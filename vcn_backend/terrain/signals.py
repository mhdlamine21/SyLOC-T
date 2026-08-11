from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import InspectionQHse, Sanction, NiveauSanction

@receiver(post_save, sender=InspectionQHse)
def generer_sanction_si_non_conforme(sender, instance, created, **kwargs):
    if created and not instance.est_conforme:
        # Essayer de trouver le contrat actif pour ce local
        contrat_actif = instance.local.contrats.filter(est_actif=True).first()
        
        Sanction.objects.create(
            local=instance.local,
            contrat=contrat_actif,
            inspection_source=instance,
            niveau=NiveauSanction.AVERTISSEMENT,
            motif=f"Génération automatique suite à inspection non conforme: {instance.observations}"
        )

from .models import Plainte, StatutPlainte

@receiver(post_save, sender=Plainte)
def generer_sanction_si_trop_de_plaintes(sender, instance, created, **kwargs):
    if created and instance.local:
        # Compter le nombre de plaintes ouvertes pour ce local
        nb_plaintes = Plainte.objects.filter(local=instance.local, statut=StatutPlainte.OUVERTE).count()
        
        niveau = None
        motif = ""
        
        if nb_plaintes == 3:
            niveau = NiveauSanction.AVERTISSEMENT
            motif = f"Avertissement : le local a accumulé {nb_plaintes} plaintes ouvertes. Un agent de terrain doit vérifier les lieux."
        elif nb_plaintes == 5:
            niveau = NiveauSanction.CONVOCATION
            motif = f"Convocation : le local a accumulé {nb_plaintes} plaintes ouvertes malgré les avertissements."
            
        if niveau:
            contrat_actif = instance.local.contrats.filter(est_actif=True).first()
            Sanction.objects.create(
                local=instance.local,
                contrat=contrat_actif,
                plainte_source=instance,
                niveau=niveau,
                motif=motif
            )

