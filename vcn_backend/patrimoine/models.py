import uuid
from django.db import models

class TypeLocal(models.TextChoices):
    RESTAURATION = 'RESTAURATION', 'Restauration'
    MULTISERVICES = 'MULTISERVICES', 'Multiservices'
    PAPETERIE = 'PAPETERIE', 'Papeterie'
    ARTISANAT = 'ARTISANAT', 'Artisanat'
    AUTRE = 'AUTRE', 'Autre'

class EtatLocal(models.TextChoices):
    BON_ETAT = 'BON_ETAT', 'Bon état'
    NECESSITE_RENOVATION = 'NECESSITE_RENOVATION', 'Nécessite rénovation'
    DEGRADE = 'DEGRADE', 'Dégradé'
    EN_TRAVAUX = 'EN_TRAVAUX', 'En travaux'

class Gestionnaire(models.TextChoices):
    CROUS_T = 'CROUS_T', 'CROUS-T'
    AMICALE = 'AMICALE', 'Amicale'

class Local(models.Model):
    id_local = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    localisation = models.CharField(max_length=200)
    type_local = models.CharField(max_length=30, choices=TypeLocal.choices)
    zone_cartographie = models.CharField(max_length=50, blank=True)
    surface_m2 = models.FloatField()
    capacite_accueil = models.PositiveIntegerField(default=0)
    etat_physique = models.CharField(max_length=30, choices=EtatLocal.choices, default=EtatLocal.BON_ETAT)
    gestionnaire = models.CharField(max_length=20, choices=Gestionnaire.choices, default=Gestionnaire.CROUS_T)
    est_libre = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.reference} ({self.type_local})"
