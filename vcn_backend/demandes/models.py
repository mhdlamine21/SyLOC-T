from django.db import models
from core.models import BaseModel
from comptes.models import Demandeur, Utilisateur
from patrimoine.models import Local

class TypeDemande(models.TextChoices):
    RENOVATION = "RENOVATION", "Rénovation"
    CONSTRUCTION_CANDIDAT = "CONSTRUCTION_CANDIDAT", "Construction Candidat"
    CONSTRUCTION_CROUST = "CONSTRUCTION_CROUST", "Construction CROUS-T"
    VENTE_PRODUIT = "VENTE_PRODUIT", "Vente de produit"
    VENTE_ALIMENTAIRE = "VENTE_ALIMENTAIRE", "Vente alimentaire"
    PRESTATION_SERVICE = "PRESTATION_SERVICE", "Prestation de service"
    LOCAL_ARTISANAL = "LOCAL_ARTISANAL", "Local artisanal"

class TypeDocument(models.TextChoices):
    CARTE_ETUDIANT = "CARTE_ETUDIANT", "Carte étudiant"
    PIECE_IDENTITE = "PIECE_IDENTITE", "Pièce d'identité"
    REGISTRE_COMMERCE = "REGISTRE_COMMERCE", "Registre de commerce"
    ATTESTATION_HYGIENE = "ATTESTATION_HYGIENE", "Attestation d'hygiène"
    PLAN_AMENAGEMENT = "PLAN_AMENAGEMENT", "Plan d'aménagement"
    CV = "CV", "Curriculum Vitae"
    AUTORISATION_VENTE = "AUTORISATION_VENTE", "Autorisation de vente"
    BUSINESS_PLAN = "BUSINESS_PLAN", "Business Plan"
    MAQUETTE_3D = "MAQUETTE_3D", "Maquette 3D"
    FICHE_SANTE = "FICHE_SANTE", "Fiche Santé Alimentaire"
    AUTRE = "AUTRE", "Autre"



class StatutDemande(models.TextChoices):
    NOUVELLE = "NOUVELLE", "Nouvelle demande"
    CONTROLE_RECEVABILITE = "CONTROLE_RECEVABILITE", "Contrôle de recevabilité"
    MITIGEE_COMPLEMENT = "MITIGEE_COMPLEMENT", "En attente de compléments"
    EN_EXPERTISE_TECHNIQUE = "EN_EXPERTISE_TECHNIQUE", "Expertise technique"
    CONTROLE_HYGIENE = "CONTROLE_HYGIENE", "Contrôle sanitaire et hygiène"
    EN_ATTENTE_DECISION = "EN_ATTENTE_DECISION", "En attente de décision finale"
    FAVORABLE = "FAVORABLE", "Favorable"
    DEFAVORABLE = "DEFAVORABLE", "Défavorable"
    MITIGEE_ARCHIVEE = "MITIGEE_ARCHIVEE", "Mitigée (Archivée)"
    EN_ATTENTE_SIGNATURE = "EN_ATTENTE_SIGNATURE", "En attente de signature"
    CONTRAT_ACCEPTE_RDV_FIXE = "CONTRAT_ACCEPTE_RDV_FIXE", "Contrat accepté (RDV fixé)"
    CONTRAT_REFUSE = "CONTRAT_REFUSE", "Contrat refusé"

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
    statut = models.CharField(max_length=32, choices=StatutDemande.choices, default=StatutDemande.NOUVELLE)
    date_depot = models.DateTimeField(auto_now_add=True)
    description_projet = models.TextField(blank=True)
    notes_admin = models.TextField(blank=True)
    reference_anonyme = models.CharField(max_length=50, unique=True, blank=True)
    avis_sanitaire_externe = models.CharField(max_length=50, blank=True)
    reference_avis_sanitaire = models.CharField(max_length=255, blank=True)
    avis_technique_interne = models.TextField(blank=True)
    rdv_signature_date = models.CharField(max_length=100, blank=True)
    
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
    pieces_receptionnees = models.BooleanField(default=False)
    est_complet = models.BooleanField(default=False)

    def enregistrer_dossier_physique(self):
        self.pieces_receptionnees = True
        self.save()

    def verifier_completude_globale(self):
        complet = self.documents.filter(est_valide=True).exists()
        self.est_complet = complet
        self.save()
        return complet

class Document(BaseModel):
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name="documents")
    type_document = models.CharField(max_length=30, choices=TypeDocument.choices)
    nom_fichier = models.CharField(max_length=255)
    fichier = models.FileField(upload_to="documents_demandes/")
    est_valide = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type_document} - {self.nom_fichier}"

    def valider_piece(self):
        self.est_valide = True
        self.save()

    def rejeter_piece(self):
        self.est_valide = False
        self.save()

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
    note_formelle = models.FloatField(null=True, blank=True)
    note_technique = models.FloatField(null=True, blank=True)
    commentaire = models.TextField(blank=True)

    @property
    def note_moyenne(self):
        notes = [n for n in (self.note_formelle, self.note_technique) if n is not None]
        return round(sum(notes) / len(notes), 2) if notes else None
