from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from comptes.models import Utilisateur, RoleUtilisateur, JournalAudit


class RapportMensuelCollaborateurTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.directeur = Utilisateur.objects.create_user(
            username="directeur_crous",
            email="directeur@crous-t.sn",
            password="password123",
            role=RoleUtilisateur.DIRECTEUR_CROUS_T,
            nom_complet="Directeur Général"
        )
        self.agent_terrain = Utilisateur.objects.create_user(
            username="agent_terrain_1",
            email="agent.terrain@crous-t.sn",
            password="password123",
            role=RoleUtilisateur.AGENT_TERRAIN,
            nom_complet="Mamadou Terrain"
        )
        JournalAudit.objects.create(
            utilisateur=self.agent_terrain,
            action="CONTROLE_HYGIENE",
            cible="Local LOC-RESTO-01",
            details="Inspection sanitaire mensuelle"
        )

    def test_directeur_peut_consulter_rapport_mensuel_agent(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.get(f"/api/comptes/utilisateurs/{self.agent_terrain.id}/rapport-mensuel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["utilisateur"]["username"], "agent_terrain_1")
        self.assertGreaterEqual(data["total_actions"], 1)
        self.assertIsInstance(data["kpis"], list)
        self.assertEqual(len(data["actions"]), 1)

    def test_directeur_peut_changer_role_agent(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post(
            f"/api/comptes/utilisateurs/{self.agent_terrain.id}/changer-role/",
            {"role": RoleUtilisateur.AGENT_QHSE},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.agent_terrain.refresh_from_db()
        self.assertEqual(self.agent_terrain.role, RoleUtilisateur.AGENT_QHSE)
