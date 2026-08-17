"""Phase 5 : Terrain/QHSE (ordres de mission) et Service Technique (maintenance)."""
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from comptes.models import RoleUtilisateur

from .models import (
    InterventionMaintenance, NiveauUrgence, OrdreMission, Plainte,
    StatutIntervention, StatutOrdreMission, StatutPlainte,
)
from .serializers import InterventionMaintenanceSerializer, OrdreMissionSerializer
from . import access
from core.permissions import roles_requis

# Supervision des ordres de mission = pilotage uniquement. Un agent QHSE ou du
# Service Technique n'est plus superviseur global : il voit ce qu'il emet et ce
# qui lui est assigne (la liaison agent <-> mission devient lisible et juste).
ROLES_SUPERVISION = access.ROLES_PILOTAGE


class OrdreMissionViewSet(viewsets.ModelViewSet):
    queryset = OrdreMission.objects.select_related(
        'local', 'agent_assigne', 'emetteur', 'plainte_source', 'inspection_resultat'
    ).all()
    serializer_class = OrdreMissionSerializer
    permission_classes = [roles_requis(
        *(access.ROLES_EMISSION_MISSION + access.ROLES_EXECUTION_MISSION)
    )]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('statut'):
            qs = qs.filter(statut=params['statut'])
        if params.get('mes_missions'):
            qs = qs.filter(agent_assigne=self.request.user)
        return access.scope_ordres_mission(qs, self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.role in access.ROLES_EMISSION_MISSION):
            raise PermissionDenied(
                "Seul le Bureau d'Environnement (QHSE) ou le pilotage peut emettre un ordre de mission."
            )
        agent = serializer.validated_data.get('agent_assigne')
        if agent is not None and getattr(agent, 'role', None) not in access.ROLES_EXECUTION_MISSION:
            raise ValidationError({
                'agent_assigne': "Une mission ne peut etre confiee qu'a un agent de terrain, QHSE ou au Service Technique."
            })
        type_controle = serializer.validated_data.get('type_controle')
        types_agent = access.types_controle_autorises(agent) if agent is not None else ()
        if type_controle and types_agent and type_controle not in types_agent:
            raise ValidationError({
                'type_controle': "Ce type de controle ne releve pas du perimetre de l'agent choisi."
            })
        serializer.save(emetteur=user)

    @action(detail=True, methods=['post'])
    def demarrer(self, request, pk=None):
        ordre = self.get_object()
        if request.user not in (ordre.agent_assigne, ordre.emetteur) and not (
            request.user.is_superuser or request.user.role in ROLES_SUPERVISION
        ):
            raise PermissionDenied("Seul l'agent assigne peut demarrer cette mission.")
        if ordre.statut != StatutOrdreMission.EMIS:
            return Response({'detail': "Seul un ordre emis peut etre demarre."},
                             status=status.HTTP_400_BAD_REQUEST)
        ordre.statut = StatutOrdreMission.EN_COURS
        ordre.save(update_fields=['statut', 'date_modification'])
        return Response(OrdreMissionSerializer(ordre).data)

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        ordre = self.get_object()
        if request.user != ordre.agent_assigne and not (
            request.user.is_superuser or request.user.role in ROLES_SUPERVISION
        ):
            raise PermissionDenied("Seul l'agent assigne peut cloturer cette mission.")
        compte_rendu = request.data.get('compte_rendu')
        if not compte_rendu:
            return Response({'compte_rendu': ["Ce champ est requis pour cloturer la mission."]},
                             status=status.HTTP_400_BAD_REQUEST)
        if ordre.statut in (StatutOrdreMission.EXECUTE, StatutOrdreMission.ANNULE):
            return Response({'detail': "Cet ordre est deja clos."}, status=status.HTTP_400_BAD_REQUEST)
        ordre.compte_rendu = compte_rendu
        ordre.statut = StatutOrdreMission.EXECUTE
        inspection_id = request.data.get('inspection_id')
        if inspection_id:
            from .models import InspectionQHse
            inspection = InspectionQHse.objects.filter(id=inspection_id).first()
            if inspection:
                ordre.inspection_resultat = inspection
        ordre.save()
        return Response(OrdreMissionSerializer(ordre).data)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        ordre = self.get_object()
        if not (request.user.is_superuser or request.user.role in ROLES_SUPERVISION
                or request.user == ordre.emetteur):
            raise PermissionDenied("Seul l'emetteur peut annuler cet ordre.")
        if ordre.statut == StatutOrdreMission.EXECUTE:
            return Response({'detail': "Un ordre execute ne peut plus etre annule."},
                             status=status.HTTP_400_BAD_REQUEST)
        ordre.statut = StatutOrdreMission.ANNULE
        ordre.save(update_fields=['statut', 'date_modification'])
        return Response(OrdreMissionSerializer(ordre).data)


