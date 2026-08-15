"""Phase 5 — tests dedies : ordres de mission, maintenance technique, rapport QHSE."""
import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from comptes.models import RoleUtilisateur, Utilisateur
from patrimoine.models import Local, TypeLocal
from terrain.models import (
    InspectionQHse,
    InterventionMaintenance,
    NiveauUrgence,
    OrdreMission,
    Plainte,
    Sanction,
    StatutIntervention,
    StatutOrdreMission,
    StatutPlainte,
    TypeControleQHSE,
    TypeIntervention,
    TypeSignalement,
)

def _liste(reponse):
    """Resultats d'une reponse DRF, paginee ou non."""
    donnees = reponse.data
    if isinstance(donnees, dict) and 'results' in donnees:
        return donnees['results']
    return donnees


OM_URL = '/api/terrain/ordres-mission/'
MT_URL = '/api/terrain/maintenance/'
QHSE_URL = '/api/rapports/qhse/'


class BasePhase5(APITestCase):
    def setUp(self):
        self.qhse = Utilisateur.objects.create_user(
            username="qhse5", email="qhse5@test.com", password="pwd",
            role=RoleUtilisateur.AGENT_QHSE, nom_complet="Agent QHSE",
        )
        self.agent = Utilisateur.objects.create_user(
            username="agent5", email="agent5@test.com", password="pwd",
            role=RoleUtilisateur.AGENT_TERRAIN, nom_complet="Agent Terrain",
        )
        self.autre_agent = Utilisateur.objects.create_user(
            username="agent6", email="agent6@test.com", password="pwd",
            role=RoleUtilisateur.AGENT_TERRAIN, nom_complet="Autre Agent",
        )
        self.technicien = Utilisateur.objects.create_user(
            username="tech5", email="tech5@test.com", password="pwd",
            role=RoleUtilisateur.SERVICE_TECHNIQUE, nom_complet="Technicien",
        )
        self.usager = Utilisateur.objects.create_user(
            username="usager5", email="usager5@test.com", password="pwd",
            role=RoleUtilisateur.USAGER, nom_complet="Usager",
        )
        self.local = Local.objects.create(
            reference="LOC-P5", type_local=TypeLocal.MULTISERVICES, surface_m2=25.0
        )

    def _ordre(self, **kwargs):
        base = dict(
            local=self.local, agent_assigne=self.agent, emetteur=self.qhse,
            objet="Controle hygiene", type_controle=TypeControleQHSE.SANITAIRE,
            priorite=NiveauUrgence.ELEVEE, date_mission=timezone.now(),
        )
        base.update(kwargs)
        return OrdreMission.objects.create(**base)

    def _intervention(self, **kwargs):
        base = dict(
            local=self.local, technicien=self.technicien,
            type_intervention=TypeIntervention.CURATIVE,
            description="Reparation plomberie", date_planifiee=timezone.now(),
            cout_estime=50000,
        )
        base.update(kwargs)
        return InterventionMaintenance.objects.create(**base)


