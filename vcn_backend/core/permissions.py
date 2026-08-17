from rest_framework.permissions import SAFE_METHODS, BasePermission

# Le Directeur CROUS-T est l'admin METIER : il supervise tout (lecture) mais
# n'herite plus automatiquement des droits d'ECRITURE operationnels des autres
# services (instruire une inspection, cloturer une mission...). Il doit etre
# explicitement liste dans la vue pour agir.
ROLE_DIRECTION = "DIRECTEUR_CROUS_T"

# L'Administrateur SI est un compte TECHNIQUE : comptes, roles, parametres,
# journal d'audit. Il n'a aucun privilege metier implicite.
ROLE_ADMIN_SI = "ADMINISTRATEUR_SI"


def _roles_utilisateur(user):
    if not user:
        return set()
    r = getattr(user, "role", None)
    roles = {r} if r else set()
    if r == "USAGER":
        try:
            from contrats.models import Contrat
            if hasattr(user, "profil_demandeur") and Contrat.objects.filter(
                demandeur=user.profil_demandeur, est_actif=True
            ).exists():
                roles.add("OCCUPANT")
        except Exception:
            pass
    return roles


def _role(user):
    return getattr(user, "role", None)


def est_supervision_lecture(request):
    """Vrai si la requete est une simple lecture faite par la Direction."""
    return _role(request.user) == ROLE_DIRECTION and request.method in SAFE_METHODS


class HasRole(BasePermission):
    """
    Permission generique par role. Usage dans une vue :

        permission_classes = [HasRole]
        roles_autorises = ["DIRECTEUR_CROUS_T", "DIRECTEUR_DCUVE"]

    Le Directeur CROUS-T conserve un droit de LECTURE transverse (supervision),
    mais pas un droit d'ecriture implicite : pour agir il doit figurer dans
    `roles_autorises`.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        roles_autorises = getattr(view, "roles_autorises", None)
        if not roles_autorises:
            return True
        if est_supervision_lecture(request):
            return True
        return bool(_roles_utilisateur(request.user).intersection(roles_autorises))


class EstProprietaire(BasePermission):
    """
    Permission objet : un Demandeur/Occupant ne peut agir que sur ses
    propres objets (sa demande, son contrat, son signalement...).
    L'objet cible doit exposer un champ `demandeur` ou `utilisateur`.

    La Direction peut consulter (lecture seule) tout objet.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if est_supervision_lecture(request):
            return True
        owner = getattr(obj, "demandeur", None) or getattr(obj, "utilisateur", None)
        return owner is not None and getattr(owner, "id", None) == user.id


def roles_requis(*roles):
    """Fabrique une permission DRF limitee a une liste de roles.

    Remplace `IsAdminUser` sur les actions metier : un Directeur DCUVE ou le
    Service Juridique n'est pas un superuser Django, il doit pourtant pouvoir
    agir sur les dossiers.

    Le superuser Django reste debloque (compte de maintenance) et la Direction
    garde la lecture transverse ; toute ECRITURE exige un role explicite.
    """
    class _RolesRequis(BasePermission):
        message = "Votre role ne permet pas cette action."

        def has_permission(self, request, view):
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if user.is_superuser:
                return True
            if est_supervision_lecture(request):
                return True
            return bool(_roles_utilisateur(user).intersection(roles))

    return _RolesRequis