ROLES_MAINTENANCE = access.ROLES_MAINTENANCE


class InterventionMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = InterventionMaintenance.objects.select_related(
        'local', 'plainte_source', 'technicien'
    ).all()
    serializer_class = InterventionMaintenanceSerializer
    permission_classes = [roles_requis(*(ROLES_MAINTENANCE + access.ROLES_PILOTAGE))]

    def get_queryset(self):
        qs = access.scope_interventions(super().get_queryset(), self.request.user)
        params = self.request.query_params
        if params.get('statut'):
            qs = qs.filter(statut=params['statut'])
        if params.get('type_intervention'):
            qs = qs.filter(type_intervention=params['type_intervention'])
        if params.get('local'):
            qs = qs.filter(local_id=params['local'])
        if params.get('mes_interventions'):
            qs = qs.filter(technicien=self.request.user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.role in ROLES_MAINTENANCE):
            raise PermissionDenied("Seul le Service Technique (ou la brigade terrain) planifie une intervention.")
        technicien = serializer.validated_data.get('technicien') or user
        if getattr(technicien, 'role', None) not in ROLES_MAINTENANCE:
            raise ValidationError({'technicien': "Le technicien doit appartenir au Service Technique."})
        serializer.save(technicien=technicien)

    def _verrou_technicien(self, intervention):
        user = self.request.user
        if user.is_superuser or user.role in access.ROLES_PILOTAGE:
            return
        if intervention.technicien_id != user.id and user.role not in ROLES_MAINTENANCE:
            raise PermissionDenied("Seul le technicien en charge peut faire evoluer cette intervention.")

    @action(detail=True, methods=['post'])
    def demarrer(self, request, pk=None):
        intervention = self.get_object()
        self._verrou_technicien(intervention)
        if intervention.statut != StatutIntervention.PLANIFIEE:
            return Response({'detail': "Seule une intervention planifiee peut demarrer."},
                             status=status.HTTP_400_BAD_REQUEST)
        intervention.statut = StatutIntervention.EN_COURS
        intervention.save(update_fields=['statut', 'date_modification'])
        return Response(InterventionMaintenanceSerializer(intervention).data)

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        intervention = self.get_object()
        self._verrou_technicien(intervention)
        if intervention.statut in (StatutIntervention.TERMINEE, StatutIntervention.ANNULEE):
            return Response({'detail': "Cette intervention est deja cloturee."},
                             status=status.HTTP_400_BAD_REQUEST)
        rapport = request.data.get('rapport', '')
        cout_reel = request.data.get('cout_reel')
        intervention.statut = StatutIntervention.TERMINEE
        intervention.date_realisation = timezone.now()
        intervention.rapport = rapport
        if cout_reel is not None:
            intervention.cout_reel = cout_reel
        intervention.save()
        if intervention.plainte_source and intervention.plainte_source.statut != StatutPlainte.RESOLUE:
            plainte = intervention.plainte_source
            plainte.statut = StatutPlainte.RESOLUE
            plainte.date_resolution = timezone.now()
            plainte.save(update_fields=['statut', 'date_resolution', 'date_modification'])
        return Response(InterventionMaintenanceSerializer(intervention).data)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        intervention = self.get_object()
        self._verrou_technicien(intervention)
        if intervention.statut == StatutIntervention.TERMINEE:
            return Response({'detail': "Une intervention terminee ne peut plus etre annulee."},
                             status=status.HTTP_400_BAD_REQUEST)
        intervention.statut = StatutIntervention.ANNULEE
        intervention.save(update_fields=['statut', 'date_modification'])
        return Response(InterventionMaintenanceSerializer(intervention).data)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        qs = self.get_queryset()
        par_statut = {row['statut']: row['n'] for row in qs.values('statut').annotate(n=Count('id'))}
        par_type = {row['type_intervention']: row['n'] for row in qs.values('type_intervention').annotate(n=Count('id'))}
        cout_estime_total = sum(float(i.cout_estime or 0) for i in qs)
        cout_reel_total = sum(float(i.cout_reel or 0) for i in qs)
        terminees = qs.filter(statut=StatutIntervention.TERMINEE, date_realisation__isnull=False)
        delais = [
            (i.date_realisation.date() - i.date_planifiee.date()).days
            for i in terminees if i.date_realisation and i.date_planifiee
        ]
        delai_moyen = round(sum(delais) / len(delais), 1) if delais else 0
        return Response({
            'total': qs.count(),
            'par_statut': par_statut,
            'par_type': par_type,
            'cout_estime_total': round(cout_estime_total, 2),
            'cout_reel_total': round(cout_reel_total, 2),
            'delai_moyen_jours': delai_moyen,
        })
