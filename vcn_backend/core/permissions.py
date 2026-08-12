from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """
    Permission generique par role. Usage dans une vue :

        permission_classes = [HasRole]
        roles_autorises = ["DIRECTEUR_CROUS_T", "DIRECTEUR_DCUVE"]

    Le role du Directeur CROUS-T debloque toujours (voir matrice de
    responsabilite : il est le seul a pouvoir agir a tous les niveaux).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        roles_autorises = getattr(view, "roles_autorises", None)
        if not roles_autorises:
            return True
        if request.user.role == "DIRECTEUR_CROUS_T":
            return True
        return request.user.role in roles_autorises


class EstProprietaire(BasePermission):
    """
    Permission objet : un Demandeur/Occupant ne peut agir que sur ses
    propres objets (sa demande, son contrat, son signalement...).
    L'objet cible doit exposer un champ `demandeur` ou `utilisateur`.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if getattr(user, "role", None) == "DIRECTEUR_CROUS_T":
            return True
        owner = getattr(obj, "demandeur", None) or getattr(obj, "utilisateur", None)
        return owner is not None and getattr(owner, "id", None) == user.id


def roles_requis(*roles):
    """Fabrique une permission DRF limitee a une liste de roles.

    Remplace `IsAdminUser` sur les actions metier : un Directeur DCUVE ou le
    Service Juridique n'est pas un superuser Django, il doit pourtant pouvoir
    agir sur les dossiers.
    """
    class _RolesRequis(BasePermission):
        message = "Votre role ne permet pas cette action."

        def has_permission(self, request, view):
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if user.is_superuser or getattr(user, "role", None) == "DIRECTEUR_CROUS_T":
                return True
            return getattr(user, "role", None) in roles

    return _RolesRequis
