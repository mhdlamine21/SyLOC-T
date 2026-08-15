"""Tests Phase 4 — Service Comptable (caisse, echeances, reglements, recus)
et espace Occupant (cloisonnement des donnees)."""

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from comptes.models import Demandeur, RoleUtilisateur, Utilisateur
from contrats.models import Contrat
from patrimoine.models import Local, TypeLocal
from paiements.models import ModePaiement, Paiement, StatutEcheance


class BaseCaisse(APITestCase):
    def setUp(self):
        self.comptable = Utilisateur.objects.create_user(
            username='comptable', email='cpt@test.com', password='pwd',
            role=RoleUtilisateur.SERVICE_COMPTABLE,
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
            reference='LOC-C1', localisation='Campus VCN',
            type_local=TypeLocal.PAPETERIE, surface_m2=20.0,
        )
        self.contrat = Contrat.objects.create(
            local=self.local, demandeur=self.demandeur, signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(), duree_mois=12,
        )
        self.echeance = self.contrat.echeances.order_by('date_exigibilite').first()


class ReglementEtQuitusTest(BaseCaisse):
    def test_reglement_renvoie_le_quitus_pret_a_imprimer(self):
        self.client.force_authenticate(user=self.comptable)
        reponse = self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': self.echeance.montant_du,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        quitus = reponse.data['quitus']
        # Donnees indispensables au ticket de caisse et a la facture A4.
        for cle in ('reference_quitus', 'occupant_nom', 'local_reference',
                    'montant_regle', 'organisme', 'mode_libelle'):
            self.assertIn(cle, quitus)
        self.assertTrue(quitus['reference_quitus'])
        self.assertEqual(quitus['occupant_nom'], 'Awa Diop')

    def test_echeance_soldee_passe_a_payee(self):
        self.client.force_authenticate(user=self.comptable)
        self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': self.echeance.montant_du,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')
        self.echeance.refresh_from_db()
        self.assertEqual(self.echeance.statut, StatutEcheance.PAYEE)
        self.assertEqual(self.echeance.reste_a_payer, 0)

    def test_reglement_partiel_laisse_le_reste_du(self):
        self.client.force_authenticate(user=self.comptable)
        self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': 10000.0,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')
        self.echeance.refresh_from_db()
        self.assertNotEqual(self.echeance.statut, StatutEcheance.PAYEE)
        self.assertEqual(self.echeance.montant_paye, 10000.0)
        self.assertGreater(self.echeance.reste_a_payer, 0)

    def test_montant_negatif_refuse(self):
        self.client.force_authenticate(user=self.comptable)
        reponse = self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': -500,
            'mode': ModePaiement.ESPECES,
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reedition_du_quitus(self):
        paiement = Paiement.objects.create(
            echeance=self.echeance, montant_regle=5000.0, mode=ModePaiement.ESPECES
        )
        paiement.valider_paiement()
        self.client.force_authenticate(user=self.comptable)
        reponse = self.client.get(f'/api/paiements/{paiement.id}/quitus/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['reference_quitus'], paiement.reference_quitus)


class EcheancierTest(BaseCaisse):
    def test_actualiser_met_en_retard_et_applique_la_penalite(self):
        self.echeance.date_exigibilite = timezone.now().date() - timedelta(days=45)
        self.echeance.save()
        self.client.force_authenticate(user=self.comptable)
        reponse = self.client.post('/api/paiements/echeances/actualiser/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.echeance.refresh_from_db()
        self.assertEqual(self.echeance.statut, StatutEcheance.EN_RETARD)
        self.assertGreater(self.echeance.montant_penalite, 0)

    def test_actualiser_reserve_au_service_comptable(self):
        self.client.force_authenticate(user=self.usager)
        reponse = self.client.post('/api/paiements/echeances/actualiser/')
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)

    def test_echeances_a_venir(self):
        self.client.force_authenticate(user=self.comptable)
        reponse = self.client.get('/api/paiements/echeances/a_venir/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertIsInstance(reponse.data, list)


class CaisseConsolideeTest(BaseCaisse):
    def test_caisse_consolidee(self):
        self.client.force_authenticate(user=self.comptable)
        self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': self.echeance.montant_du,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')

        reponse = self.client.get('/api/paiements/caisse/')
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        donnees = reponse.data
        self.assertEqual(donnees['caisse_du_jour']['nb'], 1)
        self.assertEqual(donnees['caisse_du_jour']['total'], self.echeance.montant_du)
        self.assertGreater(donnees['total_attendu'], 0)
        self.assertEqual(len(donnees['journal_14j']), 14)
        self.assertEqual(donnees['nb_recus_emis'], 1)
        self.assertGreater(donnees['taux_recouvrement'], 0)

    def test_caisse_interdite_a_loccupant(self):
        self.client.force_authenticate(user=self.usager)
        reponse = self.client.get('/api/paiements/caisse/')
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)

    def test_registre_des_recus_filtre_par_periode(self):
        self.client.force_authenticate(user=self.comptable)
        self.client.post('/api/paiements/regler/', {
            'echeance_id': str(self.echeance.id),
            'montant_regle': 1000.0,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')
        aujourdhui = timezone.now().date().isoformat()
        reponse = self.client.get(
            f'/api/paiements/recus/?debut={aujourdhui}&fin={aujourdhui}&mode={ModePaiement.MOBILE_MONEY}'
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data['nb'], 1)
        self.assertEqual(reponse.data['total'], 1000.0)


class CloisonnementOccupantTest(BaseCaisse):
    """L'occupant ne doit acceder qu'a son propre echeancier et a ses recus."""

    def setUp(self):
        super().setUp()
        autre = Utilisateur.objects.create_user(
            username='autre', email='autre@test.com', password='pwd',
            role=RoleUtilisateur.USAGER, nom_complet='Moussa Fall',
        )
        autre_demandeur = Demandeur.objects.create(utilisateur=autre, contact='771111111')
        autre_local = Local.objects.create(
            reference='LOC-C2', localisation='Campus', type_local=TypeLocal.PAPETERIE,
            surface_m2=12.0,
        )
        self.autre_contrat = Contrat.objects.create(
            local=autre_local, demandeur=autre_demandeur, signataire_crous_t=self.directeur,
            date_debut=timezone.now().date(), duree_mois=12,
        )

    def _liste(self, reponse):
        return reponse.data['results'] if isinstance(reponse.data, dict) else reponse.data

    def test_occupant_ne_voit_que_ses_echeances(self):
        self.client.force_authenticate(user=self.usager)
        resultats = self._liste(self.client.get('/api/paiements/echeances/'))
        self.assertTrue(len(resultats) > 0)
        contrats_vus = {str(e['contrat']) for e in resultats}
        self.assertEqual(contrats_vus, {str(self.contrat.id)})

    def test_comptable_voit_tous_les_contrats(self):
        self.client.force_authenticate(user=self.comptable)
        resultats = self._liste(self.client.get('/api/paiements/echeances/'))
        contrats_vus = {str(e['contrat']) for e in resultats}
        self.assertIn(str(self.autre_contrat.id), contrats_vus)

    def test_occupant_ne_peut_pas_regler_une_echeance_dautrui(self):
        echeance_autrui = self.autre_contrat.echeances.first()
        self.client.force_authenticate(user=self.usager)
        reponse = self.client.post('/api/paiements/regler/', {
            'echeance_id': str(echeance_autrui.id),
            'montant_regle': 1000.0,
            'mode': ModePaiement.MOBILE_MONEY,
        }, format='json')
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)

    def test_occupant_ne_voit_que_ses_paiements(self):
        Paiement.objects.create(
            echeance=self.autre_contrat.echeances.first(), montant_regle=500.0,
            mode=ModePaiement.ESPECES,
        )
        self.client.force_authenticate(user=self.usager)
        resultats = self._liste(self.client.get('/api/paiements/'))
        self.assertEqual(len(resultats), 0)
