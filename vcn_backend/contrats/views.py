from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Contrat, ModeleContrat, StatutContrat
from .serializers import (
    ContratSerializer,
    ModeleContratSerializer,
    RedactionSerializer,
    ResiliationSerializer,
)
from .services import (
    CLAUSES_STANDARD,
    CORPS_PAR_DEFAUT,
    VARIABLES_DISPONIBLES,
    rendre_contrat,
)

# Le Service Juridique redige et resilie les actes. La Direction CROUS-T et le
# Directeur DCUVE supervisent en LECTURE (plus d'ecriture implicite) et
# l'Administrateur SI, compte technique, sort completement du perimetre.
ROLES_JURIDIQUE = ('SERVICE_JURIDIQUE',)
# Lecture transverse : juridique, pilotage et comptabilite (recouvrement).
ROLES_LECTURE_GLOBALE = ROLES_JURIDIQUE + (
    'DIRECTEUR_CROUS_T', 'DIRECTEUR_DCUVE', 'SERVICE_COMPTABLE', 'AGENT_DCUVE',
)


def _est_juridique(user):
    return getattr(user, 'role', None) in ROLES_JURIDIQUE or user.is_superuser


class ModeleContratViewSet(viewsets.ModelViewSet):
    """Bibliotheque de modeles d'actes - ecriture reservee au juridique."""

    queryset = ModeleContrat.objects.all()
    serializer_class = ModeleContratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list' and self.request.query_params.get('actifs') == '1':
            qs = qs.filter(est_actif=True)
        return qs

    def _refuser_si_non_juridique(self):
        if not _est_juridique(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul le Service Juridique peut modifier les modeles.')

    def perform_create(self, serializer):
        self._refuser_si_non_juridique()
        serializer.save()

    def perform_update(self, serializer):
        self._refuser_si_non_juridique()
        serializer.save()

    def perform_destroy(self, instance):
        self._refuser_si_non_juridique()
        instance.delete()

    @action(detail=False, methods=['get'])
    def variables(self, request):
        """Aide a la redaction : variables disponibles + gabarit de reference."""
        return Response({
            'variables': VARIABLES_DISPONIBLES,
            'corps_par_defaut': CORPS_PAR_DEFAUT,
            'clauses_standard': CLAUSES_STANDARD,
        })


class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.select_related(
        'local', 'demandeur__utilisateur', 'signataire_crous_t', 'modele'
    ).prefetch_related('echeances__paiements')
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if getattr(user, 'role', None) in ROLES_LECTURE_GLOBALE or user.is_superuser:
            return qs
        # Occupant / usager : uniquement ses propres actes.
        return qs.filter(demandeur__utilisateur=user)

    def _verrou_juridique(self):
        if not _est_juridique(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul le Service Juridique peut rediger ou modifier un acte.')

    def perform_update(self, serializer):
        self._verrou_juridique()
        serializer.save()

    def perform_destroy(self, instance):
        self._verrou_juridique()
        instance.delete()

    def perform_create(self, serializer):
        self._verrou_juridique()
        contrat = serializer.save(signataire_crous_t=self.request.user)
        # Le signal genere l'echeancier ; la gratuite etudiante s'applique ensuite.
        contrat.appliquer_gratuite_etudiante()
        contrat.texte_contrat = rendre_contrat(contrat)
        if contrat.statut == StatutContrat.BROUILLON:
            contrat.statut = StatutContrat.EN_ATTENTE_SIGNATURE
        contrat.save(update_fields=['texte_contrat', 'statut', 'date_modification'])

    # ------------------------------------------------------------------ Phase 4
    @action(detail=True, methods=['get'])
    def apercu(self, request, pk=None):
        """Texte de l'acte pour impression / PDF cote client."""
        contrat = self.get_object()
        texte = contrat.texte_contrat or rendre_contrat(contrat)
        demandeur = contrat.demandeur
        utilisateur = getattr(demandeur, 'utilisateur', None)
        return Response({
            'reference': contrat.reference,
            'statut': contrat.statut,
            'texte': texte,
            'occupant': getattr(utilisateur, 'nom_complet', '') or getattr(utilisateur, 'username', ''),
            'occupant_contact': getattr(demandeur, 'contact', '') or getattr(utilisateur, 'email', ''),
            'local': contrat.local.reference,
            'local_localisation': getattr(contrat.local, 'localisation', ''),
            'date_debut': contrat.date_debut,
            'date_fin': contrat.date_fin,
            'duree_mois': contrat.duree_mois,
            'preavis_mois': contrat.preavis_mois,
        })

    @action(detail=True, methods=['post'], serializer_class=RedactionSerializer)
    def rediger(self, request, pk=None):
        """(Re)genere le corps de l'acte tant qu'il n'est pas signe."""
        contrat = self.get_object()
        if not _est_juridique(request.user):
            return Response({'detail': 'Reserve au Service Juridique.'},
                            status=status.HTTP_403_FORBIDDEN)
        if contrat.statut in (StatutContrat.ACTIF, StatutContrat.RESILIE):
            return Response({'detail': 'Un acte signe ou resilie ne peut plus etre reecrit.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = RedactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donnees = serializer.validated_data

        if donnees.get('modele'):
            contrat.modele = ModeleContrat.objects.filter(id=donnees['modele']).first()
        if donnees.get('clauses_particulieres') is not None:
            contrat.clauses_particulieres = donnees['clauses_particulieres']
        if donnees.get('objet'):
            contrat.objet = donnees['objet']

        contrat.texte_contrat = rendre_contrat(contrat)
        contrat.statut = StatutContrat.EN_ATTENTE_SIGNATURE
        contrat.save()
        return Response(ContratSerializer(contrat).data)

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Enregistre la signature bilaterale : le bail devient opposable."""
        contrat = self.get_object()
        if not _est_juridique(request.user):
            return Response({'detail': 'Reserve au Service Juridique.'},
                            status=status.HTTP_403_FORBIDDEN)
        if contrat.statut == StatutContrat.RESILIE:
            return Response({'detail': 'Acte resilie : reactivation impossible.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not contrat.texte_contrat:
            contrat.texte_contrat = rendre_contrat(contrat)
        contrat.date_signature = timezone.now().date()
        contrat.activer()
        return Response(ContratSerializer(contrat).data)

    @action(detail=True, methods=['post'], serializer_class=ResiliationSerializer)
    def resilier(self, request, pk=None):
        """Acte de rupture / resiliation domaniale (UC42)."""
        contrat = self.get_object()
        if not _est_juridique(request.user):
            return Response({'detail': 'Reserve au Service Juridique.'},
                            status=status.HTTP_403_FORBIDDEN)
        if contrat.statut == StatutContrat.RESILIE:
            return Response({'detail': 'Ce contrat est deja resilie.'},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer = ResiliationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contrat.resilier(
            serializer.validated_data['motif'],
            serializer.validated_data.get('date_effet'),
        )
        return Response(ContratSerializer(contrat).data)

    @action(detail=True, methods=['get'])
    def quitus_general(self, request, pk=None):
        """Quitus de fin de bail : atteste que l'occupant est quitte de tout du."""
        contrat = self.get_object()
        solde = contrat.solde_du()
        encaisse = 0.0
        for ech in contrat.echeances.all():
            encaisse += sum(float(p.montant_regle or 0) for p in ech.paiements.all())
        return Response({
            'reference': f"QG-{contrat.reference}",
            'contrat': contrat.reference,
            'occupant': getattr(contrat.demandeur.utilisateur, 'nom_complet', ''),
            'local': contrat.local.reference,
            'local_localisation': contrat.local.localisation,
            'date_emission': timezone.now().date(),
            'total_encaisse': round(encaisse, 2),
            'solde_restant': solde,
            'quitte': solde <= 0,
            'mention': "L'occupant est quitte de toute redevance a la date d'emission."
            if solde <= 0 else f"Solde restant du : {solde:,.0f} FCFA".replace(',', ' '),
        })

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Indicateurs du portefeuille contractuel (tableau de bord juridique)."""
        qs = self.get_queryset()
        aujourdhui = timezone.now().date()
        par_statut = {
            row['statut']: row['n']
            for row in qs.values('statut').annotate(n=Count('id'))
        }
        actifs = qs.filter(statut=StatutContrat.ACTIF)
        echeance_proche = [
            {
                'id': str(c.id),
                'reference': c.reference,
                'occupant': getattr(c.demandeur.utilisateur, 'nom_complet', ''),
                'local': c.local.reference if c.local else '-',
                'local_localisation': c.local.localisation if c.local else '',
                'date_fin': c.date_fin,
            }
            for c in actifs
            if 0 <= (c.date_fin - aujourdhui).days <= 120
        ]

        from demandes.models import Demande, StatutDemande
        nb_baux_a_rediger = Demande.objects.filter(statut=StatutDemande.FAVORABLE).count()

        redevance_totale = sum(
            c.echeances.first().montant_du if c.echeances.exists() else (getattr(c.local, 'loyer_mensuel', 0) or 0)
            for c in actifs if not c.est_gratuit
        )

        return Response({
            'total': qs.count(),
            'par_statut': par_statut,
            'nb_actifs': actifs.count(),
            'nb_resilies': qs.filter(statut=StatutContrat.RESILIE).count(),
            'nb_en_attente_signature': qs.filter(
                statut=StatutContrat.EN_ATTENTE_SIGNATURE
            ).count(),
            'nb_gratuits': qs.filter(est_gratuit=True).count(),
            'redevance_mensuelle_totale': float(redevance_totale),
            'nb_baux_a_rediger': nb_baux_a_rediger,
            'echeance_proche': sorted(echeance_proche, key=lambda x: x['date_fin']),
            'nb_modeles_actifs': ModeleContrat.objects.filter(est_actif=True).count(),
        })

    @action(detail=True, methods=['post'])
    def convoquer(self, request, pk=None):
        """Convocation formelle du candidat pour la signature de l'acte."""
        contrat = self.get_object()
        self._verrou_juridique()

        if contrat.statut != StatutContrat.EN_ATTENTE_SIGNATURE:
            return Response(
                {"detail": "Le contrat doit être 'En attente de signature' pour convoquer le candidat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        date_rdv = request.data.get('date_rdv')
        mode = request.data.get('mode', 'PHYSIQUE')
        lieu = request.data.get('lieu', '')

        if not date_rdv:
            return Response(
                {"detail": "La date et l'heure du rendez-vous sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST
            )

        contrat.convocation_date = date_rdv
        contrat.convocation_mode = mode
        contrat.convocation_lieu = lieu
        contrat.convocation_envoyee = True
        contrat.save(update_fields=['convocation_date', 'convocation_mode', 'convocation_lieu', 'convocation_envoyee'])

        # Mettre à jour la demande associée
        if contrat.demande:
            from demandes.models import StatutDemande
            contrat.demande.statut = StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE
            contrat.demande.rdv_signature_date = date_rdv
            contrat.demande.save(update_fields=['statut', 'rdv_signature_date'])
            # journaliser() pourrait être appelé ici si besoin

        return Response(ContratSerializer(contrat).data)

