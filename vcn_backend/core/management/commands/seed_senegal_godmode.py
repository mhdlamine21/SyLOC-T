"""Jeu de donnees de demonstration GOD MODE 100% Senegalais pour SyLOC-T (CROUS de Thies).

Ce script nettoie integralement la base de donnees et injecte un jeu massif, coherent,
ultra-realiste et structure selon les realites du campus VCN (Village Communautaire
Numerique) de l'Universite Iba Der Thiam de Thies (UIDT) et du CROUS-T.
Au moins 50 locaux reels et 100% ancres dans le terroir senegalais.
"""

import random
import uuid
from datetime import date, datetime, timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from comptes.models import (
    CanalNotification,
    Demandeur,
    JournalAudit,
    Notification,
    RoleUtilisateur,
    StatutVerificationEtudiant,
    Utilisateur,
)
from contrats.models import Contrat, ModeleContrat, StatutContrat, TypeContrat
from core.models import Annonce, ParametreSysteme
from demandes.models import (
    AppelCandidature,
    AvisCommission,
    Commission,
    CritereAppel,
    Demande,
    Document,
    Dossier,
    HistoriqueStatutDemande,
    LotCommission,
    MembreCommission,
    MotifActivationCommission,
    MotifArchivage,
    StatutDemande,
    StatutLot,
    TypeCritere,
    TypeDemande,
    TypeDocument,
    VoteCommission,
)
from fidelite.models import HistoriqueScore
from paiements.models import (
    Echeance,
    ModePaiement,
    Paiement,
    ReversementAmicale,
    StatutEcheance,
    StatutPaiement,
    TransactionLog,
)
from patrimoine.models import EtatLocal, Gestionnaire, Local, TypeLocal
from terrain.models import (
    AvisCantine,
    CommissionDestinataire,
    DispatchFidelite,
    InspectionQHse,
    InterventionMaintenance,
    NiveauSanction,
    NiveauUrgence,
    OrdreMission,
    Plainte,
    RapportVisiteTerrain,
    Sanction,
    StatutAvis,
    StatutDispatch,
    StatutIntervention,
    StatutOrdreMission,
    StatutPlainte,
    StatutRapportVisite,
    StatutSanction,
    TypeControleQHSE,
    TypeIntervention,
    TypeSignalement,
)


