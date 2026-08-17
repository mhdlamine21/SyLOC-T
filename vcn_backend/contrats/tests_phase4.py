"""Tests Phase 4 - Service Juridique : redaction, cycle de vie, quitus general."""

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from comptes.models import Demandeur, RoleUtilisateur, Utilisateur
from contrats.models import Contrat, ModeleContrat, StatutContrat, TypeContrat
from contrats.services import rendre_contrat
from patrimoine.models import Local, TypeLocal


class BaseJuridique(APITestCase):
    def setUp(self):
        self.juriste = Utilisateur.objects.create_user(
            username='juriste', email='juriste@test.com', password='pwd',
            role=RoleUtilisateur.SERVICE_JURIDIQUE,
        )
        self.directeur = Utilisateur.objects.create_user(
            username='dir', email='dir@test.com', password='pwd',
            role=RoleUtilisateur.DIRECTEUR_CROUS_T,
        )
        self.usager = Utilisateur.objects.create_user(
            username='occupant', email='occ@test.com', password='pwd',
            role=RoleUtilisateur.USAGER, nom_complet='Awa Diop',
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact='770000000')
        self.local = Local.objects.create(
            reference='LOC-J1', localisation='Campus VCN', type_local=TypeLocal.PAPETERIE,
            surface_m2=18.0,
        )
        self.modele = ModeleContrat.objects.filter(
            type_contrat=TypeContrat.BAIL_COMMERCIAL
        ).first()

    def creer_contrat(self, **kwargs):
        params = dict(
            local=self.local,
            demandeur=self.demandeur,
            signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(),
            duree_mois=24,
        )
        params.update(kwargs)
        return Contrat.objects.create(**params)


class ModeleContratTest(BaseJuridique):
    def test_modeles_par_defaut_charges_par_migration(self):
        """La bibliotheque juridique est amorcee par la migration Phase 4."""
        self.assertGreaterEqual(ModeleContrat.objects.count(), 3)
        self.assertIsNotNone(self.modele)

    def test_rendu_substitue_les_variables(self):
        contrat = self.creer_contrat()
        texte = rendre_contrat(contrat, self.modele)
        self.assertNotIn('{{', texte)
        self.assertIn(self.local.reference, texte)
        self.assertIn('Awa', texte)

    def test_apercu_expose_les_variables_disponibles(self):
        contrat = self.creer_contrat()
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.get(f'/api/contrats/{contrat.id}/apercu/?modele={self.modele.id}')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertIn('texte', reponse.data)
        self.assertNotIn('{{', reponse.data['texte'])


class CycleDeVieContratTest(BaseJuridique):
    def test_reference_generee_automatiquement(self):
        contrat = self.creer_contrat()
        annee = timezone.now().year
        self.assertTrue(contrat.reference.startswith(f'CT-{annee}-'))

    def test_contrat_cree_est_un_brouillon(self):
        contrat = self.creer_contrat()
        self.assertEqual(contrat.statut, StatutContrat.BROUILLON)

    def test_rediger_puis_activer(self):
        contrat = self.creer_contrat()
        self.client.force_authenticate(user=self.juriste)

        reponse = self.client.post(
            f'/api/contrats/{contrat.id}/rediger/',
            {'modele': str(self.modele.id), 'clauses_particulieres': 'Fermeture le dimanche.'},
            format='json',
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        contrat.refresh_from_db()
        self.assertTrue(contrat.texte_contrat)
        self.assertEqual(contrat.statut, StatutContrat.EN_ATTENTE_SIGNATURE)

        reponse = self.client.post(f'/api/contrats/{contrat.id}/activer/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        contrat.refresh_from_db()
        self.assertEqual(contrat.statut, StatutContrat.ACTIF)
        self.assertTrue(contrat.est_actif)
        # L'activation doit avoir genere l'echeancier.
        self.assertGreater(contrat.echeances.count(), 0)

    def test_activation_genere_le_texte_si_absent(self):
        """Un acte active sans redaction prealable est rendu depuis le modele
        par defaut : on ne signe jamais un contrat sans corps."""
        contrat = self.creer_contrat()
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.post(f'/api/contrats/{contrat.id}/activer/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        contrat.refresh_from_db()
        self.assertTrue(contrat.texte_contrat)
        self.assertEqual(contrat.statut, StatutContrat.ACTIF)

    def test_resiliation(self):
        contrat = self.creer_contrat(texte_contrat='Corps du bail', statut=StatutContrat.ACTIF)
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.post(
            f'/api/contrats/{contrat.id}/resilier/',
            {'motif': 'Impayes repetes'}, format='json',
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        contrat.refresh_from_db()
        self.assertEqual(contrat.statut, StatutContrat.RESILIE)
        self.assertFalse(contrat.est_actif)
        self.assertEqual(contrat.motif_resiliation, 'Impayes repetes')

    def test_resiliation_exige_un_motif(self):
        contrat = self.creer_contrat(statut=StatutContrat.ACTIF)
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.post(f'/api/contrats/{contrat.id}/resilier/', {}, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_occupant_ne_peut_pas_resilier(self):
        contrat = self.creer_contrat(statut=StatutContrat.ACTIF)
        self.client.force_authenticate(user=self.usager)
        reponse = self.client.post(
            f'/api/contrats/{contrat.id}/resilier/', {'motif': 'Je pars'}, format='json'
        )
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)


class QuitusEtStatistiquesTest(BaseJuridique):
    def test_quitus_general_liste_les_impayes(self):
        contrat = self.creer_contrat(texte_contrat='Corps', statut=StatutContrat.ACTIF)
        contrat.activer()
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.get(f'/api/contrats/{contrat.id}/quitus_general/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertGreater(reponse.data['solde_restant'], 0)
        self.assertFalse(reponse.data['quitte'])
        self.assertTrue(reponse.data['reference'].startswith('QG-'))

    def test_statistiques_juridiques(self):
        self.creer_contrat()
        self.creer_contrat(statut=StatutContrat.ACTIF, texte_contrat='x')
        self.client.force_authenticate(user=self.juriste)
        reponse = self.client.get('/api/contrats/statistiques/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['total'], 2)
        self.assertEqual(reponse.data['par_statut'][StatutContrat.BROUILLON], 1)

    def test_occupant_ne_voit_que_son_contrat(self):
        mien = self.creer_contrat()
        autre_usager = Utilisateur.objects.create_user(
            username='autre', email='a@test.com', password='pwd', role=RoleUtilisateur.USAGER
        )
        autre_demandeur = Demandeur.objects.create(utilisateur=autre_usager, contact='771111111')
        autre_local = Local.objects.create(
            reference='LOC-J2', localisation='Campus', type_local=TypeLocal.PAPETERIE, surface_m2=10.0
        )
        self.creer_contrat(demandeur=autre_demandeur, local=autre_local)

        self.client.force_authenticate(user=self.usager)
        reponse = self.client.get('/api/contrats/')
        resultats = reponse.data['results'] if isinstance(reponse.data, dict) else reponse.data
        self.assertEqual(len(resultats), 1)
        self.assertEqual(resultats[0]['id'], str(mien.id))
