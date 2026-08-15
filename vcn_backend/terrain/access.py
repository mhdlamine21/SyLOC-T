"""Politique d'acces unique du domaine terrain / QHSE / technique.

Ce module est la source de verite des perimetres metier. Il evite que chaque
vue redefinisse sa propre liste de roles (source des anomalies de visibilite :
un agent de terrain voyait les controles sanitaires du Bureau d'Environnement,
un usager pouvait lire les rapports de visite et les dispatchs...).

Trois acteurs operationnels, trois perimetres disjoints (avec un recouvrement
volontaire sur l'environnement et l'occupation) :

    AGENT_TERRAIN     -> brigade de controle : technique, electrique,
                         occupation, environnement, denonciations
    AGENT_QHSE        -> Bureau d'Environnement : sanitaire, non-conformites
                         QHSE, environnement, sanctions
    SERVICE_TECHNIQUE -> maintenance : technique / electrique uniquement

Au-dessus, le pilotage (DCUVE + Direction CROUS-T) a une vision globale en
lecture. L'Administrateur SI n'est PAS un acteur metier : il n'apparait dans
aucun perimetre ci-dessous.
"""
from django.db.models import Q

from comptes.models import RoleUtilisateur

from .models import CommissionDestinataire, TypeControleQHSE, TypeSignalement

# --- Acteurs ---------------------------------------------------------------

ROLES_OPERATIONNELS = (
    RoleUtilisateur.AGENT_TERRAIN,
    RoleUtilisateur.AGENT_QHSE,
    RoleUtilisateur.SERVICE_TECHNIQUE,
)

# Vision globale (lecture) : instruction DCUVE + direction metier.
ROLES_PILOTAGE = (
    RoleUtilisateur.AGENT_DCUVE,
    RoleUtilisateur.DIRECTEUR_DCUVE,
    RoleUtilisateur.DIRECTEUR_CROUS_T,
)

# Qui peut prononcer / lever une sanction : Bureau d'Environnement, brigade
# terrain, juridique et direction. (Le Service Technique repare, il ne
# sanctionne pas.)
ROLES_SANCTION = (
    RoleUtilisateur.AGENT_QHSE,
    RoleUtilisateur.AGENT_TERRAIN,
    RoleUtilisateur.SERVICE_JURIDIQUE,
    RoleUtilisateur.DIRECTEUR_DCUVE,
    RoleUtilisateur.DIRECTEUR_CROUS_T,
)

# Qui emet un ordre de mission : le Bureau d'Environnement pilote la brigade,
# la direction/DCUVE peut egalement mandater.
ROLES_EMISSION_MISSION = (
    RoleUtilisateur.AGENT_QHSE,
    RoleUtilisateur.AGENT_DCUVE,
    RoleUtilisateur.DIRECTEUR_DCUVE,
    RoleUtilisateur.DIRECTEUR_CROUS_T,
)

# Qui peut recevoir un ordre de mission / un dispatch.
ROLES_EXECUTION_MISSION = (
    RoleUtilisateur.AGENT_TERRAIN,
    RoleUtilisateur.AGENT_QHSE,
    RoleUtilisateur.SERVICE_TECHNIQUE,
)

ROLES_MAINTENANCE = (
    RoleUtilisateur.SERVICE_TECHNIQUE,
    RoleUtilisateur.AGENT_TERRAIN,
)

# Qui valide un rapport de visite : la commission destinataire, portee par le
# pilotage. Un agent ne valide jamais son propre rapport.
ROLES_VALIDATION_RAPPORT = ROLES_PILOTAGE

# --- Perimetres metier -----------------------------------------------------

TYPES_SIGNALEMENT_PAR_ROLE = {
    RoleUtilisateur.AGENT_TERRAIN: (
        TypeSignalement.TECHNIQUE,
        TypeSignalement.ENVIRONNEMENT,
        TypeSignalement.DENONCIATION_ILLEGALE,
    ),
    RoleUtilisateur.AGENT_QHSE: (
        TypeSignalement.NON_CONFORMITE_QHSE,
        TypeSignalement.ENVIRONNEMENT,
    ),
    RoleUtilisateur.SERVICE_TECHNIQUE: (
        TypeSignalement.TECHNIQUE,
    ),
}

