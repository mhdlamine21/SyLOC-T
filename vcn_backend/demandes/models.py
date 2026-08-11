from django.db import models
from core.models import BaseModel
from comptes.models import Demandeur, Utilisateur
from patrimoine.models import Local

class TypeDemande(models.TextChoices):
    RENOVATION = "RENOVATION", "Rénovation"
    CONSTRUCTION_CANDIDAT = "CONSTRUCTION_CANDIDAT", "Construction Candidat"
    CONSTRUCTION_CROUST = "CONSTRUCTION_CROUST", "Construction CROUS-T"
    VENTE_PRODUIT = "VENTE_PRODUIT", "Vente de produit"
    PRESTATION_SERVICE = "PRESTATION_SERVICE", "Prestation de service"
    LOCAL_ARTISANAL = "LOCAL_ARTISANAL", "Local artisanal"

class StatutDemande(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    MITIGEE_COMPLEMENT = "MITIGEE_COMPLEMENT", "Mitigée / Complément"
    FAVORABLE = "FAVORABLE", "Favorable"
    DEFAVORABLE = "DEFAVORABLE", "Défavorable"

class TypeCritere(models.TextChoices):
    GENRE = "GENRE", "Genre"
    TRANCHE_AGE = "TRANCHE_AGE", "Tranche d'âge"
    EXPERIENCE_PREALABLE = "EXPERIENCE_PREALABLE", "Expérience préalable"
    AUTRE = "AUTRE", "Autre"

class AvisCommission(models.TextChoices):
    FAVORABLE = "FAVORABLE", "Favorable"
    DEFAVORABLE = "DEFAVORABLE", "Défavorable"
    ABSTENTION = "ABSTENTION", "Abstention"

class AppelCandidature(BaseModel):
    titre = models.CharField(max_length=255)
    description = models.TextField()
    date_lancement = models.DateTimeField()
    date_cloture = models.DateTimeField()
    est_actif = models.BooleanField(default=True)
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="appels_candidature")
    publie_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name="appels_publies")

    def __str__(self):
        return self.titre

class CritereAppel(BaseModel):
    appel = models.ForeignKey(AppelCandidature, on_delete=models.CASCADE, related_name="criteres")
    type_critere = models.CharField(max_length=32, choices=TypeCritere.choices)
    valeur_cible = models.CharField(max_length=255)
    poids = models.IntegerField(default=1)
    actif = models.BooleanField(default=True)

class Demande(BaseModel):
    type_demande = models.CharField(max_length=32, choices=TypeDemande.choices)
    statut = models.CharField(max_length=32, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE)
    date_depot = models.DateTimeField(auto_now_add=True)
    notes_admin = models.TextField(blank=True)
    reference_anonyme = models.CharField(max_length=50, unique=True, blank=True)
    
    demandeur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name="demandes")
    appel_candidature = models.ForeignKey(AppelCandidature, on_delete=models.SET_NULL, null=True, blank=True, related_name="candidatures")
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True, related_name="demandes_directes")

    def save(self, *args, **kwargs):
        if not self.reference_anonyme:
            import uuid
            self.reference_anonyme = f"DOSSIER-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Demande {self.id} - {self.reference_anonyme} ({self.statut})"

class Dossier(BaseModel):
    demande = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name="dossier")
    pieces_recepissees = models.BooleanField(default=False)
    est_complet = models.BooleanField(default=False)

class HistoriqueStatutDemande(BaseModel):
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name="historique")
    ancien_statut = models.CharField(max_length=32, choices=StatutDemande.choices)
    nouveau_statut = models.CharField(max_length=32, choices=StatutDemande.choices)
    commentaire_acteur = models.TextField(blank=True)
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)

class MembreCommission(BaseModel):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="profil_commission")
    date_designation = models.DateTimeField(auto_now_add=True)
    actif = models.BooleanField(default=True)

class VoteCommission(BaseModel):
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name="votes")
    membre = models.ForeignKey(MembreCommission, on_delete=models.CASCADE, related_name="votes_emis")
    avis = models.CharField(max_length=32, choices=AvisCommission.choices)
    commentaire = models.TextField(blank=True)
