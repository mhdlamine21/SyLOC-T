from rest_framework import viewsets, permissions
from .models import Local
from .serializers import LocalSerializer
from comptes.permissions import IsAdministrateurSI, IsDirecteurCrousT, IsAgentDcuve

class IsPatrimoineManager(permissions.BasePermission):
    """
    Seuls l'Admin, le Directeur et l'Agent DCUVE peuvent modifier le patrimoine.
    Les autres peuvent seulement consulter.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        
        allowed_roles = [
            IsAdministrateurSI.allowed_roles[0],
            IsDirecteurCrousT.allowed_roles[0],
            IsAgentDcuve.allowed_roles[0]
        ]
        return request.user.role in allowed_roles

class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatrimoineManager]
