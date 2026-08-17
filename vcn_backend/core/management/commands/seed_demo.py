"""Jeu de donnees de demonstration complet pour SyLOC-T.

Usage :
    python manage.py seed_demo

Idempotent : la commande peut etre relancee sans creer de doublons.
Elle cree un compte par role metier, le patrimoine (avec coordonnees GPS
reelles du campus de Thies), un contrat actif, son echeancier, quelques
demandes a differents stades du workflow et des annonces de vitrine.
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from comptes.models import Demandeur, RoleUtilisateur, Utilisateur, StatutVerificationEtudiant
from contrats.models import Contrat
from core.models import Annonce
from demandes.models import Demande, Dossier, StatutDemande, TypeDemande
from paiements.models import Echeance, StatutEcheance
from patrimoine.models import EtatLocal, Gestionnaire, Local, TypeLocal

# username, mot de passe, role, nom complet
COMPTES = [
    ("etudiant", "etudiant", RoleUtilisateur.USAGER, "Awa Diop (etudiante)"),
    ("occupant", "occupant", RoleUtilisateur.USAGER, "Mamadou Lo (occupant titulaire)"),
    ("courrier", "courrier", RoleUtilisateur.BUREAU_COURRIER, "Bureau du Courrier"),
    ("agent_dcuve", "agent_dcuve", RoleUtilisateur.AGENT_DCUVE, "Agent DCUVE"),
    ("dcuve", "dcuve", RoleUtilisateur.DIRECTEUR_DCUVE, "Directeur DCUVE"),
    ("commission", "commission", RoleUtilisateur.DIRECTEUR_CROUS_T, "Directeur CROUS-T"),
    ("juridique", "juridique", RoleUtilisateur.SERVICE_JURIDIQUE, "Service Juridique"),
    ("comptable", "comptable", RoleUtilisateur.SERVICE_COMPTABLE, "Service Comptable"),
    ("technique", "technique", RoleUtilisateur.SERVICE_TECHNIQUE, "Service Technique"),
    ("terrain", "terrain", RoleUtilisateur.AGENT_TERRAIN, "Agent de Terrain"),
    ("agent_qhse", "agent_qhse", RoleUtilisateur.AGENT_QHSE, "Ibrahima Fall (Agent QHSE Terrain)"),
    ("qhse", "qhse", RoleUtilisateur.AGENT_QHSE, "Dr. Fatou Bintou Sow (Bureau Environnement)"),
    ("communication", "communication", RoleUtilisateur.CELLULE_COMMUNICATION, "Cellule Communication"),
    ("amicale", "amicale", RoleUtilisateur.AMICALE, "Amicale des etudiants"),
    ("admin_si", "admin_si", RoleUtilisateur.ADMINISTRATEUR_SI, "Administrateur SI"),
]

LOCAUX = [
    # (reference, localisation, type, surface_m2, gestionnaire, lat, lng, libre)
    # Seules deux boutiques du campus sont gerees par l'Amicale des etudiants.
    ("LOC-001", "Campus VCN - Cantine centrale (Bloc A)", TypeLocal.RESTAURATION, 25.0, Gestionnaire.CROUS_T, 14.7915, -16.9258, False),
    ("LOC-002", "Campus VCN - Kiosque multiservices (Bloc B)", TypeLocal.MULTISERVICES, 10.0, Gestionnaire.AMICALE, 14.7921, -16.9261, True),
    ("LOC-003", "Campus VCN - Espace commercial (Bloc C)", TypeLocal.ARTISANAT, 18.0, Gestionnaire.CROUS_T, 14.7918, -16.9248, True),
    ("LOC-004", "Campus VCN - Papeterie universitaire", TypeLocal.PAPETERIE, 12.0, Gestionnaire.AMICALE, 14.7905, -16.9259, True),
    ("LOC-005", "Campus VCN - Point de vente Bloc D", TypeLocal.AUTRE, 9.0, Gestionnaire.CROUS_T, 14.7908, -16.9251, True),
]

ANNONCES = [
    (
        "Appel a candidature - Kiosque multiservices (LOC-002)",
        "Le CROUS de Thies lance un appel a candidature pour l'exploitation du kiosque "
        "multiservices du Bloc B. Dossiers recevables jusqu'a la fin du mois au Bureau du Courrier.",
        "pin-gold",
    ),
    (
        "Rappel - Reglement des redevances domaniales",
        "Les occupants titulaires sont invites a regulariser leurs echeances au guichet "
        "de la caisse centrale ou par Mobile Money depuis leur espace SyLOC-T.",
        "pin-navy",
    ),
]


class Command(BaseCommand):
    help = "Charge un jeu de donnees de demonstration complet 100% Senegalais (idempotent)."

    def handle(self, *args, **options):
        from django.core.management import call_command
        call_command("seed_senegal_godmode")
        self.stdout.write("Comptes disponibles (identifiant / mot de passe) :")
        self.stdout.write("  admin / admin  (superuser Django)")
        for username, password, _role, nom in COMPTES:
            self.stdout.write(f"  {username} / {password}  - {nom}")

    # ------------------------------------------------------------------ #

    def _creer_superuser(self):
        admin = Utilisateur.objects.filter(username="admin").first()
        if not admin:
            admin = Utilisateur.objects.create_superuser(
                "admin", "admin@crous-t.sn", "admin", nom_complet="Admin SyLOC-T"
            )
            self.stdout.write("  + superuser admin")
        return admin

    def _creer_comptes(self):
        utilisateurs = {}
        for username, password, role, nom in COMPTES:
            user = Utilisateur.objects.filter(username=username).first()
            if not user:
                user = Utilisateur.objects.create_user(
                    username, f"{username}@crous-t.sn", password, role=role, nom_complet=nom
                )
                self.stdout.write(f"  + compte {username} ({role})")
            utilisateurs[username] = user

        # Profils demandeur : indispensables pour deposer un dossier et signer un contrat.
        Demandeur.objects.get_or_create(
            utilisateur=utilisateurs["etudiant"],
            defaults={
                "matricule_etudiant": "INE123456",
                "est_etudiant": True,
                "contact": "770000001",
            },
        )
        Demandeur.objects.get_or_create(
            utilisateur=utilisateurs["occupant"],
            defaults={"contact": "770000002"},
        )
        return utilisateurs

    def _creer_locaux(self):
        locaux = {}
        for ref, localisation, type_local, surface, gestionnaire, lat, lng, libre in LOCAUX:
            local, cree = Local.objects.get_or_create(
                reference=ref,
                defaults={
                    "localisation": localisation,
                    "type_local": type_local,
                    "surface_m2": surface,
                    "etat_physique": EtatLocal.BON_ETAT,
                    "gestionnaire": gestionnaire,
                    "latitude": lat,
                    "longitude": lng,
                    "est_libre": libre,
                },
            )
            # Les coordonnees GPS alimentent la carte interactive : on les
            # complete meme sur un local deja present en base.
            if local.latitude is None or local.longitude is None:
                local.latitude, local.longitude = lat, lng
                local.save(update_fields=["latitude", "longitude"])
            if cree:
                self.stdout.write(f"  + local {ref}")
            locaux[ref] = local
        return locaux

    def _creer_contrat(self, occupant_user, local, admin):
        demandeur = Demandeur.objects.get(utilisateur=occupant_user)
        contrat = Contrat.objects.filter(demandeur=demandeur, est_actif=True).first()
        if not contrat:
            contrat = Contrat.objects.create(
                local=local,
                demandeur=demandeur,
                signataire_crous_t=admin,
                date_debut=timezone.now().date().replace(day=1),
                redevance_mensuelle=50000,
                montant_caution=100000,
            )
            local.est_libre = False
            local.save(update_fields=["est_libre"])
            self.stdout.write("  + contrat actif sur LOC-001")
        return contrat

    def _creer_echeancier(self, contrat):
        """Trois echeances : une deja payee, une exigible, une a venir."""
        if contrat.echeances.exists():
            return
        aujourdhui = timezone.now().date()
        plan = [
            (aujourdhui - timedelta(days=60), StatutEcheance.PAYEE),
            (aujourdhui - timedelta(days=5), StatutEcheance.EXIGIBLE),
            (aujourdhui + timedelta(days=25), StatutEcheance.NON_ECHUE),
        ]
        for date_exigibilite, statut in plan:
            Echeance.objects.create(
                contrat=contrat,
                date_exigibilite=date_exigibilite,
                montant_du=contrat.redevance_mensuelle,
                statut=statut,
            )
        self.stdout.write("  + echeancier (3 echeances)")

    def _creer_demandes(self, etudiant_user, locaux):
        if Demande.objects.exists():
            return
        demandeur = Demandeur.objects.get(utilisateur=etudiant_user)
        plan = [
            (TypeDemande.VENTE_ALIMENTAIRE, StatutDemande.NOUVELLE, locaux["LOC-002"]),
            (TypeDemande.PRESTATION_SERVICE, StatutDemande.CONTROLE_RECEVABILITE, locaux["LOC-003"]),
            (TypeDemande.LOCAL_ARTISANAL, StatutDemande.EN_ATTENTE_DECISION, locaux["LOC-004"]),
        ]
        for type_demande, statut, local in plan:
            demande = Demande.objects.create(
                demandeur=demandeur,
                type_demande=type_demande,
                statut=statut,
                local=local,
                description_projet="Dossier de demonstration charge par seed_demo.",
            )
            Dossier.objects.get_or_create(demande=demande)
        self.stdout.write("  + 3 demandes de demonstration")

    def _creer_annonces(self):
        for titre, contenu, pin in ANNONCES:
            _, cree = Annonce.objects.get_or_create(
                titre=titre, defaults={"contenu": contenu, "pin": pin, "est_active": True}
            )
            if cree:
                self.stdout.write(f"  + annonce « {titre[:40]}… »")

    def _creer_cartes_etudiantes(self, utilisateurs):
        etudiant_user = utilisateurs.get("etudiant")
        if etudiant_user:
            demandeur = Demandeur.objects.get(utilisateur=etudiant_user)
            demandeur.est_etudiant = True
            demandeur.matricule_etudiant = "ETU-2026-0842"
            demandeur.statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
            demandeur.carte_etudiant_date_soumission = timezone.now() - timedelta(days=2)
            demandeur.contact = "+221 77 123 45 67"
            demandeur.save()

        demandeurs = list(Demandeur.objects.exclude(utilisateur=etudiant_user))
        if len(demandeurs) >= 4:
            # 1 & 2 : En attente
            demandeurs[0].est_etudiant = True
            demandeurs[0].matricule_etudiant = "ETU-2026-1190"
            demandeurs[0].statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
            demandeurs[0].carte_etudiant_date_soumission = timezone.now() - timedelta(days=1)
            demandeurs[0].save()

            demandeurs[1].est_etudiant = True
            demandeurs[1].matricule_etudiant = "ETU-2026-3341"
            demandeurs[1].statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
            demandeurs[1].carte_etudiant_date_soumission = timezone.now() - timedelta(days=3)
            demandeurs[1].save()

            # 3 : Validée
            demandeurs[2].est_etudiant = True
            demandeurs[2].matricule_etudiant = "ETU-2026-5502"
            demandeurs[2].statut_verification_etudiant = StatutVerificationEtudiant.VALIDE
            demandeurs[2].carte_etudiant_date_validation = timezone.now() - timedelta(days=5)
            demandeurs[2].valide_par = utilisateurs.get("courrier")
            demandeurs[2].save()

            # 4 : Rejetée
            demandeurs[3].est_etudiant = True
            demandeurs[3].matricule_etudiant = "ETU-2026-9901"
            demandeurs[3].statut_verification_etudiant = StatutVerificationEtudiant.REJETE
            demandeurs[3].motif_rejet_carte = "Carte périmée et matricule non concordant avec le registre universitaire"
            demandeurs[3].carte_etudiant_date_validation = timezone.now() - timedelta(days=4)
            demandeurs[3].valide_par = utilisateurs.get("courrier")
            demandeurs[3].save()

        self.stdout.write("  + cartes étudiantes configurées (en attente, validées, rejetées)")

        # Configurer au moins 2 cas de concurrence active pour la DCUVE
        d1 = Demande.objects.filter(reference_anonyme='DOSSIER-0C69E3C8').first()
        if d1:
            d1.statut = StatutDemande.CONTROLE_RECEVABILITE
            d1.save()
        d2 = Demande.objects.filter(reference_anonyme='DOSSIER-41DC9B23').first()
        if d2:
            d2.statut = StatutDemande.CONTROLE_RECEVABILITE
            d2.save()
        self.stdout.write("  + candidatures concurrentes actives configurées sur les locaux")

