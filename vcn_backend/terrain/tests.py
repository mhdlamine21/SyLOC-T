from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from patrimoine.models import Local, TypeLocal
from terrain.models import TypeSignalement, StatutPlainte, TypeControleQHSE, Sanction, NiveauSanction, StatutAvis

class TerrainTests(APITestCase):
    def setUp(self):
        self.usager = Utilisateur.objects.create_user(
            username="usager", email="usager@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="123")
        
        self.agent = Utilisateur.objects.create_user(
            username="agent", email="agent@test.com", password="pwd", role=RoleUtilisateur.AGENT_QHSE
        )
        self.local = Local.objects.create(
            reference="LOC-TERRAIN", type_local=TypeLocal.MULTISERVICES, surface_m2=20.0
        )
        
    def test_depot_plainte_anonyme(self):
        self.client.force_authenticate(user=self.usager)
        url = '/api/terrain/plaintes/'
        data = {
            "type": TypeSignalement.ENVIRONNEMENT,
            "description": "Poubelle non vidée",
            "est_anonyme": True
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['est_anonyme'], True)
        self.assertEqual(response.data['statut'], StatutPlainte.OUVERTE)

    def test_inspection_genere_sanction_automatique(self):
        self.client.force_authenticate(user=self.agent)
        url = '/api/terrain/inspections/'
        data = {
            "local": self.local.id,
            "type_controle": TypeControleQHSE.SANITAIRE,
            "date_visite": timezone.now().isoformat(),
            "est_conforme": False,
            "observations": "Cuisine très sale, hygiène non respectée"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Vérifier que le signal a généré la sanction
        sanction = Sanction.objects.filter(local=self.local).first()
        self.assertIsNotNone(sanction)
        self.assertEqual(sanction.niveau, NiveauSanction.AVERTISSEMENT)
        self.assertIn("Cuisine très sale", sanction.motif)

    def test_avis_cantine(self):
        self.client.force_authenticate(user=self.usager)
        url = '/api/terrain/avis/'
        data = {
            "local": self.local.id,
            "note_etoiles": 4,
            "commentaire": "Très bon repas aujourd'hui"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note_etoiles'], 4)
        self.assertEqual(response.data['statut'], StatutAvis.PUBLIE)
        
        # Test validation note
        data_invalid = {
            "local": self.local.id,
            "note_etoiles": 6, # Invalide, max 5
            "commentaire": "Trop bien"
        }
        response_invalid = self.client.post(url, data_invalid)
        self.assertEqual(response_invalid.status_code, status.HTTP_400_BAD_REQUEST)
