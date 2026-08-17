# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status, viewsets
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.audit import journaliser
from core.acteurs import peut_consulter_profils
from core.permissions import HasRole
from .models import Demandeur, StatutVerificationEtudiant, Notification, JournalAudit, RoleUtilisateur
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    DemandeurSerializer,
    UtilisateurSerializer,
    MeSerializer,
    ChangePasswordSerializer,
    NotificationSerializer,
    JournalAuditSerializer,
)

Utilisateur = get_user_model()


def generer_mot_de_passe():
    from django.utils.crypto import get_random_string
    return get_random_string(12)

ROLES_VALIDATION_CARTE = ["BUREAU_COURRIER", "AGENT_DCUVE", "DIRECTEUR_DCUVE"]
# Administration des comptes et supervision : Administrateur SI et Directeur CROUS-T.
ROLES_ADMIN = ["ADMINISTRATEUR_SI", "DIRECTEUR_CROUS_T"]


class RegisterView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        journaliser(None, "INSCRIPTION", f"Utilisateur {user.username}", "Creation de compte usager")


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """GET : profil connecte. PATCH : mise a jour de son profil."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        serializer = MeSerializer(
            request.user, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Champs portes par le profil demandeur
        profil = getattr(request.user, 'profil_demandeur', None)
        if profil:
            for champ in ('contact', 'matricule_etudiant'):
                if champ in request.data:
                    setattr(profil, champ, request.data[champ])
            profil.save()

        journaliser(request.user, "MAJ_PROFIL", f"Utilisateur {request.user.username}")
        return Response(MeSerializer(request.user, context={'request': request}).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['ancien_mot_de_passe']):
            return Response({'ancien_mot_de_passe': ["Mot de passe actuel incorrect."]},
                            status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
        request.user.save()
        journaliser(request.user, "CHANGEMENT_MOT_DE_PASSE", f"Utilisateur {request.user.username}")
        return Response({'detail': "Mot de passe mis a jour."})


class UtilisateurViewSet(viewsets.ModelViewSet):
    """Gestion des comptes et des habilitations (UC80-84)."""
    queryset = Utilisateur.objects.all().order_by('-date_joined')
    serializer_class = UtilisateurSerializer
    permission_classes = [HasRole]
    roles_autorises = ROLES_ADMIN

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'rapport_mensuel']:
            from comptes.models import RoleUtilisateur
            self.roles_autorises = [r[0] for r in RoleUtilisateur.choices if r[0] not in ('USAGER', 'AMICALE')]
        else:
            self.roles_autorises = ROLES_ADMIN
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        recherche = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        if recherche:
            qs = qs.filter(
                Q(username__icontains=recherche)
                | Q(email__icontains=recherche)
                | Q(nom_complet__icontains=recherche)
            )
        if role:
            qs = qs.filter(role=role)
        return qs

    def perform_create(self, serializer):
        user = serializer.save()
        journaliser(self.request.user, "CREATION_COMPTE", f"Utilisateur {user.username}",
                    f"role={user.role}")

    def perform_update(self, serializer):
        user = serializer.save()
        journaliser(self.request.user, "MODIFICATION_COMPTE", f"Utilisateur {user.username}",
                    f"role={user.role}, actif={user.is_active}")

    def perform_destroy(self, instance):
        # On desactive au lieu de supprimer (tracabilite des dossiers).
        instance.is_active = False
        instance.save()
        journaliser(self.request.user, "DESACTIVATION_COMPTE", f"Utilisateur {instance.username}")

    @action(detail=True, methods=['post'], url_path='activer')
    def activer(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        journaliser(request.user, "ACTIVATION_COMPTE" if user.is_active else "DESACTIVATION_COMPTE",
                    f"Utilisateur {user.username}")
        return Response(UtilisateurSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='changer-role')
    def changer_role(self, request, pk=None):
        user = self.get_object()
        nouveau_role = request.data.get('role')
        from .models import RoleUtilisateur
        if nouveau_role not in RoleUtilisateur.values:
            return Response({'role': ["Role inconnu."]}, status=status.HTTP_400_BAD_REQUEST)
        ancien = user.role
        user.role = nouveau_role
        user.save()
        journaliser(request.user, "CHANGEMENT_ROLE", f"Utilisateur {user.username}",
                    f"{ancien} -> {nouveau_role}")
        return Response(UtilisateurSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='reinitialiser-mot-de-passe')
    def reinitialiser_mot_de_passe(self, request, pk=None):
        user = self.get_object()
        nouveau = request.data.get('nouveau_mot_de_passe') or generer_mot_de_passe()
        user.set_password(nouveau)
        user.save()
        journaliser(request.user, "REINITIALISATION_MOT_DE_PASSE", f"Utilisateur {user.username}")
        return Response({'detail': "Mot de passe reinitialise.", 'mot_de_passe_provisoire': nouveau})

    @action(detail=True, methods=['post'], url_path='deleguer')
    def deleguer(self, request, pk=None):
        """Delegation temporaire de signature (UC : delegation)."""
        user = self.get_object()
        user.delegation_active = bool(request.data.get('active', True))
        expiration = request.data.get('expiration')
        user.delegation_expiration = expiration or None
        user.save()
        journaliser(request.user, "DELEGATION", f"Utilisateur {user.username}",
                    f"active={user.delegation_active} jusqu'au {expiration}")
        return Response(UtilisateurSerializer(user).data)

    @action(detail=False, methods=['get'], url_path='roles')
    def roles(self, request):
        from .models import RoleUtilisateur
        return Response([{'value': v, 'label': l} for v, l in RoleUtilisateur.choices])

    @action(detail=True, methods=['get'], url_path='rapport-mensuel')
    def rapport_mensuel(self, request, pk=None):
        """Rapport d'activite et de performance mensuel pour un collaborateur donne."""
        import calendar
        from datetime import datetime, date, time
        user = self.get_object()
        
        now = timezone.now()
        try:
            mois = int(request.query_params.get('mois', now.month))
            annee = int(request.query_params.get('annee', now.year))
        except (ValueError, TypeError):
            mois = now.month
            annee = now.year

        _, dernier_jour = calendar.monthrange(annee, mois)
        debut = timezone.make_aware(datetime.combine(date(annee, mois, 1), time.min))
        fin = timezone.make_aware(datetime.combine(date(annee, mois, dernier_jour), time.max))

        logs_qs = JournalAudit.objects.filter(
            utilisateur=user,
            date_creation__range=(debut, fin)
        ).order_by('-date_creation')
        total_actions = logs_qs.count()

        kpis = []
        role = user.role

        if role in (RoleUtilisateur.AGENT_TERRAIN, RoleUtilisateur.AGENT_QHSE):
            from terrain.models import InspectionQHse, OrdreMission
            nb_controles = InspectionQHse.objects.filter(inspecteur=user, date_visite__range=(debut, fin)).count()
            nb_missions = OrdreMission.objects.filter(agent_assigne=user, date_modification__range=(debut, fin), statut='EXECUTE').count()
            kpis.append({'label': 'Inspections QHSE', 'value': nb_controles, 'tone': 'teal'})
            kpis.append({'label': 'Ordres de mission exécutés', 'value': nb_missions, 'tone': 'blue'})

        elif role == RoleUtilisateur.SERVICE_COMPTABLE:
            from paiements.models import Paiement
            paiements = Paiement.objects.filter(date_paiement__range=(debut, fin), statut='VALIDE')
            total_encaisse = sum(p.montant_regle or 0 for p in paiements)
            kpis.append({'label': 'Paiements validés', 'value': paiements.count(), 'tone': 'green'})
            kpis.append({'label': 'Montant encaissé', 'value': f"{int(total_encaisse):,} FCFA".replace(',', ' '), 'tone': 'gold'})

        elif role == RoleUtilisateur.SERVICE_JURIDIQUE:
            from contrats.models import Contrat
            nb_contrats = Contrat.objects.filter(date_creation__range=(debut, fin)).count()
            kpis.append({'label': 'Baux rédigés & créés', 'value': nb_contrats, 'tone': 'blue'})

        elif role in (RoleUtilisateur.BUREAU_COURRIER, RoleUtilisateur.AGENT_DCUVE, RoleUtilisateur.DIRECTEUR_DCUVE):
            from demandes.models import Demande
            nb_dossiers = Demande.objects.filter(date_depot__range=(debut.date(), fin.date())).count()
            kpis.append({'label': 'Dossiers enregistrés', 'value': nb_dossiers, 'tone': 'navy'})

        from demandes.models import VoteCommission
        nb_votes = VoteCommission.objects.filter(membre__utilisateur=user, date_creation__range=(debut, fin)).count()
        if nb_votes > 0:
            kpis.append({'label': 'Votes en commission', 'value': nb_votes, 'tone': 'gold'})

        kpis.append({'label': 'Total actions enregistrées', 'value': total_actions, 'tone': 'navy'})

        return Response({
            'utilisateur': UtilisateurSerializer(user).data,
            'mois': mois,
            'annee': annee,
            'total_actions': total_actions,
            'kpis': kpis,
            'actions': JournalAuditSerializer(logs_qs[:100], many=True).data,
        })


