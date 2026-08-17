from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from patrimoine.models import Local, TypeLocal
from contrats.models import Contrat
from paiements.models import ModePaiement, Paiement
from terrain.models import Sanction, NiveauSanction, AvisCantine, Plainte, TypeSignalement
from fidelite.models import HistoriqueScore

class FideliteTests(APITestCase):
    def setUp(self):
        self.usager = Utilisateur.objects.create_user(
            username="etudiant", email="etu@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="123")
        self.local = Local.objects.create(reference="LOC1", type_local=TypeLocal.RESTAURATION, surface_m2=20.0)
        self.contrat = Contrat.objects.create(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.usager, # Simulation
            date_debut=timezone.now().date(),
            duree_mois=1
        )
        self.echeance = self.contrat.echeances.first()

    def test_maj_score_paiement(self):
        # Création d'un paiement
        Paiement.objects.create(
            echeance=self.echeance,
            montant_regle=10000.0,
            mode=ModePaiement.MOBILE_MONEY
        )
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, 5.0)
        self.assertEqual(HistoriqueScore.objects.count(), 1)

    def test_maj_score_sanction(self):
        Sanction.objects.create(
            local=self.local,
            contrat=self.contrat,
            niveau=NiveauSanction.AVERTISSEMENT,
            motif="Degradation mineure"
        )
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, -3.0)

        Sanction.objects.create(
            local=self.local,
            contrat=self.contrat,
            niveau=NiveauSanction.CONVOCATION,
            motif="Entretien"
        )
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, -8.0)

    def test_maj_score_avis(self):
        AvisCantine.objects.create(
            local=self.local,
            auteur=self.demandeur,
            note_etoiles=4,
            commentaire="Test"
        )
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, 2.0)

    def test_api_mon_score(self):
        self.demandeur.score_fidelite = 10.0
        self.demandeur.save()
        
        self.client.force_authenticate(user=self.usager)
        response = self.client.get('/api/fidelite/mon-score/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['score_actuel'], 10.0)
        
    def test_cooldown_plainte(self):
        self.client.force_authenticate(user=self.usager)
        url = '/api/terrain/plaintes/'
        data = {
            "local": self.local.id,
            "type": TypeSignalement.TECHNIQUE,
            "description": "Panne",
            "est_anonyme": False
        }
        
        # 1ere plainte = OK
        r1 = self.client.post(url, data)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        
        # 2eme plainte immédiate sur le même local = KO (cooldown)
        r2 = self.client.post(url, data)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("patienter", str(r2.data))

    def test_sanction_accumulation_plaintes(self):
        # Création de 2 plaintes directes (sans passer par l'API pour bypasser le cooldown)
        Plainte.objects.create(local=self.local, plaignant=self.usager, type=TypeSignalement.TECHNIQUE, description="1")
        Plainte.objects.create(local=self.local, plaignant=self.usager, type=TypeSignalement.TECHNIQUE, description="2")
        
        # 3eme plainte
        Plainte.objects.create(local=self.local, plaignant=self.usager, type=TypeSignalement.TECHNIQUE, description="3")
        
        # Vérifier qu'un avertissement a été généré
        sanction = Sanction.objects.filter(local=self.local, niveau=NiveauSanction.AVERTISSEMENT).first()
        self.assertIsNotNone(sanction)
        self.assertIn("Avertissement", sanction.motif)

    def test_api_classement_fidelite_occupant(self):
        self.demandeur.score_fidelite = 50.0
        self.demandeur.save()

        self.client.force_authenticate(user=self.usager)
        response = self.client.get('/api/fidelite/classement/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['demandeur_id'], str(self.demandeur.id))
        self.assertEqual(response.data[0]['score'], 50)
        self.assertEqual(response.data[0]['rang'], 1)
        self.assertTrue(response.data[0]['est_moi'])

    def test_api_classement_fidelite_occupant_hors_top_10(self):
        # Créer 11 autres demandeurs avec des scores plus élevés
        for i in range(1, 12):
            u = Utilisateur.objects.create_user(
                username=f"autre_{i}", email=f"autre_{i}@test.com", password="pwd", role=RoleUtilisateur.USAGER
            )
            Demandeur.objects.create(utilisateur=u, contact=f"12{i}", score_fidelite=100 - i)

        # L'occupant connecté a un score plus bas (rang 12)
        self.demandeur.score_fidelite = 10.0
        self.demandeur.save()

        self.client.force_authenticate(user=self.usager)
        response = self.client.get('/api/fidelite/classement/?limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10)
        # Les 9 premiers sont du top 9
        for idx in range(9):
            self.assertEqual(response.data[idx]['rang'], idx + 1)
            self.assertFalse(response.data[idx]['est_moi'])
        # Le 10ème élément est l'occupant connecté avec sa vraie position (12)
        self.assertEqual(response.data[9]['demandeur_id'], str(self.demandeur.id))
        self.assertEqual(response.data[9]['rang'], 12)
        self.assertEqual(response.data[9]['score'], 10)
        self.assertTrue(response.data[9]['est_moi'])



