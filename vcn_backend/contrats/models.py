from django.db import models
from core.models import BaseModel
from patrimoine.models import Local
from comptes.models import Demandeur, Utilisateur
from django.utils import timezone

class Contrat(BaseModel):
    local = models.ForeignKey(Local, on_delete=models.PROTECT, related_name="contrats")
    demandeur = models.ForeignKey(Demandeur, on_delete=models.PROTECT, related_name="contrats_titulaire")
    signataire_crous_t = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name="contrats_signes")
    
    # Relation optionnelle vers Demande
    demande = models.OneToOneField('demandes.Demande', null=True, blank=True, on_delete=models.SET_NULL)

    date_signature = models.DateField(default=timezone.now)
    date_debut = models.DateField()
    duree_mois = models.PositiveIntegerField(default=24) # Par défaut 2 ans (24 mois) comme demandé
    preavis_mois = models.PositiveIntegerField(default=3)
    redevance_mensuelle = models.FloatField()
    montant_caution = models.FloatField()
    est_gratuit = models.BooleanField(default=False)
    est_actif = models.BooleanField(default=True)
    
    date_resiliation = models.DateField(null=True, blank=True)
    motif_resiliation = models.TextField(null=True, blank=True)

    def appliquer_gratuite_etudiante(self):
        if self.demandeur.est_etudiant and self.demandeur.statut_verification_etudiant == 'VALIDE':
            self.est_gratuit = True
            self.redevance_mensuelle = 0.0
            self.save()

    def prononcer_expulsion(self, motif):
        self.est_actif = False
        self.date_resiliation = timezone.now().date()
        self.motif_resiliation = f"Expulsion: {motif}"
        self.save()
        
        # Libérer le local
        self.local.est_libre = True
        self.local.save()

    def __str__(self):
        return f"Contrat {self.id} - Local: {self.local.reference}"
