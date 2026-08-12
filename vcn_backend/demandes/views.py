from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from comptes.models import RoleUtilisateur, Demandeur, Notification
from core.audit import journaliser
from core.permissions import roles_requis
from .models import AppelCandidature, Demande, Dossier, VoteCommission, MembreCommission, StatutDemande
from .serializers import (
    AppelCandidatureSerializer, DemandeSerializer, DemandeAnonymeSerializer, DossierSerializer, VoteCommissionSerializer, MembreCommissionSerializer
)
from .services import DemandeService, calculer_score_correspondance

class AppelCandidatureViewSet(viewsets.ModelViewSet):
    queryset = AppelCandidature.objects.all()
    serializer_class = AppelCandidatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(publie_par=self.request.user)

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
        if user.role == RoleUtilisateur.USAGER:
            return Demande.objects.filter(demandeur__utilisateur=user)
        return Demande.objects.all()

    @staticmethod
    def _notifier(demande, message):
        try:
            Notification.objects.create(destinataire=demande.demandeur.utilisateur, contenu=message)
        except Exception:
            pass

    def perform_create(self, serializer):
        try:
            demandeur = Demandeur.objects.get(utilisateur=self.request.user)
        except Demandeur.DoesNotExist:
            demandeur = Demandeur.objects.create(utilisateur=self.request.user, contact="")
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
        self._notifier(demande_maj, f"Votre dossier {demande_maj.reference_anonyme} est desormais au statut : {demande_maj.statut}.")
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

    @action(detail=True, methods=['post'], permission_classes=[roles_requis(
        'DIRECTEUR_CROUS_T', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI')])
    def decider(self, request, pk=None):
        demande = self.get_object()
        decision = request.data.get('decision')
        commentaire = request.data.get('commentaire', '')
        if decision not in [StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]:
            return Response({"detail": "Décision invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
        demande_maj = DemandeService.changer_statut(demande, decision, request.user, commentaire)
        self._notifier(demande_maj, f"Decision sur votre dossier {demande_maj.reference_anonyme} : {decision}.")
        journaliser(request.user, "DECISION_DEMANDE", f"Demande {demande_maj.reference_anonyme}",
                    f"decision={decision} ({commentaire})")
        return Response(DemandeSerializer(demande_maj).data)

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

class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all()
    serializer_class = DossierSerializer
    permission_classes = [permissions.IsAuthenticated]

class MembreCommissionViewSet(viewsets.ModelViewSet):
    queryset = MembreCommission.objects.all()
    serializer_class = MembreCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class VoteCommissionViewSet(viewsets.ModelViewSet):
    queryset = VoteCommission.objects.all()
    serializer_class = VoteCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            membre = MembreCommission.objects.get(utilisateur=self.request.user)
        except MembreCommission.DoesNotExist:
            # Pour la démo, si l'utilisateur n'est pas membre, on bloque
            # ou on pourrait lever une ValidationError
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Vous n'êtes pas membre de la commission.")
        serializer.save(membre=membre)
