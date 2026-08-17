"""Tests Phase 3 - appels a candidature, chronologie de suivi, commission."""
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase

from comptes.models import Utilisateur, Demandeur, RoleUtilisateur
from patrimoine.models import Local
from demandes.models import (
    AppelCandidature, Demande, MembreCommission, StatutDemande, VoteCommission, Commission,
)


def creer_utilisateur(username, role, **extra):
    return Utilisateur.objects.create_user(
        username=username, email=f"{username}@vcn.sn", password="Passe1234!",
        role=role, nom_complet=username.title(), **extra
    )


class Phase3TestCase(APITestCase):
    def setUp(self):
        self.usager = creer_utilisateur("usager3", RoleUtilisateur.USAGER)
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="770000000")
        self.com = creer_utilisateur("comcell", RoleUtilisateur.CELLULE_COMMUNICATION)
        self.agent = creer_utilisateur("agentdcuve3", RoleUtilisateur.AGENT_DCUVE)
        self.membre_user = creer_utilisateur("membrecom", RoleUtilisateur.AGENT_DCUVE)
        self.commission = Commission.objects.create(nom="Commission d'évaluation", active=True)
        self.membre = MembreCommission.objects.create(utilisateur=self.membre_user, commission=self.commission)
        self.local = Local.objects.create(
            reference="LOC-P3", localisation="Zone A", type_local="RESTAURATION",
            surface_m2=20,
        )

    # ── Communication : publication d'un appel ────────────────────────────
    def test_cellule_communication_publie_un_appel(self):
        self.client.force_authenticate(self.com)
        reponse = self.client.post('/api/demandes/appels/', {
            "titre": "Appel restauration 2026",
            "description": "Exploitation d'un point de restauration.",
            "date_lancement": timezone.now().isoformat(),
            "date_cloture": (timezone.now() + timedelta(days=20)).isoformat(),
            "local": str(self.local.id),
        }, format='json')
        self.assertEqual(reponse.status_code, 201, reponse.data)
        self.assertTrue(reponse.data['est_ouvert'])

    def test_usager_ne_peut_pas_publier_un_appel(self):
        self.client.force_authenticate(self.usager)
        reponse = self.client.post('/api/demandes/appels/', {
            "titre": "Faux appel", "description": "x",
            "date_lancement": timezone.now().isoformat(),
            "date_cloture": (timezone.now() + timedelta(days=5)).isoformat(),
            "local": str(self.local.id),
        }, format='json')
        self.assertEqual(reponse.status_code, 403)

    def test_appels_ouverts_visibles_par_usager(self):
        AppelCandidature.objects.create(
            titre="Ouvert", description="d", local=self.local,
            date_lancement=timezone.now() - timedelta(days=1),
            date_cloture=timezone.now() + timedelta(days=10),
        )
        AppelCandidature.objects.create(
            titre="Ferme", description="d", local=self.local, est_actif=False,
            date_lancement=timezone.now() - timedelta(days=30),
            date_cloture=timezone.now() - timedelta(days=1),
        )
        self.client.force_authenticate(self.usager)
        reponse = self.client.get('/api/demandes/appels/ouverts/')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual([a['titre'] for a in reponse.data], ["Ouvert"])

    # ── Usager : chronologie du dossier ───────────────────────────────────
    def test_chronologie_expose_etapes_et_evenements(self):
        self.client.force_authenticate(self.usager)
        creation = self.client.post('/api/demandes/demandes/', {
            "type_demande": "VENTE_PRODUIT", "local": str(self.local.id),
            "description_projet": "Vente de fournitures scolaires sur le site VCN.",
        }, format='json')
        self.assertEqual(creation.status_code, 201, creation.data)
        demande_id = creation.data['id']

        self.client.force_authenticate(self.agent)
        self.client.post(f'/api/demandes/demandes/{demande_id}/changer_statut/', {
            "statut": StatutDemande.CONTROLE_RECEVABILITE, "commentaire": "Dossier recevable",
        }, format='json')

        self.client.force_authenticate(self.usager)
        reponse = self.client.get(f'/api/demandes/demandes/{demande_id}/chronologie/')
        self.assertEqual(reponse.status_code, 200)
        etapes = {e['statut']: e['etat'] for e in reponse.data['etapes']}
        self.assertEqual(etapes[StatutDemande.CONTROLE_RECEVABILITE], 'EN_COURS')
        self.assertEqual(etapes[StatutDemande.NOUVELLE], 'FRANCHIE')
        self.assertEqual(etapes[StatutDemande.FAVORABLE], 'A_VENIR')
        self.assertGreaterEqual(len(reponse.data['evenements']), 1)

    def test_demande_de_complement_notifie_l_usager(self):
        demande = Demande.objects.create(
            type_demande="VENTE_PRODUIT", demandeur=self.demandeur, local=self.local)
        self.client.force_authenticate(self.agent)
        reponse = self.client.post(f'/api/demandes/demandes/{demande.id}/changer_statut/', {
            "statut": "MITIGEE_COMPLEMENT",
            "commentaire": "Quitus fiscal manquant",
        }, format='json')
        self.assertEqual(reponse.status_code, 200, reponse.data)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, StatutDemande.MITIGEE_COMPLEMENT)
        self.assertTrue(self.usager.notifications.exists())

    # ── Commission consultative ───────────────────────────────────────────
    def test_vote_unique_par_membre_et_revision(self):
        demande = Demande.objects.create(
            type_demande="VENTE_PRODUIT", demandeur=self.demandeur, local=self.local)
        self.client.force_authenticate(self.membre_user)
        payload = {"demande": str(demande.id), "avis": "FAVORABLE",
                   "note_formelle": 4, "note_technique": 5, "commentaire": "OK"}
        premier = self.client.post('/api/demandes/votes/', payload, format='json')
        self.assertEqual(premier.status_code, 201, premier.data)

        payload["avis"] = "DEFAVORABLE"
        second = self.client.post('/api/demandes/votes/', payload, format='json')
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(VoteCommission.objects.filter(demande=demande).count(), 1)
        self.assertEqual(VoteCommission.objects.get(demande=demande).avis, "DEFAVORABLE")

    def test_non_membre_ne_peut_pas_voter(self):
        demande = Demande.objects.create(
            type_demande="VENTE_PRODUIT", demandeur=self.demandeur, local=self.local)
        self.client.force_authenticate(self.agent)
        reponse = self.client.post('/api/demandes/votes/', {
            "demande": str(demande.id), "avis": "FAVORABLE"}, format='json')
        self.assertEqual(reponse.status_code, 400)

    def test_synthese_des_votes(self):
        demande = Demande.objects.create(
            type_demande="VENTE_PRODUIT", demandeur=self.demandeur, local=self.local)
        VoteCommission.objects.create(demande=demande, membre=self.membre, avis="FAVORABLE",
                                      note_formelle=4, note_technique=4)
        self.client.force_authenticate(self.membre_user)
        reponse = self.client.get(f'/api/demandes/demandes/{demande.id}/synthese-votes/')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data['favorables'], 1)
        self.assertEqual(reponse.data['sens_majoritaire'], 'FAVORABLE')
        self.assertEqual(reponse.data['note_moyenne'], 4.0)
        self.assertTrue(reponse.data['quorum_atteint'])

    # ── Fidelite ──────────────────────────────────────────────────────────
    def test_score_fidelite_credite_a_la_decision_favorable(self):
        demande = Demande.objects.create(
            type_demande="VENTE_PRODUIT", demandeur=self.demandeur, local=self.local)
        score_initial = self.demandeur.score_fidelite
        demande.statut = StatutDemande.FAVORABLE
        demande.save()
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, score_initial + 15.0)

        # Idempotence : un nouvel enregistrement ne re-credite pas.
        demande.save()
        self.demandeur.refresh_from_db()
        self.assertEqual(self.demandeur.score_fidelite, score_initial + 15.0)

    def test_mon_score_expose_palier_et_historique(self):
        self.client.force_authenticate(self.usager)
        reponse = self.client.get('/api/fidelite/mon-score/')
        self.assertEqual(reponse.status_code, 200)
        self.assertIn('palier', reponse.data)
        self.assertIn('niveau', reponse.data['palier'])
