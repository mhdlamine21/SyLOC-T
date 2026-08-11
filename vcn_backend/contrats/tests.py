from rest_framework.test import APITestCase
from django.utils import timezone
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur, StatutVerificationEtudiant
from patrimoine.models import Local, TypeLocal
from contrats.models import Contrat
from paiements.models import Echeance

class ContratTest(APITestCase):
    def setUp(self):
        self.usager = Utilisateur.objects.create_user(
            username="titulaire", email="titulaire@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(
            utilisateur=self.usager, contact="12345", est_etudiant=True, statut_verification_etudiant=StatutVerificationEtudiant.VALIDE
        )
        self.directeur = Utilisateur.objects.create_user(
            username="directeur", email="dir@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_CROUS_T
        )
        self.local = Local.objects.create(
            reference="LOC-TEST", localisation="Campus", type_local=TypeLocal.PAPETERIE, surface_m2=15.0
        )
    
    def test_creation_contrat_et_signal_echeances(self):
        # Création d'un contrat de 2 ans (24 mois) comme défini par défaut
        contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(),
            redevance_mensuelle=50000.0,
            montant_caution=100000.0
        )
        
        # Le signal génère automatiquement les échéances
        echeances = Echeance.objects.filter(contrat=contrat)
        self.assertEqual(echeances.count(), 24) # 2 ans = 24 mois
        self.assertEqual(echeances.first().montant_du, 50000.0)

    def test_gratuite_etudiante(self):
        contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(),
            redevance_mensuelle=50000.0,
            montant_caution=100000.0
        )
        contrat.appliquer_gratuite_etudiante()
        
        self.assertTrue(contrat.est_gratuit)
        self.assertEqual(contrat.redevance_mensuelle, 0.0)
