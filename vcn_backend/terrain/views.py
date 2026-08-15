from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from core.audit import journaliser
from .models import Plainte, InspectionQHse, Sanction, AvisCantine, StatutAvis, StatutPlainte
from .serializers import (
    PlainteSerializer,
    PlainteAgentSerializer,
    InspectionQHseSerializer,
    SanctionSerializer,
    AvisCantineSerializer
)
from comptes.models import RoleUtilisateur, Demandeur
from core.permissions import roles_requis
from django.utils import timezone

from . import access

# Roles habilites a instruire un signalement (chacun sur SON perimetre,
# cf. terrain/access.py). L'Administrateur SI en est exclu : compte technique.
ROLES_TRAITEMENT_PLAINTES = access.ROLES_OPERATIONNELS + access.ROLES_PILOTAGE


class PlainteViewSet(viewsets.ModelViewSet):
    queryset = Plainte.objects.select_related('local', 'plaignant', 'agent_traitant').all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Visibilite par perimetre metier :

        * l'occupant/usager ne voit que les signalements qu'il a deposes ;
        * un acteur operationnel ne voit que les types qui le concernent
          (le Bureau d'Environnement ne voit pas les pannes electriques,
          le Service Technique ne voit pas les non-conformites QHSE) plus
          ceux qui lui sont personnellement affectes ;
        * le pilotage voit tout le parc.
        """
        return access.scope_plaintes(super().get_queryset(), self.request.user)

    def get_serializer_class(self):
        if access.peut_instruire_signalement(self.request.user):
            return PlainteAgentSerializer
        return PlainteSerializer

    def _verrou_instruction(self):
        from rest_framework.exceptions import PermissionDenied
        if not access.peut_instruire_signalement(self.request.user):
            raise PermissionDenied("Votre role ne permet pas d'instruire un signalement.")

    def perform_create(self, serializer):
        from rest_framework import serializers
        local = serializer.validated_data.get('local')
        if local:
            # Check cooldown (e.g., 7 days)
            il_y_a_7_jours = timezone.now() - timezone.timedelta(days=7)
            derniere_plainte = Plainte.objects.filter(
                plaignant=self.request.user,
                local=local,
                date_creation__gte=il_y_a_7_jours
            ).first()
            if derniere_plainte:
                raise serializers.ValidationError({"detail": "Vous avez déjà signalé ce local récemment. Veuillez patienter avant un nouveau signalement."})
        
        serializer.save(plaignant=self.request.user)

    def perform_update(self, serializer):
        # Si la plainte passe en résolue, on met la date de résolution
        instance = serializer.save()
        if instance.statut == StatutPlainte.RESOLUE and not instance.date_resolution:
            instance.date_resolution = timezone.now()
            instance.save()

class InspectionQHseViewSet(viewsets.ModelViewSet):
    """Controles terrain / QHSE : reserves aux agents habilites."""
    queryset = InspectionQHse.objects.all()
    serializer_class = InspectionQHseSerializer
    permission_classes = [roles_requis(*(access.ROLES_OPERATIONNELS + access.ROLES_PILOTAGE))]

    def perform_create(self, serializer):
        from rest_framework import serializers
        type_controle = serializer.validated_data.get('type_controle')
        user_role = self.request.user.role
        
        # Validation metier : chaque acteur reste dans son perimetre de controle
        # (cf. terrain/access.TYPES_CONTROLE_PAR_ROLE).
        autorises = access.types_controle_autorises(self.request.user)
        if autorises and type_controle not in autorises:
            libelles = ', '.join(str(t) for t in autorises)
            raise serializers.ValidationError({
                "detail": f"Votre role ({user_role}) ne peut realiser que les controles : {libelles}."
            })

        # L'inspecteur est l'utilisateur connecté
        serializer.save(inspecteur=self.request.user)

class SanctionViewSet(viewsets.ModelViewSet):
    """Sanctions : instruction reservee aux agents QHSE/Terrain et a la direction.

    L'occupant sanctionne conserve la lecture de ses propres sanctions.
    """
    queryset = Sanction.objects.all()
    serializer_class = SanctionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _peut_instruire(self):
        return access.peut_sanctionner(self.request.user)

    def get_queryset(self):
        return access.scope_sanctions(super().get_queryset(), self.request.user)

    def _verrou(self):
        if not self._peut_instruire():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Votre role ne permet pas d'instruire une sanction.")

    def perform_create(self, serializer):
        self._verrou(); serializer.save()

    def perform_update(self, serializer):
        self._verrou(); serializer.save()

    def perform_destroy(self, instance):
        self._verrou(); instance.delete()

# Moderation de la vitrine : Cellule Communication + QHSE + pilotage.
ROLES_MODERATION_AVIS = (
    RoleUtilisateur.CELLULE_COMMUNICATION,
    RoleUtilisateur.AGENT_QHSE,
    RoleUtilisateur.AGENT_DCUVE,
    RoleUtilisateur.DIRECTEUR_DCUVE,
    RoleUtilisateur.DIRECTEUR_CROUS_T,
)


class AvisCantineViewSet(viewsets.ModelViewSet):
    """Avis cantine : deposes uniquement par les usagers etudiants verifies."""
    queryset = AvisCantine.objects.all()
    serializer_class = AvisCantineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _verrou_depot(self):
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user
        if getattr(user, 'role', None) != RoleUtilisateur.USAGER:
            raise PermissionDenied("Seuls les usagers etudiants peuvent deposer un avis cantine.")
        demandeur = Demandeur.objects.filter(utilisateur=user).first()
        if demandeur and not demandeur.est_etudiant:
            raise PermissionDenied("Le droit d'avis cantine est reserve aux etudiants verifies.")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Moderation : Cellule Communication (vitrine), QHSE (qualite de service)
        # et pilotage voient tous les avis, y compris signales/masques.
        if user.is_superuser or getattr(user, 'role', None) in ROLES_MODERATION_AVIS:
            return qs
        if getattr(user, 'role', None) == RoleUtilisateur.USAGER:
            return qs.filter(auteur__utilisateur=user)
        # Tout autre compte (Administrateur SI inclus) : uniquement le publie.
        return qs.filter(statut=StatutAvis.PUBLIE)

    @action(detail=True, methods=['post'], url_path='moderer', url_name='moderer')
    def moderer(self, request, pk=None):
        """Moderation d'un avis cantine : publier / signaler / masquer.

        Boucle metier qui manquait : la Cellule Communication (et le Bureau
        d'Environnement-QHSE) arbitre les avis affiches sur la vitrine.
        """
        from rest_framework.exceptions import PermissionDenied, ValidationError
        user = request.user
        if not user.is_superuser and getattr(user, 'role', None) not in ROLES_MODERATION_AVIS:
            raise PermissionDenied("La moderation des avis appartient a la Cellule Communication.")
        statut = (request.data.get('statut') or '').upper()
        if statut not in StatutAvis.values:
            raise ValidationError({'statut': [f"Statut attendu parmi {', '.join(StatutAvis.values)}."]})
        avis = self.get_object()
        avis.statut = statut
        avis.save(update_fields=['statut', 'date_modification'])
        journaliser(user, "MODERATION_AVIS", f"Avis {avis.id}", f"statut={statut}")
        return Response(self.get_serializer(avis).data)

    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        avis = self.get_object()
        if getattr(avis.auteur, 'utilisateur_id', None) != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez modifier que vos propres avis.")
        serializer.save()

    def perform_create(self, serializer):
        self._verrou_depot()
        # On suppose que l'auteur est un demandeur lié à l'utilisateur
        try:
            demandeur = Demandeur.objects.get(utilisateur=self.request.user)
        except Demandeur.DoesNotExist:
            demandeur = Demandeur.objects.create(utilisateur=self.request.user, contact="")
        serializer.save(auteur=demandeur)


# ---------------------------------------------------------------------------
# Phase 5 — extensions QHSE/Terrain (filtres + actions metier + statistiques)
# ---------------------------------------------------------------------------
from datetime import timedelta
from django.db.models import Avg, Count
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import TypeControleQHSE, NiveauSanction, StatutSanction

ROLES_SANCTION = access.ROLES_SANCTION


def _plainte_filtree(qs, params):
    if params.get('statut'):
        qs = qs.filter(statut=params['statut'])
    if params.get('type'):
        qs = qs.filter(type=params['type'])
    if params.get('urgence'):
        qs = qs.filter(urgence=params['urgence'])
    if params.get('local'):
        qs = qs.filter(local_id=params['local'])
    if params.get('debut'):
        qs = qs.filter(date_creation__date__gte=params['debut'])
    if params.get('fin'):
        qs = qs.filter(date_creation__date__lte=params['fin'])
    return qs


def _patch_plainte_get_queryset():
    original = PlainteViewSet.get_queryset

    def get_queryset(self):
        qs = original(self)
        return _plainte_filtree(qs, self.request.query_params)

    PlainteViewSet.get_queryset = get_queryset


_patch_plainte_get_queryset()


@action(detail=True, methods=['post'], url_path='affecter', url_name='affecter')
def _affecter(self, request, pk=None):
    self._verrou_instruction()
    plainte = self.get_object()
    agent_id = request.data.get('agent_id')
    if not agent_id:
        return Response({'agent_id': ["Ce champ est requis."]}, status=400)
    from comptes.models import Utilisateur
    try:
        agent = Utilisateur.objects.get(id=agent_id)
    except Utilisateur.DoesNotExist:
        return Response({'detail': "Agent introuvable."}, status=400)
    if getattr(agent, 'role', None) not in access.ROLES_OPERATIONNELS:
        return Response(
            {'detail': "Seul un agent de terrain, du Bureau d'Environnement ou du Service Technique peut etre affecte."},
            status=400,
        )
    plainte.agent_traitant = agent
    plainte.statut = StatutPlainte.EN_COURS_TRAITEMENT
    plainte.save(update_fields=['agent_traitant', 'statut', 'date_modification'])
    return Response(PlainteAgentSerializer(plainte).data)


@action(detail=True, methods=['post'], url_path='traiter', url_name='traiter')
def _traiter(self, request, pk=None):
    self._verrou_instruction()
    plainte = self.get_object()
    plainte.statut = StatutPlainte.EN_COURS_TRAITEMENT
    plainte.save(update_fields=['statut', 'date_modification'])
    return Response(PlainteAgentSerializer(plainte).data)


@action(detail=True, methods=['post'], url_path='resoudre', url_name='resoudre')
def _resoudre(self, request, pk=None):
    self._verrou_instruction()
    plainte = self.get_object()
    plainte.statut = StatutPlainte.RESOLUE
    plainte.date_resolution = timezone.now()
    plainte.save(update_fields=['statut', 'date_resolution', 'date_modification'])
    return Response(PlainteAgentSerializer(plainte).data)


@action(detail=False, methods=['post'], url_path='escalader', url_name='escalader')
def _escalader(self, request):
    self._verrou_instruction()
    qs = self.get_queryset().exclude(statut__in=[StatutPlainte.RESOLUE, StatutPlainte.REJETEE])
    nb = 0
    for plainte in qs:
        if plainte.escalader_si_besoin():
            nb += 1
    return Response({'nb_escaladees': nb})


@action(detail=False, methods=['get'], url_path='statistiques', url_name='statistiques')
def _statistiques_plainte(self, request):
    qs = self.get_queryset()
    aujourdhui = timezone.now()
    par_statut = {row['statut']: row['n'] for row in qs.values('statut').annotate(n=Count('id'))}
    par_type = {row['type']: row['n'] for row in qs.values('type').annotate(n=Count('id'))}
    par_urgence = {row['urgence']: row['n'] for row in qs.values('urgence').annotate(n=Count('id'))}

    ouvertes_avec_sla = qs.filter(date_limite_sla__isnull=False)
    sla_depasse = sum(
        1 for p in ouvertes_avec_sla
        if (p.date_resolution or aujourdhui) > p.date_limite_sla
    )
    sla_respecte = ouvertes_avec_sla.count() - sla_depasse

    resolues = qs.filter(statut=StatutPlainte.RESOLUE, date_resolution__isnull=False)
    delais = [(p.date_resolution - p.date_creation).total_seconds() / 86400 for p in resolues]
    delai_moyen = round(sum(delais) / len(delais), 2) if delais else 0

    par_local = list(
        qs.exclude(local__isnull=True).values('local__reference')
        .annotate(n=Count('id')).order_by('-n')[:10]
    )

    serie = []
    for i in range(29, -1, -1):
        jour = aujourdhui.date() - timedelta(days=i)
        serie.append({'date': str(jour), 'n': qs.filter(date_creation__date=jour).count()})

    return Response({
        'total': qs.count(),
        'par_statut': par_statut,
        'par_type': par_type,
        'par_urgence': par_urgence,
        'sla_respecte': sla_respecte,
        'sla_depasse': sla_depasse,
        'delai_moyen_resolution_jours': delai_moyen,
        'top_locaux': par_local,
        'serie_30_jours': serie,
    })


_affecter.__name__ = 'affecter'
PlainteViewSet.affecter = _affecter
_traiter.__name__ = 'traiter'
PlainteViewSet.traiter = _traiter
_resoudre.__name__ = 'resoudre'
PlainteViewSet.resoudre = _resoudre
_escalader.__name__ = 'escalader'
PlainteViewSet.escalader = _escalader
_statistiques_plainte.__name__ = 'statistiques'
PlainteViewSet.statistiques = _statistiques_plainte


def _inspection_get_queryset(self):
    qs = access.scope_inspections(
        InspectionQHse.objects.select_related('local', 'inspecteur'), self.request.user
    )
    params = self.request.query_params
    if params.get('mes_inspections'):
        qs = qs.filter(inspecteur=self.request.user)
    if params.get('local'):
        qs = qs.filter(local_id=params['local'])
    if params.get('type_controle'):
        qs = qs.filter(type_controle=params['type_controle'])
    if params.get('est_conforme') is not None and params.get('est_conforme') != '':
        val = params['est_conforme'] in ('1', 'true', 'True')
        qs = qs.filter(est_conforme=val)
    if params.get('debut'):
        qs = qs.filter(date_visite__date__gte=params['debut'])
    if params.get('fin'):
        qs = qs.filter(date_visite__date__lte=params['fin'])
    return qs


InspectionQHseViewSet.get_queryset = _inspection_get_queryset


@action(detail=False, methods=['get'], url_path='statistiques', url_name='statistiques')
def _statistiques_inspection(self, request):
    qs = self.get_queryset()
    total = qs.count()
    conformes = qs.filter(est_conforme=True).count()
    taux_conformite = round(conformes / total * 100, 1) if total else 0
    note_moyenne = qs.aggregate(m=Avg('note_sanitaire'))['m']
    par_type = list(qs.values('type_controle').annotate(n=Count('id')).order_by('-n'))
    locaux_non_conformes = list(
        qs.filter(est_conforme=False).values('local__reference')
        .annotate(n=Count('id')).order_by('-n')[:10]
    )
    return Response({
        'total': total,
        'conformes': conformes,
        'non_conformes': total - conformes,
        'taux_conformite': taux_conformite,
        'note_sanitaire_moyenne': round(note_moyenne, 2) if note_moyenne else None,
        'par_type_controle': par_type,
        'locaux_non_conformes': locaux_non_conformes,
    })


_statistiques_inspection.__name__ = 'statistiques'
InspectionQHseViewSet.statistiques = _statistiques_inspection


def _sanction_get_permissions(self):
    if self.action in ('create', 'lever'):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]
    return [permissions.IsAuthenticated()]


def _sanction_perform_create(self, serializer):
    user = self.request.user
    if not (user.is_superuser or getattr(user, 'role', None) in ROLES_SANCTION):
        raise PermissionDenied("Votre role ne permet pas de creer une sanction.")
    
    sanction = serializer.save(agent_prononcant=user)
    
    # Phase 5: Diminuer le score de fidelite de l'occupant et declencher OrdreMission si < 0
    if sanction.contrat and sanction.contrat.demandeur:
        demandeur = sanction.contrat.demandeur
        baisse = 0
        if sanction.niveau == 'AVERTISSEMENT': baisse = 1
        elif sanction.niveau == 'RAPPEL_A_L_ORDRE': baisse = 3
        elif sanction.niveau == 'CONVOCATION': baisse = 5
        elif sanction.niveau == 'EXPULSION': baisse = 10
        
        demandeur.score_fidelite -= baisse
        demandeur.save(update_fields=['score_fidelite'])
        
        if demandeur.score_fidelite < 0:
            from .models import OrdreMission, StatutOrdreMission, TypeControleQHSE, NiveauUrgence
            from datetime import timedelta
            from django.utils import timezone
            from comptes.models import Utilisateur
            
            agent_terrain = Utilisateur.objects.filter(role='AGENT_TERRAIN', is_active=True).first()
            if agent_terrain:
                OrdreMission.objects.create(
                    local=sanction.local,
                    agent_assigne=agent_terrain,
                    emetteur=user,
                    objet=f"Discussion physique suite à score négatif ({demandeur.score_fidelite})",
                    directives="L'occupant a accumulé trop d'incidents. Engager une discussion physique urgente.",
                    type_controle=TypeControleQHSE.OCCUPATION,
                    priorite=NiveauUrgence.ELEVEE,
                    date_mission=timezone.now() + timedelta(days=1),
                    statut=StatutOrdreMission.EMIS
                )


@action(detail=True, methods=['post'], url_path='lever', url_name='lever')
def _lever(self, request, pk=None):
    user = request.user
    if not (user.is_superuser or getattr(user, 'role', None) in ROLES_SANCTION):
        raise PermissionDenied("Votre role ne permet pas de lever une sanction.")
    sanction = self.get_object()
    if sanction.statut_sanction == StatutSanction.LEVEE:
        return Response({'detail': "Cette sanction est deja levee."}, status=400)
    motif_levee = request.data.get('motif_levee', '')
    sanction.statut_sanction = StatutSanction.LEVEE
    sanction.date_levee = timezone.now()
    if motif_levee:
        sanction.motif = f"{sanction.motif}\n[Levee] {motif_levee}"
    sanction.save()
    return Response(SanctionSerializer(sanction).data)


@action(detail=False, methods=['get'], url_path='statistiques', url_name='statistiques')
def _statistiques_sanction(self, request):
    if not access.peut_sanctionner(request.user):
        raise PermissionDenied("Votre role ne permet pas de consulter les statistiques de sanctions.")
    qs = self.get_queryset()
    par_niveau = {row['niveau']: row['n'] for row in qs.values('niveau').annotate(n=Count('id'))}
    par_statut = {row['statut_sanction']: row['n'] for row in qs.values('statut_sanction').annotate(n=Count('id'))}
    top_locaux = list(
        qs.values('local__reference').annotate(n=Count('id')).order_by('-n')[:10]
    )
    return Response({
        'total': qs.count(),
        'par_niveau': par_niveau,
        'par_statut': par_statut,
        'top_locaux': top_locaux,
    })


SanctionViewSet.perform_create = _sanction_perform_create
_lever.__name__ = 'lever'
SanctionViewSet.lever = _lever
_statistiques_sanction.__name__ = 'statistiques'
SanctionViewSet.statistiques = _statistiques_sanction
