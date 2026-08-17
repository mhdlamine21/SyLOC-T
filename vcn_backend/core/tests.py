from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from comptes.models import Utilisateur, RoleUtilisateur

class SupervisionSystemeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_si = Utilisateur.objects.create_user(
            username='admin_si_test',
            email='admin_si_test@crous-t.sn',
            password='testpassword123',
            role=RoleUtilisateur.ADMINISTRATEUR_SI,
        )
        self.usager = Utilisateur.objects.create_user(
            username='usager_test',
            email='usager_test@crous-t.sn',
            password='testpassword123',
            role=RoleUtilisateur.USAGER,
        )

    def test_supervision_accessible_pour_admin_si(self):
        self.client.force_authenticate(user=self.admin_si)
        response = self.client.get('/api/admin/supervision/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'OPERATIONNEL')
        self.assertIn('services', response.data)
        self.assertIn('volumetrie', response.data)
        self.assertIn('systeme', response.data)

    def test_rapports_periode_accessible_pour_admin_si(self):
        self.client.force_authenticate(user=self.admin_si)
        response = self.client.get('/api/rapports/periode/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervision_interdite_pour_usager(self):
        self.client.force_authenticate(user=self.usager)
        response = self.client.get('/api/admin/supervision/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
