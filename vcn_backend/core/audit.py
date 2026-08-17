"""Journalisation d'audit centralisee (UC80-84).

Toutes les actions sensibles (changement de statut d'une demande, decision,
creation de contrat, reglement de paiement, gestion des comptes...) passent
par `journaliser()` pour alimenter `comptes.JournalAudit`.
"""


def journaliser(utilisateur, action: str, cible: str = "", details: str = ""):
    """Cree une entree de journal d'audit. Ne leve jamais d'exception."""
    try:
        from comptes.models import JournalAudit

        user = utilisateur if getattr(utilisateur, "is_authenticated", False) else None
        return JournalAudit.objects.create(
            utilisateur=user,
            action=action[:255],
            cible=str(cible)[:255],
            details=details or "",
        )
    except Exception:  # pragma: no cover - l'audit ne doit jamais casser l'API
        return None
