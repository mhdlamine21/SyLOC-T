from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from patrimoine.models import Local, TypeLocal
from contrats.models import Contrat
from paiements.models import StatutEcheance, ModePaiement

class PaiementAPITest(APITestCase):
    def setUp(self):
        self.usager = Utilisateur.objects.create_user(
            username="titulaire", email="titulaire@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(
            utilisateur=self.usager, contact="12345"
        )
        self.directeur = Utilisateur.objects.create_user(
            username="directeur", email="dir@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_CROUS_T
        )
        self.local = Local.objects.create(
            reference="LOC-TEST-2", localisation="Campus", type_local=TypeLocal.PAPETERIE, surface_m2=15.0
        )
        
        self.contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(),
            duree_mois=12,
            redevance_mensuelle=10000.0,
            montant_caution=20000.0
        )
        
        self.echeance = self.contrat.echeances.first()
        self.regler_url = '/api/paiements/regler/'

    def test_regler_echeance(self):
        self.client.force_authenticate(user=self.usager)
        
        data = {
            "echeance_id": str(self.echeance.id),
            "montant_regle": 10000.0,
            "mode": ModePaiement.MOBILE_MONEY,
            "reference_transaction": "TX123456"
        }
        
        response = self.client.post(self.regler_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.echeance.refresh_from_db()
        self.assertEqual(self.echeance.statut, StatutEcheance.PAYEE)
        
    def test_regler_echeance_deja_payee(self):
        self.echeance.statut = StatutEcheance.PAYEE
        self.echeance.save()
        
        self.client.force_authenticate(user=self.usager)
        
        data = {
            "echeance_id": str(self.echeance.id),
            "montant_regle": 10000.0,
            "mode": ModePaiement.MOBILE_MONEY
        }
        
        response = self.client.post(self.regler_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Cette échéance est déjà payée.')
