from rest_framework.test import APITestCase
from rest_framework import status
from comptes.models import Utilisateur, RoleUtilisateur, Demandeur
from patrimoine.models import Local, TypeLocal
from .models import Demande, TypeDemande, StatutDemande, HistoriqueStatutDemande

class DemandesTests(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin", email="admin@test.com", password="pwd", role=RoleUtilisateur.DIRECTEUR_CROUS_T, is_staff=True
        )
        self.usager = Utilisateur.objects.create_user(
            username="usager", email="usager@test.com", password="pwd", role=RoleUtilisateur.USAGER
        )
        self.demandeur = Demandeur.objects.create(utilisateur=self.usager, contact="123")
        self.local = Local.objects.create(reference="LOC1", type_local=TypeLocal.RESTAURATION, surface_m2=20.0)

    def test_creation_demande_genere_dossier(self):
        self.client.force_authenticate(user=self.usager)
        url = '/api/demandes/demandes/'
        data = {
            "type_demande": TypeDemande.PRESTATION_SERVICE,
            "local": self.local.id
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        demande = Demande.objects.get(id=response.data['id'])
        # Vérifier que le signal a bien créé le dossier
        self.assertTrue(hasattr(demande, 'dossier'))
        self.assertIsNotNone(demande.dossier)

    def test_changement_statut_genere_historique(self):
        demande = Demande.objects.create(
            demandeur=self.demandeur, type_demande=TypeDemande.PRESTATION_SERVICE, local=self.local
        )
        
        self.client.force_authenticate(user=self.admin)
        url = f'/api/demandes/demandes/{demande.id}/changer_statut/'
        data = {
            "statut": StatutDemande.MITIGEE_COMPLEMENT,
            "commentaire": "Il manque une pièce."
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statut'], StatutDemande.MITIGEE_COMPLEMENT)
        
        # Vérifier que l'historique a été créé
        historique = HistoriqueStatutDemande.objects.filter(demande=demande).first()
        self.assertIsNotNone(historique)
        self.assertEqual(historique.nouveau_statut, StatutDemande.MITIGEE_COMPLEMENT)
        self.assertEqual(historique.commentaire_acteur, "Il manque une pièce.")

    def test_analyse_equidistance(self):
        # On définit les coordonnées de self.local
        self.local.latitude = 48.8566
        self.local.longitude = 2.3522
        self.local.save()
        
        # Local 2 très proche (environ 50 mètres) - on le marque comme non libre pour déclencher l'alerte
        Local.objects.create(
            reference="LOC_PROCHE", type_local=TypeLocal.RESTAURATION, surface_m2=20.0,
            latitude=48.8566, longitude=2.3529, est_libre=False
        )
        
        # Local 3 lointain (plusieurs km) - on le marque comme non libre
        Local.objects.create(
            reference="LOC_LOIN", type_local=TypeLocal.RESTAURATION, surface_m2=20.0,
            latitude=48.8600, longitude=2.4000, est_libre=False
        )
        
        demande = Demande.objects.create(
            demandeur=self.demandeur, type_demande=TypeDemande.PRESTATION_SERVICE, local=self.local
        )
        
        self.client.force_authenticate(user=self.admin)
        url = f'/api/demandes/demandes/{demande.id}/analyse_equidistance/'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # On s'attend à ce qu'il y ait une alerte (1 conflit avec LOC_PROCHE)
        self.assertTrue(response.data['alerte'])
        self.assertEqual(len(response.data['conflits']), 1)
        self.assertEqual(response.data['conflits'][0]['reference'], "LOC_PROCHE")

    def test_blind_review_anonymisation(self):
        demande = Demande.objects.create(
            demandeur=self.demandeur, type_demande=TypeDemande.PRESTATION_SERVICE, local=self.local
        )
        # S'assurer que le numéro de dossier est bien généré
        self.assertTrue(demande.reference_anonyme.startswith("DOSSIER-"))
        
        # Test 1 : L'usager propriétaire voit son identité
        self.client.force_authenticate(user=self.usager)
        r_usager = self.client.get(f'/api/demandes/demandes/{demande.id}/')
        self.assertIn('demandeur', r_usager.data)
        
        # Test 2 : Le directeur/commission voit le dossier anonymisé par défaut
        self.client.force_authenticate(user=self.admin)
        r_admin = self.client.get(f'/api/demandes/demandes/{demande.id}/')
        self.assertNotIn('demandeur', r_admin.data) # Identité masquée !
        self.assertIn('reference_anonyme', r_admin.data) # On ne voit que ça
        
        # Test 3 : Une fois le statut passé à FAVORABLE, l'identité est révélée au directeur
        demande.statut = StatutDemande.FAVORABLE
        demande.save()
        r_admin_revele = self.client.get(f'/api/demandes/demandes/{demande.id}/')
        self.assertIn('demandeur', r_admin_revele.data) # Déverrouillé !


