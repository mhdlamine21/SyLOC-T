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
    if created:
        demandeur = instance.echeance.contrat.demandeur
        mettre_a_jour_score(demandeur, 5.0, "Paiement d'une échéance")

@receiver(post_save, sender=Echeance)
def maj_score_sur_retard_echeance(sender, instance, **kwargs):
    """Malus de fidelite progressif lorsqu'une echeance bascule en retard de paiement."""
    if instance.statut == StatutEcheance.EN_RETARD and instance.contrat:
        demandeur = instance.contrat.demandeur
        nb_retards = Echeance.objects.filter(contrat__demandeur=demandeur, statut=StatutEcheance.EN_RETARD).count()
        if nb_retards >= 5:
            points = -15.0
        elif nb_retards >= 3:
            points = -10.0
        elif nb_retards >= 2:
            points = -7.0
        else:
            points = -5.0
        motif = f"Impayé critique (#{nb_retards} retard(s)) — bail {instance.contrat.reference or instance.id}"
        if not HistoriqueScore.objects.filter(demandeur=demandeur, motif=motif).exists():
            mettre_a_jour_score(demandeur, points, motif)

@receiver(post_save, sender=Sanction)
def maj_score_sur_sanction(sender, instance, created, **kwargs):
    if created and instance.contrat:
        demandeur = instance.contrat.demandeur
        points = 0
        if instance.niveau == NiveauSanction.AVERTISSEMENT:
            points = -10.0
        elif instance.niveau == NiveauSanction.RAPPEL_A_L_ORDRE:
            points = -15.0
        elif instance.niveau == NiveauSanction.CONVOCATION:
            points = -20.0
        elif instance.niveau == NiveauSanction.EXPULSION:
            points = -50.0
        
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
# Phase 3 — le parcours de candidature alimente aussi le score de fidelite.
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
    motif_complet = f"{motif} — dossier {instance.reference_anonyme}"
    # Idempotence : un meme dossier ne cree qu'une seule ligne par motif.
    if HistoriqueScore.objects.filter(demandeur=instance.demandeur, motif=motif_complet).exists():
        return
    mettre_a_jour_score(instance.demandeur, points, motif_complet)

@receiver(post_save, sender=Plainte)
def maj_score_sur_plainte(sender, instance, created, **kwargs):
    """Pénalité lorsqu'un occupant signale un problème (dégradation)."""
    if created and instance.plaignant:
        try:
            demandeur = instance.plaignant.profil_demandeur
            mettre_a_jour_score(demandeur, -5.0, "Signalement de problème technique")
        except AttributeError:
            pass
