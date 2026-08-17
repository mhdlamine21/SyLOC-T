from django.db import models
from core.models import BaseModel
from contrats.models import Contrat

class StatutEcheance(models.TextChoices):
    NON_ECHUE = 'NON_ECHUE', 'Non échue'
    EXIGIBLE = 'EXIGIBLE', 'Exigible'
    PAYEE = 'PAYEE', 'Payée'
    EN_RETARD = 'EN_RETARD', 'En retard'

class ModePaiement(models.TextChoices):
    MOBILE_MONEY = 'MOBILE_MONEY', 'Mobile Money'
    ESPECES = 'ESPECES', 'Espèces'

class StatutPaiement(models.TextChoices):
    EN_ATTENTE = 'EN_ATTENTE', 'En attente de validation'
    VALIDE = 'VALIDE', 'Validé'
    REJETE = 'REJETE', 'Rejeté'

class Echeance(BaseModel):
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name="echeances")
    date_exigibilite = models.DateField()
    montant_du = models.FloatField()
    montant_penalite = models.FloatField(default=0.0)
    statut = models.CharField(max_length=20, choices=StatutEcheance.choices, default=StatutEcheance.NON_ECHUE)

    def appliquer_penalite_retard(self, montant):
        if self.statut == StatutEcheance.EN_RETARD:
            self.montant_penalite += montant
            self.save()

    @property
    def montant_total_du(self):
        return (self.montant_du or 0.0) + (self.montant_penalite or 0.0)

    @property
    def montant_paye(self):
        return sum(p.montant_regle or 0.0 for p in self.paiements.all())

    @property
    def reste_a_payer(self):
        return max(self.montant_total_du - self.montant_paye, 0.0)

    def actualiser_statut(self):
        from datetime import date, timedelta
        aujourdhui = date.today()
        modifie = False
        
        if self.statut == StatutEcheance.NON_ECHUE and aujourdhui >= self.date_exigibilite:
            self.statut = StatutEcheance.EXIGIBLE
            modifie = True
            
        if self.statut == StatutEcheance.EXIGIBLE and aujourdhui > self.date_exigibilite + timedelta(days=30):
            self.statut = StatutEcheance.EN_RETARD
            self.montant_penalite = self.montant_du * 0.10
            modifie = True
            
        if modifie:
            self.save(update_fields=['statut', 'montant_penalite'])
            
        return modifie

    def __str__(self):
        return f"Echeance {self.id} - Contrat {self.contrat.id} ({self.statut})"

class Paiement(BaseModel):
    echeance = models.ForeignKey(Echeance, on_delete=models.PROTECT, related_name="paiements")
    date_paiement = models.DateTimeField(auto_now_add=True)
    montant_regle = models.FloatField()
    mode = models.CharField(max_length=20, choices=ModePaiement.choices)
    statut = models.CharField(max_length=20, choices=StatutPaiement.choices, default=StatutPaiement.VALIDE)
    reference_transaction = models.CharField(max_length=100, unique=True, null=True, blank=True)
    reference_quitus = models.CharField(max_length=100, unique=True, null=True, blank=True)
    numero_payeur = models.CharField(
        max_length=30, blank=True, null=True,
        help_text="Numero mobile money utilise par l'occupant pour regler (obligatoire si mode = MOBILE_MONEY)."
    )

    def editer_quitus(self):
        # Logique de generation de PDF a implémenter
        demandeur = self.echeance.contrat.demandeur
        return {
            'reference_quitus': self.reference_quitus,
            'occupant_nom': getattr(demandeur.utilisateur, 'nom_complet', str(demandeur.utilisateur)),
            'local_reference': self.echeance.contrat.local.reference if self.echeance.contrat.local else '',
            'montant_regle': self.montant_regle,
            'organisme': 'CROUS',
            'mode_libelle': self.get_mode_display(),
        }

    def valider_paiement(self):
        # Numero de quitus officiel : c'est la reference imprimee sur la
        # quittance PDF remise a l'occupant, elle doit donc etre persistee.
        if not self.reference_quitus:
            self.reference_quitus = f"QUITUS-{self.date_paiement:%Y%m%d}-{str(self.id)[:8].upper()}"
            self.statut = StatutPaiement.VALIDE
            self.save(update_fields=["reference_quitus", "statut"])

        # Logique de solde de l'échéance
        total_paye = sum(p.montant_regle for p in self.echeance.paiements.all())
        total_du = self.echeance.montant_du + self.echeance.montant_penalite

        if total_paye >= total_du:
            self.echeance.statut = StatutEcheance.PAYEE
            self.echeance.save()
            
        # Logique d'automatisation des reversements Amicale (100% des revenus)
        if hasattr(self.echeance, 'contrat') and self.echeance.contrat.local.gestionnaire == 'AMICALE':
            # Verifier s'il n'existe pas deja pour eviter les doublons en cas de re-validation
            if not hasattr(self, 'reversement'):
                ReversementAmicale.objects.create(
                    paiement=self,
                    montant_reverse=self.montant_regle
                )

    def __str__(self):
        return f"Paiement {self.id} - Echeance {self.echeance.id}"

class ReversementAmicale(BaseModel):
    paiement = models.OneToOneField(Paiement, on_delete=models.CASCADE, related_name="reversement")
    montant_reverse = models.FloatField()
    date_reversement = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reversement {self.id} - Amicale (Paiement {self.paiement.id})"

class TransactionLog(BaseModel):
    paiement = models.ForeignKey(Paiement, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
    provider = models.CharField(max_length=50, default="MOBILE_MONEY")
    provider_transaction_id = models.CharField(max_length=255, blank=True)
    payload_brut = models.TextField(blank=True, help_text="Données brutes reçues du webhook")
    statut_api = models.CharField(max_length=50, blank=True)
    erreur = models.TextField(blank=True)

    def __str__(self):
        return f"Log {self.provider} - {self.statut_api}"

