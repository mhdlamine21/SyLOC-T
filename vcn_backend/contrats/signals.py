from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contrat
from paiements.models import Echeance, StatutEcheance
from dateutil.relativedelta import relativedelta

@receiver(post_save, sender=Contrat)
def generer_echeancier(sender, instance, created, **kwargs):
    if created and not instance.est_gratuit:
        date_courante = instance.date_debut
        echeances = []
        for _ in range(instance.duree_mois):
            echeances.append(
                Echeance(
                    contrat=instance,
                    date_exigibilite=date_courante,
                    montant_du=45000.0,
                    statut=StatutEcheance.NON_ECHUE
                )
            )
            date_courante += relativedelta(months=1)
        
        # Bulk create for performance
        Echeance.objects.bulk_create(echeances)
