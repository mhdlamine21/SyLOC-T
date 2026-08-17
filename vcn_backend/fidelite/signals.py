from django.db.models.signals import post_save
from django.dispatch import receiver
from paiements.models import Paiement, Echeance, StatutEcheance
from terrain.models import Sanction, NiveauSanction, AvisCantine, Plainte
from demandes.models import Demande, StatutDemande
from .models import HistoriqueScore

def mettre_a_jour_score(demandeur, points, motif):
    if not demandeur:
        return
    demandeur.score_fidelite += points
    demandeur.save()
    HistoriqueScore.objects.create(
        demandeur=demandeur,
        points_modifies=points,
        nouveau_score=demandeur.score_fidelite,
        motif=motif
    )

@receiver(post_save, sender=Paiement)
def maj_score_sur_paiement(sender, instance, created, **kwargs):
    if created and instance.echeance and instance.echeance.contrat:
        demandeur = instance.echeance.contrat.demandeur
        date_paiement = instance.date_paiement.date() if hasattr(instance.date_paiement, 'date') else instance.date_paiement
        date_exigibilite = instance.echeance.date_exigibilite
        
        # Date limite normale : exigibilité (ex: le 10 du mois)
        diff_jours = (date_paiement - date_exigibilite).days if (date_paiement and date_exigibilite) else 0
        
        if diff_jours <= 0:
            # Payé à temps (avant ou le 10)
            mettre_a_jour_score(demandeur, 5.0, "Paiement ponctuel de redevance (avant le 10)")
        elif diff_jours <= 5:
            # Payé entre le 11 et le 15 (retard léger)
            mettre_a_jour_score(demandeur, -3.0, "Retard léger de paiement (réglé entre le 11 et le 15)")
        else:
            # Payé après le 15 (retard conséquent)
            mettre_a_jour_score(demandeur, -7.0, f"Retard significatif de paiement ({diff_jours}j de retard, réglé après le 15)")

@receiver(post_save, sender=Echeance)
def maj_score_sur_retard_echeance(sender, instance, **kwargs):
    """Malus de fidélité progressif lorsqu'une échéance bascule en impayé de plus de 30 jours (1 mois de retard)."""
    if instance.statut == StatutEcheance.EN_RETARD and instance.contrat:
        demandeur = instance.contrat.demandeur
        nb_retards = Echeance.objects.filter(contrat__demandeur=demandeur, statut=StatutEcheance.EN_RETARD).count()
        
        # Pour 1 mois d'arriéré impayé (> 30 jours) : malus de -12 points
        # À 2 mois : procédure d'expulsion (pas de cumul infini de points)
        if nb_retards == 1:
            points = -12.0
            motif = f"Impayé de 1 mois (> 30 jours) - bail {instance.contrat.reference or instance.id}"
            if not HistoriqueScore.objects.filter(demandeur=demandeur, motif=motif).exists():
                mettre_a_jour_score(demandeur, points, motif)

@receiver(post_save, sender=Sanction)
def maj_score_sur_sanction(sender, instance, created, **kwargs):
    if created and instance.contrat:
        demandeur = instance.contrat.demandeur
        points = 0
        if instance.niveau == NiveauSanction.AVERTISSEMENT:
            points = -3.0
        elif instance.niveau == NiveauSanction.CONVOCATION:
            points = -5.0
        
        if points < 0:
            mettre_a_jour_score(demandeur, points, f"Sanction: {instance.niveau}")

@receiver(post_save, sender=AvisCantine)
def maj_score_sur_avis(sender, instance, created, **kwargs):
    if created:
        if instance.note_etoiles and instance.note_etoiles >= 4:
            mettre_a_jour_score(instance.auteur, 2.0, "Dépôt d'un avis cantine positif")
        elif instance.note_etoiles and instance.note_etoiles <= 2:
            mettre_a_jour_score(instance.auteur, -2.0, "Dépôt d'un avis cantine négatif")
        else:
            mettre_a_jour_score(instance.auteur, 1.0, "Dépôt d'un avis cantine neutre")


# ---------------------------------------------------------------------------
# Phase 3 - le parcours de candidature alimente aussi le score de fidelite.
# ---------------------------------------------------------------------------

@receiver(post_save, sender=Demande)
def maj_score_sur_decision_demande(sender, instance, created, **kwargs):
    """Bonus/malus a la cloture d'un dossier de candidature."""
    if created:
        return
    bareme = {
        StatutDemande.FAVORABLE: (15.0, "Candidature acceptee par la commission"),
        StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE: (10.0, "Contrat accepte (RDV de signature fixe)"),
        StatutDemande.CONTRAT_REFUSE: (-10.0, "Contrat propose puis refuse"),
    }
    if instance.statut not in bareme:
        return
    points, motif = bareme[instance.statut]
    motif_complet = f"{motif} - dossier {instance.reference_anonyme}"
    # Idempotence : un meme dossier ne cree qu'une seule ligne par motif.
    if HistoriqueScore.objects.filter(demandeur=instance.demandeur, motif=motif_complet).exists():
        return
    mettre_a_jour_score(instance.demandeur, points, motif_complet)