class OrdreMissionPhase5Tests(BasePhase5):
    def test_reference_generee_au_format_om(self):
        ordre = self._ordre()
        self.assertRegex(ordre.reference, r'^OM-\d{4}-\d{4}$')
        self.assertEqual(ordre.statut, StatutOrdreMission.EMIS)

    def test_creation_par_api_affecte_emetteur(self):
        self.client.force_authenticate(user=self.qhse)
        reponse = self.client.post(OM_URL, {
            'local': str(self.local.id),
            'agent_assigne': str(self.agent.id),
            'objet': "Mission de controle",
            'directives': "Verifier les extincteurs",
            'type_controle': TypeControleQHSE.TECHNIQUE,
            'priorite': NiveauUrgence.MOYENNE,
            'date_mission': timezone.now().isoformat(),
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED, reponse.data)
        self.assertEqual(reponse.data['emetteur'], self.qhse.id)
        self.assertTrue(reponse.data['reference'].startswith('OM-'))

    def test_cycle_demarrer_puis_cloturer(self):
        ordre = self._ordre()
        self.client.force_authenticate(user=self.agent)
        demarrage = self.client.post(f'{OM_URL}{ordre.id}/demarrer/')
        self.assertEqual(demarrage.status_code, status.HTTP_200_OK)
        self.assertEqual(demarrage.data['statut'], StatutOrdreMission.EN_COURS)

        cloture = self.client.post(f'{OM_URL}{ordre.id}/cloturer/',
                                   {'compte_rendu': "Local conforme."}, format='json')
        self.assertEqual(cloture.status_code, status.HTTP_200_OK)
        self.assertEqual(cloture.data['statut'], StatutOrdreMission.EXECUTE)

    def test_cloture_exige_un_compte_rendu(self):
        ordre = self._ordre(statut=StatutOrdreMission.EN_COURS)
        self.client.force_authenticate(user=self.agent)
        reponse = self.client.post(f'{OM_URL}{ordre.id}/cloturer/', {}, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('compte_rendu', reponse.data)

    def test_cloture_rattache_inspection_resultat(self):
        ordre = self._ordre(statut=StatutOrdreMission.EN_COURS)
        inspection = InspectionQHse.objects.create(
            local=self.local, inspecteur=self.qhse, type_controle=TypeControleQHSE.SANITAIRE,
            date_visite=timezone.now(), est_conforme=True, note_sanitaire=18,
            observations="Rien a signaler",
        )
        self.client.force_authenticate(user=self.agent)
        reponse = self.client.post(f'{OM_URL}{ordre.id}/cloturer/', {
            'compte_rendu': "Inspection realisee.",
            'inspection_id': str(inspection.id),
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        ordre.refresh_from_db()
        self.assertEqual(ordre.inspection_resultat_id, inspection.id)

    def test_cloisonnement_agent_non_concerne(self):
        self._ordre()
        self.client.force_authenticate(user=self.autre_agent)
        liste = self.client.get(OM_URL)
        self.assertEqual(liste.status_code, status.HTTP_200_OK)
        resultats = _liste(liste)
        self.assertEqual(len(resultats), 0)

    def test_annulation_reservee_a_emetteur_ou_supervision(self):
        ordre = self._ordre()
        self.client.force_authenticate(user=self.autre_agent)
        refus = self.client.post(f'{OM_URL}{ordre.id}/annuler/')
        self.assertIn(refus.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        self.client.force_authenticate(user=self.qhse)
        accord = self.client.post(f'{OM_URL}{ordre.id}/annuler/')
        self.assertEqual(accord.status_code, status.HTTP_200_OK)
        self.assertEqual(accord.data['statut'], StatutOrdreMission.ANNULE)

    def test_ordre_execute_non_annulable(self):
        ordre = self._ordre(statut=StatutOrdreMission.EXECUTE)
        self.client.force_authenticate(user=self.qhse)
        reponse = self.client.post(f'{OM_URL}{ordre.id}/annuler/')
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)


class MaintenancePhase5Tests(BasePhase5):
    def test_cloture_resout_la_plainte_source(self):
        plainte = Plainte.objects.create(
            local=self.local, plaignant=self.usager, type=TypeSignalement.TECHNIQUE,
            description="Fuite d'eau",
        )
        intervention = self._intervention(
            plainte_source=plainte, statut=StatutIntervention.EN_COURS
        )
        self.client.force_authenticate(user=self.technicien)
        reponse = self.client.post(f'{MT_URL}{intervention.id}/cloturer/', {
            'rapport': "Joint remplace.", 'cout_reel': 42000,
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['statut'], StatutIntervention.TERMINEE)
        plainte.refresh_from_db()
        self.assertEqual(plainte.statut, StatutPlainte.RESOLUE)
        self.assertIsNotNone(plainte.date_resolution)

    def test_demarrer_refuse_hors_planifiee(self):
        intervention = self._intervention(statut=StatutIntervention.TERMINEE)
        self.client.force_authenticate(user=self.technicien)
        reponse = self.client.post(f'{MT_URL}{intervention.id}/demarrer/')
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtres_statut_et_type(self):
        self._intervention()
        self._intervention(
            type_intervention=TypeIntervention.PREVENTIVE, statut=StatutIntervention.EN_COURS
        )
        self.client.force_authenticate(user=self.technicien)
        filtre = self.client.get(MT_URL, {'statut': StatutIntervention.EN_COURS})
        resultats = _liste(filtre)
        self.assertEqual(len(resultats), 1)
        filtre_type = self.client.get(MT_URL, {'type_intervention': TypeIntervention.PREVENTIVE})
        resultats_type = _liste(filtre_type)
        self.assertEqual(len(resultats_type), 1)

    def test_statistiques_maintenance(self):
        self._intervention(
            statut=StatutIntervention.TERMINEE,
            date_realisation=timezone.now() + datetime.timedelta(days=2),
            cout_reel=60000,
        )
        self.client.force_authenticate(user=self.technicien)
        reponse = self.client.get(f'{MT_URL}statistiques/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['total'], 1)
        self.assertEqual(reponse.data['cout_reel_total'], 60000)
        self.assertEqual(reponse.data['delai_moyen_jours'], 2)


class RapportQHSEPhase5Tests(BasePhase5):
    def test_acces_refuse_a_un_usager(self):
        self.client.force_authenticate(user=self.usager)
        self.assertEqual(self.client.get(QHSE_URL).status_code, status.HTTP_403_FORBIDDEN)

    def test_rapport_qhse_consolide(self):
        plainte = Plainte.objects.create(
            local=self.local, plaignant=self.usager, type=TypeSignalement.ENVIRONNEMENT,
            description="Depot sauvage", statut=StatutPlainte.RESOLUE,
            date_resolution=timezone.now(),
        )
        Plainte.objects.create(
            local=self.local, plaignant=self.usager, type=TypeSignalement.TECHNIQUE,
            description="Panne electrique",
            date_limite_sla=timezone.now() - datetime.timedelta(days=1),
        )
        InspectionQHse.objects.create(
            local=self.local, inspecteur=self.qhse, type_controle=TypeControleQHSE.SANITAIRE,
            date_visite=timezone.now(), est_conforme=False, note_sanitaire=8,
            observations="Non conforme",
        )
        Sanction.objects.create(
            local=self.local, agent_prononcant=self.qhse, motif="Hygiene insuffisante",
        )
        self._ordre(statut=StatutOrdreMission.EXECUTE)
        self._intervention(statut=StatutIntervention.TERMINEE, cout_reel=30000)

        self.client.force_authenticate(user=self.qhse)
        reponse = self.client.get(QHSE_URL)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        corps = reponse.data
        self.assertEqual(corps['plaintes']['total'], 2)
        self.assertEqual(corps['plaintes']['resolues'], 1)
        self.assertEqual(corps['plaintes']['sla_depassees'], 1)
        self.assertEqual(corps['inspections']['taux_conformite'], 0)
        # Une sanction automatique est generee par le signal d'inspection non conforme.
        self.assertGreaterEqual(corps['sanctions']['total'], 1)
        self.assertEqual(corps['missions']['executes'], 1)
        self.assertEqual(corps['missions']['taux_execution'], 100.0)
        self.assertEqual(corps['maintenance']['terminees'], 1)
        self.assertEqual(corps['maintenance']['cout_reel_total'], 30000)
        self.assertEqual(corps['locaux_a_risque'][0]['local_reference'], self.local.reference)
        self.assertEqual(corps['locaux_a_risque'][0]['score_risque'], 4)
        self.assertIn(str(plainte.type), corps['plaintes']['par_type'])

    def test_rapport_periode_contient_missions_et_maintenance(self):
        self._ordre(statut=StatutOrdreMission.EN_COURS)
        self._intervention()
        self.client.force_authenticate(user=self.qhse)
        reponse = self.client.get('/api/rapports/periode/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['missions']['en_cours'], 1)
        self.assertEqual(reponse.data['maintenance']['planifiees'], 1)
        self.assertEqual(reponse.data['maintenance']['cout_estime_total'], 50000)
