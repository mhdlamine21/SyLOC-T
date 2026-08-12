# pyrefly: ignore [missing-import]
from django.db import models
from core.models import BaseModel

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

class Local(BaseModel):
    reference = models.CharField(max_length=50, unique=True)
    localisation = models.CharField(max_length=200)
    type_local = models.CharField(max_length=30, choices=TypeLocal.choices)
    zone_cartographie = models.CharField(max_length=50, blank=True)
    surface_m2 = models.FloatField()
    capacite_accueil = models.PositiveIntegerField(default=0)
    etat_physique = models.CharField(max_length=30, choices=EtatLocal.choices, default=EtatLocal.BON_ETAT)
    gestionnaire = models.CharField(max_length=20, choices=Gestionnaire.choices, default=Gestionnaire.CROUS_T)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    photo_url = models.URLField(max_length=500, blank=True)
    est_libre = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.reference} ({self.type_local})"
