"""Perimetres des acteurs transverses : Cellule Communication, Administrateur SI
et Direction CROUS-T.

Complement de `terrain/access.py` (qui traite la brigade terrain, le Bureau
d'Environnement-QHSE et le Service Technique). Ce module ferme les anomalies de
visibilite constatees sur les comptes de la capture :

    CELLULE_COMMUNICATION  -> communication institutionnelle uniquement :
                              annonces, appels a candidature, avis cantine
                              (moderation) et statistiques publiques.
                              Elle ne voit plus les dossiers de candidature,
                              les actes, les encaissements, ni les profils
                              etudiants (donnees personnelles).

    ADMINISTRATEUR_SI      -> compte purement TECHNIQUE : comptes, habilitations,
                              parametres systeme, journal d'audit. Aucun
                              privilege metier implicite (plus de redaction
                              d'acte, plus de caisse, plus de validation de
                              carte etudiante, plus de referentiel patrimoine,
                              plus de rapports metier).

    DIRECTEUR_CROUS_T      -> supervision : LECTURE globale conservee (via
                              `core.permissions.est_supervision_lecture`), aucun
                              droit d'ecriture implicite.
"""

ROLE_COMMUNICATION = "CELLULE_COMMUNICATION"
ROLE_ADMIN_SI = "ADMINISTRATEUR_SI"
ROLE_DIRECTION = "DIRECTEUR_CROUS_T"
ROLE_AMICALE = "AMICALE"
ROLE_USAGER = "USAGER"

# Qui instruit un dossier de candidature (et peut donc le lire en entier).
# La Cellule Communication et l'Administrateur SI n'en font pas partie.
ROLES_INSTRUCTION_DOSSIER = (
    "BUREAU_COURRIER",
    "AGENT_DCUVE",
    "DIRECTEUR_DCUVE",
    "SERVICE_JURIDIQUE",
    "SERVICE_COMPTABLE",
    "SERVICE_TECHNIQUE",
    "AGENT_QHSE",
    "AGENT_TERRAIN",
    ROLE_DIRECTION,
)

# Qui peut consulter les profils demandeurs / etudiants (donnees personnelles).
ROLES_PROFIL_DEMANDEUR = (
    "BUREAU_COURRIER",
    "AGENT_DCUVE",
    "DIRECTEUR_DCUVE",
    "SERVICE_JURIDIQUE",
    "SERVICE_COMPTABLE",
    ROLE_DIRECTION,
)

# Qui publie sur la vitrine (annonces, appels a candidature).
ROLES_PUBLICATION = (ROLE_COMMUNICATION,)
ROLES_PUBLICATION_APPELS = (ROLE_COMMUNICATION, ROLE_AMICALE)

# Comptes sans acces aux tableaux de bord et rapports metier consolides.
ROLES_SANS_DONNEES_METIER = (ROLE_COMMUNICATION, ROLE_ADMIN_SI)


def _role(user):
    return getattr(user, "role", None)


def est_communication(user):
    return _role(user) == ROLE_COMMUNICATION


def est_admin_si(user):
    return _role(user) == ROLE_ADMIN_SI


def est_direction(user):
    return _role(user) == ROLE_DIRECTION


def peut_instruire_dossier(user):
    return bool(getattr(user, "is_superuser", False)) or _role(user) in ROLES_INSTRUCTION_DOSSIER


def peut_consulter_profils(user):
    return bool(getattr(user, "is_superuser", False)) or _role(user) in ROLES_PROFIL_DEMANDEUR


def _permission_sans_donnees_metier():
    from rest_framework.permissions import BasePermission

    class SansDonneesMetier(BasePermission):
        """Refuse les agregats metier aux comptes non metier (Communication, SI)."""

        message = (
            "Ce tableau de bord metier n'est pas dans le perimetre de votre compte."
        )

        def has_permission(self, request, view):
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if getattr(user, "is_superuser", False):
                return True
            return _role(user) not in ROLES_SANS_DONNEES_METIER

    return SansDonneesMetier


SansDonneesMetier = _permission_sans_donnees_metier()
