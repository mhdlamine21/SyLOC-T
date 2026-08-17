# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Local, StatutOccupation
from .serializers import LocalSerializer
from comptes.permissions import IsAdministrateurSI, IsDirecteurCrousT, IsDirecteurDcuve
from comptes.models import RoleUtilisateur


class IsPatrimoineManager(permissions.BasePermission):
    """
    Seuls le Directeur DCUVE et l'Agent DCUVE peuvent modifier le referentiel
    des locaux (gestion du patrimoine). La Direction CROUS-T supervise en
    lecture et l'Administrateur SI, compte technique, ne gere pas le
    patrimoine. Les autres peuvent seulement consulter.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_roles = [
            IsDirecteurDcuve.allowed_roles[0],
            RoleUtilisateur.AGENT_DCUVE,
        ]
        return request.user.role in allowed_roles


class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatrimoineManager]

    def get_queryset(self):
        qs = super().get_queryset()
        statut = self.request.query_params.get('statut_occupation')
        if statut:
            statut = statut.upper()
            ids = [loc.id for loc in qs if loc.statut_occupation == statut]
            qs = qs.filter(id__in=ids)
        return qs

    @action(detail=False, methods=['get'])
    def eligibles(self, request):
        """Locaux disponibles (non occupes) pour une candidature directe (depot de dossier)."""
        qs = [loc for loc in self.get_queryset() if loc.statut_occupation == StatutOccupation.DISPONIBLE]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # Correspondance entre la nature du projet deposé par le candidat et la
    # vocation des emplacements que le CROUS-T autorise pour ce projet.
    VOCATIONS_AUTORISEES = {
        'LOCAL_ARTISANAL': ['ARTISANAT'],
        'VENTE_ALIMENTAIRE': ['RESTAURATION'],
        'VENTE_PRODUIT': ['PAPETERIE', 'MULTISERVICES'],
        'PRESTATION_SERVICE': ['MULTISERVICES'],
    }

    @action(detail=False, methods=['get'], url_path='emplacements-autorises')
    def emplacements_autorises(self, request):
        """Emplacements ou un type de projet est autorise (avec photo de vitrine).

        Utilise par l'assistant de depot : le candidat visualise les lieux
        autorises pour son projet (ex. local artisanal) et choisit le sien.
        """
        type_demande = (request.query_params.get('type_demande') or '').upper()
        vocations = self.VOCATIONS_AUTORISEES.get(type_demande)
        qs = [loc for loc in self.get_queryset() if loc.statut_occupation == StatutOccupation.DISPONIBLE]
        if vocations:
            qs = [loc for loc in qs if loc.type_local in vocations]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
