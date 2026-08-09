# pyrefly: ignore [missing-import]
from django.test import TestCase
from django.db import IntegrityError
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
        demandeur.statut_verification_etudiant = StatutVerificationEtudiant.VALIDE
        demandeur.valide_par = self.admin
        demandeur.save()

        self.assertEqual(demandeur.valide_par, self.admin)
        self.assertIn(demandeur, self.admin.demandeurs_valides.all())

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
