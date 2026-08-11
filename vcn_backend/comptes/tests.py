# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from comptes.models import (
    Utilisateur, RoleUtilisateur, Demandeur,
    StatutVerificationEtudiant, Notification, CanalNotification, JournalAudit
)


class ComptesModelsTest(TestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin1", email="admin1@test.com", password="pwd", role=RoleUtilisateur.ADMINISTRATEUR_SI
        )
        self.usager = Utilisateur.objects.create_user(
            username="usager1", email="usager1@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )

    def test_creation_utilisateur(self):
        self.assertEqual(self.admin.role, RoleUtilisateur.ADMINISTRATEUR_SI)
        self.assertEqual(str(self.admin), "admin1 (ADMINISTRATEUR_SI)")

    def test_creation_demandeur_et_validation(self):
        demandeur = Demandeur.objects.create(
            utilisateur=self.usager,
            contact="123456789",
            est_etudiant=True,
            matricule_etudiant="ETUD123"
        )
        self.assertEqual(demandeur.statut_verification_etudiant, StatutVerificationEtudiant.NON_SOUMIS)
        self.assertIsNone(demandeur.valide_par)

        # Validation de la carte
        # pyrefly: ignore [missing-import]
        from django.utils import timezone
        demandeur.statut_verification_etudiant = StatutVerificationEtudiant.VALIDE
        demandeur.valide_par = self.admin
        demandeur.carte_etudiant_date_validation = timezone.now()
        demandeur.save()

        self.assertEqual(demandeur.valide_par, self.admin)
        self.assertIn(demandeur, self.admin.demandeurs_valides.all())
        self.assertTrue(demandeur.est_etudiant_verifie)

    def test_creation_notification(self):
        notif = Notification.objects.create(
            destinataire=self.usager,
            contenu="Test Notif",
            canal=CanalNotification.EMAIL
        )
        self.assertEqual(notif.destinataire, self.usager)
        self.assertFalse(notif.est_lue)

    def test_creation_journal_audit(self):
        audit = JournalAudit.objects.create(
            utilisateur=self.admin,
            action="CONNEXION",
            cible="SYSTEME",
            details="Connexion reussie"
        )
        self.assertEqual(audit.utilisateur, self.admin)
        self.assertEqual(audit.action, "CONNEXION")
        self.assertIn(audit, self.admin.audits.all())


# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]

class ComptesAPITest(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin1", email="admin1@test.com", password="pwd", role=RoleUtilisateur.ADMINISTRATEUR_SI
        )
        self.usager = Utilisateur.objects.create_user(
            username="usager1", email="usager1@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        
        # Test route mapping (using reverse or explicit paths)
        # Note: reverse may fail if urls are not yet mapped. We will use explicit strings for TDD.
        self.register_url = '/api/comptes/register/'
        self.login_url = '/api/comptes/login/'
        self.protected_url = '/api/comptes/protected-admin/' # A dummy route for testing permissions

    def test_register_success(self):
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "strongpassword123",
            "nom_complet": "New User"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="newuser@test.com").exists())
        new_user = Utilisateur.objects.get(email="newuser@test.com")
        self.assertEqual(new_user.role, RoleUtilisateur.USAGER)

    def test_register_duplicate_email(self):
        data = {
            "username": "usager2",
            "email": "usager1@test.com", # already exists
            "password": "pwd"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        data = {
            "username": "usager1",
            "password": "pwd"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data) # Our custom payload

    def test_login_invalid_credentials(self):
        data = {
            "username": "usager1",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_is_administrateur_si(self):
        # We need a dummy view in urls to test this properly, or we can test the permission class directly.
        # For simplicity, we'll instantiate the permission class and test `has_permission`.
        from comptes.permissions import IsAdministrateurSI
        # pyrefly: ignore [missing-import]
        from rest_framework.request import Request
        # pyrefly: ignore [missing-import]
        from django.http import HttpRequest
        
        request = Request(HttpRequest())
        request.user = self.usager
        permission = IsAdministrateurSI()
        self.assertFalse(permission.has_permission(request, None))
        
        request.user = self.admin
        self.assertTrue(permission.has_permission(request, None))

    def test_permission_is_directeur_crous_t(self):
        from comptes.permissions import IsDirecteurCrousT
        # pyrefly: ignore [missing-import]
        from rest_framework.request import Request
        # pyrefly: ignore [missing-import]
        from django.http import HttpRequest
        
        directeur = Utilisateur.objects.create_user(
            username="dir1", email="dir1@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_CROUS_T
        )
        
        request = Request(HttpRequest())
        request.user = self.usager
        permission = IsDirecteurCrousT()
        self.assertFalse(permission.has_permission(request, None))
        
        request.user = directeur
        self.assertTrue(permission.has_permission(request, None))

from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

class DemandeurAPITest(APITestCase):
    def setUp(self):
        self.usager = Utilisateur.objects.create_user(username="usg1", email="u1@test.com", password="pwd", role=RoleUtilisateur.USAGER)
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="123")
        self.agent = Utilisateur.objects.create_user(username="ag1", email="ag@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_DCUVE, is_staff=True)

    def test_soumettre_carte(self):
        self.client.force_authenticate(user=self.usager)
        url = '/api/comptes/demandeurs/soumettre-carte-etudiant/'
        dummy_file = SimpleUploadedFile("carte.jpg", b"file_content", content_type="image/jpeg")
        response = self.client.post(url, {'fichier': dummy_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.statut_verification_etudiant, StatutVerificationEtudiant.EN_ATTENTE)

    def test_valider_carte(self):
        self.client.force_authenticate(user=self.agent)
        url = f'/api/comptes/demandeurs/{self.demandeur.id}/valider-carte-etudiant/'
        response = self.client.post(url, {'decision': StatutVerificationEtudiant.VALIDE})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.statut_verification_etudiant, StatutVerificationEtudiant.VALIDE)
        self.assertIsNotNone(self.demandeur.carte_etudiant_date_validation)
        self.assertEqual(self.demandeur.valide_par, self.agent)