TYPES_CONTROLE_PAR_ROLE = {
    RoleUtilisateur.AGENT_TERRAIN: (
        TypeControleQHSE.TECHNIQUE,
        TypeControleQHSE.ELECTRIQUE,
        TypeControleQHSE.OCCUPATION,
    ),
    RoleUtilisateur.AGENT_QHSE: (
        TypeControleQHSE.SANITAIRE,
        TypeControleQHSE.OCCUPATION,
    ),
    RoleUtilisateur.SERVICE_TECHNIQUE: (
        TypeControleQHSE.TECHNIQUE,
        TypeControleQHSE.ELECTRIQUE,
    ),
}

COMMISSIONS_PAR_ROLE = {
    RoleUtilisateur.AGENT_TERRAIN: (
        CommissionDestinataire.COMMISSION_ENVIRONNEMENT,
        CommissionDestinataire.COMMISSION_TECHNIQUE,
    ),
    RoleUtilisateur.AGENT_QHSE: (
        CommissionDestinataire.COMMISSION_ENVIRONNEMENT,
    ),
    RoleUtilisateur.SERVICE_TECHNIQUE: (
        CommissionDestinataire.COMMISSION_TECHNIQUE,
    ),
}


# --- Helpers ---------------------------------------------------------------

def role(user):
    return getattr(user, "role", None)


def est_maintenance(user):
    return role(user) in ROLES_MAINTENANCE


def a_vision_globale(user):
    """Pilotage metier (ou compte de maintenance Django) : lecture globale."""
    return bool(getattr(user, "is_superuser", False)) or role(user) in ROLES_PILOTAGE


def peut_instruire_signalement(user):
    return a_vision_globale(user) or role(user) in ROLES_OPERATIONNELS


def peut_sanctionner(user):
    return bool(getattr(user, "is_superuser", False)) or role(user) in ROLES_SANCTION


def types_signalement_autorises(user):
    return TYPES_SIGNALEMENT_PAR_ROLE.get(role(user), ())


def types_controle_autorises(user):
    return TYPES_CONTROLE_PAR_ROLE.get(role(user), ())


def commissions_autorisees(user):
    return COMMISSIONS_PAR_ROLE.get(role(user), ())


# --- Scoping des querysets -------------------------------------------------

def scope_plaintes(qs, user):
    """Un acteur operationnel ne voit que les signalements de son perimetre
    (ou ceux qui lui sont personnellement affectes). Tout autre utilisateur ne
    voit que ses propres depots."""
    if a_vision_globale(user):
        return qs
    types = types_signalement_autorises(user)
    if types:
        return qs.filter(Q(type__in=types) | Q(agent_traitant=user))
    return qs.filter(plaignant=user)


def scope_inspections(qs, user):
    if a_vision_globale(user):
        return qs
    types = types_controle_autorises(user)
    if types:
        return qs.filter(Q(type_controle__in=types) | Q(inspecteur=user))
    return qs.none()


def scope_sanctions(qs, user):
    """Les sanctions sont instruites par le Bureau d'Environnement / la brigade
    et lues par l'occupant concerne. Le Service Technique n'y a pas acces."""
    if a_vision_globale(user) or peut_sanctionner(user):
        return qs
    return qs.filter(contrat__demandeur__utilisateur=user)


def scope_ordres_mission(qs, user):
    """Un ordre de mission n'est visible que par son emetteur, son agent
    assigne et le pilotage : c'est la liaison agent <-> mission."""
    if a_vision_globale(user):
        return qs
    if role(user) in ROLES_EMISSION_MISSION + ROLES_EXECUTION_MISSION:
        return qs.filter(Q(emetteur=user) | Q(agent_assigne=user))
    return qs.none()


def scope_interventions(qs, user):
    if a_vision_globale(user):
        return qs
    if est_maintenance(user):
        return qs.filter(
            Q(technicien=user)
            | Q(plainte_source__type__in=types_signalement_autorises(user))
        )
    return qs.none()


def scope_rapports_visite(qs, user):
    """Un agent voit ses propres rapports et ceux adresses a sa commission."""
    if a_vision_globale(user):
        return qs
    commissions = commissions_autorisees(user)
    if commissions:
        return qs.filter(Q(agent=user) | Q(commission_destinataire__in=commissions))
    return qs.none()


def scope_dispatch(qs, user):
    """Le dispatch fidelite est declenche par le Bureau d'Environnement ; la
    brigade terrain ne voit que les mediations qui lui sont assignees."""
    if a_vision_globale(user) or role(user) == RoleUtilisateur.AGENT_QHSE:
        return qs
    if role(user) in ROLES_EXECUTION_MISSION:
        return qs.filter(agent_assigne=user)
    return qs.none()
