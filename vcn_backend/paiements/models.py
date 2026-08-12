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

    def __str__(self):
        return f"Echeance {self.id} - Contrat {self.contrat.id} ({self.statut})"

class Paiement(BaseModel):
    echeance = models.ForeignKey(Echeance, on_delete=models.PROTECT, related_name="paiements")
    date_paiement = models.DateTimeField(auto_now_add=True)
    montant_regle = models.FloatField()
    mode = models.CharField(max_length=20, choices=ModePaiement.choices)
    reference_transaction = models.CharField(max_length=100, unique=True, null=True, blank=True)
    reference_quitus = models.CharField(max_length=100, unique=True, null=True, blank=True)

    def editer_quitus(self):
        # Logique de generation de PDF a implémenter
        return f"Quitus pour le paiement {self.id}"

    def valider_paiement(self):
        # Numero de quitus officiel : c'est la reference imprimee sur la
        # quittance PDF remise a l'occupant, elle doit donc etre persistee.
        if not self.reference_quitus:
            self.reference_quitus = f"QUITUS-{self.date_paiement:%Y%m%d}-{str(self.id)[:8].upper()}"
            self.save(update_fields=["reference_quitus"])

        # Logique de solde de l'échéance
        total_paye = sum(p.montant_regle for p in self.echeance.paiements.all())
        total_du = self.echeance.montant_du + self.echeance.montant_penalite

        if total_paye >= total_du:
            self.echeance.statut = StatutEcheance.PAYEE
            self.echeance.save()

    def __str__(self):
        return f"Paiement {self.id} - Echeance {self.echeance.id}"

class TransactionLog(BaseModel):
    paiement = models.ForeignKey(Paiement, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
    provider = models.CharField(max_length=50, default="MOBILE_MONEY")
    provider_transaction_id = models.CharField(max_length=255, blank=True)
    payload_brut = models.TextField(blank=True, help_text="Données brutes reçues du webhook")
    statut_api = models.CharField(max_length=50, blank=True)
    erreur = models.TextField(blank=True)

    def __str__(self):
        return f"Log {self.provider} - {self.statut_api}"

