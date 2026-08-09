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
