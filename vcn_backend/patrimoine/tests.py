from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from comptes.models import RoleUtilisateur
from .models import TypeLocal, Local

Utilisateur = get_user_model()

class PatrimoineAPITest(APITestCase):
    def setUp(self):
        # Création de 2 utilisateurs avec des rôles différents
        self.usager = Utilisateur.objects.create_user(
            username='usager',
            email='usager@test.com',
            password='pwd',
            nom_complet='John Doe',
            role=RoleUtilisateur.USAGER
        )
        self.directeur_dcuve = Utilisateur.objects.create_user(
            username='directeur_dcuve',
            email='directeur_dcuve@test.com',
            password='pwd',
            nom_complet='Directeur DCUVE',
            role=RoleUtilisateur.DIRECTEUR_DCUVE
        )
        self.url = '/api/patrimoine/locaux/'

    def test_creation_local_non_autorisee(self):
        # Un usager normal ne peut pas créer de local
        self.client.force_authenticate(user=self.usager)
        data = {
            "reference": "L-001",
            "localisation": "Bâtiment A",
            "type_local": TypeLocal.RESTAURATION,
            "surface_m2": 50.5
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creation_local_autorisee(self):
        # Un directeur DCUVE peut créer un local
        self.client.force_authenticate(user=self.directeur_dcuve)
        data = {
            "reference": "L-002",
            "localisation": "Bâtiment B",
            "type_local": TypeLocal.MULTISERVICES,
            "surface_m2": 12.0
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Local.objects.count(), 1)
        self.assertEqual(Local.objects.get().reference, "L-002")

    def test_liste_locaux(self):
        # Création manuelle d'un local
        Local.objects.create(
            reference="L-003",
            localisation="Campus Nord",
            type_local=TypeLocal.PAPETERIE,
            surface_m2=20.0
        )
        # N'importe quel utilisateur authentifié peut lister les locaux
        self.client.force_authenticate(user=self.usager)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['reference'], "L-003")
