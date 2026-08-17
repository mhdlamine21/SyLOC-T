"""Phase 6 - Rapports de visite terrain (cadence 10 jours) et dispatch d'agent.

Deux besoins metier :
  * l'agent de terrain / QHSE rend compte de chaque visite a SA commission,
    avec une cadence reglementaire de 10 jours par local ;
  * lorsqu'un occupant tombe a un score de fidelite tres negatif, la
    commission environnement declenche l'envoi d'un agent (mediation).
"""
from datetime import timedelta

from django.db.models import Count, Max
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from comptes.models import Demandeur, RoleUtilisateur
from patrimoine.models import Local

from .models import (
    CADENCE_VISITE_JOURS, DispatchFidelite, RapportVisiteTerrain,
    StatutDispatch, StatutRapportVisite,
)
from .serializers import DispatchFideliteSerializer, RapportVisiteTerrainSerializer
from . import access
from core.permissions import roles_requis

ROLES_TERRAIN = access.ROLES_OPERATIONNELS
ROLES_PILOTAGE = access.ROLES_PILOTAGE


class RapportVisiteTerrainViewSet(viewsets.ModelViewSet):
    queryset = RapportVisiteTerrain.objects.select_related('local', 'agent', 'inspection').all()
    serializer_class = RapportVisiteTerrainSerializer
    # Un usager/occupant n'a rien a faire dans les rapports de visite.
    permission_classes = [roles_requis(*(ROLES_TERRAIN + ROLES_PILOTAGE))]

    def get_queryset(self):
        # Chaque agent voit ses rapports + ceux adresses a sa commission.
        qs = access.scope_rapports_visite(super().get_queryset(), self.request.user)
        params = self.request.query_params
        if params.get('local'):
            qs = qs.filter(local_id=params['local'])
        if params.get('statut'):
            qs = qs.filter(statut=params['statut'])
        if params.get('commission'):
            qs = qs.filter(commission_destinataire=params['commission'])
        if params.get('mes_rapports'):
            qs = qs.filter(agent=self.request.user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ROLES_TERRAIN:
            raise ValidationError("Seuls les agents de terrain / QHSE / technique rédigent un rapport de visite.")
        commissions = access.commissions_autorisees(user)
        commission = serializer.validated_data.get('commission_destinataire')
        if commission and commissions and commission not in commissions:
            raise ValidationError(
                {'commission_destinataire': "Vous ne pouvez adresser un rapport qu'à votre commission de rattachement."}
            )
        types = access.types_controle_autorises(user)
        type_controle = serializer.validated_data.get('type_controle')
        if type_controle and types and type_controle not in types:
            raise ValidationError(
                {'type_controle': "Ce type de contrôle ne relève pas de votre périmètre."}
            )
        serializer.save(agent=user)

    @action(detail=True, methods=['post'])
    def transmettre(self, request, pk=None):
        """Transmet le rapport a la commission destinataire."""
        rapport = self.get_object()
        if rapport.agent_id != request.user.id and request.user.role not in ROLES_PILOTAGE:
            return Response({'detail': "Seul l'agent rédacteur peut transmettre son rapport."},
                            status=status.HTTP_403_FORBIDDEN)
        if rapport.statut == StatutRapportVisite.TRANSMIS:
            return Response({'detail': 'Rapport déjà transmis.'}, status=status.HTTP_400_BAD_REQUEST)
        rapport.transmettre()
        return Response(self.get_serializer(rapport).data)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Validation du rapport par la commission destinataire."""
        if request.user.role not in access.ROLES_VALIDATION_RAPPORT and not request.user.is_superuser:
            return Response({'detail': "Seule la commission (pilotage) valide un rapport de visite."},
                            status=status.HTTP_403_FORBIDDEN)
        rapport = self.get_object()
        if rapport.statut == StatutRapportVisite.BROUILLON:
            return Response({'detail': "Le rapport doit d'abord être transmis à la commission."},
                            status=status.HTTP_400_BAD_REQUEST)
        rapport.statut = StatutRapportVisite.VALIDE
        rapport.save(update_fields=['statut', 'date_modification'])
        return Response(self.get_serializer(rapport).data)

    @action(detail=False, methods=['get'])
    def cadence(self, request):
        """Suivi de la cadence de 10 jours, local par local.

        Renvoie pour chaque local la derniere visite, l'echeance de la
        prochaine et le retard eventuel (en jours).
        """
        maintenant = timezone.now()
        dernieres = {
            r['local_id']: r['derniere']
            for r in RapportVisiteTerrain.objects.values('local_id').annotate(derniere=Max('date_visite'))
        }
        lignes = []
        for local in Local.objects.all():
            derniere = dernieres.get(local.id)
            echeance = (derniere + timedelta(days=CADENCE_VISITE_JOURS)) if derniere else None
            retard = 0
            if echeance and maintenant > echeance:
                retard = (maintenant - echeance).days
            lignes.append({
                'local_id': str(local.id),
                'reference': local.reference,
                'localisation': local.localisation,
                'derniere_visite': derniere,
                'prochaine_visite': echeance,
                'jours_retard': retard,
                'statut_cadence': 'JAMAIS_VISITE' if not derniere else ('EN_RETARD' if retard else 'A_JOUR'),
            })
        lignes.sort(key=lambda l: (l['statut_cadence'] != 'EN_RETARD', -l['jours_retard']))
        return Response({
            'cadence_jours': CADENCE_VISITE_JOURS,
            'nb_locaux': len(lignes),
            'nb_en_retard': sum(1 for l in lignes if l['statut_cadence'] == 'EN_RETARD'),
            'nb_jamais_visites': sum(1 for l in lignes if l['statut_cadence'] == 'JAMAIS_VISITE'),
            'resultats': lignes,
        })

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'transmis': qs.filter(statut=StatutRapportVisite.TRANSMIS).count(),
            'valides': qs.filter(statut=StatutRapportVisite.VALIDE).count(),
            'non_conformes': qs.filter(conforme=False).count(),
            'par_commission': list(
                qs.values('commission_destinataire').annotate(nb=Count('id')).order_by('-nb')
            ),
        })


class DispatchFideliteViewSet(viewsets.ModelViewSet):
    queryset = DispatchFidelite.objects.select_related(
        'demandeur__utilisateur', 'agent_assigne', 'local'
    ).all()
    serializer_class = DispatchFideliteSerializer
    permission_classes = [roles_requis(*(ROLES_TERRAIN + ROLES_PILOTAGE))]

    def get_queryset(self):
        # La brigade terrain ne voit que les médiations qui lui sont assignées.
        qs = access.scope_dispatch(super().get_queryset(), self.request.user)
        params = self.request.query_params
        if params.get('statut'):
            qs = qs.filter(statut=params['statut'])
        if params.get('mes_missions'):
            qs = qs.filter(agent_assigne=self.request.user)
        return qs

    def _verrou_pilotage_qhse(self):
        user = self.request.user
        autorises = access.ROLES_EMISSION_MISSION
        if not (user.is_superuser or user.role in autorises):
            raise ValidationError(
                "Seul le Bureau d'Environnement (QHSE) ou le pilotage peut déclencher/assigner un dispatch."
            )

    def perform_create(self, serializer):
        self._verrou_pilotage_qhse()
        demandeur = serializer.validated_data.get('demandeur')
        score = getattr(demandeur, 'score_fidelite', None)
        instance = serializer.save(demandeur_par=self.request.user, score_constate=score)
        # Le local occupe par le demandeur est rattache automatiquement.
        if not instance.local:
            contrat = getattr(demandeur, 'contrats', None)
            if contrat is not None:
                actif = contrat.order_by('-date_creation').first()
                if actif and getattr(actif, 'local_id', None):
                    instance.local_id = actif.local_id
                    instance.save(update_fields=['local', 'date_modification'])

    @action(detail=True, methods=['post'])
    def assigner(self, request, pk=None):
        from comptes.models import Utilisateur
        self._verrou_pilotage_qhse()
        dispatch = self.get_object()
        agent_id = request.data.get('agent')
        if not agent_id:
            return Response({'detail': "L'identifiant de l'agent est requis."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            agent = Utilisateur.objects.get(pk=agent_id)
        except Utilisateur.DoesNotExist:
            return Response({'detail': 'Agent introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if getattr(agent, 'role', None) not in access.ROLES_EXECUTION_MISSION:
            return Response(
                {'detail': "Seul un agent de terrain, QHSE ou du Service Technique peut être dispatché."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        dispatch.agent_assigne = agent
        dispatch.statut = StatutDispatch.ASSIGNE
        dispatch.save(update_fields=['agent_assigne', 'statut', 'date_modification'])
        return Response(self.get_serializer(dispatch).data)

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        dispatch = self.get_object()
        if dispatch.agent_assigne_id != request.user.id and request.user.role not in ROLES_PILOTAGE:
            return Response({'detail': "Seul l'agent assigné clôture sa médiation."},
                            status=status.HTTP_403_FORBIDDEN)
        dispatch.compte_rendu = request.data.get('compte_rendu', '')
        dispatch.statut = StatutDispatch.CLOTURE
        dispatch.date_intervention = timezone.now()
        dispatch.save(update_fields=['compte_rendu', 'statut', 'date_intervention', 'date_modification'])
        return Response(self.get_serializer(dispatch).data)

    @action(detail=False, methods=['get'])
    def candidats(self, request):
        """Occupants eligibles a un dispatch (score fortement negatif)."""
        if not (request.user.is_superuser or request.user.role in access.ROLES_EMISSION_MISSION):
            return Response({'detail': "Réservé au Bureau d'Environnement et au pilotage."},
                            status=status.HTTP_403_FORBIDDEN)
        try:
            seuil = float(request.query_params.get('seuil', -20))
        except (TypeError, ValueError):
            seuil = -20.0
        deja = set(
            DispatchFidelite.objects
            .exclude(statut__in=[StatutDispatch.CLOTURE, StatutDispatch.ANNULE])
            .values_list('demandeur_id', flat=True)
        )
        resultats = [{
            'demandeur_id': str(d.id),
            'nom': d.utilisateur.nom_complet or d.utilisateur.username,
            'score': d.score_fidelite,
            'dispatch_en_cours': d.id in deja,
        } for d in Demandeur.objects.select_related('utilisateur')
            .filter(score_fidelite__lte=seuil).order_by('score_fidelite')]
        return Response({'seuil': seuil, 'nombre': len(resultats), 'resultats': resultats})
