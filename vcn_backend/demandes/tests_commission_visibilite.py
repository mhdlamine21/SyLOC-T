from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from comptes.serializers import MeSerializer
from core.models import ParametreSysteme
from demandes.models import Commission, MembreCommission, Demande, StatutDemande, VoteCommission, TypeDemande
from patrimoine.models import Local


class CommissionVisibiliteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.directeur_croust = Utilisateur.objects.create_user(
            username="dir_croust", email="dir_croust@test.com", password="password123",
            role=RoleUtilisateur.DIRECTEUR_CROUS_T, nom_complet="Directeur CROUS-T"
        )
        self.directeur_dcuve = Utilisateur.objects.create_user(
            username="dir_dcuve", email="dir_dcuve@test.com", password="password123",
            role=RoleUtilisateur.DIRECTEUR_DCUVE, nom_complet="Directeur DCUVE"
        )
        self.agent_dcuve = Utilisateur.objects.create_user(
            username="agent_dcuve", email="agent_dcuve@test.com", password="password123",
            role=RoleUtilisateur.AGENT_DCUVE, nom_complet="Agent DCUVE"
        )
        self.candidat = Utilisateur.objects.create_user(
            username="candidat1", email="candidat1@test.com", password="password123",
            role=RoleUtilisateur.USAGER, nom_complet="Candidat 1"
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.candidat, contact="770001122")
        self.local = Local.objects.create(reference="LOC-COMM-01", type_local="RESTAURATION", surface_m2=25)
        self.demande = Demande.objects.create(
            demandeur=self.demandeur, type_demande=TypeDemande.VENTE_ALIMENTAIRE,
            local=self.local, statut=StatutDemande.EN_ATTENTE_DECISION
        )
        self.commission = Commission.objects.create(
            nom="Commission d'évaluation",
            active=False
        )

    def test_directeur_dcuve_non_membre_a_est_membre_false(self):
        data = MeSerializer(self.directeur_dcuve).data
        self.assertFalse(data['est_membre_commission'])

    def test_directeur_dcuve_membre_commission_inactive_a_est_membre_false(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=True
        )
        data = MeSerializer(self.directeur_dcuve).data
        self.assertFalse(data['est_membre_commission'])

    def test_directeur_dcuve_membre_commission_active_a_est_membre_true(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=True
        )
        self.commission.active = True
        self.commission.save()

        data = MeSerializer(self.directeur_dcuve).data
        self.assertTrue(data['est_membre_commission'])

    def test_membre_desactive_dans_commission_active_a_est_membre_false(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=False
        )
        self.commission.active = True
        self.commission.save()

        data = MeSerializer(self.directeur_dcuve).data
        self.assertFalse(data['est_membre_commission'])

    def test_mes_taches_refuse_si_commission_inactive(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=True
        )
        self.client.force_authenticate(self.directeur_dcuve)
        res = self.client.get('/api/demandes/membres/mes-taches/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['est_membre'])

    def test_membre_sans_delegation_ne_peut_pas_decider(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=True
        )
        self.commission.active = True
        self.commission.delegation_directeur = False
        self.commission.save()

        self.client.force_authenticate(self.directeur_dcuve)
        res = self.client.post(f'/api/demandes/demandes/{self.demande.id}/decider/', {
            'decision': 'FAVORABLE', 'commentaire': 'Validé par commission'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_membre_avec_delegation_peut_decider(self):
        MembreCommission.objects.create(
            commission=self.commission,
            utilisateur=self.directeur_dcuve,
            actif=True
        )
        self.commission.active = True
        self.commission.delegation_directeur = True
        self.commission.save()

        ParametreSysteme.objects.update_or_create(
            cle='delegation_commission',
            defaults={'valeur': 'OUI', 'categorie': 'WORKFLOW', 'libelle': 'Délégation du pouvoir à la Commission'}
        )

        self.client.force_authenticate(self.directeur_dcuve)
        res = self.client.post(f'/api/demandes/demandes/{self.demande.id}/decider/', {
            'decision': 'FAVORABLE', 'commentaire': 'Attribué sous délégation'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.demande.refresh_from_db()
        self.assertEqual(self.demande.statut, StatutDemande.FAVORABLE)
