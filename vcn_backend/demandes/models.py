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


class MotifArchivage(models.TextChoices):
    AVIS_DEFAVORABLE = "AVIS_DEFAVORABLE", "Avis défavorable"
    DOSSIER_INCOMPLET = "DOSSIER_INCOMPLET", "Dossier incomplet"
    AUTRE = "AUTRE", "Autre"


class MotifActivationCommission(models.TextChoices):
    ABSENCE = "ABSENCE", "Absence du Directeur CROUS-T"
    VOYAGE = "VOYAGE", "Voyage / mission du Directeur"
    ARBITRAGE = "ARBITRAGE", "Arbitrage collégial requis"
    AUTRE = "AUTRE", "Autre"

class AppelCandidature(BaseModel):
    titre = models.CharField(max_length=255)
    description = models.TextField()
    date_lancement = models.DateTimeField()
    date_cloture = models.DateTimeField()
    est_actif = models.BooleanField(default=True)
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="appels_candidature")
    publie_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name="appels_publies")

    class Meta:
        ordering = ['-date_lancement']

    @property
    def est_ouvert(self):
        from django.utils import timezone
        maintenant = timezone.now()
        return bool(self.est_actif and self.date_lancement <= maintenant <= self.date_cloture)

    def cloturer(self):
        """Ferme l'appel : plus aucune candidature ne peut y etre rattachee."""
        self.est_actif = False
        self.save(update_fields=['est_actif'])
        return self

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

    # ---------------------------------------------------------- Archivage
    archive = models.BooleanField(default=False)
    date_archivage = models.DateTimeField(null=True, blank=True)
    archive_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="dossiers_archives"
    )
    motif_archivage = models.CharField(max_length=32, choices=MotifArchivage.choices, blank=True)
    commentaire_archivage = models.TextField(blank=True)
    partage_avec = models.ManyToManyField(
        Utilisateur, blank=True, related_name="demandes_partagees"
    )

    # ---------------------- Routage Renovation/Construction (Service Technique)
    transmis_service_technique = models.BooleanField(default=False)
    date_transmission_technique = models.DateTimeField(null=True, blank=True)
    rapport_technique = models.TextField(blank=True)
    rapport_technique_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="rapports_techniques_rediges"
    )
    date_rapport_technique = models.DateTimeField(null=True, blank=True)
    transfere_juridique = models.BooleanField(default=False)
    date_transfert_juridique = models.DateTimeField(null=True, blank=True)

    def archiver(self, utilisateur, motif, commentaire=""):
        from django.utils import timezone
        self.archive = True
        self.date_archivage = timezone.now()
        self.archive_par = utilisateur
        self.motif_archivage = motif
        self.commentaire_archivage = commentaire
        self.save(update_fields=[
            'archive', 'date_archivage', 'archive_par', 'motif_archivage',
            'commentaire_archivage', 'date_modification',
        ])
        return self

    @property
    def necessite_expertise_technique(self):
        return self.type_demande in (TypeDemande.RENOVATION, TypeDemande.CONSTRUCTION_CANDIDAT, TypeDemande.CONSTRUCTION_CROUST)

    def save(self, *args, **kwargs):
        if not self.reference_anonyme:
            import uuid
            self.reference_anonyme = f"DOSSIER-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

    ETAPES_CHRONOLOGIE = [
        StatutDemande.NOUVELLE,
        StatutDemande.CONTROLE_RECEVABILITE,
        StatutDemande.EN_EXPERTISE_TECHNIQUE,
        StatutDemande.CONTROLE_HYGIENE,
        StatutDemande.EN_ATTENTE_DECISION,
        StatutDemande.FAVORABLE,
    ]

    @property
    def statut_label(self):
        return self.get_statut_display()

    @property
    def est_cloturee(self):
        return self.statut in (
            StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE,
            StatutDemande.MITIGEE_ARCHIVEE, StatutDemande.CONTRAT_REFUSE,
        )

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

class Commission(BaseModel):
    """Commission d'evaluation, creee et activee par le Directeur CROUS-T (UC commission).

    Peut recevoir une delegation de decision du Directeur (`delegation_directeur`) :
    dans ce cas, ses membres peuvent exercer les actions de decision reservees
    au role DIRECTEUR_CROUS_T sur les demandes (cf. `demandes.services` / permissions).
    """
    nom = models.CharField(max_length=150, default="Commission d'évaluation")
    active = models.BooleanField(default=False)
    date_activation = models.DateTimeField(null=True, blank=True)
    date_desactivation = models.DateTimeField(null=True, blank=True)
    motif_activation = models.CharField(max_length=32, choices=MotifActivationCommission.choices, blank=True)
    commentaire_activation = models.TextField(blank=True)
    delegation_directeur = models.BooleanField(
        default=False, help_text="Si actif, la commission peut prendre les decisions du Directeur CROUS-T."
    )
    creee_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="commissions_creees"
    )

    class Meta:
        verbose_name = "Commission d'évaluation"
        verbose_name_plural = "Commissions d'évaluation"

    def activer(self, utilisateur, motif, delegation=False, commentaire=""):
        from django.utils import timezone
        self.active = True
        self.date_activation = timezone.now()
        self.motif_activation = motif
        self.commentaire_activation = commentaire
        self.delegation_directeur = delegation
        self.save()
        return self

    def desactiver(self):
        from django.utils import timezone
        self.active = False
        self.date_desactivation = timezone.now()
        self.delegation_directeur = False
        self.save()
        return self

    def __str__(self):
        return f"{self.nom} ({'active' if self.active else 'inactive'})"


class MembreCommission(BaseModel):
    commission = models.ForeignKey(
        Commission, on_delete=models.CASCADE, null=True, blank=True, related_name="membres"
    )
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

    class Meta:
        # Un membre ne vote qu'une seule fois par dossier (le vote est
        # revisable via PATCH, jamais duplique).
        unique_together = ('demande', 'membre')
        ordering = ['-date_creation']

    @property
    def note_moyenne(self):
        notes = [n for n in (self.note_formelle, self.note_technique) if n is not None]
        return round(sum(notes) / len(notes), 2) if notes else None
