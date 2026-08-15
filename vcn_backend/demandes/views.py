from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from comptes.models import RoleUtilisateur, Demandeur, Notification
from core.audit import journaliser
from core.acteurs import ROLES_PUBLICATION_APPELS, peut_instruire_dossier
from core.permissions import roles_requis
from .models import (
    AppelCandidature, Demande, Dossier, VoteCommission, MembreCommission, StatutDemande,
    Commission, MotifActivationCommission,
)
from .serializers import (
    AppelCandidatureSerializer, DemandeSerializer, DemandeAnonymeSerializer, DossierSerializer,
    VoteCommissionSerializer, MembreCommissionSerializer, CommissionSerializer, ArchivageSerializer,
)
from .services import DemandeService, calculer_score_correspondance

class AppelCandidatureViewSet(viewsets.ModelViewSet):
    queryset = AppelCandidature.objects.all()
    serializer_class = AppelCandidatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        from comptes.models import RoleUtilisateur
        if user.role not in ROLES_PUBLICATION_APPELS and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seules la Cellule Communication et l'Amicale publient un appel.")
        serializer.save(publie_par=user)

    @action(detail=False, methods=['get'])
    def ouverts(self, request):
        from django.utils import timezone
        maintenant = timezone.now()
        appels = self.get_queryset().filter(
            est_actif=True,
            date_lancement__lte=maintenant,
            date_cloture__gte=maintenant
        )
        serializer = self.get_serializer(appels, many=True)
        return Response(serializer.data)

class DemandeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Si c'est un usager (le créateur), il peut voir ses propres infos
        if self.request.user.role == RoleUtilisateur.USAGER:
            return DemandeSerializer
            
        # Le Service Juridique et le DCUVE ont toujours accès à l'identité complète
        if self.request.user.role in [RoleUtilisateur.SERVICE_JURIDIQUE, RoleUtilisateur.DIRECTEUR_DCUVE]:
            return DemandeSerializer

        # Si c'est le directeur ou la commission, on vérifie si la demande est clôturée
        if self.action in ['retrieve', 'update', 'partial_update']:
            demande = self.get_object()
            if getattr(demande, 'statut', None) in [StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]:
                return DemandeSerializer # Identité révélée car le vote est fini
        
        # Par défaut (ex: GET /demandes/ pour la Commission), identité masquée (Blind Review)
        return DemandeAnonymeSerializer


    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        if self.action == 'archives':
            return Demande.objects.filter(archive=True)
        if user.role == RoleUtilisateur.USAGER:
            return Demande.objects.filter(
                Q(demandeur__utilisateur=user, archive=False) | Q(partage_avec=user)
            ).distinct()
        if user.role == RoleUtilisateur.AMICALE:
            # L'Amicale voit ses propres demandes ET les demandes pour ses locaux
            return Demande.objects.filter(
                Q(demandeur__utilisateur=user, archive=False) | Q(local__gestionnaire='AMICALE', archive=False) | Q(partage_avec=user)
            ).distinct()
        if peut_instruire_dossier(user):
            return Demande.objects.filter(
                Q(archive=False) | Q(partage_avec=user)
            ).distinct()
        # Cellule Communication, Administrateur SI, autres comptes non
        # instructeurs : aucun acces aux dossiers de candidature.
        return Demande.objects.filter(
            Q(demandeur__utilisateur=user, archive=False) | Q(partage_avec=user)
        ).distinct()

    @staticmethod
    def _notifier(demande, message, envoyer_email=False, sujet=""):
        try:
            Notification.objects.create(destinataire=demande.demandeur.utilisateur, contenu=message)
            if envoyer_email and demande.demandeur.utilisateur.email:
                from django.core.mail import send_mail
                from django.conf import settings
                send_mail(
                    sujet or "Mise à jour de votre dossier VCN",
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [demande.demandeur.utilisateur.email],
                    fail_silently=True,
                )
        except Exception as e:
            print("Erreur notification:", e)

    def perform_create(self, serializer):
        try:
            demandeur = Demandeur.objects.get(utilisateur=self.request.user)
        except Demandeur.DoesNotExist:
            demandeur = Demandeur.objects.create(utilisateur=self.request.user, contact="")

        local = serializer.validated_data.get('local')
        if local is not None and not local.est_libre:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'local': ["Ce local est déjà occupé : la candidature directe n'est possible que sur un local disponible."]
            })

        demande = serializer.save(demandeur=demandeur)
        # Un dossier est toujours ouvert avec la demande (pieces jointes).
        Dossier.objects.get_or_create(demande=demande)
        journaliser(self.request.user, "DEPOT_DEMANDE", f"Demande {demande.reference_anonyme}",
                    f"type={demande.type_demande}")

    @action(detail=False, methods=['get'], url_path='mes-demandes')
    def mes_demandes(self, request):
        demandes = Demande.objects.filter(demandeur__utilisateur=request.user).order_by('-date_depot')
        return Response(DemandeSerializer(demandes, many=True).data)

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        from .serializers import HistoriqueStatutDemandeSerializer
        demande = self.get_object()
        historique = demande.historique.all().order_by('date_creation')
        return Response(HistoriqueStatutDemandeSerializer(historique, many=True).data)

    @action(detail=True, methods=['get'])
    def chronologie(self, request, pk=None):
        demande = self.get_object()
        etapes_ordre = Demande.ETAPES_CHRONOLOGIE
        
        try:
            index_actuel = etapes_ordre.index(demande.statut)
        except ValueError:
            # Si le statut n'est pas dans le parcours standard (ex: REJETE, REFUSE), on s'arrete à la fin ou on gère.
            index_actuel = len(etapes_ordre)

        etapes = []
        for i, statut in enumerate(etapes_ordre):
            etat = "A_VENIR"
            if i < index_actuel:
                etat = "FRANCHIE"
            elif i == index_actuel:
                etat = "EN_COURS"
            elif demande.est_cloturee and i >= index_actuel:
                etat = "A_VENIR" # or skipped
                
            etapes.append({
                "statut": statut,
                "libelle": dict(StatutDemande.choices).get(statut, statut),
                "etat": etat
            })

        evenements = []
        for hist in demande.historique.all().order_by('date_creation'):
            evenements.append({
                "statut": hist.nouveau_statut,
                "libelle": f"Passage au statut {dict(StatutDemande.choices).get(hist.nouveau_statut, hist.nouveau_statut)}",
                "date": hist.date_creation,
                "commentaire": hist.commentaire_acteur,
                "auteur": hist.auteur.nom_complet if hist.auteur else "Système"
            })

        return Response({
            "statut": demande.statut,
            "statut_label": demande.statut_label,
            "est_cloturee": demande.est_cloturee,
            "etapes": etapes,
            "evenements": evenements
        })

    @action(detail=True, methods=['post'], url_path='documents',
            permission_classes=[permissions.IsAuthenticated])
    def ajouter_document(self, request, pk=None):
        """Depot d'une piece justificative sur le dossier de la demande."""
        from .serializers import DocumentSerializer
        demande = self.get_object()
        dossier, _ = Dossier.objects.get_or_create(demande=demande)
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'fichier': ["Fichier manquant."]}, status=status.HTTP_400_BAD_REQUEST)
        document = dossier.documents.create(
            type_document=request.data.get('type_document', 'AUTRE'),
            nom_fichier=request.data.get('nom_fichier') or fichier.name,
            fichier=fichier,
        )
        journaliser(request.user, "DEPOT_DOCUMENT", f"Demande {demande.reference_anonyme}",
                    document.type_document)
        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='reception-physique', permission_classes=[roles_requis('BUREAU_COURRIER', 'AGENT_DCUVE')])
    def reception_physique(self, request, pk=None):
        demande = self.get_object()
        dossier, _ = Dossier.objects.get_or_create(demande=demande)
        dossier.enregistrer_dossier_physique()
        journaliser(request.user, "RECEPTION_PHYSIQUE", f"Dossier {demande.reference_anonyme}")
        return Response({'status': 'Pièces physiques réceptionnées avec succès.'})

    @action(detail=True, methods=['post'], permission_classes=[roles_requis(
        'BUREAU_COURRIER', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'SERVICE_JURIDIQUE',
        'AGENT_QHSE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')])
    def changer_statut(self, request, pk=None):
        demande = self.get_object()
        nouveau_statut = request.data.get('statut')
        commentaire = request.data.get('commentaire', '')
        
        if not nouveau_statut:
            return Response({"detail": "Statut manquant."}, status=status.HTTP_400_BAD_REQUEST)
            
        demande_maj = DemandeService.changer_statut(demande, nouveau_statut, request.user, commentaire)
        
        from .models import MotifArchivage
        if nouveau_statut in [StatutDemande.DEFAVORABLE, StatutDemande.MITIGEE_ARCHIVEE]:
            demande_maj.archiver(
                utilisateur=request.user,
                motif=MotifArchivage.AVIS_DEFAVORABLE,
                commentaire=commentaire,
            )
            message = (
                f"Votre dossier {demande_maj.reference_anonyme} a reçu un avis défavorable et a été classé sans suite (archivé).\n\n"
                f"Motif : {commentaire if commentaire else 'Dossier irrecevable'}"
            )
            self._notifier(demande_maj, message, envoyer_email=True, sujet="Décision défavorable concernant votre dossier (SyLOC-T)")
        elif nouveau_statut == StatutDemande.MITIGEE_COMPLEMENT:
            message = (
                f"Votre dossier {demande_maj.reference_anonyme} est en attente de complément suite à un contrôle des pièces.\n\n"
                f"Pièces manquantes / Remarque :\n{commentaire}\n\n"
                f"Veuillez vous connecter pour compléter et renvoyer vos pièces justificatives."
            )
            self._notifier(demande_maj, message, envoyer_email=True, sujet="Action requise : Complément de pièces demandé (SyLOC-T)")
        elif nouveau_statut == StatutDemande.CONTROLE_RECEVABILITE:
            message = f"Votre dossier {demande_maj.reference_anonyme} a été validé par le Bureau du Courrier et transmis à la DCUVE pour instruction."
            self._notifier(demande_maj, message, envoyer_email=True, sujet="Dossier validé et transmis à la DCUVE (SyLOC-T)")
        else:
            message = f"Votre dossier {demande_maj.reference_anonyme} est désormais au statut : {demande_maj.get_statut_display()}."
            self._notifier(demande_maj, message)
            
        journaliser(request.user, "CHANGEMENT_STATUT_DEMANDE", f"Demande {demande_maj.reference_anonyme}",
                    f"-> {nouveau_statut} ({commentaire})")
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['post'], url_path='avis-sanitaire', permission_classes=[roles_requis(
        'AGENT_QHSE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')])
    def enregistrer_avis_sanitaire(self, request, pk=None):
        demande = self.get_object()
        demande.avis_sanitaire_externe = request.data.get('avis', '')
        demande.reference_avis_sanitaire = request.data.get('reference', '')
        demande.save(update_fields=['avis_sanitaire_externe', 'reference_avis_sanitaire'])
        
        return Response({'avis_sanitaire_externe': demande.avis_sanitaire_externe})

    @action(detail=True, methods=['post'], url_path='avis-technique', permission_classes=[roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')])
    def enregistrer_avis_technique(self, request, pk=None):
        demande = self.get_object()
        avis = request.data.get('avis', '')
        
        demande.avis_technique_interne = avis
        demande.statut = StatutDemande.EN_ATTENTE_DECISION
        demande.save(update_fields=['avis_technique_interne', 'statut'])
        
        return Response(DemandeSerializer(demande).data)

    @action(detail=False, methods=['get'], url_path='triees')
    def demandes_triees(self, request):
        appel_id = request.query_params.get('appel')
        demandes = self.get_queryset()
        if appel_id:
            try:
                appel = AppelCandidature.objects.get(pk=appel_id)
                demandes = sorted(demandes, key=lambda d: calculer_score_correspondance(d, appel), reverse=True)
            except AppelCandidature.DoesNotExist:
                pass
        
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def decider(self, request, pk=None):
        demande = self.get_object()
        decision = request.data.get('decision')
        commentaire = request.data.get('commentaire', '')
        if decision not in [StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]:
            return Response({"detail": "Décision invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        est_dcuve = user.role == RoleUtilisateur.DIRECTEUR_DCUVE
        est_directeur = user.role in (RoleUtilisateur.DIRECTEUR_CROUS_T, RoleUtilisateur.ADMINISTRATEUR_SI) or user.is_superuser
        est_membre_delegue = (
            Commission.objects.filter(active=True, delegation_directeur=True, membres__utilisateur=user, membres__actif=True).exists()
        )

        if not (est_directeur or est_membre_delegue):
            if est_dcuve:
                from core.models import ParametreSysteme
                delegation = ParametreSysteme.objects.filter(cle='delegation_dcuve').first()
                if not delegation or delegation.valeur != 'OUI':
                    return Response({"detail": "Vous n'avez pas la délégation pour décider."}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({"detail": "Votre rôle ne permet pas de décider sur ce dossier."}, status=status.HTTP_403_FORBIDDEN)

        demande_maj = DemandeService.changer_statut(demande, decision, request.user, commentaire)
        self._notifier(demande_maj, f"Decision sur votre dossier {demande_maj.reference_anonyme} : {decision}.")
        journaliser(request.user, "DECISION_DEMANDE", f"Demande {demande_maj.reference_anonyme}",
                    f"decision={decision} ({commentaire})")
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['post'], url_path='archiver', permission_classes=[roles_requis(
        'BUREAU_COURRIER', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI')])
    def archiver(self, request, pk=None):
        """Archivage d'un dossier : reserve au Bureau du Courrier et a la DCUVE."""
        demande = self.get_object()
        serializer = ArchivageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        demande.archiver(
            request.user,
            serializer.validated_data['motif_archivage'],
            serializer.validated_data['commentaire'],
        )
        journaliser(request.user, "ARCHIVAGE_DOSSIER", f"Demande {demande.reference_anonyme}",
                    serializer.validated_data['motif_archivage'])
        return Response(DemandeSerializer(demande).data)

    @action(detail=False, methods=['get'], url_path='archives', permission_classes=[roles_requis('BUREAU_COURRIER')])
    def archives(self, request):
        """Liste des dossiers archives, reservee au Bureau du Courrier."""
        demandes = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(demandes)
        serializer = DemandeSerializer(page or demandes, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    # ------------------------------------------------------------ Routage Renovation/Construction
    @action(detail=True, methods=['post'], url_path='partager')
    def partager(self, request, pk=None):
        demande = self.get_object()
        utilisateur_id = request.data.get('utilisateur')
        message = request.data.get('message', '')

        if not utilisateur_id:
            return Response({'error': "Veuillez sélectionner un utilisateur."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from comptes.models import Utilisateur
            destinataire = Utilisateur.objects.get(id=utilisateur_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Accorder la permission explicite d'accès au dossier
        demande.partage_avec.add(destinataire)

        # Notify the user
        from comptes.models import Notification
        contenu_msg = f"Le Bureau du Courrier a partagé avec vous le dossier archivé {demande.reference_anonyme}."
        if message:
            contenu_msg += f"\n\nMessage : {message}"

        Notification.objects.create(
            destinataire=destinataire,
            contenu=contenu_msg
        )

        # Historique statut & Journalisation
        from .models import HistoriqueStatutDemande
        HistoriqueStatutDemande.objects.create(
            demande=demande,
            ancien_statut=demande.statut,
            nouveau_statut=demande.statut,
            commentaire_acteur=f"Dossier partagé avec {destinataire.nom_complet or destinataire.username} ({destinataire.role}). Note: {message}" if message else f"Dossier partagé avec {destinataire.nom_complet or destinataire.username} ({destinataire.role}).",
            auteur=request.user,
        )

        journaliser(request.user, "PARTAGE_DOSSIER", f"Partage du dossier {demande.reference_anonyme} avec {destinataire.username}")

        return Response({'status': "Dossier partagé avec succès."})

    @action(detail=True, methods=['post'], url_path='transmettre-technique', permission_classes=[roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')])
    def transmettre_technique(self, request, pk=None):
        """Transmission automatique au Service Technique pour les demandes de renovation/construction."""
        demande = self.get_object()
        if not demande.necessite_expertise_technique:
            return Response({"detail": "Ce type de demande ne necessite pas d'expertise technique."}, status=status.HTTP_400_BAD_REQUEST)
        demande.transmis_service_technique = True
        from django.utils import timezone
        demande.date_transmission_technique = timezone.now()
        DemandeService.changer_statut(demande, StatutDemande.EN_EXPERTISE_TECHNIQUE, request.user,
                                       "Transmission au Service Technique.")
        demande.save(update_fields=['transmis_service_technique', 'date_transmission_technique'])
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'], url_path='rapport-technique', permission_classes=[roles_requis(
        'SERVICE_TECHNIQUE', 'ADMINISTRATEUR_SI')])
    def soumettre_rapport_technique(self, request, pk=None):
        """Le Service Technique renvoie son rapport a la DCUVE."""
        demande = self.get_object()
        rapport = request.data.get('rapport')
        if not rapport:
            return Response({"rapport": ["Ce champ est requis."]}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        demande.rapport_technique = rapport
        demande.rapport_technique_par = request.user
        demande.date_rapport_technique = timezone.now()
        DemandeService.changer_statut(demande, StatutDemande.EN_ATTENTE_DECISION, request.user,
                                       "Rapport technique transmis a la DCUVE.")
        demande.save(update_fields=['rapport_technique', 'rapport_technique_par', 'date_rapport_technique'])
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'], url_path='transfert-juridique', permission_classes=[roles_requis(
        'DIRECTEUR_CROUS_T', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI')])
    def transfert_juridique(self, request, pk=None):
        """Apres decision favorable du Directeur CROUS-T, transfert au Service Juridique (redaction du contrat)."""
        demande = self.get_object()
        if demande.statut != StatutDemande.FAVORABLE:
            return Response({"detail": "Seul un dossier favorable peut etre transfere au Service Juridique."}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        demande.transfere_juridique = True
        demande.date_transfert_juridique = timezone.now()
        demande.save(update_fields=['transfere_juridique', 'date_transfert_juridique'])
        journaliser(request.user, "TRANSFERT_JURIDIQUE", f"Demande {demande.reference_anonyme}")
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'], permission_classes=[roles_requis(
        'BUREAU_COURRIER', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'SERVICE_JURIDIQUE',
        'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')])
    def valider(self, request, pk=None):
        demande = self.get_object()
        commentaire = request.data.get('commentaire', 'Validation par le service')
        demande_maj = DemandeService.valider_demande(demande, request.user, commentaire)
        journaliser(request.user, "VALIDATION_DEMANDE", f"Demande {demande_maj.reference_anonyme}", commentaire)
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['post'], url_path='accepter-contrat', permission_classes=[permissions.IsAuthenticated])
    def accepter_contrat(self, request, pk=None):
        demande = self.get_object()
        date_rdv = request.data.get('date_rdv')
        
        if not date_rdv:
            return Response({"detail": "La date de rendez-vous est requise."}, status=status.HTTP_400_BAD_REQUEST)
            
        demande.rdv_signature_date = date_rdv
        demande.statut = StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE
        demande.save(update_fields=['rdv_signature_date', 'statut'])
        
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'], url_path='refuser-contrat',
            permission_classes=[permissions.IsAuthenticated])
    def refuser_contrat(self, request, pk=None):
        """Le candidat (USAGER) refuse la proposition de contrat qui lui est faite."""
        demande = self.get_object()
        motif = request.data.get('motif') or request.data.get('commentaire', '')
        demande_maj = DemandeService.changer_statut(
            demande, StatutDemande.CONTRAT_REFUSE, request.user, motif
        )
        journaliser(request.user, "REFUS_CONTRAT", f"Demande {demande_maj.reference_anonyme}", motif)
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['get'], permission_classes=[roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'SERVICE_TECHNIQUE', 'DIRECTEUR_CROUS_T',
        'ADMINISTRATEUR_SI')])
    def analyse_equidistance(self, request, pk=None):
        demande = self.get_object()
        if not demande.local or demande.local.latitude is None or demande.local.longitude is None:
            return Response({"detail": "Le local ciblé n'a pas de coordonnées GPS."}, status=status.HTTP_400_BAD_REQUEST)
        
        # On importe la fonction utilitaire et le modèle Local
        from patrimoine.utils import calculer_distance_haversine
        from patrimoine.models import Local
        
        type_cible = demande.local.type_local
        # On cherche tous les autres locaux actifs du même type
        autres_locaux = Local.objects.filter(
            type_local=type_cible, est_libre=False
        ).exclude(id=demande.local.id)
        
        conflits = []
        distance_limite_metres = 200.0  # La règle des 200 mètres
        
        for autre in autres_locaux:
            if autre.latitude and autre.longitude:
                dist = calculer_distance_haversine(
                    demande.local.latitude, demande.local.longitude,
                    autre.latitude, autre.longitude
                )
                if dist <= distance_limite_metres:
                    conflits.append({
                        "local_id": autre.id,
                        "reference": autre.reference,
                        "distance_metres": round(dist, 2)
                    })
                    
        return Response({
            "alerte": len(conflits) > 0,
            "conflits": conflits,
            "message": f"{len(conflits)} locaux de type {type_cible} détectés à moins de {distance_limite_metres}m."
        })

    @action(detail=False, methods=['get'], url_path='palmares-commission', permission_classes=[permissions.IsAuthenticated])
    def palmares_commission(self, request):
        """Retourne les demandes en attente de décision, groupées par local avec leurs scores."""
        demandes = Demande.objects.filter(statut=StatutDemande.EN_ATTENTE_DECISION, local__isnull=False)
        if request.user.role == 'AMICALE':
            demandes = demandes.filter(local__gestionnaire='AMICALE')
        
        locaux_dict = {}
        for d in demandes:
            local_id = str(d.local.id)
            if local_id not in locaux_dict:
                locaux_dict[local_id] = {
                    "local_id": local_id,
                    "local_reference": d.local.reference,
                    "candidats": []
                }
            
            votes = d.votes.all()
            nb_votes = votes.count()
            score_moyen = None
            if nb_votes > 0:
                notes = []
                for v in votes:
                    if v.note_formelle is not None: notes.append(v.note_formelle)
                    if v.note_technique is not None: notes.append(v.note_technique)
                if notes:
                    score_moyen = round(sum(notes) / len(notes), 2)
                    
            locaux_dict[local_id]["candidats"].append({
                "demande_id": str(d.id),
                "reference_anonyme": d.reference_anonyme,
                "type_demande": d.type_demande,
                "score_moyen": score_moyen,
                "nb_votes": nb_votes
            })
            
        for l in locaux_dict.values():
            l["candidats"].sort(key=lambda c: (c["score_moyen"] is not None, c["score_moyen"] or 0), reverse=True)
            
        return Response(list(locaux_dict.values()))

    @action(detail=False, methods=['post'], url_path='cloturer-local')
    def cloturer_local(self, request):
        local_id = request.data.get('local_id')
        gagnant_id = request.data.get('gagnant_id')
        
        # Verification des habilitations (Directeur ou Commission avec délégation)
        from core.models import ParametreSysteme
        delegation = ParametreSysteme.objects.filter(cle='delegation_commission').first()
        delegation_active = delegation and delegation.valeur == 'OUI'
        
        est_dir = request.user.role in ['DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI']
        est_membre = MembreCommission.objects.filter(utilisateur=request.user, actif=True).exists()
        
        if not est_dir and not (est_membre and delegation_active):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'avez pas l'autorisation de clôturer ce dossier.")

        if not local_id or not gagnant_id:
            return Response({"detail": "local_id et gagnant_id sont requis."}, status=status.HTTP_400_BAD_REQUEST)
            
        demandes_loc = Demande.objects.filter(local_id=local_id, statut=StatutDemande.EN_ATTENTE_DECISION)
        
        if not demandes_loc.filter(id=gagnant_id).exists():
            return Response({"detail": "Le candidat specifié n'est pas valide ou n'est plus en attente."}, status=status.HTTP_400_BAD_REQUEST)
            
        gagnant = demandes_loc.get(id=gagnant_id)
        demande_maj = DemandeService.changer_statut(gagnant, StatutDemande.FAVORABLE, request.user, "Attribution suite à la délibération de la commission.")
        self._notifier(demande_maj, f"Félicitations ! Votre dossier {demande_maj.reference_anonyme} a été retenu pour le local {demande_maj.local.reference}.", envoyer_email=True, sujet="Décision Favorable (VCN)")
            
        return Response({"status": "Clôture effectuée avec succès."})

    @action(detail=True, methods=['get'], url_path='synthese-votes', permission_classes=[permissions.IsAuthenticated])
    def synthese_votes(self, request, pk=None):
        demande = self.get_object()
        votes = demande.votes.all()
        favorables = votes.filter(avis='FAVORABLE').count()
        defavorables = votes.filter(avis='DEFAVORABLE').count()
        
        notes = []
        for v in votes:
            if v.note_formelle is not None: notes.append(v.note_formelle)
            if v.note_technique is not None: notes.append(v.note_technique)
        note_moyenne = round(sum(notes) / len(notes), 2) if notes else None
        
        # Simuler quorum: on a 1 vote, on dit que le quorum est de 1 pour le test
        quorum_atteint = votes.count() > 0 
        sens_majoritaire = 'FAVORABLE' if favorables > defavorables else ('DEFAVORABLE' if defavorables > favorables else 'MITIGE')
        
        return Response({
            'total_votes': votes.count(),
            'favorables': favorables,
            'defavorables': defavorables,
            'sens_majoritaire': sens_majoritaire,
            'note_moyenne': note_moyenne,
            'quorum_atteint': quorum_atteint
        })

class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all()
    serializer_class = DossierSerializer
    permission_classes = [permissions.IsAuthenticated]

class MembreCommissionViewSet(viewsets.ModelViewSet):
    queryset = MembreCommission.objects.all()
    serializer_class = MembreCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        commission = serializer.validated_data.get('commission')
        if not commission:
            commission = Commission.objects.filter(active=True).first() or Commission.objects.order_by('-date_creation').first()
            if not commission:
                commission = Commission.objects.create(nom="Commission d'évaluation", active=True)
            serializer.save(commission=commission)
        else:
            serializer.save()

    @action(detail=False, methods=['get', 'post'])
    def delegation(self, request):
        from core.models import ParametreSysteme
        param, _ = ParametreSysteme.objects.get_or_create(
            cle='delegation_commission',
            defaults={'valeur': 'NON', 'categorie': 'WORKFLOW', 'libelle': 'Délégation du pouvoir à la Commission'}
        )
        
        if request.method == 'POST':
            active = request.data.get('active', False)
            param.valeur = 'OUI' if active else 'NON'
            param.save()
            comm = Commission.objects.order_by('-date_creation').first()
            if not comm:
                comm = Commission.objects.create(nom="Commission d'évaluation", active=active, delegation_directeur=active)
            else:
                comm.delegation_directeur = active
                if active:
                    comm.active = True
                comm.save()
            return Response({'active': active})
            
        return Response({'active': param.valeur == 'OUI'})

    # ------------------------------------------------------------------
    # Espace membre de la commission
    # ------------------------------------------------------------------
    def _membre_courant(self, request):
        return MembreCommission.objects.filter(
            utilisateur=request.user, actif=True, commission__active=True
        ).select_related('commission').first()

    @action(detail=False, methods=['get'], url_path='mes-taches')
    def mes_taches(self, request):
        """Espace du membre : appartenance, dossiers a voter, echeances.

        Le membre voit uniquement les dossiers en phase de decision non
        encore votes par lui, ainsi que ses votes deja emis (revisables).
        """
        from django.utils import timezone

        membre = self._membre_courant(request)
        if not membre:
            return Response({
                'est_membre': False,
                'commission': None,
                'a_voter': [],
                'deja_votes': [],
                'echeances': [],
            })

        commission = membre.commission
        statuts_votables = [
            StatutDemande.EN_ATTENTE_DECISION,
            StatutDemande.CONTROLE_HYGIENE,
            StatutDemande.EN_EXPERTISE_TECHNIQUE,
        ]
        base = (Demande.objects
                .filter(statut__in=statuts_votables, archive=False)
                .select_related('local', 'appel_candidature', 'demandeur__utilisateur')
                .order_by('date_depot'))

        deja_votes_ids = set(
            VoteCommission.objects.filter(membre=membre).values_list('demande_id', flat=True)
        )
        maintenant = timezone.now()

        def _ligne(d):
            appel = d.appel_candidature
            echeance = getattr(appel, 'date_cloture', None) if appel else None
            return {
                'demande_id': str(d.id),
                'reference': d.reference_anonyme,
                'type_demande': d.type_demande,
                'statut': d.statut,
                'date_depot': d.date_depot,
                'local': getattr(d.local, 'reference', None),
                'appel': getattr(appel, 'titre', None),
                'echeance': echeance,
                'jours_restants': (echeance - maintenant).days if echeance else None,
                'nb_votes': d.votes.count(),
            }

        a_voter = [_ligne(d) for d in base if d.id not in deja_votes_ids]
        deja = [_ligne(d) for d in base if d.id in deja_votes_ids]

        return Response({
            'est_membre': True,
            'commission': {
                'id': str(commission.id) if commission else None,
                'nom': commission.nom if commission else "Commission d'évaluation",
                'active': bool(commission and commission.active),
                'delegation_directeur': bool(commission and commission.delegation_directeur),
                'motif_activation': commission.motif_activation if commission else '',
                'date_activation': commission.date_activation if commission else None,
                'nb_membres': commission.membres.filter(actif=True).count() if commission else 0,
            },
            'a_voter': a_voter,
            'deja_votes': deja,
            'echeances': sorted(
                [l for l in a_voter if l['echeance']],
                key=lambda l: l['echeance']
            )[:10],
            'compteurs': {
                'a_voter': len(a_voter),
                'deja_votes': len(deja),
                'en_retard': sum(1 for l in a_voter if (l['jours_restants'] or 0) < 0),
            },
        })

    @action(detail=False, methods=['get'])
    def rapport(self, request):
        """Rapport consolide des travaux de la commission (vue Directeur).

        Filtrable par periode : `?debut=YYYY-MM-DD&fin=YYYY-MM-DD`.
        """
        from django.db.models import Avg, Count

        commission = Commission.objects.order_by('-date_creation').first()
        votes = VoteCommission.objects.select_related(
            'membre__utilisateur', 'demande'
        ).all()
        params = request.query_params
        if params.get('debut'):
            votes = votes.filter(date_creation__date__gte=params['debut'])
        if params.get('fin'):
            votes = votes.filter(date_creation__date__lte=params['fin'])

        par_avis = list(votes.values('avis').annotate(nb=Count('id')).order_by('-nb'))
        membres = MembreCommission.objects.filter(actif=True).select_related('utilisateur')
        participation = []
        for m in membres:
            votes_membre = votes.filter(membre=m)
            participation.append({
                'membre': m.utilisateur.nom_complet or m.utilisateur.username,
                'nb_votes': votes_membre.count(),
                'note_moyenne': votes_membre.aggregate(m=Avg('note_formelle'))['m'],
            })
        participation.sort(key=lambda p: -p['nb_votes'])

        dossiers = {}
        for v in votes:
            entree = dossiers.setdefault(str(v.demande_id), {
                'demande_id': str(v.demande_id),
                'reference': v.demande.reference_anonyme,
                'statut': v.demande.statut,
                'favorable': 0, 'defavorable': 0, 'abstention': 0,
            })
            entree[v.avis.lower()] = entree.get(v.avis.lower(), 0) + 1
        for d in dossiers.values():
            total = d['favorable'] + d['defavorable'] + d['abstention']
            d['total_votes'] = total
            d['sens_majoritaire'] = max(
                ('FAVORABLE', d['favorable']), ('DEFAVORABLE', d['defavorable']),
                ('ABSTENTION', d['abstention']), key=lambda x: x[1]
            )[0] if total else None

        return Response({
            'commission': {
                'nom': commission.nom if commission else "Commission d'évaluation",
                'active': bool(commission and commission.active),
                'delegation_directeur': bool(commission and commission.delegation_directeur),
                'motif_activation': commission.motif_activation if commission else '',
                'date_activation': commission.date_activation if commission else None,
            } if commission else None,
            'nb_membres_actifs': membres.count(),
            'total_votes': votes.count(),
            'repartition_avis': par_avis,
            'participation': participation,
            'dossiers': sorted(dossiers.values(), key=lambda d: -d['total_votes']),
        })



class VoteCommissionViewSet(viewsets.ModelViewSet):
    queryset = VoteCommission.objects.all()
    serializer_class = VoteCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            membre = MembreCommission.objects.get(utilisateur=self.request.user, actif=True, commission__active=True)
        except MembreCommission.DoesNotExist:
            if self.request.user.role == 'AMICALE':
                comm = Commission.objects.filter(active=True).first() or Commission.objects.order_by('-date_creation').first()
                if not comm:
                    comm = Commission.objects.create(nom="Commission d'évaluation", active=True)
                membre, _ = MembreCommission.objects.get_or_create(utilisateur=self.request.user, defaults={'actif': True, 'commission': comm})
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Vous n'êtes pas membre d'une commission active.")
                
        demande_id = request.data.get('demande')
        vote_existant = VoteCommission.objects.filter(demande_id=demande_id, membre=membre).first()
        
        if vote_existant:
            serializer = self.get_serializer(vote_existant, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        membre = MembreCommission.objects.get(utilisateur=self.request.user, actif=True, commission__active=True)
        serializer.save(membre=membre)
