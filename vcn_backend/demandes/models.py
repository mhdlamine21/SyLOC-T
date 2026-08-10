import uuid
from django.db import models
from core.models import BaseModel
from comptes.models import Utilisateur, Demandeur


# --- Enumerations ---

class TypeDemande(models.TextChoices):
    RENOVATION = "RENOVATION", "Rénovation"
    CONSTRUCTION_CANDIDAT = "CONSTRUCTION_CANDIDAT", "Construction candidat"
    CONSTRUCTION_CROUST = "CONSTRUCTION_CROUST", "Construction CROUS-T"
    VENTE_ALIMENTAIRE = "VENTE_ALIMENTAIRE", "Vente alimentaire"
    PRESTATION_SERVICE = "PRESTATION_SERVICE", "Prestation de service"
    LOCAL_ARTISANAL = "LOCAL_ARTISANAL", "Local artisanal"


class StatutDemande(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    MITIGEE_COMPLEMENT = "MITIGEE_COMPLEMENT", "Mitigée - complément requis"
    FAVORABLE = "FAVORABLE", "Favorable"
    DEFAVORABLE = "DEFAVORABLE", "Défavorable"


class TypeDocument(models.TextChoices):
    CARTE_ETUDIANT = "CARTE_ETUDIANT", "Carte étudiant"
    PIECE_IDENTITE = "PIECE_IDENTITE", "Pièce d'identité"
    REGISTRE_COMMERCE = "REGISTRE_COMMERCE", "Registre de commerce"
    ATTESTATION_HYGIENE = "ATTESTATION_HYGIENE", "Attestation d'hygiène"
    PLAN_AMENAGEMENT = "PLAN_AMENAGEMENT", "Plan d'aménagement"
    AUTRE = "AUTRE", "Autre"


# --- Modeles ---

class Demande(BaseModel):
    demandeur = models.ForeignKey(
        Demandeur, on_delete=models.CASCADE, related_name="demandes"
    )
    date_depot = models.DateTimeField(auto_now_add=True)
    type_demande = models.CharField(max_length=30, choices=TypeDemande.choices)
    statut = models.CharField(
        max_length=30,
        choices=StatutDemande.choices,
        default=StatutDemande.EN_ATTENTE,
    )

    def __str__(self):
        return f"Demande {self.id} - {self.demandeur} ({self.statut})"

    def verifier_recevabilite(self):
        return hasattr(self, "dossier") and self.dossier.est_complet

    def accepter(self):
        self.statut = StatutDemande.FAVORABLE
        self.save()

    def refuser(self):
        self.statut = StatutDemande.DEFAVORABLE
        self.save()

    def demander_complement(self):
        self.statut = StatutDemande.MITIGEE_COMPLEMENT
        self.save()

    def valider(self):
        # TODO: logique finale de validation (declenche creation de Contrat ?)
        pass


class Dossier(BaseModel):
    demande = models.OneToOneField(
        Demande, on_delete=models.CASCADE, related_name="dossier"
    )
    pieces_receptionnees = models.BooleanField(default=False)
    est_complet = models.BooleanField(default=False)

    def __str__(self):
        return f"Dossier de {self.demande}"

    def enregistrer_dossier_physique(self):
        self.pieces_receptionnees = True
        self.save()

    def verifier_completude_globale(self):
        complet = self.documents.filter(est_valide=True).exists()
        self.est_complet = complet
        self.save()
        return complet


class Document(BaseModel):
    dossier = models.ForeignKey(
        Dossier, on_delete=models.CASCADE, related_name="documents"
    )
    type_document = models.CharField(max_length=30, choices=TypeDocument.choices)
    nom_fichier = models.CharField(max_length=255)
    fichier = models.FileField(upload_to="documents_demandes/")
    date_upload = models.DateTimeField(auto_now_add=True)
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
    demande = models.ForeignKey(
        Demande, on_delete=models.CASCADE, related_name="historique"
    )
    auteur = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, related_name="historiques_demande"
    )
    horodatage = models.DateTimeField(auto_now_add=True)
    ancien_statut = models.CharField(max_length=30, blank=True, null=True)
    nouveau_statut = models.CharField(max_length=30)
    commentaire_acteur = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.demande} : {self.ancien_statut} -> {self.nouveau_statut}"


class AppelCandidat(BaseModel):
    date_lancement = models.DateTimeField()
    date_cloture = models.DateTimeField()
    description = models.TextField()
    est_actif = models.BooleanField(default=True)

    def __str__(self):
        return f"Appel {self.id} ({'actif' if self.est_actif else 'clos'})"

    def publier_appel_candidature(self):
        self.est_actif = True
        self.save()

    def cloturer_appel(self):
        self.est_actif = False
        self.save()