class NotificationViewSet(viewsets.ModelViewSet):
    """Notifications de l'utilisateur connecte (UC : notifications)."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user).order_by('-date_creation')

    def perform_create(self, serializer):
        serializer.save(destinataire=self.request.user)

    @action(detail=False, methods=['get'], url_path='non-lues')
    def non_lues(self, request):
        qs = self.get_queryset().filter(est_lue=False)
        return Response({'count': qs.count(), 'results': NotificationSerializer(qs, many=True).data})

    @action(detail=True, methods=['post'], url_path='marquer-lue')
    def marquer_lue(self, request, pk=None):
        notif = self.get_object()
        notif.est_lue = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='marquer-toutes-lues')
    def marquer_toutes_lues(self, request):
        self.get_queryset().filter(est_lue=False).update(est_lue=True)
        return Response({'detail': "Toutes les notifications sont marquees comme lues."})


class JournalAuditViewSet(viewsets.ReadOnlyModelViewSet):
    """Journal d'audit consultable par l'Administrateur SI / la Direction."""
    serializer_class = JournalAuditSerializer
    permission_classes = [HasRole]
    roles_autorises = ROLES_ADMIN

    def get_queryset(self):
        qs = JournalAudit.objects.select_related('utilisateur').all().order_by('-date_creation')
        params = self.request.query_params
        if params.get('action'):
            qs = qs.filter(action__icontains=params['action'])
        if params.get('utilisateur'):
            qs = qs.filter(
                Q(utilisateur__username__icontains=params['utilisateur'])
                | Q(utilisateur__nom_complet__icontains=params['utilisateur'])
            )
        if params.get('date_debut'):
            qs = qs.filter(date_creation__date__gte=params['date_debut'])
        if params.get('date_fin'):
            qs = qs.filter(date_creation__date__lte=params['date_fin'])
        return qs


class DemandeurViewSet(viewsets.ModelViewSet):
    queryset = Demandeur.objects.select_related('utilisateur').all()
    serializer_class = DemandeurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # Donnees personnelles : seuls les services instructeurs y accedent.
        # Tout autre compte (Cellule Communication, Administrateur SI, usager)
        # ne voit que son propre profil.
        if not peut_consulter_profils(self.request.user):
            return qs.filter(utilisateur=self.request.user)
        statut = self.request.query_params.get('statut_verification_etudiant')
        if statut:
            qs = qs.filter(statut_verification_etudiant=statut)
        return qs

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

    @action(detail=False, methods=['get'], url_path='moi')
    def moi(self, request):
        profil = getattr(request.user, 'profil_demandeur', None)
        if not profil:
            return Response({'detail': "Aucun profil demandeur."}, status=404)
        return Response(DemandeurSerializer(profil, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='cartes-a-valider',
            permission_classes=[permissions.IsAuthenticated])
    def cartes_a_valider(self, request):
        if request.user.role not in ROLES_VALIDATION_CARTE and not request.user.is_superuser:
            return Response({'detail': "Non autorise."}, status=403)
        statut = request.query_params.get('statut') or StatutVerificationEtudiant.EN_ATTENTE
        qs = Demandeur.objects.select_related('utilisateur', 'valide_par')
        if statut != 'TOUTES':
            qs = qs.filter(statut_verification_etudiant=statut)
        else:
            qs = qs.exclude(statut_verification_etudiant=StatutVerificationEtudiant.NON_SOUMIS)
        qs = qs.order_by('-date_modification')
        return Response(DemandeurSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='soumettre-carte-etudiant')
    def soumettre_carte_etudiant(self, request):
        demandeur = getattr(request.user, 'profil_demandeur', None)
        if demandeur is None:
            demandeur = Demandeur.objects.create(
                utilisateur=request.user, contact=request.data.get('contact', '')
            )

        fichier = request.FILES.get('fichier') or request.FILES.get('carte_etudiant_fichier')
        if not fichier:
            return Response({'detail': 'Fichier manquant'}, status=400)

        demandeur.carte_etudiant_fichier = fichier
        demandeur.est_etudiant = True
        if request.data.get('matricule_etudiant'):
            demandeur.matricule_etudiant = request.data['matricule_etudiant']
        demandeur.statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
        demandeur.carte_etudiant_date_soumission = timezone.now()
        demandeur.motif_rejet_carte = None
        demandeur.save()
        journaliser(request.user, "DEPOT_CARTE_ETUDIANT", f"Demandeur {demandeur.id}")
        return Response(DemandeurSerializer(demandeur, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='valider-carte-etudiant')
    def valider_carte_etudiant(self, request, pk=None):
        if request.user.role not in ROLES_VALIDATION_CARTE and not request.user.is_superuser:
            return Response({'detail': "Non autorise."}, status=403)

        demandeur = self.get_object()
        decision = request.data.get('decision') or request.data.get('statut')
        if decision not in StatutVerificationEtudiant.values:
            return Response(
                {'decision': [f"Valeurs possibles : {', '.join(StatutVerificationEtudiant.values)}"]},
                status=400,
            )
        motif = (request.data.get('motif') or '').strip()
        if decision == StatutVerificationEtudiant.REJETE and len(motif) < 5:
            return Response(
                {'motif': ["Un motif de rejet (min. 5 caracteres) est obligatoire."]},
                status=400,
            )

        demandeur.statut_verification_etudiant = decision
        demandeur.carte_etudiant_date_validation = timezone.now()
        demandeur.motif_rejet_carte = motif or None
        demandeur.valide_par = request.user
        demandeur.save()

        Notification.objects.create(
            destinataire=demandeur.utilisateur,
            contenu=(
                f"Votre carte etudiant a ete traitee : {decision}."
                + (f" Motif : {motif}" if motif else "")
            ),
        )
        journaliser(request.user, "VALIDATION_CARTE_ETUDIANT", f"Demandeur {demandeur.id}",
                    f"decision={decision}")
        return Response(DemandeurSerializer(demandeur, context={'request': request}).data)
