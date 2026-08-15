from django.db import models
from core.models import BaseModel
from patrimoine.models import Local
from comptes.models import Demandeur, Utilisateur
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class StatutContrat(models.TextChoices):
    BROUILLON = 'BROUILLON', 'Brouillon (en redaction)'
    EN_ATTENTE_SIGNATURE = 'EN_ATTENTE_SIGNATURE', 'En attente de signature'
    ACTIF = 'ACTIF', 'Actif'
    RESILIE = 'RESILIE', 'Resilie'
    EXPIRE = 'EXPIRE', 'Expire'


class TypeContrat(models.TextChoices):
    BAIL_COMMERCIAL = 'BAIL_COMMERCIAL', 'Bail commercial domanial'
    CONVENTION_OCCUPATION = 'CONVENTION_OCCUPATION', "Convention d'occupation precaire"
    CONVENTION_ETUDIANTE = 'CONVENTION_ETUDIANTE', 'Convention etudiante (gratuite)'
    AVENANT = 'AVENANT', 'Avenant'


class ModeleContrat(BaseModel):
    """Modele (gabarit) de contrat gere par le Service Juridique — Phase 4.

    `corps` contient un texte avec des variables `{{cle}}` remplacees a la
    redaction (voir contrats/services.py). Cela permet au juridique de faire
    evoluer la redaction des actes sans redeploiement.
    """

    nom = models.CharField(max_length=150, unique=True)
    type_contrat = models.CharField(
        max_length=40, choices=TypeContrat.choices, default=TypeContrat.BAIL_COMMERCIAL
    )
    objet = models.CharField(max_length=255, blank=True)
    corps = models.TextField(help_text="Texte du contrat, variables au format {{cle}}")
    clauses_standard = models.TextField(blank=True)
    duree_mois_defaut = models.PositiveIntegerField(default=24)
    preavis_mois_defaut = models.PositiveIntegerField(default=3)
    est_actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Modele de contrat'
        verbose_name_plural = 'Modeles de contrat'

    def __str__(self):
        return self.nom


class Contrat(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.PROTECT, related_name="contrats")
    demandeur = models.ForeignKey(Demandeur, on_delete=models.PROTECT, related_name="contrats_titulaire")
    signataire_crous_t = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="contrats_signes")
    
    # Relation optionnelle vers Demande
    demande = models.OneToOneField('demandes.Demande', null=True, blank=True, on_delete=models.SET_NULL)

    modele = models.ForeignKey(
        ModeleContrat, null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats'
    )
    reference = models.CharField(max_length=40, unique=True, blank=True)
    type_contrat = models.CharField(
        max_length=40, choices=TypeContrat.choices, default=TypeContrat.BAIL_COMMERCIAL
    )
    statut = models.CharField(
        max_length=30, choices=StatutContrat.choices, default=StatutContrat.BROUILLON
    )
    objet = models.CharField(max_length=255, blank=True)
    clauses_particulieres = models.TextField(blank=True)
    texte_contrat = models.TextField(blank=True, help_text='Corps redige et fige du contrat')

    date_signature = models.DateField(default=timezone.now)
    date_debut = models.DateField()
    duree_mois = models.PositiveIntegerField(default=24) # Par défaut 2 ans (24 mois) comme demandé
    preavis_mois = models.PositiveIntegerField(default=3)
    est_gratuit = models.BooleanField(default=False)
    est_actif = models.BooleanField(default=True)
    
    date_resiliation = models.DateField(null=True, blank=True)
    motif_resiliation = models.TextField(null=True, blank=True)

    # ------------------------------------------------------------------ Convocation
    convocation_date = models.DateTimeField(null=True, blank=True)
    convocation_mode = models.CharField(
        max_length=20, 
        choices=[('PHYSIQUE', 'Physique'), ('VIRTUELLE', 'Virtuelle')], 
        default='PHYSIQUE'
    )
    convocation_lieu = models.CharField(max_length=255, blank=True)
    convocation_envoyee = models.BooleanField(default=False)

    # ------------------------------------------------------------------ Phase 4
    @property
    def date_fin(self):
        return self.date_debut + relativedelta(months=self.duree_mois or 0)

    @property
    def date_fin_preavis(self):
        return self.date_fin - relativedelta(months=self.preavis_mois or 0)

    def generer_reference(self):
        if self.reference:
            return self.reference
        annee = (self.date_signature or timezone.now().date()).year
        rang = Contrat.objects.filter(date_signature__year=annee).count() + 1
        self.reference = f"CT-{annee}-{rang:04d}"
        return self.reference

    def mettre_en_signature(self):
        self.statut = StatutContrat.EN_ATTENTE_SIGNATURE
        self.save(update_fields=['statut', 'date_modification'])

    def activer(self):
        """Signature effective : le bail devient opposable et le local occupe."""
        self.statut = StatutContrat.ACTIF
        self.est_actif = True
        if not self.texte_contrat:
            # Un acte ne peut pas etre signe sans corps : on le rend depuis le
            # modele (ou le gabarit par defaut) avant de le figer.
            from .services import rendre_contrat
            self.texte_contrat = rendre_contrat(self)
        self.save(update_fields=[
            'statut', 'est_actif', 'texte_contrat', 'date_signature', 'date_modification',
        ])
        if hasattr(self.local, 'est_libre'):
            self.local.est_libre = False
            self.local.save(update_fields=['est_libre'])
        return self

    def resilier(self, motif, date_effet=None):
        """Resiliation juridique amiable ou contentieuse (UC42)."""
        self.statut = StatutContrat.RESILIE
        self.est_actif = False
        self.date_resiliation = date_effet or timezone.now().date()
        self.motif_resiliation = motif
        self.save()
        if hasattr(self.local, 'est_libre'):
            self.local.est_libre = True
            self.local.save(update_fields=['est_libre'])
        return self

    def solde_du(self):
        """Reste a payer, utilise par le quitus general de fin de bail."""
        total = 0.0
        for ech in self.echeances.all():
            du = float(ech.montant_du or 0) + float(ech.montant_penalite or 0)
            paye = sum(float(p.montant_regle or 0) for p in ech.paiements.all())
            total += max(du - paye, 0.0)
        return round(total, 2)

    def appliquer_gratuite_etudiante(self):
        if self.demandeur.est_etudiant and self.demandeur.statut_verification_etudiant == 'VALIDE':
            self.est_gratuit = True
            self.redevance_mensuelle = 0.0
            self.save()

    def prononcer_expulsion(self, motif):
        self.est_actif = False
        self.statut = StatutContrat.RESILIE
        self.date_resiliation = timezone.now().date()
        self.motif_resiliation = f"Expulsion: {motif}"
        self.save()
        
        # Libérer le local
        self.local.est_libre = True
        self.local.save()

    def save(self, *args, **kwargs):
        if not self.reference:
            self.generer_reference()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference or self.id} - Local: {self.local.reference}"
