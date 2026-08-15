import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Modele abstrait de base : tous les modeles metier (Demande, Local,
    Contrat, Plainte, etc.) doivent en heriter pour avoir un id UUID
    et un suivi automatique de creation/modification.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-date_creation"]


class Annonce(BaseModel):
    """
    Modèle pour les annonces de la Cellule Communication affichées sur la vitrine.
    """
    TYPE_PIN = [
        ('pin-navy', 'Bleu Marine (Navy)'),
        ('pin-slate', 'Gris (Slate)'),
        ('pin-gold', 'Or (Gold)'),
    ]

    titre = models.CharField(max_length=200)
    contenu = models.TextField()
    date_publication = models.DateField(auto_now_add=True)
    pin = models.CharField(max_length=20, choices=TYPE_PIN, default='pin-navy')
    bg = models.CharField(max_length=20, default='#fffde7', help_text="Couleur de fond hexadécimale")
    est_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-date_publication", "-date_creation"]

    def __str__(self):
        return self.titre


class ParametreSysteme(BaseModel):
    """Parametres systeme editables par l'Administrateur SI (Phase 2).

    Sert aussi de source de verite pour les contenus editoriaux de la
    vitrine publique (etapes du parcours, FAQ, contacts) : le front ne
    contient plus de texte en dur, il lit `/api/public/vitrine/`.
    """

    CATEGORIES = [
        ('GENERAL', 'General'),
        ('VITRINE', 'Vitrine publique'),
        ('WORKFLOW', 'Workflow & delais'),
        ('NOTIFICATION', 'Notifications'),
    ]

    cle = models.CharField(max_length=100, unique=True)
    libelle = models.CharField(max_length=200)
    valeur = models.JSONField(default=dict, blank=True)
    categorie = models.CharField(max_length=30, choices=CATEGORIES, default='GENERAL')
    description = models.TextField(blank=True)
    est_public = models.BooleanField(default=False)

    class Meta:
        ordering = ['categorie', 'cle']

    def __str__(self):
        return f"{self.categorie}:{self.cle}"
