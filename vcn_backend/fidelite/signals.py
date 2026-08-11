from django.db.models.signals import post_save
from django.dispatch import receiver
from paiements.models import Paiement
from terrain.models import Sanction, NiveauSanction, AvisCantine
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
        mettre_a_jour_score(instance.auteur, 2.0, "Dépôt d'un avis")