class Command(BaseCommand):
    help = "Nettoie la base et injecte un volume massif de donnees reelles senegalaises pour SyLOC-T (CROUS-T)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Reinitialisation de la base SyLOC-T..."))

        self._nettoyer_base()

        self.stdout.write(self.style.SUCCESS("[1/10] Creation des parametres systeme et annonces officielles..."))
        self._creer_parametres_et_annonces()

        self.stdout.write(self.style.SUCCESS("[2/10] Creation des modeles de contrat juridiques CROUS-T..."))
        modeles_contrat = self._creer_modeles_contrat()

        self.stdout.write(self.style.SUCCESS("[3/10] Creation des comptes metier institutionnels et usagers..."))
        admin, comptes_metier, usagers_etudiants, usagers_commercants = self._creer_utilisateurs_et_demandeurs()

        self.stdout.write(self.style.SUCCESS("[4/10] Creation du patrimoine immobilier (50 Locaux du campus VCN Thies)..."))
        locaux = self._creer_locaux()

        self.stdout.write(self.style.SUCCESS("[5/10] Creation des appels a candidatures officiels et criteres..."))
        appels = self._creer_appels_candidatures(admin, locaux)

        self.stdout.write(self.style.SUCCESS("[6/10] Creation des commissions d'evaluation, membres et lots..."))
        commissions = self._creer_commissions(admin, comptes_metier)

        self.stdout.write(self.style.SUCCESS("[7/10] Generation des dossiers de demande & candidatures..."))
        demandes = self._creer_demandes_et_dossiers(
            usagers_etudiants, usagers_commercants, locaux, appels, commissions, comptes_metier
        )

        self.stdout.write(self.style.SUCCESS("[8/10] Etablissement des contrats, baux commerciaux et conventions..."))
        contrats = self._creer_contrats(locaux, usagers_etudiants, usagers_commercants, admin, modeles_contrat, demandes)

        self.stdout.write(self.style.SUCCESS("[9/10] Generation de la comptabilite (Echeances, Wave/OM, Quitus)..."))
        self._creer_echeancier_et_paiements(contrats)

        self.stdout.write(self.style.SUCCESS("[10/10] Generation du pole Terrain, QHSE, Maintenance, Visites & Fidelite..."))
        self._creer_donnees_terrain_qhse_maintenance(locaux, comptes_metier, usagers_etudiants, usagers_commercants, contrats)

        self.stdout.write(self.style.SUCCESS("Base de donnees initialisee avec succes."))
        self._afficher_resume()

    def _nettoyer_base(self):
        """Supprime toutes les donnees existantes dans l'ordre inverse des dependances."""
        self.stdout.write("Purge des tables en cours...")
        HistoriqueScore.objects.all().delete()
        DispatchFidelite.objects.all().delete()
        RapportVisiteTerrain.objects.all().delete()
        InterventionMaintenance.objects.all().delete()
        OrdreMission.objects.all().delete()
        AvisCantine.objects.all().delete()
        Sanction.objects.all().delete()
        InspectionQHse.objects.all().delete()
        Plainte.objects.all().delete()
        TransactionLog.objects.all().delete()
        ReversementAmicale.objects.all().delete()
        Paiement.objects.all().delete()
        Echeance.objects.all().delete()
        Contrat.objects.all().delete()
        ModeleContrat.objects.all().delete()
        VoteCommission.objects.all().delete()
        LotCommission.objects.all().delete()
        MembreCommission.objects.all().delete()
        Commission.objects.all().delete()
        HistoriqueStatutDemande.objects.all().delete()
        Document.objects.all().delete()
        Dossier.objects.all().delete()
        Demande.objects.all().delete()
        CritereAppel.objects.all().delete()
        AppelCandidature.objects.all().delete()
        Local.objects.all().delete()
        Notification.objects.all().delete()
        JournalAudit.objects.all().delete()
        Demandeur.objects.all().delete()
        Utilisateur.objects.all().delete()
        Annonce.objects.all().delete()
        ParametreSysteme.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Purge terminee. Base 100% propre."))

    def _creer_parametres_et_annonces(self):
        ParametreSysteme.objects.create(
            cle="contact_crous_t",
            libelle="Coordonnees Officielles du CROUS de Thies",
            categorie="GENERAL",
            est_public=True,
            valeur={
                "institution": "Centre Regional des Oeuvres Universitaires Sociales de Thies (CROUS-T)",
                "universite": "Universite Iba Der Thiam de Thies (UIDT)",
                "campus": "Campus VCN (Voie de Contournement Nord), Cite Universitaire",
                "ville": "Thies, Senegal",
                "boite_postale": "BP 77 Thies RP",
                "telephone_standard": "+221 33 951 12 34",
                "telephone_dcuve": "+221 33 951 56 78",
                "email_contact": "contact@crous-thies.sn",
                "email_dcuve": "dcuve@crous-thies.sn",
                "email_courrier": "courrier@crous-thies.sn",
                "horaires_ouverture": "Du Lundi au Vendredi de 08h00 a 17h00 (Pause de 13h30 a 14h30)",
            },
            description="Informations de contact et localisation officielle du CROUS-T.",
        )

        ParametreSysteme.objects.create(
            cle="vitrine_presentation",
            libelle="Presentation de la plateforme SyLOC-T",
            categorie="VITRINE",
            est_public=True,
            valeur={
                "titre": "Systeme Digitalise de Gestion Domaniale et Commerciale du Campus VCN",
                "chapeau": "Le CROUS de Thies met a disposition des etudiants, entrepreneurs et prestataires une plateforme transparente et securisee pour la candidature, l'attribution et la gestion des espaces commerciaux du campus.",
                "avantages": [
                    "Gratuite totale des redevances locatives pour les projets portes par des etudiants reguliers de l'UIDT.",
                    "Paiement securise des redevances par Mobile Money (Wave, Orange Money, Free Money) sans frais de deplacement.",
                    "Transparence integrale des attributions via la Commission d'evaluation du CROUS-T.",
                    "Controle d'hygiene rigoureux assure en collaboration avec la Sous-brigade d'hygiene de Thies.",
                ],
            },
            description="Contenu editorial de la vitrine d'accueil.",
        )

        ParametreSysteme.objects.create(
            cle="bareme_redevances_2026",
            libelle="Grille Tarifaire des Redevances Domaniales 2026 (FCFA)",
            categorie="WORKFLOW",
            est_public=True,
            valeur={
                "kiosque_etudiant_subventionne": 0,
                "kiosque_multiservices": 25000,
                "papeterie_imprimerie": 40000,
                "artisanat_couture_coiffure": 35000,
                "cantine_restauration_fastfood": 75000,
                "grande_cantine_centrale": 120000,
                "superette_alimentation": 60000,
                "taux_penalite_retard_pourcent": 10,
            },
            description="Bareme officiel approuve par la Direction du CROUS-T.",
        )

        annonces_data = [
            (
                "Appel a Candidatures Session 2026 - Attribution des Kiosques Commerciaux du Campus VCN",
                "La Direction du Centre Regional des Oeuvres Universitaires Sociales de Thies (CROUS-T) informe la communaute universitaire et les prestataires exterieurs de l'ouverture officielle des candidatures pour l'attribution et l'exploitation des locaux commerciaux du Village Communautaire Numerique (VCN).\n\n"
                "Les dossiers complets doivent etre deposes en ligne via la plateforme SyLOC-T ou au Bureau du Courrier situe au Bloc Administratif.\n"
                "Priorite accordee aux projets a fort impact et aux initiatives portees par les etudiants reguliers de l'UIDT.",
                "pin-gold",
                "#fff9c4",
                "Direction CROUS-T",
                "Diffusion large sur portail et affichage physique dans les 7 pavillons.",
            ),
            (
                "Facilite Etudiants Entrepreneurs : Gratuite des Loyers Domaniaux pour l'annee 2025/2026",
                "Conformement a la circulaire rectorale N° 2025-04/UIDT relative a l'insertion professionnelle et a l'incubation etudiante, les etudiants porteurs de projets selectionnes beneficient d'une exoneration complete de redevance locative mensuelle sur presentation d'une carte d'etudiant valide pour l'annee academique en cours.",
                "pin-navy",
                "#e3f2fd",
                "Direction de la Vie Universitaire (DCUVE)",
                "Information obligatoire a notifier a l'ensemble des candidats etudiants.",
            ),
            (
                "Campagne de Salubrite & Inspection Sanitaire Generale - Brigade d'Hygiene de Thies",
                "Le Bureau QHSE du CROUS-T, en partenariat avec la Sous-brigade regionale d'Hygiene de Thies, entreprendra une mission d'inspection inopinee de toutes les cantines, dibiteries et kiosques alimentaires du campus du 20 au 25 du mois courant.\n"
                "Le port de blouses, charlottes et la possession de certificats medicaux valides sont strictement obligatoires pour le personnel de manipulation des aliments.",
                "pin-navy",
                "#ffebee",
                "Bureau QHSE & Salubrite",
                "Transmettre aux gerants de restauration du campus.",
            ),
            (
                "Generalisation du Reglement par Wave et Orange Money sans frais de guichet",
                "L'Agence Comptable Principale du CROUS-T rappelle a tous les occupants titulaires de baux commerciaux que les redevances mensuelles doivent etre acquittees avant le 5 de chaque mois. Les paiements par Mobile Money via SyLOC-T generent instantanement le quitus numerique officiel faisant foi.",
                "pin-slate",
                "#f5f5f5",
                "Agence Comptable Principale",
                "Rappel automatique a integrer aux avis d'echeance mensuels.",
            ),
        ]

        for titre, corps, epingle, col, emetteur, consigne in annonces_data:
            Annonce.objects.create(
                titre=titre,
                contenu=corps,
                est_active=True,
                statut='PUBLIEE',
                pin=epingle,
                bg=col,
                emetteur_nom=emetteur,
                consigne_direction=consigne,
            )

    def _creer_modeles_contrat(self):
        modeles = {}
        m_bail = ModeleContrat.objects.create(
            nom="Bail Commercial CROUS-T Standard (Commercants & Prestataires)",
            type_contrat=TypeContrat.BAIL_COMMERCIAL,
            objet="Bail commercial domanial pour exploitation commerciale sur campus VCN",
            corps="CONTRAT DE CONCESSION ET DE BAIL COMMERCIAL PORTANT SUR L'OCCUPATION D'UN LOCAL DU CAMPUS VCN\n\nENTRE LES SOUSSIGNES :\nLe CROUS de Thies, represente par son Directeur,\nET LE PRESTATAIRE CONCESSIONNAIRE :\nNom / Raison Sociale : {{ demandeur_nom }}\nContact : {{ demandeur_contact }}\n\nIL A ETE CONVENU CE QUI SUIT :\nArticle 1 : Objet de la Concession\nLe CROUS-T accorde a titre onereux l'exploitation du local commercial reference {{ local_reference }}, situe a {{ local_localisation }}.\n\nArticle 2 : Destination des lieux\nLe preneur s'engage a exploiter exclusivement le local conformement a l'activite autorisee, a maintenir une hygiene exemplaire et a respecter les normes de securite incendie.\n\nArticle 3 : Redevance domaniale et Modalites de Paiement\nLa redevance mensuelle est payable avant le 5 de chaque mois civil par Mobile Money (Wave, Orange Money) ou a la caisse du CROUS-T.\nTout retard entraine une penalite de 10% apres mise en demeure de 8 jours.\n\nArticle 4 : Duree et Resiliation\nLe present bail est conclu pour une duree renouvelable par accord expres des parties.",
            clauses_standard="Respect du reglement interieur du VCN et des regles d'hygiene du CROUS-T.",
            duree_mois_defaut=24,
            preavis_mois_defaut=3,
            est_actif=True,
        )
        modeles["BAIL_COMMERCIAL"] = m_bail

        m_etu = ModeleContrat.objects.create(
            nom="Convention d'Incubation & d'Occupation Etudiante Subventionnee (0 FCFA)",
            type_contrat=TypeContrat.CONVENTION_ETUDIANTE,
            objet="Convention d'occupation a titre gratuit pour etudiants porteurs de projets",
            corps="CONVENTION PARTICULIERE D'OCCUPATION A TITRE GRATUIT (SUBVENTION ETUDIANTE CROUS-T)\n\nENTRE :\nLe CROUS-T, au titre de sa mission d'accompagnement social et d'insertion professionnelle,\nET L'ETUDIANT ENTREPRENEUR :\nNom : {{ demandeur_nom }}\nMatricule UIDT : {{ demandeur_matricule }}\nContact : {{ demandeur_contact }}\n\nIL EST CONVENU :\nArticle 1 : Exoneration totale de redevance\nEn vertu du statut d'etudiant regulierement inscrit a l'UIDT, le beneficiaire est integralement dispense du paiement de redevance locative (Loyer mensuel : 0 FCFA).\n\nArticle 2 : Engagements de l'Etudiant\nL'etudiant beneficiaire s'engage a : \n1. Maintenir son inscription academique active ;\n2. Pratiquer des tarifs sociaux et accessibles aux camarades etudiants ;\n3. Respecter la proprete stricte des locaux et les horaires d'ouverture fixes par le reglement interieur du VCN.",
            clauses_standard="Exoneration 100% de loyer domanial sous reserve du maintien de la carte d'etudiant active.",
            duree_mois_defaut=12,
            preavis_mois_defaut=1,
            est_actif=True,
        )
        modeles["CONVENTION_ETUDIANTE"] = m_etu

        m_temp = ModeleContrat.objects.create(
            nom="Convention d'Occupation Temporaire / Precaire",
            type_contrat=TypeContrat.CONVENTION_OCCUPATION,
            objet="Convention d'occupation precaire pour evenement ou periode d'essai",
            corps="CONVENTION PRECAIRE D'OCCUPATION TEMPORAIRE\n\nArticle 1 : Autorisation temporaire d'occuper les dependances domaniales du CROUS-T.\nArticle 2 : Caractere precaire et revocable a premiere demande en cas de necessite de service ou de grands travaux.",
            clauses_standard="Revocabilite sans preavis en cas de non-respect des clauses domaniales.",
            duree_mois_defaut=6,
            preavis_mois_defaut=1,
            est_actif=True,
        )
        modeles["CONVENTION_OCCUPATION"] = m_temp

        return modeles

    def _creer_utilisateurs_et_demandeurs(self):
        comptes_metier_defs = [
            ("candidat", "candidat@crous-t.sn", RoleUtilisateur.USAGER, "Ousmane Sonko Sarr", "+221 77 111 22 33", None),
            ("etudiant", "etudiant@crous-t.sn", RoleUtilisateur.USAGER, "Awa Diop", "+221 77 123 45 67", None),
            ("occupant", "occupant@crous-t.sn", RoleUtilisateur.USAGER, "Mamadou Lamine Lo", "+221 77 234 56 78", None),
            ("courrier", "courrier@crous-t.sn", RoleUtilisateur.BUREAU_COURRIER, "Serigne Abdou Khadre Cisse (Bureau Courrier)", "+221 77 345 67 89", None),
            ("agent_dcuve", "agent_dcuve@crous-t.sn", RoleUtilisateur.AGENT_DCUVE, "Fatou Bintou Ndiaye (Agent DCUVE)", "+221 77 456 78 90", None),
            ("dcuve", "dcuve@crous-t.sn", RoleUtilisateur.DIRECTEUR_DCUVE, "Dr. Ibrahima Sarr (Directeur DCUVE)", "+221 77 567 89 01", None),
            ("commission", "commission@crous-t.sn", RoleUtilisateur.DIRECTEUR_CROUS_T, "Pr. Cheikh Tidiane Sy (Directeur CROUS-T)", "+221 77 678 90 12", None),
            ("juridique", "juridique@crous-t.sn", RoleUtilisateur.SERVICE_JURIDIQUE, "Me. Astou Fall (Conseillere Juridique)", "+221 77 789 01 23", None),
            ("comptable", "comptable@crous-t.sn", RoleUtilisateur.SERVICE_COMPTABLE, "Ousmane Diallo (Agent Comptable Principal)", "+221 77 890 12 34", None),
            ("technique", "technique@crous-t.sn", RoleUtilisateur.SERVICE_TECHNIQUE, "Ing. Babacar Faye (Chef Service Technique)", "+221 77 901 23 45", "Ingenieur Genie Civil"),
            ("terrain", "terrain@crous-t.sn", RoleUtilisateur.AGENT_TERRAIN, "Modou Kara Gueye (Agent de Surveillance Terrain)", "+221 76 112 23 34", "Surveillance Domaniale"),
            ("qhse", "qhse@crous-t.sn", RoleUtilisateur.AGENT_QHSE, "Dieynaba Ba (Inspectrice Hygiene & Salubrite)", "+221 76 223 34 45", "Hygiene & Environnement"),
            ("communication", "communication@crous-t.sn", RoleUtilisateur.CELLULE_COMMUNICATION, "Ramatoulaye Thiam (Responsable Communication)", "+221 76 334 45 56", None),
            ("amicale", "amicale@crous-t.sn", RoleUtilisateur.AMICALE, "Moussa Sene (President Amicale Centrale UIDT)", "+221 76 445 56 67", None),
            ("admin_si", "admin_si@crous-t.sn", RoleUtilisateur.ADMINISTRATEUR_SI, "Pape Alioune Niang (Administrateur SI SyLOC-T)", "+221 76 556 67 78", "Systemes & Reseaux"),
        ]

        admin = Utilisateur.objects.create_superuser(
            username="admin",
            email="admin@crous-t.sn",
            password="admin",
            nom_complet="Administrateur Central CROUS-T",
            role=RoleUtilisateur.ADMINISTRATEUR_SI,
            telephone="+221 33 951 12 34",
        )

        comptes_metier = {}
        for username, email, role, nom, tel, spec in comptes_metier_defs:
            u = Utilisateur.objects.create_user(
                username=username,
                email=email,
                password=username,
                role=role,
                nom_complet=nom,
                telephone=tel,
                specialite=spec,
            )
            comptes_metier[username] = u

        d_candidat = Demandeur.objects.create(
            utilisateur=comptes_metier["candidat"],
            contact="+221 77 111 22 33",
            est_etudiant=True,
            matricule_etudiant="ETU-UIDT-2026-9999",
            statut_verification_etudiant=StatutVerificationEtudiant.VALIDE,
            carte_etudiant_date_soumission=timezone.now() - timedelta(days=15),
            carte_etudiant_date_validation=timezone.now() - timedelta(days=12),
            valide_par=comptes_metier["courrier"],
            score_fidelite=15.0,
        )

        d_etudiant = Demandeur.objects.create(
            utilisateur=comptes_metier["etudiant"],
            contact="+221 77 123 45 67",
            est_etudiant=True,
            matricule_etudiant="ETU-UIDT-2026-0842",
            statut_verification_etudiant=StatutVerificationEtudiant.VALIDE,
            carte_etudiant_date_soumission=timezone.now() - timedelta(days=20),
            carte_etudiant_date_validation=timezone.now() - timedelta(days=18),
            valide_par=comptes_metier["courrier"],
            score_fidelite=25.0,
        )

        d_occupant = Demandeur.objects.create(
            utilisateur=comptes_metier["occupant"],
            contact="+221 77 234 56 78",
            est_etudiant=False,
            matricule_etudiant="",
            statut_verification_etudiant=StatutVerificationEtudiant.NON_SOUMIS,
            score_fidelite=40.0,
        )

        corps_metiers = [
            ("tech_elec", "Abdoulaye Wade", "electricien", "+221 77 512 34 56", "Electricite batiment & Groupes"),
            ("tech_plomb", "Samba Ka", "plombier", "+221 77 623 45 67", "Plomberie sanitaire & Reseaux"),
            ("tech_frigo", "Moustapha Samb", "frigoriste", "+221 77 734 56 78", "Climatisation & Froid commercial"),
            ("tech_menuis", "Mor Talla Boye", "menuisier", "+221 77 845 67 89", "Menuiserie metallique & Bois"),
        ]
        for uname, nom, pwd, tel, spec in corps_metiers:
            u = Utilisateur.objects.create_user(
                username=uname,
                email=f"{uname}@crous-t.sn",
                password=pwd,
                role=RoleUtilisateur.SERVICE_TECHNIQUE,
                nom_complet=f"{nom} ({spec})",
                telephone=tel,
                specialite=spec,
            )
            comptes_metier[uname] = u

        hashed_pwd_etudiant = make_password("password123")

        etudiants_data = [
            ("khady_fall", "Khadidiatou Fall", "khady.fall@univ-thies.sn", "ETU-UIDT-2025-0112", "+221 77 410 23 89", StatutVerificationEtudiant.VALIDE, 20.0),
            ("alioune_ba", "Alioune Badara Ba", "alioune.ba@univ-thies.sn", "ETU-UIDT-2024-0345", "+221 78 521 34 90", StatutVerificationEtudiant.VALIDE, 15.0),
            ("nabou_seck", "Seynabou Seck", "nabou.seck@univ-thies.sn", "ETU-UIDT-2025-0987", "+221 76 632 45 01", StatutVerificationEtudiant.VALIDE, 30.0),
            ("ibrahima_ly", "Ibrahima Ly", "ibrahima.ly@univ-thies.sn", "ETU-UIDT-2026-1144", "+221 70 743 56 12", StatutVerificationEtudiant.EN_ATTENTE, 0.0),
            ("coumba_toure", "Coumba Toure", "coumba.toure@univ-thies.sn", "ETU-UIDT-2026-2289", "+221 77 854 67 23", StatutVerificationEtudiant.EN_ATTENTE, 0.0),
            ("mansour_camara", "Mansour Camara", "mansour.camara@univ-thies.sn", "ETU-UIDT-2023-0056", "+221 78 965 78 34", StatutVerificationEtudiant.VALIDE, 35.0),
            ("mariama_badji", "Mariama Badji", "mariama.badji@univ-thies.sn", "ETU-UIDT-2025-0723", "+221 76 176 89 45", StatutVerificationEtudiant.VALIDE, 10.0),
            ("souleymane_kane", "Souleymane Kane", "souleymane.kane@univ-thies.sn", "ETU-UIDT-2024-1590", "+221 77 287 90 56", StatutVerificationEtudiant.REJETE, -5.0),
            ("astou_gomis", "Astou Gomis", "astou.gomis@univ-thies.sn", "ETU-UIDT-2025-0451", "+221 70 398 01 67", StatutVerificationEtudiant.VALIDE, 25.0),
            ("assane_diatta", "Assane Diatta", "assane.diatta@univ-thies.sn", "ETU-UIDT-2026-3312", "+221 78 409 12 78", StatutVerificationEtudiant.EN_ATTENTE, 0.0),
            ("fatou_ndiaye", "Fatoumata Zahra Ndiaye", "fatou.ndiaye@univ-thies.sn", "ETU-UIDT-2025-0814", "+221 77 654 32 10", StatutVerificationEtudiant.VALIDE, 20.0),
            ("cheikh_mboup", "Cheikh Ahmadou Bamba Mboup", "cheikh.mboup@univ-thies.sn", "ETU-UIDT-2024-1928", "+221 78 765 43 21", StatutVerificationEtudiant.VALIDE, 18.0),
            ("mame_bousso", "Mame Bousso Dieng", "mame.bousso@univ-thies.sn", "ETU-UIDT-2025-2415", "+221 76 876 54 32", StatutVerificationEtudiant.VALIDE, 22.0),
            ("ousmane_diaw", "Ousmane Sonko Diaw", "ousmane.diaw@univ-thies.sn", "ETU-UIDT-2026-0512", "+221 70 987 65 43", StatutVerificationEtudiant.EN_ATTENTE, 0.0),
            ("awa_senghor", "Awa Senghor", "awa.senghor@univ-thies.sn", "ETU-UIDT-2024-3109", "+221 77 198 76 54", StatutVerificationEtudiant.VALIDE, 28.0),
            ("moustapha_dieng", "Moustapha Dieng", "moustapha.dieng@univ-thies.sn", "ETU-UIDT-2025-4201", "+221 78 209 87 65", StatutVerificationEtudiant.VALIDE, 12.0),
            ("rokheya_sow", "Rokheya Sow", "rokheya.sow@univ-thies.sn", "ETU-UIDT-2026-5510", "+221 76 310 98 76", StatutVerificationEtudiant.EN_ATTENTE, 0.0),
            ("babacar_seye", "Babacar Seye", "babacar.seye@univ-thies.sn", "ETU-UIDT-2023-6621", "+221 70 421 09 87", StatutVerificationEtudiant.VALIDE, 30.0),
            ("aminata_diallo", "Aminata Diallo", "aminata.diallo@univ-thies.sn", "ETU-UIDT-2025-7732", "+221 77 532 10 98", StatutVerificationEtudiant.VALIDE, 15.0),
            ("lamine_sagna", "Lamine Sagna", "lamine.sagna@univ-thies.sn", "ETU-UIDT-2024-8843", "+221 78 643 21 09", StatutVerificationEtudiant.VALIDE, 25.0),
        ]

        usagers_etudiants = [d_candidat, d_etudiant]
        for uname, nom, mail, ine, tel, statut_v, score in etudiants_data:
            u = Utilisateur(
                username=uname,
                email=mail,
                password=hashed_pwd_etudiant,
                role=RoleUtilisateur.USAGER,
                nom_complet=nom,
                telephone=tel,
            )
            u.save()
            d = Demandeur.objects.create(
                utilisateur=u,
                contact=tel,
                est_etudiant=True,
                matricule_etudiant=ine,
                statut_verification_etudiant=statut_v,
                carte_etudiant_date_soumission=timezone.now() - timedelta(days=random.randint(5, 30)),
                carte_etudiant_date_validation=(timezone.now() - timedelta(days=random.randint(1, 4))) if statut_v == StatutVerificationEtudiant.VALIDE else None,
                motif_rejet_carte="Carte d'etudiant de l'annee 2023/2024 non recevable pour la session en cours." if statut_v == StatutVerificationEtudiant.REJETE else None,
                valide_par=comptes_metier["courrier"] if statut_v == StatutVerificationEtudiant.VALIDE else None,
                score_fidelite=score,
            )
            usagers_etudiants.append(d)

        commercants_data = [
            ("gorgui_ndour", "Gorgui Ndour (GIE Teranga Restauration)", "gorgui.ndour@gmail.com", "+221 77 501 11 22", 45.0),
            ("adja_sylla", "Adja Nogaye Sylla (ETS Sylla Couture & Mode)", "adja.sylla@yahoo.fr", "+221 78 612 22 33", 30.0),
            ("cheikh_badiane", "Cheikh Badiane (Baol Multiservices Digital)", "cheikh.baol@orange.sn", "+221 76 723 33 44", 50.0),
            ("mame_diarra_drame", "Mame Diarra Drame (Superette Campus Diambar)", "mame.diarra@gmail.com", "+221 77 834 44 55", 35.0),
            ("fallou_sonko", "Fallou Sonko (Dibiterie Cheikh Ibra Fall)", "fallou.sonko@hotmail.com", "+221 70 945 55 66", 20.0),
            ("sokhna_mendy", "Sokhna Mendy (Salon Aminata Coiffure)", "sokhna.mendy@gmail.com", "+221 78 156 66 77", 25.0),
            ("elhadj_sane", "El Hadj Sane (Pressing & Blanchisserie du Baol)", "elhadj.sane@gmail.com", "+221 77 267 77 88", 15.0),
            ("dame_manga", "Dame Manga (Kiosque Fruits & Jus Locaux Teranga)", "dame.manga@yahoo.fr", "+221 76 378 88 99", -10.0),
            ("ndeye_fatou_thiam", "Ndeye Fatou Thiam (Fast-Food Thiep & Yassa Express)", "ndeye.thiam@gmail.com", "+221 77 489 99 11", 40.0),
            ("modou_lo_papeterie", "Modou Lo (Imprimerie & Librairie Cayor)", "modou.cayor@gmail.com", "+221 78 590 00 22", 35.0),
            ("serigne_mbacke_cuir", "Serigne Mbacke (Maroquinerie & Cuir de Touba)", "serigne.cuir@gmail.com", "+221 76 601 11 33", 20.0),
            ("baye_zale_cafe", "Baye Zale Ndao (Kiosque Cafe Touba & Doungous)", "zale.cafe@gmail.com", "+221 70 712 22 44", 45.0),
            ("antou_niang_lait", "Antou Niang (Comptoir Laitier du Saloum & Yaourts)", "antou.lait@gmail.com", "+221 77 823 33 55", 30.0),
            ("khadidja_ba_soins", "Khadidja Ba (Esthetique & Soins Naturels Sunu Bio)", "khadidja.soins@gmail.com", "+221 78 934 44 66", 25.0),
            ("abdou_rahmane_tech", "Abdou Rahmane Dia (Point Relais Wave / OM / Wari)", "abdou.relais@gmail.com", "+221 76 045 55 77", 55.0),
        ]

        usagers_commercants = [d_occupant]
        for uname, nom, mail, tel, score in commercants_data:
            u = Utilisateur(
                username=uname,
                email=mail,
                password=hashed_pwd_etudiant,
                role=RoleUtilisateur.USAGER,
                nom_complet=nom,
                telephone=tel,
            )
            u.save()
            d = Demandeur.objects.create(
                utilisateur=u,
                contact=tel,
                est_etudiant=False,
                matricule_etudiant="",
                statut_verification_etudiant=StatutVerificationEtudiant.NON_SOUMIS,
                score_fidelite=score,
            )
            usagers_commercants.append(d)

        return admin, comptes_metier, usagers_etudiants, usagers_commercants

    def _creer_locaux(self):
        """Cree 50 locaux authentiques et detailles sur le Campus VCN de Thies et environs."""
        locaux_configs = [
            # Référence, Localisation, Type, Surface, Gestionnaire, Lat, Lng, Libre, Etat
            ("LOC-VCN-01", "Campus VCN - Cantine Centrale (Pavillon Lat Dior)", TypeLocal.RESTAURATION, 65.0, Gestionnaire.CROUS_T, 14.7915, -16.9258, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-02", "Campus VCN - Kiosque Multiservices Wave / OM (Bloc B Aline Sitoe Diatta)", TypeLocal.MULTISERVICES, 12.0, Gestionnaire.AMICALE, 14.7921, -16.9261, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-03", "Campus VCN - Espace Restauration Rapide & Cafeteria Teranga (Esplanade)", TypeLocal.RESTAURATION, 40.0, Gestionnaire.CROUS_T, 14.7918, -16.9248, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-04", "Campus VCN - Papeterie & Imprimerie Universitaire Baol (Bloc A)", TypeLocal.PAPETERIE, 18.0, Gestionnaire.AMICALE, 14.7905, -16.9259, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-05", "Campus VCN - Dibiterie & Grillades du Campus (Pres du Terrain de Basket)", TypeLocal.RESTAURATION, 25.0, Gestionnaire.CROUS_T, 14.7908, -16.9251, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-06", "Campus VCN - Cyber-Cafe & Espace Numerique Ouvert (Pavillon Cheikh Anta Diop)", TypeLocal.MULTISERVICES, 35.0, Gestionnaire.CROUS_T, 14.7928, -16.9265, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-07", "Campus VCN - Atelier de Couture & Retouches Maam Samba (Bloc Artisanal C)", TypeLocal.ARTISANAT, 15.0, Gestionnaire.CROUS_T, 14.7932, -16.9242, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-08", "Campus VCN - Salon Barber Shop Nianthio (Pavillon Yoro Diao)", TypeLocal.ARTISANAT, 14.0, Gestionnaire.CROUS_T, 14.7911, -16.9272, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-09", "Campus VCN - Salon Aminata Coiffure & Soins Dames (Pavillon F Ousmane Sembene)", TypeLocal.ARTISANAT, 16.0, Gestionnaire.CROUS_T, 14.7919, -16.9278, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-10", "Campus VCN - Superette Alimentation Generale Diambar (Bloc Commercial D)", TypeLocal.AUTRE, 45.0, Gestionnaire.CROUS_T, 14.7925, -16.9240, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-11", "Campus VCN - Kiosque Cafe Touba & Patisseries du Terroir (Allee Centrale)", TypeLocal.RESTAURATION, 10.0, Gestionnaire.CROUS_T, 14.7914, -16.9255, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-12", "Campus VCN - Kiosque Fruits Frais & Jus Locaux Bio (Pres du Restaurant VCN 2)", TypeLocal.RESTAURATION, 10.0, Gestionnaire.CROUS_T, 14.7902, -16.9268, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-13", "Campus VCN - Cordonnerie & Reparation Maroquinerie (Bloc Artisanal C2)", TypeLocal.ARTISANAT, 8.0, Gestionnaire.CROUS_T, 14.7935, -16.9245, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-14", "Campus VCN - Espace Laverie & Pressing Touba Darou Khoudoss (Pavillon G Kocc Barma)", TypeLocal.AUTRE, 22.0, Gestionnaire.CROUS_T, 14.7938, -16.9270, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-15", "Campus VCN - Kiosque Boutique Telecom & Flash Sunu Digital (Entree Principale)", TypeLocal.MULTISERVICES, 12.0, Gestionnaire.CROUS_T, 14.7898, -16.9250, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-16", "Campus VCN - Kiosque Reprographie UFR Sante (Pres de la Faculte de Medecine)", TypeLocal.PAPETERIE, 14.0, Gestionnaire.AMICALE, 14.7942, -16.9255, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-17", "Campus VCN - Fast-Food Thiossane & Chawarma (Allee des Palmiers)", TypeLocal.RESTAURATION, 20.0, Gestionnaire.CROUS_T, 14.7916, -16.9249, True, EtatLocal.NECESSITE_RENOVATION),
            ("LOC-VCN-18", "Campus VCN - Kiosque Produits Laitiers & Yaourts Ferme Ecole Thies", TypeLocal.RESTAURATION, 12.0, Gestionnaire.CROUS_T, 14.7909, -16.9262, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-19", "Campus VCN - Boutique Vente Fournitures & Librairie Campus (Bloc A2)", TypeLocal.PAPETERIE, 24.0, Gestionnaire.CROUS_T, 14.7903, -16.9256, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-20", "Campus VCN - Kiosque Sandwicherie & Jus Naturels Pavillon E", TypeLocal.RESTAURATION, 11.0, Gestionnaire.CROUS_T, 14.7913, -16.9269, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-21", "Campus VCN - Ancien Kiosque Bloc B (Rehabilitation programmee)", TypeLocal.AUTRE, 15.0, Gestionnaire.CROUS_T, 14.7923, -16.9260, True, EtatLocal.EN_TRAVAUX),
            ("LOC-VCN-22", "Campus VCN - Hangar Artisanal Ouest (Refection toiture en cours)", TypeLocal.ARTISANAT, 30.0, Gestionnaire.CROUS_T, 14.7930, -16.9280, True, EtatLocal.EN_TRAVAUX),
            ("LOC-VCN-23", "Campus VCN - Annexe Restaurant Universitaire VCN 2", TypeLocal.RESTAURATION, 50.0, Gestionnaire.CROUS_T, 14.7901, -16.9266, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-24", "Campus VCN - Kiosque Service Express Amicale UFR SET", TypeLocal.MULTISERVICES, 10.0, Gestionnaire.AMICALE, 14.7927, -16.9252, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-25", "Campus VCN - Depot de Pain & Viennoiserie Centrale", TypeLocal.RESTAURATION, 15.0, Gestionnaire.CROUS_T, 14.7917, -16.9253, True, EtatLocal.BON_ETAT),
            # Locaux 26 a 50 (Nouveaux locaux 100% senegalais pour atteindre le total de 50 locaux)
            ("LOC-VCN-26", "Campus VCN - Restaurant Thieboudienne Penda Mbaye (Pres du Grand Amphi UIDT)", TypeLocal.RESTAURATION, 55.0, Gestionnaire.CROUS_T, 14.7920, -16.9270, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-27", "Campus VCN - Point Relais Mobile Money Wave & Orange Money (Esplanade Sud)", TypeLocal.MULTISERVICES, 14.0, Gestionnaire.CROUS_T, 14.7910, -16.9245, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-28", "Campus VCN - Kiosque Reprographie & Reliure Memoires UFR SES (Bloc C)", TypeLocal.PAPETERIE, 20.0, Gestionnaire.AMICALE, 14.7930, -16.9250, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-29", "Campus VCN - Atelier Confection & Broderie Grand Boubou (Pavillon Valdiodio)", TypeLocal.ARTISANAT, 18.0, Gestionnaire.CROUS_T, 14.7924, -16.9275, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-30", "Campus VCN - Boutique Sunu Alimentation & Produits Frais (Pavillon Daniel Brottier)", TypeLocal.AUTRE, 35.0, Gestionnaire.CROUS_T, 14.7936, -16.9262, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-31", "Campus VCN - Espace Cafe Touba & Beignets Doungous du Matin (Pres du Terrain Foot)", TypeLocal.RESTAURATION, 12.0, Gestionnaire.CROUS_T, 14.7900, -16.9255, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-32", "Campus VCN - Kiosque Presse Universitaire & Livres de Droit (Entree Nord)", TypeLocal.PAPETERIE, 16.0, Gestionnaire.CROUS_T, 14.7945, -16.9260, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-33", "Campus VCN - Salon Coiffure Hommes Le Cayor Barber (Bloc Artisanal D)", TypeLocal.ARTISANAT, 15.0, Gestionnaire.CROUS_T, 14.7933, -16.9238, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-34", "Campus VCN - Kiosque Jus Locaux Bissap / Bouye / Ditakh (Pres de la Bibliotheque)", TypeLocal.RESTAURATION, 10.0, Gestionnaire.AMICALE, 14.7915, -16.9265, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-35", "Campus VCN - Centre Impression & Conception Graphique Sunu Campus (IUT Thies)", TypeLocal.MULTISERVICES, 28.0, Gestionnaire.CROUS_T, 14.7950, -16.9270, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-36", "Campus VCN - Comptoir Poissonnerie & Grillades Thiessoises (Restaurant VCN 1)", TypeLocal.RESTAURATION, 30.0, Gestionnaire.CROUS_T, 14.7905, -16.9265, True, EtatLocal.NECESSITE_RENOVATION),
            ("LOC-VCN-37", "Campus VCN - Cordonnerie Artisanale & Sacs en Cuir de Touba (Bloc C3)", TypeLocal.ARTISANAT, 10.0, Gestionnaire.CROUS_T, 14.7937, -16.9248, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-38", "Campus VCN - Kiosque Reparation Smartphones & PC Portables (Allee Centrale)", TypeLocal.MULTISERVICES, 12.0, Gestionnaire.CROUS_T, 14.7918, -16.9257, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-39", "Campus VCN - Fast-Food Fataya & Pastels du Campus (Devant Pavillon B)", TypeLocal.RESTAURATION, 16.0, Gestionnaire.AMICALE, 14.7922, -16.9264, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-40", "Campus VCN - Espace Esthetique & Tresses Traditionnelles (Pavillon Aline Sitoe)", TypeLocal.ARTISANAT, 18.0, Gestionnaire.CROUS_T, 14.7926, -16.9268, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-41", "Campus VCN - Kiosque Fournitures Scolaires & Polycopies (UFR Sciences Sante)", TypeLocal.PAPETERIE, 15.0, Gestionnaire.AMICALE, 14.7940, -16.9252, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-42", "Campus VCN - Kiosque Cremerie & Yaourts du Terroir (Pres de la Piscine UIDT)", TypeLocal.RESTAURATION, 14.0, Gestionnaire.CROUS_T, 14.7895, -16.9260, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-43", "Campus VCN - Espace Multiservices Senelec / Sen'Eau & Transferts (Entree Est)", TypeLocal.MULTISERVICES, 16.0, Gestionnaire.CROUS_T, 14.7912, -16.9235, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-44", "Campus VCN - Atelier Menuiserie & Soudure de Precision (Zone Technique)", TypeLocal.ARTISANAT, 35.0, Gestionnaire.CROUS_T, 14.7955, -16.9285, True, EtatLocal.EN_TRAVAUX),
            ("LOC-VCN-45", "Campus VCN - Snack-Bar & Petit-Dejeuner Teranga (Esplanade Nord)", TypeLocal.RESTAURATION, 22.0, Gestionnaire.CROUS_T, 14.7935, -16.9258, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-46", "Campus VCN - Kiosque Reliure Express & Plastification (Bloc Administratif CROUS-T)", TypeLocal.PAPETERIE, 12.0, Gestionnaire.CROUS_T, 14.7908, -16.9242, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-47", "Campus VCN - Pressing Ecologique & Nettoyage a Sec (Pavillon Lat Dior)", TypeLocal.AUTRE, 25.0, Gestionnaire.CROUS_T, 14.7914, -16.9260, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-48", "Campus VCN - Kiosque Cafe Espresso & The Mauritanien Ataya (Carrefour Etudiants)", TypeLocal.RESTAURATION, 10.0, Gestionnaire.AMICALE, 14.7919, -16.9251, False, EtatLocal.BON_ETAT),
            ("LOC-VCN-49", "Campus VCN - Kiosque Panneaux Solaires & Accessoires Telephonie (Bloc D2)", TypeLocal.MULTISERVICES, 15.0, Gestionnaire.CROUS_T, 14.7928, -16.9245, True, EtatLocal.BON_ETAT),
            ("LOC-VCN-50", "Campus VCN - Kiosque Sandwiches & Salades Bio Ferme Universitaire (Allee des Sciences)", TypeLocal.RESTAURATION, 18.0, Gestionnaire.CROUS_T, 14.7948, -16.9265, True, EtatLocal.BON_ETAT),
        ]

        locaux_map = {}
        for ref, loc, type_l, surf, gest, lat, lng, libre, etat in locaux_configs:
            l = Local.objects.create(
                reference=ref,
                localisation=loc,
                type_local=type_l,
                surface_m2=surf,
                etat_physique=etat,
                gestionnaire=gest,
                latitude=lat,
                longitude=lng,
                est_libre=libre,
                zone_cartographie="Campus VCN Thies",
            )
            locaux_map[ref] = l
        return locaux_map

    def _creer_appels_candidatures(self, admin, locaux):
        appels = []
        a1 = AppelCandidature.objects.create(
            titre="Appel d'Offres N° 01/2026/CROUS-T : Exploitation du Cyber-Cafe & Espace Numerique (LOC-VCN-06)",
            description="Le CROUS-T recherche un operateur professionnel pour l'amenagement et la gestion du cyber-cafe et centre d'impression numerique du Pavillon Cheikh Anta Diop. Exigences : materiel neuf, connexion haut debit garantie, tarifs speciaux etudiants.",
            date_lancement=timezone.now() - timedelta(days=25),
            date_cloture=timezone.now() + timedelta(days=10),
            est_actif=True,
            local=locaux["LOC-VCN-06"],
            loyer_mensuel=40000.0,
            publie_par=admin,
        )
        CritereAppel.objects.create(appel=a1, type_critere=TypeCritere.EXPERIENCE_PREALABLE, valeur_cible="Au moins 2 ans d'experience en maintenance et reseaux", poids=35, actif=True)
        CritereAppel.objects.create(appel=a1, type_critere=TypeCritere.AUTRE, valeur_cible="Grille tarifaire subventionnee pour les photocopies etudiantes (<= 20 FCFA/page)", poids=35, actif=True)
        CritereAppel.objects.create(appel=a1, type_critere=TypeCritere.AUTRE, valeur_cible="Plan d'investissement en equipement informatique neuf", poids=30, actif=True)
        appels.append(a1)

        a2 = AppelCandidature.objects.create(
            titre="Appel d'Offres N° 02/2026/CROUS-T : Salon Aminata Coiffure & Soins Dames (LOC-VCN-09)",
            description="Mise en concession du salon de coiffure et d'esthetique du Pavillon Ousmane Sembene. Priorite aux artisanes locales et etudiantes porteuses de projets capillaires traditionnels et modernes.",
            date_lancement=timezone.now() - timedelta(days=20),
            date_cloture=timezone.now() - timedelta(days=2),
            est_actif=False,
            local=locaux["LOC-VCN-09"],
            loyer_mensuel=35000.0,
            publie_par=admin,
        )
        CritereAppel.objects.create(appel=a2, type_critere=TypeCritere.GENRE, valeur_cible="Femme artisane ou etudiante", poids=40, actif=True)
        CritereAppel.objects.create(appel=a2, type_critere=TypeCritere.EXPERIENCE_PREALABLE, valeur_cible="CAP/CQP Coiffure ou experience confirmee de 3 ans", poids=30, actif=True)
        CritereAppel.objects.create(appel=a2, type_critere=TypeCritere.AUTRE, valeur_cible="Respect du protocole sanitaire et sterilisation du materiel", poids=30, actif=True)
        appels.append(a2)

        a3 = AppelCandidature.objects.create(
            titre="Appel a Projets N° 03/2026/CROUS-T : Kiosque Fruits Frais & Jus Locaux Bio (LOC-VCN-12)",
            description="Selection d'un exploitant pour le kiosque de fruits et jus locaux (Bissap, Bouye, Ditakh, Gingembre) situe a proximite du Restaurant VCN 2. Approvisionnement aupres des producteurs maraichers de la region de Thies encourage.",
            date_lancement=timezone.now() - timedelta(days=15),
            date_cloture=timezone.now() + timedelta(days=15),
            est_actif=True,
            local=locaux["LOC-VCN-12"],
            loyer_mensuel=25000.0,
            publie_par=admin,
        )
        CritereAppel.objects.create(appel=a3, type_critere=TypeCritere.AUTRE, valeur_cible="Origine 100% locale et bio des fruits et matieres premieres", poids=50, actif=True)
        CritereAppel.objects.create(appel=a3, type_critere=TypeCritere.TRANCHE_AGE, valeur_cible="Moins de 35 ans ou etudiant regulier UIDT", poids=50, actif=True)
        appels.append(a3)

        a4 = AppelCandidature.objects.create(
            titre="Appel d'Offres N° 04/2026/CROUS-T : Restauration Rapide Thiossane & Chawarma (LOC-VCN-17)",
            description="Attribution du local restauration rapide sous reserve de prise en charge des travaux de refection du comptoir.",
            date_lancement=timezone.now() - timedelta(days=30),
            date_cloture=timezone.now() - timedelta(days=5),
            est_actif=False,
            local=locaux["LOC-VCN-17"],
            loyer_mensuel=60000.0,
            publie_par=admin,
        )
        CritereAppel.objects.create(appel=a4, type_critere=TypeCritere.EXPERIENCE_PREALABLE, valeur_cible="Experience averee en restauration collective", poids=40, actif=True)
        CritereAppel.objects.create(appel=a4, type_critere=TypeCritere.AUTRE, valeur_cible="Capacite a prefinancer les travaux de renovation", poids=60, actif=True)
        appels.append(a4)

        a5 = AppelCandidature.objects.create(
            titre="Appel a Projets N° 05/2026/CROUS-T : Centre d'Impression Graphique & Projets UIDT (LOC-VCN-35)",
            description="Selection d'un etudiant ou diplome UIDT pour animer le centre de reprographie et assistance graphique du pole IUT.",
            date_lancement=timezone.now() - timedelta(days=10),
            date_cloture=timezone.now() + timedelta(days=20),
            est_actif=True,
            local=locaux["LOC-VCN-35"],
            loyer_mensuel=0.0,
            publie_par=admin,
        )
        CritereAppel.objects.create(appel=a5, type_critere=TypeCritere.TRANCHE_AGE, valeur_cible="Etudiant ou jeune diplome UIDT", poids=50, actif=True)
        CritereAppel.objects.create(appel=a5, type_critere=TypeCritere.AUTRE, valeur_cible="Competences PAO / DAO / Impression grands formats", poids=50, actif=True)
        appels.append(a5)

        return appels

    def _creer_commissions(self, admin, comptes_metier):
        c1 = Commission.objects.create(
            nom="Commission Mixte d'Attribution des Locaux Commerciaux - Session Janvier 2026",
            active=True,
            date_activation=timezone.now() - timedelta(days=7),
            motif_activation=MotifActivationCommission.ARBITRAGE,
            commentaire_activation="Attribution validee pour les lots 1, 2 et 3 sous reserve de conformite sanitaire et signature des baux.",
            delegation_directeur=True,
            creee_par=comptes_metier["commission"],
        )

        c2 = Commission.objects.create(
            nom="Commission d'Arbitrage et de Renouvellement des Baux 2025/2026",
            active=False,
            date_activation=timezone.now() - timedelta(days=60),
            motif_activation=MotifActivationCommission.AUTRE,
            commentaire_activation="Renouvellement accorde a 92% des occupants a jour de leurs redevances Wave/OM.",
            delegation_directeur=False,
            creee_par=comptes_metier["commission"],
        )

        membres_data = [
            comptes_metier["commission"],
            comptes_metier["dcuve"],
            comptes_metier["juridique"],
            comptes_metier["comptable"],
            comptes_metier["technique"],
            comptes_metier["amicale"],
        ]

        for u in membres_data:
            MembreCommission.objects.create(commission=c1, utilisateur=u, actif=True)

        return [c1, c2]

    def _creer_demandes_et_dossiers(self, usagers_etudiants, usagers_commercants, locaux, appels, commissions, comptes_metier):
        demandes_configs = [
            # 5 Dossiers pour candidat (Ousmane Sonko Sarr)
            (usagers_etudiants[0], TypeDemande.PRESTATION_SERVICE, StatutDemande.NOUVELLE, "Espace Multiservices & Impression Memoires UIDT", "Services bureautiques, reliure et photocopies", locaux["LOC-VCN-06"], appels[0], "CR-2026-001"),
            (usagers_etudiants[0], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Kiosque Jus Bio Teranga & Salades de Fruits du Baol", "Vente de jus frais de Bissap, Bouye, Ditakh", locaux["LOC-VCN-12"], appels[2], "CR-2026-002"),
            (usagers_etudiants[0], TypeDemande.LOCAL_ARTISANAL, StatutDemande.MITIGEE_COMPLEMENT, "Atelier Maroquinerie & Confection Cuir Thiessois", "Maroquinerie et confection d'accessoires", locaux["LOC-VCN-09"], appels[1], "CR-2026-003"),
            (usagers_etudiants[0], TypeDemande.VENTE_PRODUIT, StatutDemande.NOUVELLE, "Kiosque Doungous & Cafe Touba du Matin", "Cafe Touba bien epice, beignets et gateaux", locaux["LOC-VCN-18"], None, "CR-2026-004"),
            (usagers_etudiants[0], TypeDemande.PRESTATION_SERVICE, StatutDemande.NOUVELLE, "Point Relais Digital & Assistance Informatique", "Assistance bureautique et impression express", locaux["LOC-VCN-35"], appels[4], "CR-2026-005"),

            # Dossiers pour etudiant (Awa Diop)
            (usagers_etudiants[1], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Kiosque Multiservices Wave & Impression Etudiante", "Services bureautiques et transferts", locaux["LOC-VCN-02"], None, "CR-2026-010"),
            (usagers_etudiants[1], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Espace Detente & Boissons Fraiches Pavillon D", "Vente de rafraichissements", locaux["LOC-VCN-24"], None, "CR-2026-011"),

            # Dossiers pour commercants et autres etudiants
            (usagers_commercants[0], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Cantine Centrale Teranga (Restauration traditionnelle)", "Thieboudienne, Yassa, Mafe, Dibi", locaux["LOC-VCN-01"], None, "CR-2025-102"),
            (usagers_commercants[1], TypeDemande.LOCAL_ARTISANAL, StatutDemande.FAVORABLE, "Atelier Sylla Couture & Retouches Tenues d'etudiants", "Couture, broderie, retouches", locaux["LOC-VCN-07"], None, "CR-2025-115"),
            (usagers_etudiants[2], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Papeterie & Reprographie Baol - Tarifs Etudiants", "Impression memoires, polycopies", locaux["LOC-VCN-04"], None, "CR-2025-120"),
            (usagers_commercants[2], TypeDemande.PRESTATION_SERVICE, StatutDemande.NOUVELLE, "Espace Numerique Baol Digital", "Cybercafe et services internet", locaux["LOC-VCN-06"], appels[0], "CR-2026-046"),
            (usagers_commercants[3], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Superette Alimentation Diambar VCN", "Produits de premiere necessite, biscuits", locaux["LOC-VCN-10"], None, "CR-2025-130"),
            (usagers_commercants[4], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Dibiterie Cheikh Ibra Fall du Campus", "Grillades de viande locale, dibi agneau", locaux["LOC-VCN-05"], None, "CR-2025-135"),
            (usagers_commercants[5], TypeDemande.LOCAL_ARTISANAL, StatutDemande.MITIGEE_COMPLEMENT, "Salon Aminata Coiffure & Soins Dames", "Coiffure dames, nattes, soins capillaires", locaux["LOC-VCN-09"], appels[1], "CR-2026-050"),
            (usagers_etudiants[3], TypeDemande.LOCAL_ARTISANAL, StatutDemande.NOUVELLE, "Salon Etudiant Tresses & Nattes Sunu Teranga", "Coiffure et tresses traditionnelles", locaux["LOC-VCN-09"], appels[1], "CR-2026-051"),
            (usagers_commercants[7], TypeDemande.VENTE_PRODUIT, StatutDemande.DEFAVORABLE, "Jus Locaux & Fruits Teranga Dame", "Vente de fruits et rafraichissements", locaux["LOC-VCN-12"], appels[2], "CR-2026-061"),
            (usagers_commercants[0], TypeDemande.RENOVATION, StatutDemande.FAVORABLE, "Fast-Food Thiossane & Chawarma (Projet Renovation)", "Fast-food et sandwicherie", locaux["LOC-VCN-17"], appels[3], "CR-2026-070"),
            (usagers_commercants[6], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Pressing & Blanchisserie Touba Darou Khoudoss", "Nettoyage vetements, draps dortoirs", locaux["LOC-VCN-14"], None, "CR-2025-140"),
            (usagers_commercants[7], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Kiosque Cafe Touba & Doungous du Matin", "Cafe Touba, beignets, pain thon", locaux["LOC-VCN-11"], None, "CR-2025-150"),
            (usagers_etudiants[8], TypeDemande.LOCAL_ARTISANAL, StatutDemande.FAVORABLE, "Barber Shop Nianthio Universite", "Coiffure masculine, degradé wave", locaux["LOC-VCN-08"], None, "CR-2025-160"),
            (usagers_etudiants[9], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Sandwicherie & Jus Naturels Pavillon E", "Sandwiches chauds, omelettes, jus", locaux["LOC-VCN-20"], None, "CR-2026-020"),
            (usagers_etudiants[10], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Restaurant Thieboudienne Penda Mbaye (Amphi UIDT)", "Dejeuners complets thieb et mafe", locaux["LOC-VCN-26"], None, "CR-2026-090"),
            (usagers_commercants[14], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Point Relais Mobile Money Wave & Orange Money", "Transferts, depots, retraits et recharges", locaux["LOC-VCN-27"], None, "CR-2026-095"),
            (usagers_etudiants[11], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Kiosque Reprographie & Reliure Memoires UFR SES", "Impression polycopies, memoires et thèses", locaux["LOC-VCN-28"], None, "CR-2026-100"),
            (usagers_commercants[8], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Superette Sunu Alimentation & Produits Frais", "Produits de premiere necessite, savon, biscuits", locaux["LOC-VCN-30"], None, "CR-2026-105"),
            (usagers_commercants[11], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Espace Cafe Touba & Beignets Doungous du Matin", "Cafe Touba bien epice, beignets, pastels", locaux["LOC-VCN-31"], None, "CR-2026-110"),
            (usagers_commercants[13], TypeDemande.LOCAL_ARTISANAL, StatutDemande.FAVORABLE, "Salon Coiffure Hommes Le Cayor Barber", "Coiffure masculine moderne et soins barbe", locaux["LOC-VCN-33"], None, "CR-2026-115"),
            (usagers_etudiants[12], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Kiosque Jus Locaux Bissap / Bouye / Ditakh", "Jus de fruits frais presses a froid", locaux["LOC-VCN-34"], None, "CR-2026-120"),
            (usagers_etudiants[13], TypeDemande.PRESTATION_SERVICE, StatutDemande.NOUVELLE, "Centre Impression & Conception Graphique Sunu Campus", "Affiches, depliants, reliures de qualite", locaux["LOC-VCN-35"], appels[4], "CR-2026-125"),
            (usagers_commercants[9], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Kiosque Reparation Smartphones & PC Portables", "Maintenance electronique, changement ecrans", locaux["LOC-VCN-38"], None, "CR-2026-130"),
            (usagers_etudiants[14], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Fast-Food Fataya & Pastels du Campus VCN", "Fataya viande hachee, pastels poisson, sauce piment", locaux["LOC-VCN-39"], None, "CR-2026-135"),
            (usagers_etudiants[15], TypeDemande.LOCAL_ARTISANAL, StatutDemande.FAVORABLE, "Espace Esthetique & Tresses Traditionnelles", "Tresses africaines, soins visage, pose vernis", locaux["LOC-VCN-40"], None, "CR-2026-140"),
            (usagers_commercants[14], TypeDemande.PRESTATION_SERVICE, StatutDemande.FAVORABLE, "Espace Multiservices Senelec / Sen'Eau & Transferts", "Paiement factures d'eau et d'electricite", locaux["LOC-VCN-43"], None, "CR-2026-145"),
            (usagers_commercants[9], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Kiosque Reliure Express & Plastification", "Plastification documents officiels, reliures", locaux["LOC-VCN-46"], None, "CR-2026-150"),
            (usagers_etudiants[16], TypeDemande.VENTE_PRODUIT, StatutDemande.FAVORABLE, "Kiosque Cafe Espresso & The Mauritanien Ataya", "The vert traditionnel ataya, cafe, infusion", locaux["LOC-VCN-48"], None, "CR-2026-155"),
        ]

        demandes_creees = []
        for i, (dem, type_d, stat, desc, act, loc, app, reg) in enumerate(demandes_configs):
            demande = Demande.objects.create(
                demandeur=dem,
                type_demande=type_d,
                statut=stat,
                description_projet=desc,
                local=loc,
                appel_candidature=app,
                notes_admin=f"Numero registre: {reg}",
                reference_anonyme=f"CAND-2026-{i+1:04d}",
                avis_sanitaire_externe="FAVORABLE" if type_d == TypeDemande.VENTE_PRODUIT and stat == StatutDemande.FAVORABLE else "",
                avis_technique_interne="Conforme aux plans d'amenagement du CROUS-T." if stat == StatutDemande.FAVORABLE else "En attente de visite technique.",
            )

            dossier = demande.dossier
            dossier.pieces_receptionnees = True
            dossier.est_complet = (stat != StatutDemande.MITIGEE_COMPLEMENT)
            dossier.save(update_fields=["pieces_receptionnees", "est_complet"])

            Document.objects.create(
                dossier=dossier,
                type_document=TypeDocument.PIECE_IDENTITE,
                nom_fichier="cni_senegal.pdf",
                est_valide=True,
            )
            Document.objects.create(
                dossier=dossier,
                type_document=TypeDocument.CARTE_ETUDIANT if dem.est_etudiant else TypeDocument.REGISTRE_COMMERCE,
                nom_fichier="carte_etudiant_uidt.pdf" if dem.est_etudiant else "rccm_thies.pdf",
                est_valide=True,
            )

            HistoriqueStatutDemande.objects.create(
                demande=demande,
                ancien_statut=StatutDemande.NOUVELLE,
                nouveau_statut=stat,
                commentaire_acteur=f"Passage au statut {stat} apres verification administrative et avis technique.",
                auteur=comptes_metier["agent_dcuve"],
            )

            demandes_creees.append(demande)

        # Lier les demandes aux votes de commission
        membre_directeur = MembreCommission.objects.get(utilisateur=comptes_metier["commission"])
        for idx in range(min(len(demandes_creees), 12)):
            dem = demandes_creees[idx]
            VoteCommission.objects.create(
                demande=dem,
                membre=membre_directeur,
                avis=AvisCommission.FAVORABLE if dem.statut == StatutDemande.FAVORABLE else AvisCommission.DEFAVORABLE,
                note_formelle=18.0 if dem.statut == StatutDemande.FAVORABLE else 10.0,
                note_technique=17.0 if dem.statut == StatutDemande.FAVORABLE else 8.0,
                commentaire="Dossier etudiant de qualite repondant aux besoins du campus." if dem.statut == StatutDemande.FAVORABLE else "Pre-requis financiers ou sanitaires insuffisants.",
            )

        return demandes_creees

    def _creer_contrats(self, locaux, usagers_etudiants, usagers_commercants, admin, modeles_contrat, demandes):
        """Cree les baux commerciaux et conventions d'occupation effectifs sur le campus."""
        contrats_configs = [
            (locaux["LOC-VCN-01"], usagers_commercants[0], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 1, 1), 24, 120000.0, False, StatutContrat.ACTIF, demandes[7]),
            (locaux["LOC-VCN-02"], usagers_etudiants[1], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[5]),
            (locaux["LOC-VCN-03"], usagers_commercants[0], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 3, 1), 24, 75000.0, False, StatutContrat.ACTIF, None),
            (locaux["LOC-VCN-04"], usagers_etudiants[2], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 11, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[9]),
            (locaux["LOC-VCN-05"], usagers_commercants[4], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 2, 1), 24, 45000.0, False, StatutContrat.ACTIF, demandes[12]),
            (locaux["LOC-VCN-07"], usagers_commercants[1], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 4, 1), 24, 35000.0, False, StatutContrat.ACTIF, demandes[8]),
            (locaux["LOC-VCN-08"], usagers_etudiants[8], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[19]),
            (locaux["LOC-VCN-10"], usagers_commercants[3], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 1, 1), 36, 60000.0, False, StatutContrat.ACTIF, demandes[11]),
            (locaux["LOC-VCN-11"], usagers_commercants[7], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 5, 1), 24, 25000.0, False, StatutContrat.ACTIF, demandes[18]),
            (locaux["LOC-VCN-13"], usagers_commercants[2], modeles_contrat["CONVENTION_OCCUPATION"], TypeContrat.CONVENTION_OCCUPATION, date(2025, 6, 1), 12, 20000.0, False, StatutContrat.ACTIF, None),
            (locaux["LOC-VCN-14"], usagers_commercants[6], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 1, 1), 24, 40000.0, False, StatutContrat.ACTIF, demandes[17]),
            (locaux["LOC-VCN-16"], usagers_etudiants[5], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 11, 1), 12, 0.0, True, StatutContrat.ACTIF, None),
            (locaux["LOC-VCN-20"], usagers_etudiants[9], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2026, 1, 1), 12, 0.0, True, StatutContrat.EN_ATTENTE_SIGNATURE, demandes[20]),
            (locaux["LOC-VCN-24"], usagers_etudiants[1], modeles_contrat["CONVENTION_OCCUPATION"], TypeContrat.CONVENTION_OCCUPATION, date(2025, 8, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[6]),
            # Nouveaux contrats
            (locaux["LOC-VCN-26"], usagers_etudiants[10], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[21]),
            (locaux["LOC-VCN-27"], usagers_commercants[14], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 3, 1), 24, 30000.0, False, StatutContrat.ACTIF, demandes[22]),
            (locaux["LOC-VCN-28"], usagers_etudiants[11], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[23]),
            (locaux["LOC-VCN-30"], usagers_commercants[8], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 2, 1), 24, 50000.0, False, StatutContrat.ACTIF, demandes[24]),
            (locaux["LOC-VCN-31"], usagers_commercants[11], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 4, 1), 24, 25000.0, False, StatutContrat.ACTIF, demandes[25]),
            (locaux["LOC-VCN-33"], usagers_commercants[13], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 5, 1), 24, 35000.0, False, StatutContrat.ACTIF, demandes[26]),
            (locaux["LOC-VCN-34"], usagers_etudiants[12], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 11, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[27]),
            (locaux["LOC-VCN-38"], usagers_commercants[9], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 6, 1), 24, 25000.0, False, StatutContrat.ACTIF, demandes[29]),
            (locaux["LOC-VCN-39"], usagers_etudiants[14], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[30]),
            (locaux["LOC-VCN-40"], usagers_etudiants[15], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[31]),
            (locaux["LOC-VCN-43"], usagers_commercants[14], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 1, 1), 24, 30000.0, False, StatutContrat.ACTIF, demandes[32]),
            (locaux["LOC-VCN-46"], usagers_commercants[9], modeles_contrat["BAIL_COMMERCIAL"], TypeContrat.BAIL_COMMERCIAL, date(2025, 7, 1), 24, 25000.0, False, StatutContrat.ACTIF, demandes[33]),
            (locaux["LOC-VCN-48"], usagers_etudiants[16], modeles_contrat["CONVENTION_ETUDIANTE"], TypeContrat.CONVENTION_ETUDIANTE, date(2025, 10, 1), 12, 0.0, True, StatutContrat.ACTIF, demandes[34]),
        ]

        contrats_crees = []
        for i, (local, dem, modele, type_c, d_debut, duree, loyer, gratuit, statut, dem_assoc) in enumerate(contrats_configs):
            ref_c = f"CT-2025-{i+1:04d}" if d_debut.year == 2025 else f"CT-2026-{i+1:04d}"
            c = Contrat.objects.create(
                reference=ref_c,
                local=local,
                demandeur=dem,
                signataire_crous_t=admin,
                modele=modele,
                type_contrat=type_c,
                statut=statut,
                objet=f"Bail d'occupation du local {local.reference} ({local.localisation})",
                clauses_particulieres="Respect strict du reglement sanitaire et paiement des redevances par Wave/OM.",
                texte_contrat=modele.corps if modele else "Contrat d'occupation officiel CROUS-T.",
                date_signature=d_debut,
                date_debut=d_debut,
                duree_mois=duree,
                preavis_mois=3,
                est_gratuit=gratuit,
                est_actif=(statut == StatutContrat.ACTIF),
                demande=dem_assoc,
                convocation_mode="PHYSIQUE",
                convocation_lieu="Bureau du Service Juridique - Bloc Administratif CROUS-T",
                convocation_envoyee=True,
            )
            if statut == StatutContrat.ACTIF:
                local.est_libre = False
                local.save(update_fields=["est_libre"])
            contrats_crees.append((c, loyer))

        return contrats_crees

    def _creer_echeancier_et_paiements(self, contrats_avec_loyers):
        aujourdhui = timezone.now().date()

        for contrat, loyer in contrats_avec_loyers:
            contrat.echeances.all().delete()

            if contrat.est_gratuit or loyer == 0.0:
                continue

            nb_mois = min(contrat.duree_mois, 12)
            for m in range(nb_mois):
                echeance_date = contrat.date_debut + timedelta(days=30 * m)
                
                if echeance_date < aujourdhui - timedelta(days=40):
                    statut_ech = StatutEcheance.PAYEE
                    penalite = 0.0
                elif echeance_date < aujourdhui - timedelta(days=5):
                    statut_ech = random.choice([StatutEcheance.PAYEE, StatutEcheance.EN_RETARD])
                    penalite = round(loyer * 0.10, 2) if statut_ech == StatutEcheance.EN_RETARD else 0.0
                elif echeance_date <= aujourdhui + timedelta(days=5):
                    statut_ech = StatutEcheance.EXIGIBLE
                    penalite = 0.0
                else:
                    statut_ech = StatutEcheance.NON_ECHUE
                    penalite = 0.0

                echeance = Echeance.objects.create(
                    contrat=contrat,
                    date_exigibilite=echeance_date,
                    montant_du=loyer,
                    montant_penalite=penalite,
                    statut=statut_ech,
                )

                if statut_ech == StatutEcheance.PAYEE:
                    mode = random.choice([ModePaiement.MOBILE_MONEY, ModePaiement.MOBILE_MONEY, ModePaiement.ESPECES])
                    provider = random.choice(["WAVE", "ORANGE_MONEY"]) if mode == ModePaiement.MOBILE_MONEY else "CAISSE_CROUST"
                    uid_suffix = uuid.uuid4().hex[:8].upper()
                    txn_id = f"WAV-SN-{uid_suffix}" if provider == "WAVE" else (
                        f"OM-THS-{uid_suffix}" if provider == "ORANGE_MONEY" else f"RCP-CROUST-{uid_suffix}"
                    )
                    quitus_id = f"QUITUS-{echeance_date.strftime('%Y%m%d')}-{uid_suffix}"

                    p = Paiement.objects.create(
                        echeance=echeance,
                        montant_regle=loyer,
                        mode=mode,
                        statut=StatutPaiement.VALIDE,
                        reference_transaction=txn_id,
                        reference_quitus=quitus_id,
                        numero_payeur=contrat.demandeur.contact if mode == ModePaiement.MOBILE_MONEY else None,
                    )

                    TransactionLog.objects.create(
                        paiement=p,
                        provider=provider,
                        provider_transaction_id=txn_id,
                        payload_brut=f'{{"status": "SUCCESS", "amount": {loyer}, "currency": "XOF", "client": "{contrat.demandeur.utilisateur.nom_complet}", "phone": "{contrat.demandeur.contact}"}}',
                        statut_api="SUCCESS",
                    )

                    if contrat.local.gestionnaire == Gestionnaire.AMICALE:
                        ReversementAmicale.objects.create(
                            paiement=p,
                            montant_reverse=loyer,
                        )

    def _creer_donnees_terrain_qhse_maintenance(self, locaux, comptes_metier, usagers_etudiants, usagers_commercants, contrats):
        all_usagers = [u.utilisateur for u in usagers_etudiants + usagers_commercants]
        agent_terrain = comptes_metier["terrain"]
        agent_qhse = comptes_metier["qhse"]
        tech_elec = comptes_metier["tech_elec"]
        tech_plomb = comptes_metier["tech_plomb"]
        tech_frigo = comptes_metier["tech_frigo"]
        tech_menuis = comptes_metier["tech_menuis"]
        admin = Utilisateur.objects.get(username="admin")

        plaintes_data = [
            (locaux["LOC-VCN-01"], all_usagers[0], TypeSignalement.NON_CONFORMITE_QHSE, NiveauUrgence.ELEVEE, StatutPlainte.RESOLUE, "Fuite importante sur le bac a graisse de la plonge du restaurant central, odeurs nauseabondes dans le couloir."),
            (locaux["LOC-VCN-02"], all_usagers[1], TypeSignalement.TECHNIQUE, NiveauUrgence.MOYENNE, StatutPlainte.RESOLUE, "Disjoncteur differentiel 16A qui saute regulierement lors du branchement simultane de l'onduleur et de la photocopieuse."),
            (locaux["LOC-VCN-05"], all_usagers[2], TypeSignalement.ENVIRONNEMENT, NiveauUrgence.MOYENNE, StatutPlainte.EN_COURS_TRAITEMENT, "Fumees epaisses de grillades s'echappant vers les fenetres des chambres du Pavillon C en soiree."),
            (locaux["LOC-VCN-03"], all_usagers[3], TypeSignalement.NON_CONFORMITE_QHSE, NiveauUrgence.ELEVEE, StatutPlainte.OUVERTE, "Presence d'eau stagnante et infiltration sous le comptoir de service de la cafeteria Teranga."),
            (locaux["LOC-VCN-10"], all_usagers[4], TypeSignalement.TECHNIQUE, NiveauUrgence.FAIBLE, StatutPlainte.RESOLUE, "Neon LED clignotant a l'entree de la superette et prise murale endommagee."),
            (locaux["LOC-VCN-14"], all_usagers[5], TypeSignalement.TECHNIQUE, NiveauUrgence.ELEVEE, StatutPlainte.RESOLUE, "Baisse de pression d'eau au raccordement de la machine a laver industrielle du pressing."),
            (locaux["LOC-VCN-11"], all_usagers[6], TypeSignalement.DENONCIATION_ILLEGALE, NiveauUrgence.MOYENNE, StatutPlainte.RESOLUE, "Installation d'un vendeur ambulant non autorise sur les marches du kiosque a cafe."),
            (locaux["LOC-VCN-07"], all_usagers[7], TypeSignalement.TECHNIQUE, NiveauUrgence.FAIBLE, StatutPlainte.OUVERTE, "Poignee et serrure de la porte metallique d'acces bloquees."),
            (locaux["LOC-VCN-26"], all_usagers[8], TypeSignalement.NON_CONFORMITE_QHSE, NiveauUrgence.MOYENNE, StatutPlainte.RESOLUE, "Verification des conditions de conservation de la viande et du poisson frais au restaurant Thieb."),
            (locaux["LOC-VCN-27"], all_usagers[9], TypeSignalement.TECHNIQUE, NiveauUrgence.FAIBLE, StatutPlainte.RESOLUE, "Prise reseau RJ45 endommagee au guichet Wave."),
            (locaux["LOC-VCN-30"], all_usagers[10], TypeSignalement.TECHNIQUE, NiveauUrgence.MOYENNE, StatutPlainte.RESOLUE, "Panne du groupe frigorifique de conservation des produits laitiers."),
            (locaux["LOC-VCN-33"], all_usagers[11], TypeSignalement.TECHNIQUE, NiveauUrgence.FAIBLE, StatutPlainte.RESOLUE, "Probleme d'eclairage sur le miroir du salon de coiffure."),
        ]

        plaintes_creees = []
        for loc, usager, t_sig, urg, stat, desc in plaintes_data:
            p = Plainte.objects.create(
                local=loc,
                plaignant=usager,
                agent_traitant=agent_terrain if stat != StatutPlainte.OUVERTE else None,
                type=t_sig,
                urgence=urg,
                statut=stat,
                description=desc,
                localisation_libre=loc.localisation,
                date_limite_sla=timezone.now() + timedelta(days=2),
                date_resolution=(timezone.now() - timedelta(days=1)) if stat == StatutPlainte.RESOLUE else None,
                latitude=loc.latitude,
                longitude=loc.longitude,
            )
            plaintes_creees.append(p)

        om1 = OrdreMission.objects.create(
            local=locaux["LOC-VCN-01"],
            agent_assigne=agent_qhse,
            emetteur=admin,
            objet="Inspection sanitaire inopinee et controle du bac a graisse",
            directives="Verifier la conformite du nettoyage du bac a graisse, l'elimination des residus et l'etat des filtres.",
            type_controle=TypeControleQHSE.SANITAIRE,
            priorite=NiveauUrgence.ELEVEE,
            date_mission=timezone.now() - timedelta(days=2),
            statut=StatutOrdreMission.EXECUTE,
            plainte_source=plaintes_creees[0],
            compte_rendu="Intervention effectuee avec succes. Bac a graisse cure, produit desinfectant applique, odeurs neutralisees.",
        )

        om2 = OrdreMission.objects.create(
            local=locaux["LOC-VCN-02"],
            agent_assigne=agent_terrain,
            emetteur=admin,
            objet="Controle des installations electriques et des equipements de photocopie",
            directives="Controler la puissance souscrite et l'equilibrage des phases avec le technicien electricien.",
            type_controle=TypeControleQHSE.ELECTRIQUE,
            priorite=NiveauUrgence.MOYENNE,
            date_mission=timezone.now() - timedelta(days=1),
            statut=StatutOrdreMission.EXECUTE,
            plainte_source=plaintes_creees[1],
            compte_rendu="Tableau electrique verifie. Remplacement du disjoncteur 16A par un disjoncteur calibre 20A courbe C.",
        )

        insp1 = InspectionQHse.objects.create(
            local=locaux["LOC-VCN-01"],
            inspecteur=agent_qhse,
            type_controle=TypeControleQHSE.SANITAIRE,
            date_visite=timezone.now() - timedelta(days=2),
            est_conforme=True,
            note_sanitaire=4,
            observations="Cantine centrale conforme apres vidange du bac a graisse. Personnel dote de charlottes et gants. Tenue des registres d'approvisionnement irreprochable.",
            latitude=locaux["LOC-VCN-01"].latitude,
            longitude=locaux["LOC-VCN-01"].longitude,
        )

        insp2 = InspectionQHse.objects.create(
            local=locaux["LOC-VCN-05"],
            inspecteur=agent_qhse,
            type_controle=TypeControleQHSE.SANITAIRE,
            date_visite=timezone.now() - timedelta(days=5),
            est_conforme=False,
            note_sanitaire=2,
            observations="Dibiterie : fumoirs necessitant un rehaussement de cheminee. Stockage d'huile de friture a eloigner de la source de chaleur. Extincteur poudre a reviser.",
            latitude=locaux["LOC-VCN-05"].latitude,
            longitude=locaux["LOC-VCN-05"].longitude,
        )

        insp3 = InspectionQHse.objects.create(
            local=locaux["LOC-VCN-26"],
            inspecteur=agent_qhse,
            type_controle=TypeControleQHSE.SANITAIRE,
            date_visite=timezone.now() - timedelta(days=3),
            est_conforme=True,
            note_sanitaire=5,
            observations="Restaurant Thieboudienne Penda Mbaye : hygiene exemplaire, chambre froide a temperature ideale (+3°C).",
            latitude=locaux["LOC-VCN-26"].latitude,
            longitude=locaux["LOC-VCN-26"].longitude,
        )

        sanction_existante = Sanction.objects.filter(inspection_source=insp2).first()
        if sanction_existante:
            sanction_existante.contrat = contrats[4][0] if len(contrats) > 4 else None
            sanction_existante.agent_prononcant = comptes_metier["dcuve"]
            sanction_existante.niveau = NiveauSanction.AVERTISSEMENT
            sanction_existante.statut_sanction = StatutSanction.NOTIFIEE
            sanction_existante.motif = "Non-conformite sanitaire et evacuation defectueuse des fumees de cuisson vers les dortoirs des etudiants."
            sanction_existante.save()
        else:
            Sanction.objects.create(
                local=locaux["LOC-VCN-05"],
                contrat=contrats[4][0] if len(contrats) > 4 else None,
                inspection_source=insp2,
                agent_prononcant=comptes_metier["dcuve"],
                niveau=NiveauSanction.AVERTISSEMENT,
                statut_sanction=StatutSanction.NOTIFIEE,
                motif="Non-conformite sanitaire et evacuation defectueuse des fumees de cuisson vers les dortoirs des etudiants.",
            )

        InterventionMaintenance.objects.create(
            local=locaux["LOC-VCN-01"],
            plainte_source=plaintes_creees[0],
            technicien=tech_plomb,
            type_intervention=TypeIntervention.CURATIVE,
            description="Debouchage de la conduite principale d'evacuation 110mm et refection du joint du bac a graisse.",
            statut=StatutIntervention.TERMINEE,
            date_planifiee=timezone.now() - timedelta(days=2),
            date_realisation=timezone.now() - timedelta(days=2),
            cout_estime=25000.0,
            cout_reel=22500.0,
            rapport="Conduite debouchee a l'aide du furet electrique. Ecoulement parfait et etancheite retablie.",
        )

        InterventionMaintenance.objects.create(
            local=locaux["LOC-VCN-02"],
            plainte_source=plaintes_creees[1],
            technicien=tech_elec,
            type_intervention=TypeIntervention.CURATIVE,
            description="Remplacement disjoncteur modulaire et tirage nouvelle ligne dediee pour photocopieuse couleur.",
            statut=StatutIntervention.TERMINEE,
            date_planifiee=timezone.now() - timedelta(days=1),
            date_realisation=timezone.now() - timedelta(days=1),
            cout_estime=15000.0,
            cout_reel=14000.0,
            rapport="Ligne dediee 3G2.5mm² posee sous goulotte, alimentation stabilisee.",
        )

        InterventionMaintenance.objects.create(
            local=locaux["LOC-VCN-30"],
            plainte_source=plaintes_creees[10],
            technicien=tech_frigo,
            type_intervention=TypeIntervention.CURATIVE,
            description="Recharge en fluide frigorigene R134a et remplacement du thermostat du meuble froid.",
            statut=StatutIntervention.TERMINEE,
            date_planifiee=timezone.now() - timedelta(days=3),
            date_realisation=timezone.now() - timedelta(days=3),
            cout_estime=35000.0,
            cout_reel=32000.0,
            rapport="Circuit tire au vide et recharge. Temperature de consigne atteinte.",
        )

        RapportVisiteTerrain.objects.create(
            reference="RV-2026-0001",
            local=locaux["LOC-VCN-01"],
            agent=agent_terrain,
            inspection=insp1,
            ordre_mission=om1,
            date_visite=timezone.now() - timedelta(days=2),
            date_prochaine_visite=timezone.now() + timedelta(days=8),
            type_controle=TypeControleQHSE.SANITAIRE,
            commission_destinataire=CommissionDestinataire.COMMISSION_ENVIRONNEMENT,
            statut=StatutRapportVisite.VALIDE,
            conforme=True,
            note_globale=17,
            constats="Restaurant propre, respect des protocoles d'hygiene, gestion exemplaire de la file d'attente etudiante.",
            recommandations="Poursuivre le curage hebdomadaire du bac a graisse.",
            date_transmission=timezone.now() - timedelta(days=1),
            latitude=locaux["LOC-VCN-01"].latitude,
            longitude=locaux["LOC-VCN-01"].longitude,
        )

        RapportVisiteTerrain.objects.create(
            reference="RV-2026-0002",
            local=locaux["LOC-VCN-05"],
            agent=agent_terrain,
            date_visite=timezone.now() - timedelta(days=4),
            date_prochaine_visite=timezone.now() + timedelta(days=6),
            type_controle=TypeControleQHSE.OCCUPATION,
            commission_destinataire=CommissionDestinataire.COMMISSION_TECHNIQUE,
            statut=StatutRapportVisite.TRANSMIS,
            conforme=False,
            note_globale=9,
            constats="Encombrement de l'allee pietonne par des bancs non autorises. Travaux de rehausse cheminee non encore acheves.",
            recommandations="Sommation de liberation de la voie publique sous 48h.",
            date_transmission=timezone.now() - timedelta(days=3),
            latitude=locaux["LOC-VCN-05"].latitude,
            longitude=locaux["LOC-VCN-05"].longitude,
        )

        DispatchFidelite.objects.create(
            reference="DF-2026-0001",
            demandeur=usagers_commercants[7],
            local=locaux["LOC-VCN-12"],
            demandeur_par=comptes_metier["dcuve"],
            agent_assigne=agent_terrain,
            score_constate=-10.0,
            motif="Score de fidelite negatif du a un retard de paiement et un defaut d'hygiene constate.",
            urgence=NiveauUrgence.ELEVEE,
            statut=StatutDispatch.ASSIGNE,
        )

        HistoriqueScore.objects.create(
            demandeur=usagers_commercants[0],
            points_modifies=10.0,
            nouveau_score=45.0,
            motif="Paiement ponctuel des redevances par Wave sur 6 mois consecutifs.",
        )
        HistoriqueScore.objects.create(
            demandeur=usagers_etudiants[0],
            points_modifies=15.0,
            nouveau_score=25.0,
            motif="Excellente tenue du kiosque multiservices et tarifs sociaux respectes.",
        )
        HistoriqueScore.objects.create(
            demandeur=usagers_commercants[7],
            points_modifies=-15.0,
            nouveau_score=-10.0,
            motif="Avertissement pour non-conformite d'hygiene et retard d'echeance.",
        )

        avis_data = [
            (locaux["LOC-VCN-01"], usagers_etudiants[0], 5, "Le Thieboudienne et le Yassa sont tres bons et copieux ! Service rapide."),
            (locaux["LOC-VCN-01"], usagers_etudiants[1], 4, "Rapport qualite-prix imbattable sur le campus de Thies. 500 FCFA le plat complet."),
            (locaux["LOC-VCN-02"], usagers_etudiants[2], 5, "Super pratique pour imprimer les rapports de TP et faire les depots Wave sans faire la queue en ville."),
            (locaux["LOC-VCN-03"], usagers_etudiants[3], 4, "Les sandwichs chawarma et jus de bissap sont frais. Bonne ambiance."),
            (locaux["LOC-VCN-05"], usagers_etudiants[4], 2, "La viande est bonne mais trop de fumee qui rentre dans les pavillons le soir."),
            (locaux["LOC-VCN-11"], usagers_etudiants[5], 5, "Le meilleur cafe Touba du campus VCN ! Beignets bien chauds des 07h du matin."),
            (locaux["LOC-VCN-26"], usagers_etudiants[6], 5, "Le thieb rouge aux legumes et poisson frais est un regal absolu. Merci au chef !"),
            (locaux["LOC-VCN-27"], usagers_etudiants[7], 5, "Depots et retraits Wave toujours disponibles meme en fin de mois quand les bourses tombent."),
            (locaux["LOC-VCN-28"], usagers_etudiants[8], 4, "Reliure soignee pour mon memoire de licence en sciences economiques."),
            (locaux["LOC-VCN-31"], usagers_etudiants[9], 5, "Cafe Touba bien dose au poivre de Selim (Djar) avec beignets croustillants."),
            (locaux["LOC-VCN-33"], usagers_etudiants[10], 4, "Bonne coupe et salon climatisé, tres agreable."),
            (locaux["LOC-VCN-34"], usagers_etudiants[11], 5, "Le jus de Bouye au lait concentre est exceptionnel."),
        ]
        for loc, dem, note, comm in avis_data:
            AvisCantine.objects.create(
                local=loc,
                auteur=dem,
                note_etoiles=note,
                commentaire=comm,
                statut=StatutAvis.PUBLIE,
            )

        # Avis a moderer pour la cellule de communication
        avis_data_en_attente = [
            (locaux["LOC-VCN-06"], usagers_etudiants[0], 5, "Espace numerique tres bien equipe, connexion haut debit parfaite pour les recherches.", StatutAvis.SIGNALE),
            (locaux["LOC-VCN-12"], usagers_etudiants[0], 4, "Jus de Ditakh et Bissap bien sucres, tres frais a la pause de 10h.", StatutAvis.SIGNALE),
            (locaux["LOC-VCN-18"], usagers_etudiants[1], 1, "Beignets un peu trop gras aujourd'hui.", StatutAvis.SIGNALE),
        ]
        for loc, dem, note, comm, stat_a in avis_data_en_attente:
            AvisCantine.objects.create(
                local=loc,
                auteur=dem,
                note_etoiles=note,
                commentaire=comm,
                statut=stat_a,
            )

        notifs_global = [
            (comptes_metier["candidat"], "Votre candidature N° CAND-2026-0002 pour le Kiosque Jus Bio a recu un avis FAVORABLE de la commission."),
            (comptes_metier["candidat"], "Votre carte d'etudiant UIDT a ete verifiee et validee par le Bureau du Courrier."),
            (comptes_metier["candidat"], "Complement requis pour le dossier CAND-2026-0003 : veuillez joindre un devis d'amenagement."),
            (comptes_metier["occupant"], "Votre paiement Wave de 120 000 FCFA a ete valide. Votre quitus fiscal officiel N° QUITUS-202602 est pret."),
            (comptes_metier["occupant"], "Le technicien plombier a cloture avec succes votre signalement de fuite."),
            (comptes_metier["etudiant"], "Votre convention d'incubation etudiante 100% subventionnee (0 FCFA) a ete renouvelee pour 12 mois."),
            (comptes_metier["courrier"], "3 nouveaux dossiers de candidature physiques sont en attente d'enregistrement."),
            (comptes_metier["agent_dcuve"], "5 nouveaux dossiers a instruire pour l'appel a candidatures Session 2026."),
            (comptes_metier["dcuve"], "La commission d'attribution N°1 est programmee pour le 25 du mois."),
            (comptes_metier["commission"], "Le proces-verbal de la session d'attribution est pret pour signature finale."),
            (comptes_metier["juridique"], "3 projets de baux commerciaux ont ete generes et sont prets pour signature."),
            (comptes_metier["comptable"], "180 transactions Wave & Orange Money traitees avec succes pour ce mois."),
            (comptes_metier["technique"], "Nouvelle intervention planifiee pour Abdoulaye Wade (Electricite Pavillon Lat Dior)."),
            (comptes_metier["terrain"], "Ordre de mission N°1 assigne : verification des installations et terrasses."),
            (comptes_metier["qhse"], "Inspection inopinee programmee au restaurant central de l'amphi."),
            (comptes_metier["communication"], "3 nouveaux avis cantines en attente de moderation sur la vitrine."),
            (comptes_metier["amicale"], "Le reversement mensuel de 15% (18 000 FCFA) a ete credite sur le compte de l'Amicale."),
        ]
        for dest, msg in notifs_global:
            Notification.objects.create(
                destinataire=dest,
                contenu=msg,
                canal=CanalNotification.EMAIL,
                est_lue=False,
            )

        audits_data = [
            (admin, "INITIALISATION_SYSTEME", "Base SyLOC-T", "Chargement complet du referentiel domanial et des 50 locaux VCN."),
            (admin, "ATTRIBUTION_LOCAL", "LOC-VCN-01", "Attribution officielle de la Cantine Centrale au GIE Teranga."),
            (comptes_metier["dcuve"], "VALIDATION_RECEVABILITE", "CAND-2026-0002", "Dossier declare recevable pour le Kiosque Jus Bio."),
            (comptes_metier["commission"], "SIGNATURE_BAIL", "CT-2025-0001", "Signature electronique du bail commercial par le Directeur CROUS-T."),
            (comptes_metier["juridique"], "REDACTION_CONTRAT", "CT-2025-0002", "Generation du contrat de bail conforme au modele officiel CROUS-T."),
            (comptes_metier["comptable"], "ENCAISSEMENT_WAVE", "WAV-SN-849201", "Paiement de 45 000 FCFA valide via passerelle Wave Money."),
            (comptes_metier["courrier"], "ENREGISTREMENT_COURRIER", "CR-2026-001", "Reception physique et enregistrement au registre d'arrivee."),
            (comptes_metier["courrier"], "VALIDATION_CARTE", "ETU-UIDT-2026-9999", "Validation de la carte etudiante UIDT pour Ousmane Sonko Sarr."),
            (comptes_metier["technique"], "CLOTURE_INTERVENTION", "INT-MAINT-001", "Reparation de la fuite bac a graisse terminee par le plombier."),
            (comptes_metier["qhse"], "INSPECTION_SANITAIRE", "LOC-VCN-26", "Inspection restaurant amphi : Note 5/5 Hygiene conforme."),
            (comptes_metier["terrain"], "RAPPORT_VISITE", "LOC-VCN-05", "Rapport decadaire : constat d'occupation transmis a la commission."),
            (comptes_metier["communication"], "PUBLICATION_ANNONCE", "ANN-2026-01", "Publication de l'appel a candidatures sur la vitrine officielle."),
            (comptes_metier["amicale"], "REVERSEMENT_PERCU", "REV-AMIC-2026-01", "Validation du reversement 15% pour les locaux sous gestion Amicale."),
        ]
        for u, act, cib, det in audits_data:
            JournalAudit.objects.create(utilisateur=u, action=act, cible=cib, details=det)

    def _afficher_resume(self):
        self.stdout.write(self.style.SUCCESS("Resume du chargement SyLOC-T (CROUS-T) :"))
        self.stdout.write(f"  Utilisateurs actifs          : {Utilisateur.objects.count()}")
        self.stdout.write(f"  Demandeurs enregistres       : {Demandeur.objects.count()}")
        self.stdout.write(f"  Locaux du patrimoine VCN     : {Local.objects.count()}")
        self.stdout.write(f"  Appels a candidatures        : {AppelCandidature.objects.count()}")
        self.stdout.write(f"  Demandes & Dossiers traites  : {Demande.objects.count()}")
        self.stdout.write(f"  Contrats & Baux commerciaux  : {Contrat.objects.count()}")
        self.stdout.write(f"  Echeances financieres        : {Echeance.objects.count()}")
        self.stdout.write(f"  Paiements Wave/OM/Especes    : {Paiement.objects.count()}")
        self.stdout.write(f"  Plaintes & Signalements      : {Plainte.objects.count()}")
        self.stdout.write(f"  Ordres de mission terrain    : {OrdreMission.objects.count()}")
        self.stdout.write(f"  Inspections QHSE & Salubrite : {InspectionQHse.objects.count()}")
        self.stdout.write(f"  Interventions Maintenance    : {InterventionMaintenance.objects.count()}")
        self.stdout.write(f"  Rapports de visite (10 jrs)  : {RapportVisiteTerrain.objects.count()}")
        self.stdout.write(f"  Annonces officielles vitrine : {Annonce.objects.count()}")
        self.stdout.write("\nIdentifiants de connexion aux differents roles (mot de passe = identifiant) :")
        self.stdout.write("  - Super Admin SI        : admin / admin")
        self.stdout.write("  - Etudiant Titulaire    : etudiant / etudiant")
        self.stdout.write("  - Occupant Commercant   : occupant / occupant")
        self.stdout.write("  - Bureau du Courrier    : courrier / courrier")
        self.stdout.write("  - Agent DCUVE           : agent_dcuve / agent_dcuve")
        self.stdout.write("  - Directeur DCUVE       : dcuve / dcuve")
        self.stdout.write("  - Directeur CROUS-T     : commission / commission")
        self.stdout.write("  - Service Juridique     : juridique / juridique")
        self.stdout.write("  - Service Comptable     : comptable / comptable")
        self.stdout.write("  - Service Technique     : technique / technique")
        self.stdout.write("  - Agent de Terrain      : terrain / terrain")
        self.stdout.write("  - Inspectrice QHSE      : qhse / qhse")
        self.stdout.write("  - Cellule Communication : communication / communication")
        self.stdout.write("  - Amicale des Etudiants : amicale / amicale")
        self.stdout.write("  - Electricien Batiment  : tech_elec / electricien")
        self.stdout.write("  - Plombier Sanitaire    : tech_plomb / plombier")
