from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Demande, Dossier

@receiver(post_save, sender=Demande)
def generer_dossier_pour_demande(sender, instance, created, **kwargs):
    if created:
        Dossier.objects.create(demande=instance)
