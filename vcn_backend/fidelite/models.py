from django.db import models
from core.models import BaseModel
from comptes.models import Demandeur

class HistoriqueScore(BaseModel):
    demandeur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name="historique_score")
    points_modifies = models.FloatField()
    nouveau_score = models.FloatField()
    motif = models.CharField(max_length=255)

    def __str__(self):
        signe = "+" if self.points_modifies >= 0 else ""
        return f"{self.demandeur} : {signe}{self.points_modifies} -> {self.nouveau_score} ({self.motif})"
