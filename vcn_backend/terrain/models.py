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
    photo_preuve = models.ImageField(upload_to='plaintes_photos/', null=True, blank=True)
    
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
    note_sanitaire = models.IntegerField(null=True, blank=True)
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


# ---------------------------------------------------------------------------
# Phase 5 — Ordres de mission (Terrain/QHSE) & Maintenance (Service Technique)
# ---------------------------------------------------------------------------

class StatutOrdreMission(models.TextChoices):
    EMIS = 'EMIS', 'Emis'
    EN_COURS = 'EN_COURS', 'En cours'
    EXECUTE = 'EXECUTE', 'Exécuté'
    ANNULE = 'ANNULE', 'Annulé'


class OrdreMission(BaseModel):
    """Ordre de mission confie a un agent de terrain / QHSE (Phase 5)."""
    reference = models.CharField(max_length=40, unique=True, blank=True)
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="ordres_mission")
    agent_assigne = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="ordres_mission_recus")
    emetteur = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="ordres_mission_emis")

    objet = models.CharField(max_length=255)
    directives = models.TextField(blank=True)
    type_controle = models.CharField(max_length=50, choices=TypeControleQHSE.choices)
    priorite = models.CharField(max_length=50, choices=NiveauUrgence.choices, default=NiveauUrgence.FAIBLE)
    date_mission = models.DateTimeField()
    statut = models.CharField(max_length=30, choices=StatutOrdreMission.choices, default=StatutOrdreMission.EMIS)

    plainte_source = models.ForeignKey(
        Plainte, on_delete=models.SET_NULL, null=True, blank=True, related_name="ordres_mission"
    )
    inspection_resultat = models.ForeignKey(
        InspectionQHse, on_delete=models.SET_NULL, null=True, blank=True, related_name="ordre_mission_origine"
    )
    compte_rendu = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            from django.utils import timezone as _tz
            annee = _tz.now().year
            rang = OrdreMission.objects.filter(date_creation__year=annee).count() + 1
            self.reference = f"OM-{annee}-{rang:04d}"
        super().save(*args, **kwargs)


class TypeIntervention(models.TextChoices):
    PREVENTIVE = 'PREVENTIVE', 'Préventive'
    CURATIVE = 'CURATIVE', 'Curative'
    URGENCE = 'URGENCE', 'Urgence'


class StatutIntervention(models.TextChoices):
    PLANIFIEE = 'PLANIFIEE', 'Planifiée'
    EN_COURS = 'EN_COURS', 'En cours'
    TERMINEE = 'TERMINEE', 'Terminée'
    ANNULEE = 'ANNULEE', 'Annulée'


class InterventionMaintenance(BaseModel):
    """Intervention du Service Technique (Phase 5)."""
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="interventions_maintenance")
    plainte_source = models.ForeignKey(
        Plainte, on_delete=models.SET_NULL, null=True, blank=True, related_name="interventions_maintenance"
    )
    technicien = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="interventions_maintenance")

    type_intervention = models.CharField(max_length=30, choices=TypeIntervention.choices, default=TypeIntervention.CURATIVE)
    description = models.TextField()
    statut = models.CharField(max_length=30, choices=StatutIntervention.choices, default=StatutIntervention.PLANIFIEE)

    date_planifiee = models.DateTimeField()
    date_realisation = models.DateTimeField(null=True, blank=True)
    cout_estime = models.FloatField(null=True, blank=True)
    cout_reel = models.FloatField(null=True, blank=True)
    rapport = models.TextField(blank=True)


# ---------------------------------------------------------------------------
# Phase 6 — Rapports de visite terrain (cadence 10 jours) & dispatch fidelite
# ---------------------------------------------------------------------------

CADENCE_VISITE_JOURS = 10


class StatutRapportVisite(models.TextChoices):
    BROUILLON = 'BROUILLON', 'Brouillon'
    TRANSMIS = 'TRANSMIS', 'Transmis à la commission'
    VALIDE = 'VALIDE', 'Validé par la commission'


class CommissionDestinataire(models.TextChoices):
    COMMISSION_EVALUATION = 'COMMISSION_EVALUATION', "Commission d'évaluation"
    COMMISSION_ENVIRONNEMENT = 'COMMISSION_ENVIRONNEMENT', 'Commission environnement (QHSE)'
    COMMISSION_TECHNIQUE = 'COMMISSION_TECHNIQUE', 'Commission technique'


