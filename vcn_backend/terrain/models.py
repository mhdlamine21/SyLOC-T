# pyrefly: ignore [missing-import]
from django.db import models
from core.models import BaseModel
from comptes.models import Utilisateur, Demandeur
from patrimoine.models import Local
from contrats.models import Contrat
# pyrefly: ignore [missing-import]
from django.core.validators import MinValueValidator, MaxValueValidator

class TypeSignalement(models.TextChoices):
    TECHNIQUE = 'TECHNIQUE', 'Technique'
    NON_CONFORMITE_QHSE = 'NON_CONFORMITE_QHSE', 'Non Conformité QHSE'
    ENVIRONNEMENT = 'ENVIRONNEMENT', 'Environnement'
    DENONCIATION_ILLEGALE = 'DENONCIATION_ILLEGALE', 'Dénonciation Illégale'

class StatutPlainte(models.TextChoices):
    OUVERTE = 'OUVERTE', 'Ouverte'
    EN_COURS_TRAITEMENT = 'EN_COURS_TRAITEMENT', 'En cours de traitement'
    RESOLUE = 'RESOLUE', 'Résolue'
    REJETEE = 'REJETEE', 'Rejetée'

class NiveauUrgence(models.TextChoices):
    FAIBLE = 'FAIBLE', 'Faible'
    MOYENNE = 'MOYENNE', 'Moyenne'
    ELEVEE = 'ELEVEE', 'Elevée'

class TypeControleQHSE(models.TextChoices):
    SANITAIRE = 'SANITAIRE', 'Sanitaire'
    TECHNIQUE = 'TECHNIQUE', 'Technique'
    ELECTRIQUE = 'ELECTRIQUE', 'Electrique'
    OCCUPATION = 'OCCUPATION', 'Occupation'

class NiveauSanction(models.TextChoices):
    AVERTISSEMENT = 'AVERTISSEMENT', 'Avertissement'
    RAPPEL_A_L_ORDRE = 'RAPPEL_A_L_ORDRE', "Rappel à l'ordre"
    CONVOCATION = 'CONVOCATION', 'Convocation'
    EXPULSION = 'EXPULSION', 'Expulsion'

class StatutSanction(models.TextChoices):
    NOTIFIEE = 'NOTIFIEE', 'Notifiée'
    LEVEE = 'LEVEE', 'Levée'

class StatutAvis(models.TextChoices):
    PUBLIE = 'PUBLIE', 'Publié'
    SIGNALE = 'SIGNALE', 'Signalé'
    MASQUE = 'MASQUE', 'Masqué'


class Plainte(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True, related_name="plaintes")
    plaignant = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="plaintes_deposees")
    agent_traitant = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="plaintes_traitees")
    
    type = models.CharField(max_length=50, choices=TypeSignalement.choices)
    statut = models.CharField(max_length=50, choices=StatutPlainte.choices, default=StatutPlainte.OUVERTE)
    urgence = models.CharField(max_length=50, choices=NiveauUrgence.choices, default=NiveauUrgence.FAIBLE)
    
    date_resolution = models.DateTimeField(null=True, blank=True)
    date_limite_sla = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    localisation_libre = models.CharField(max_length=255, blank=True)
    photo_preuve = models.URLField(blank=True) # URLField pour simuler un stockage cloud
    
    def escalader_si_besoin(self):
        from django.utils import timezone
        if self.statut != StatutPlainte.RESOLUE and self.date_limite_sla and timezone.now() > self.date_limite_sla:
            if self.urgence != NiveauUrgence.ELEVEE:
                self.urgence = NiveauUrgence.ELEVEE
                self.save(update_fields=['urgence'])
                return True
        return False
    est_anonyme = models.BooleanField(default=False)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

class InspectionQHse(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="inspections")
    inspecteur = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="inspections_realisees")
    
    type_controle = models.CharField(max_length=50, choices=TypeControleQHSE.choices)
    date_visite = models.DateTimeField()
    est_conforme = models.BooleanField()
    observations = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

class Sanction(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="sanctions")
    contrat = models.ForeignKey(Contrat, on_delete=models.SET_NULL, null=True, blank=True, related_name="sanctions")
    inspection_source = models.ForeignKey(InspectionQHse, on_delete=models.SET_NULL, null=True, blank=True, related_name="sanction_generee")
    plainte_source = models.ForeignKey(Plainte, on_delete=models.SET_NULL, null=True, blank=True, related_name="sanction_generee")
    agent_prononcant = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, null=True, blank=True, related_name="sanctions_prononcees") # Peut être null si automatique
    
    niveau = models.CharField(max_length=50, choices=NiveauSanction.choices, default=NiveauSanction.AVERTISSEMENT)
    statut_sanction = models.CharField(max_length=50, choices=StatutSanction.choices, default=StatutSanction.NOTIFIEE)
    date_application = models.DateTimeField(auto_now_add=True)
    date_levee = models.DateTimeField(null=True, blank=True)
    motif = models.TextField()

class AvisCantine(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="avis")
    auteur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name="avis_rediges")
    
    note_etoiles = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField(blank=True)
    statut = models.CharField(max_length=50, choices=StatutAvis.choices, default=StatutAvis.PUBLIE)
