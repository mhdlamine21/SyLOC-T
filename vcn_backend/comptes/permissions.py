# pyrefly: ignore [missing-import]
from rest_framework import permissions
from .models import RoleUtilisateur

class IsRoleBasePermission(permissions.BasePermission):
    """
    Base class for role-based permissions.
    """
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles


class IsAdministrateurSI(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.ADMINISTRATEUR_SI]


class IsDirecteurCrousT(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.DIRECTEUR_CROUS_T]


class IsDirecteurDcuve(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.DIRECTEUR_DCUVE]


class IsAgentTerrain(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.AGENT_TERRAIN]


class IsAgentQhse(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.AGENT_QHSE]


class IsServiceJuridique(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.SERVICE_JURIDIQUE]


class IsServiceComptable(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.SERVICE_COMPTABLE]


class IsCelluleCommunication(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.CELLULE_COMMUNICATION]

class IsUsager(IsRoleBasePermission):
    allowed_roles = [RoleUtilisateur.USAGER]
