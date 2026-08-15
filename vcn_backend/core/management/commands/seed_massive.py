"""Générateur massif de données pour SyLOC-T.

Usage :
    python manage.py seed_massive

Cette commande utilise la librairie Faker pour générer ~50 enregistrements
pour chaque modèle principal de l'application sans effacer les données existantes.
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from comptes.models import Demandeur, RoleUtilisateur, Utilisateur
from contrats.models import Contrat
from core.models import Annonce
from demandes.models import Demande, Dossier, StatutDemande, TypeDemande
from paiements.models import Echeance, StatutEcheance, TransactionLog
from patrimoine.models import EtatLocal, Gestionnaire, Local, TypeLocal
from terrain.models import Plainte, InspectionQHse, OrdreMission, TypeIntervention, StatutPlainte, NiveauUrgence, TypeControleQHSE

try:
    from faker import Faker
except ImportError:
    raise ImportError("Veuillez installer Faker : pip install Faker")

class Command(BaseCommand):
    help = "Charge un volume massif de données de démonstration via Faker."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Génération de données massives (50+ par modèle)...")
        self.fake = Faker('fr_FR')
        
        self.admin = Utilisateur.objects.filter(is_superuser=True).first()
        if not self.admin:
            self.admin = Utilisateur.objects.create_superuser("admin_massive", "admin_m@crous-t.sn", "admin", nom_complet="Admin Massive")

        users = self._creer_utilisateurs_et_demandeurs(50)
        locaux = self._creer_locaux(50)
        demandeurs = [u for u in users if u.role == RoleUtilisateur.USAGER]
        
        self._creer_demandes(50, demandeurs, locaux)
        contrats = self._creer_contrats(30, demandeurs, locaux)
        self._creer_echeances_et_paiements(contrats)
        self._creer_terrain_donnees(50, locaux, users)
        self._creer_annonces(20)

        self.stdout.write(self.style.SUCCESS("\nGeneration massive terminee avec succes !"))

    def _creer_utilisateurs_et_demandeurs(self, count):
        self.stdout.write(f"Création de {count} Utilisateurs/Demandeurs...")
        users = []
        roles = [
            RoleUtilisateur.USAGER, RoleUtilisateur.USAGER, RoleUtilisateur.USAGER,
            RoleUtilisateur.AGENT_DCUVE, RoleUtilisateur.AGENT_TERRAIN, RoleUtilisateur.AGENT_QHSE
        ]
        
        for _ in range(count):
            nom_complet = self.fake.name()
            username = self.fake.user_name() + str(random.randint(1000, 9999))
            role = random.choice(roles)
            
            user = Utilisateur.objects.create_user(
                username=username,
                email=f"{random.randint(1000, 99999)}_{self.fake.email()}",
                password="password123",
                role=role,
                nom_complet=nom_complet
            )
            users.append(user)

            if role == RoleUtilisateur.USAGER:
                Demandeur.objects.create(
                    utilisateur=user,
                    matricule_etudiant=f"INE{random.randint(100000, 999999)}" if random.random() > 0.3 else "",
                    est_etudiant=random.random() > 0.3,
                    contact=self.fake.phone_number(),
                )
        return users

    def _creer_locaux(self, count):
        self.stdout.write(f"Création de {count} Locaux...")
        locaux = []
        types_locaux = [t[0] for t in TypeLocal.choices]
        etats_locaux = [e[0] for e in EtatLocal.choices]

        for i in range(count):
            lat = 14.7915 + random.uniform(-0.005, 0.005)
            lng = -16.9258 + random.uniform(-0.005, 0.005)
            
            local = Local.objects.create(
                reference=f"LOC-MASSIVE-{random.randint(1000, 9999)}-{i}",
                localisation=self.fake.address(),
                type_local=random.choice(types_locaux),
                surface_m2=random.uniform(9.0, 50.0),
                capacite_accueil=random.randint(2, 30),
                etat_physique=random.choice(etats_locaux),
                gestionnaire=Gestionnaire.CROUS_T,
                latitude=lat,
                longitude=lng,
                est_libre=random.choice([True, False])
            )
            locaux.append(local)
        return locaux

    def _creer_demandes(self, count, demandeurs, locaux):
        if not demandeurs or not locaux: return
        self.stdout.write(f"Création de {count} Demandes...")
        types_demandes = [t[0] for t in TypeDemande.choices]
        statuts_demandes = [s[0] for s in StatutDemande.choices]

        for _ in range(count):
            demande = Demande.objects.create(
                demandeur=Demandeur.objects.filter(utilisateur=random.choice(demandeurs)).first(),
                type_demande=random.choice(types_demandes),
                statut=random.choice(statuts_demandes),
                local=random.choice(locaux),
                description_projet=self.fake.text(max_nb_chars=200),
            )
            demande.created_at = self.fake.date_time_between(start_date='-6M', end_date='now', tzinfo=timezone.get_current_timezone())
            demande.save()

    def _creer_contrats(self, count, demandeurs, locaux):
        if not demandeurs or not locaux: return []
        self.stdout.write(f"Création de {count} Contrats...")
        contrats = []
        for _ in range(count):
            demandeur = Demandeur.objects.filter(utilisateur=random.choice(demandeurs)).first()
            if not demandeur: continue
            local = random.choice(locaux)
            date_debut = self.fake.date_between(start_date='-1y', end_date='today')
            
            contrat = Contrat.objects.create(
                local=local,
                demandeur=demandeur,
                signataire_crous_t=self.admin,
                date_debut=date_debut,
                duree_mois=random.choice([12, 24, 36]),
                redevance_mensuelle=random.choice([25000, 50000, 75000, 100000]),
                montant_caution=random.choice([50000, 100000, 150000]),
                est_actif=random.choice([True, False])
            )
            local.est_libre = not contrat.est_actif
            local.save(update_fields=["est_libre"])
            contrats.append(contrat)
        return contrats

    def _creer_echeances_et_paiements(self, contrats):
        self.stdout.write("Création des Echéances et Paiements...")
        for contrat in contrats:
            nb_echeances = random.randint(1, 12)
            for m in range(nb_echeances):
                exigibilite = contrat.date_debut + timedelta(days=30 * m)
                statut = random.choice([s[0] for s in StatutEcheance.choices])
                echeance = Echeance.objects.create(
                    contrat=contrat,
                    date_exigibilite=exigibilite,
                    montant_du=contrat.redevance_mensuelle,
                    statut=statut,
                )
                
                if statut == StatutEcheance.PAYEE or statut == StatutEcheance.EN_RETARD:
                    montant_paye = echeance.montant_du if statut == StatutEcheance.PAYEE else echeance.montant_du / 2
                    from paiements.models import Paiement
                    paiement = Paiement.objects.create(
                        echeance=echeance,
                        montant_regle=montant_paye,
                        mode=random.choice(["MOBILE_MONEY", "ESPECES"]),
                        reference_transaction=f"TXN-{random.randint(100000, 999999)}"
                    )
                    echeance.actualiser_statut(appliquer_penalite=False)
                    
                    TransactionLog.objects.create(
                        paiement=paiement,
                        provider=random.choice(["WAVE", "ORANGE_MONEY"]),
                        provider_transaction_id=paiement.reference_transaction,
                        payload_brut="{}",
                        statut_api="SUCCESS"
                    )

    def _creer_terrain_donnees(self, count, locaux, users):
        self.stdout.write(f"Création de données Terrain (Plaintes, Inspections, Missions)...")
        plaintes = []
        for _ in range(count // 2):
            plainte = Plainte.objects.create(
                local=random.choice(locaux),
                plaignant=random.choice(users),
                type=random.choice(["TECHNIQUE", "NON_CONFORMITE_QHSE", "ENVIRONNEMENT"]),
                urgence=random.choice([c[0] for c in NiveauUrgence.choices]),
                description=self.fake.text(max_nb_chars=150),
                statut=random.choice([s[0] for s in StatutPlainte.choices]),
            )
            plaintes.append(plainte)

        for plainte in plaintes:
            if random.random() > 0.5:
                OrdreMission.objects.create(
                    plainte_source=plainte,
                    objet=f"Intervention sur plainte",
                    type_controle=random.choice([t[0] for t in TypeControleQHSE.choices]),
                    date_mission=self.fake.date_time_between(start_date='-1M', end_date='+1M', tzinfo=timezone.get_current_timezone()),
                    statut="EMIS" if random.random() > 0.5 else "EXECUTE",
                    agent_assigne=random.choice(users),
                    emetteur=self.admin,
                    local=plainte.local
                )

        for _ in range(count // 2):
            InspectionQHse.objects.create(
                local=random.choice(locaux),
                inspecteur=random.choice(users),
                type_controle=random.choice([t[0] for t in TypeControleQHSE.choices]),
                date_visite=self.fake.date_time_between(start_date='-1y', end_date='now', tzinfo=timezone.get_current_timezone()),
                note_sanitaire=random.randint(1, 5),
                observations=self.fake.text(max_nb_chars=150),
                est_conforme=random.choice([True, False])
            )

    def _creer_annonces(self, count):
        self.stdout.write(f"Création de {count} Annonces...")
        for _ in range(count):
            Annonce.objects.create(
                titre=self.fake.sentence(),
                contenu=self.fake.text(max_nb_chars=500),
                pin=random.choice(["pin-navy", "pin-gold", "pin-green", "pin-red", "pin-slate", "pin-purple", ""]),
                est_active=random.choice([True, False])
            )
