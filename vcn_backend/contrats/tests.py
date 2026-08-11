from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from patrimoine.models import Local
from contrats.models import Contrat

class ContratsTests(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin", email="admin@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_CROUS_T, is_staff=True
        )
        self.usager = Utilisateur.objects.create_user(
            username="usager", email="usager@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="123")
        self.local = Local.objects.create(reference="LOC-CONTRAT", type_local="RESTAURATION", surface_m2=20.0)

    def test_creation_contrat(self):
        contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.admin,
            date_debut=timezone.now().date(),
            redevance_mensuelle=100.0,
            montant_caution=200.0
        )
        self.assertIsNotNone(contrat)
        self.assertTrue(contrat.est_actif)

    def test_gratuite_etudiante(self):
        # Mettre à jour l'étudiant
        self.demandeur.est_etudiant = True
        self.demandeur.statut_verification_etudiant = 'VALIDE'
        self.demandeur.save()

        contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.admin,
            date_debut=timezone.now().date(),
            redevance_mensuelle=100.0,
            montant_caution=200.0
        )
        contrat.appliquer_gratuite_etudiante()
        
        self.assertTrue(contrat.est_gratuit)
        self.assertEqual(contrat.redevance_mensuelle, 0.0)

    def test_expulsion(self):
        contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.admin,
            date_debut=timezone.now().date(),
            redevance_mensuelle=100.0,
            montant_caution=200.0
        )
        self.local.est_libre = False
        self.local.save()
        
        contrat.prononcer_expulsion("Non paiement")
        
        self.assertFalse(contrat.est_actif)
        self.assertIsNotNone(contrat.date_resiliation)
        self.assertIn("Expulsion: Non paiement", contrat.motif_resiliation)
        
        self.local.refresh_from_db()
        self.assertTrue(self.local.est_libre)