class RapportVisiteTerrain(BaseModel):
    """Rapport de visite periodique d'un local par un agent terrain / QHSE.

    La cadence reglementaire est de 10 jours : `date_prochaine_visite` est
    calculee automatiquement a la creation, et `est_en_retard` permet aux
    ecrans de pilotage de signaler les locaux non visites dans les delais.
    """
    reference = models.CharField(max_length=40, unique=True, blank=True)
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="rapports_visite")
    agent = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="rapports_visite")
    inspection = models.ForeignKey(
        InspectionQHse, on_delete=models.SET_NULL, null=True, blank=True, related_name="rapports_visite"
    )
    ordre_mission = models.ForeignKey(
        OrdreMission, on_delete=models.SET_NULL, null=True, blank=True, related_name="rapports_visite"
    )

    date_visite = models.DateTimeField()
    date_prochaine_visite = models.DateTimeField(null=True, blank=True)
    type_controle = models.CharField(max_length=50, choices=TypeControleQHSE.choices,
                                     default=TypeControleQHSE.OCCUPATION)
    commission_destinataire = models.CharField(
        max_length=40, choices=CommissionDestinataire.choices,
        default=CommissionDestinataire.COMMISSION_ENVIRONNEMENT,
    )
    statut = models.CharField(max_length=20, choices=StatutRapportVisite.choices,
                              default=StatutRapportVisite.BROUILLON)

    conforme = models.BooleanField(default=True)
    note_globale = models.IntegerField(null=True, blank=True,
                                       validators=[MinValueValidator(0), MaxValueValidator(20)])
    constats = models.TextField()
    recommandations = models.TextField(blank=True)
    photo = models.ImageField(upload_to='rapports_visite/', null=True, blank=True)

    date_transmission = models.DateTimeField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-date_visite']
        verbose_name = 'Rapport de visite terrain'
        verbose_name_plural = 'Rapports de visite terrain'

    def save(self, *args, **kwargs):
        from datetime import timedelta
        from django.utils import timezone
        if not self.reference:
            annee = timezone.now().year
            rang = RapportVisiteTerrain.objects.filter(date_creation__year=annee).count() + 1
            self.reference = f"RV-{annee}-{rang:04d}"
        if self.date_visite and not self.date_prochaine_visite:
            self.date_prochaine_visite = self.date_visite + timedelta(days=CADENCE_VISITE_JOURS)
        super().save(*args, **kwargs)

    @property
    def est_en_retard(self):
        from django.utils import timezone
        return bool(self.date_prochaine_visite and timezone.now() > self.date_prochaine_visite)

    def transmettre(self):
        from django.utils import timezone
        self.statut = StatutRapportVisite.TRANSMIS
        self.date_transmission = timezone.now()
        self.save(update_fields=['statut', 'date_transmission', 'date_modification'])
        return self


class StatutDispatch(models.TextChoices):
    DEMANDE = 'DEMANDE', 'Demandé'
    ASSIGNE = 'ASSIGNE', 'Agent assigné'
    EN_COURS = 'EN_COURS', 'En cours'
    CLOTURE = 'CLOTURE', 'Clôturé'
    ANNULE = 'ANNULE', 'Annulé'


class DispatchFidelite(BaseModel):
    """Envoi d'un agent de terrain aupres d'un occupant au score tres negatif."""
    reference = models.CharField(max_length=40, unique=True, blank=True)
    demandeur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name="dispatchs_fidelite")
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name="dispatchs_fidelite")
    demandeur_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="dispatchs_declenches")
    agent_assigne = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="dispatchs_recus")

    score_constate = models.FloatField(null=True, blank=True)
    motif = models.TextField()
    urgence = models.CharField(max_length=20, choices=NiveauUrgence.choices, default=NiveauUrgence.ELEVEE)
    statut = models.CharField(max_length=20, choices=StatutDispatch.choices, default=StatutDispatch.DEMANDE)

    date_intervention = models.DateTimeField(null=True, blank=True)
    compte_rendu = models.TextField(blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Dispatch agent (fidélité)'
        verbose_name_plural = 'Dispatchs agent (fidélité)'

    def save(self, *args, **kwargs):
        from django.utils import timezone
        if not self.reference:
            annee = timezone.now().year
            rang = DispatchFidelite.objects.filter(date_creation__year=annee).count() + 1
            self.reference = f"DF-{annee}-{rang:04d}"
        super().save(*args, **kwargs)
