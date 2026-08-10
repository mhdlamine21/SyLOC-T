GUIDE COMPLET DE RÉALISATION — DOCUMENT UNIQUE FINAL

Système intégré de gestion de l’occupation du site VCN — CROUS-T

Licence 3 Génie Logiciel — Semestre 5 — Data Processing / BDA

Stack : Django + DRF + MySQL + React/Vite · Équipes : Backend (3) / Frontend (3) · Durée : 10 jours



Sommaire de ce document : 1. Organisation générale et setup (2 équipes) 2. Guide détaillé Équipe Backend — modèles, endpoints, logique métier complète 3. Guide détaillé Équipe Frontend — écrans, composants, logique complète 4. Déploiement, documentation finale, soutenance 5. Addendum — rôles superadmin/admin, sanction levée, journal d’audit, intégration Annuaire Scolarité 6. Analyse complémentaire — plan d’exécution, revue d’architecture, sécurité de base

Ce document remplace et regroupe tous les livrables précédents (guide 2 équipes, addendum, analyse complémentaire) en un seul fichier.

GUIDE COMPLET DE RÉALISATION — VERSION FINALE

Système intégré de gestion de l’occupation du site VCN — CROUS-T

Django + DRF + MySQL + React/Vite — Équipe Backend (3) / Équipe Frontend (3)

Ce guide reflète le diagramme de classe corrigé final (issu du grill complet : score de fidélité, anti-fraude des avis, géolocalisation, commission, critères pondérés, délégation, sanctions découplées du contrat). Si une tâche n’est pas listée ici alors qu’elle l’était dans un guide précédent, c’est qu’elle n’a pas changé — se référer au guide “2 équipes” antérieur pour le détail mot à mot (setup Git, Docker, cheat-sheets). Ce document se concentre sur ce qui est nouveau ou modifié, avec le code complet à chaque fois.



PARTIE 1.1 — Organisation générale : ce qui ne change pas (rappel express)

Organisation en 2 équipes de 3, coordination par sync quotidien à 13h, “lead du jour” tournant.

Dépôt monorepo, branches feature/be-* / feature/fe-*, PR systématique.

MySQL (pas Postgres), docker-compose.yml avec service db MySQL 8.

Rituel quotidien : matin (pull + Monday), soir (Journal de bord + statut Monday).

Annexes Git/Django/React/Monday/Colab/Google Docs du guide précédent : toujours valables telles quelles.

PARTIE 1.2 — Ce qui change structurellement (issu du grill)



PARTIE 1.3 — Répartition finale des rôles

Équipe Backend : | Sous-rôle | Modules | |—|—| | BE-A | accounts (Utilisateur + Demandeur + vérification étudiante) + demandes (Demande + Dossier + Historique + AppelCandidature + CritereAppel + Commission) | | BE-B | patrimoine (Local) + contrats (Contrat + Echeance + Paiement) | | BE-C | terrain (Plainte + InspectionQHse + Sanction + AvisCantine) + notifications + rapports + Colab + CI + déploiement |

Équipe Frontend : | Sous-rôle | Écrans | |—|—| | FE-A | Auth, vitrine, dépôt de demande (+ upload carte étudiante), suivi, instruction DCUVE, commission (vote) | | FE-B | Contrats, espace occupant, espace comptable | | FE-C | Terrain/QHSE, avis cantine, validation carte étudiante, dashboard Direction, polish + déploiement + Google Docs |

Modèle MySQL — rappel de config (voir guide précédent pour le détail complet)

DATABASES = {'default': {'ENGINE': 'django.db.backends.mysql', 'NAME': 'vcn_db',
    'USER': 'vcn_user', 'PASSWORD': 'vcn_pass', 'HOST': 'db', 'PORT': '3306',
    'OPTIONS': {'charset': 'utf8mb4'}}}

PARTIE 2 — ÉQUIPE BACKEND : CODE COMPLET DU MODÈLE FINAL

JOUR 1 — Tous les modèles (les 3 en parallèle, ordre de dépendance respecté)

09:00 — BE-A : accounts (avec vérification étudiante)

📝 backend/accounts/models.py

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class RoleUtilisateur(models.TextChoices):
    USAGER = 'USAGER', 'Usager'
    BUREAU_COURRIER = 'BUREAU_COURRIER', 'Bureau du Courrier'
    AGENT_DCUVE = 'AGENT_DCUVE', 'Agent DCUVE'
    DIRECTEUR_DCUVE = 'DIRECTEUR_DCUVE', 'Directeur DCUVE'
    DIRECTEUR_CROUS_T = 'DIRECTEUR_CROUS_T', 'Directeur CROUS-T'
    SERVICE_JURIDIQUE = 'SERVICE_JURIDIQUE', 'Service Juridique'
    SERVICE_COMPTABLE = 'SERVICE_COMPTABLE', 'Service Comptable'
    AGENT_TERRAIN = 'AGENT_TERRAIN', 'Agent de Terrain'
    AGENT_HSE = 'AGENT_HSE', 'Agent HSE'
    CELLULE_COMMUNICATION = 'CELLULE_COMMUNICATION', 'Cellule Communication'
    AMICALE = 'AMICALE', 'Amicale'
    # Note : pas de rôle "SERVICE_HYGIENE" — ce service reste externe, sans compte (cf. Partie A.2)


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('role', RoleUtilisateur.DIRECTEUR_CROUS_T)
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    id_utilisateur = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    nom_complet = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=RoleUtilisateur.choices)
    date_creation = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Délégation temporaire (cf. grill : indisponibilité du Directeur)
    delegation_active = models.BooleanField(default=False)
    delegation_expiration = models.DateTimeField(null=True, blank=True)

    objects = UtilisateurManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role', 'nom_complet']

    def peut_decider_comme_directeur(self):
        """Un Directeur CROUS-T peut toujours décider. Un Directeur DCUVE ne le peut
        que si une délégation est active et non expirée."""
        from django.utils import timezone
        if self.role == RoleUtilisateur.DIRECTEUR_CROUS_T:
            return True
        if self.role == RoleUtilisateur.DIRECTEUR_DCUVE and self.delegation_active:
            return self.delegation_expiration is None or self.delegation_expiration > timezone.now()
        return False

    def __str__(self):
        return f"{self.nom_complet} ({self.role})"


class StatutVerificationEtudiant(models.TextChoices):
    NON_SOUMIS = 'NON_SOUMIS', 'Non soumis'
    EN_ATTENTE = 'EN_ATTENTE', 'En attente de validation'
    VALIDE = 'VALIDE', 'Validé'
    REJETE = 'REJETE', 'Rejeté'


class Demandeur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='profil_demandeur')
    contact = models.CharField(max_length=50)
    est_etudiant = models.BooleanField(default=False)
    matricule_etudiant = models.CharField(max_length=50, blank=True, null=True)
    carte_etudiant_fichier = models.FileField(upload_to='cartes_etudiant/', blank=True, null=True)
    statut_verification_etudiant = models.CharField(
        max_length=20, choices=StatutVerificationEtudiant.choices,
        default=StatutVerificationEtudiant.NON_SOUMIS)
    carte_etudiant_date_validation = models.DateTimeField(null=True, blank=True)
    valide_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='demandeurs_valides')
    score_fidelite = models.FloatField(default=5.0)

    def peut_laisser_avis(self):
        """Règle du grill : seuls les étudiants au statut VÉRIFIÉ peuvent noter une cantine."""
        return self.est_etudiant and self.statut_verification_etudiant == StatutVerificationEtudiant.VALIDE

    def __str__(self):
        return self.utilisateur.nom_complet

⌨️

python manage.py makemigrations accounts
git add . && git commit -m "feat(accounts): Utilisateur (délégation) + Demandeur (vérification étudiante)"
git push -u origin feature/be-setup

10:00 — BE-B : patrimoine (inchangé dans sa logique, ajout zone_cartographie)

📝 backend/patrimoine/models.py

import uuid
from django.db import models

class TypeLocal(models.TextChoices):
    RESTAURATION = 'RESTAURATION', 'Restauration'
    MULTISERVICES = 'MULTISERVICES', 'Multiservices'
    PAPETERIE = 'PAPETERIE', 'Papeterie'
    ARTISANAT = 'ARTISANAT', 'Artisanat'
    AUTRE = 'AUTRE', 'Autre'

class EtatLocal(models.TextChoices):
    BON_ETAT = 'BON_ETAT', 'Bon état'
    NECESSITE_RENOVATION = 'NECESSITE_RENOVATION', 'Nécessite rénovation'
    DEGRADE = 'DEGRADE', 'Dégradé'
    EN_TRAVAUX = 'EN_TRAVAUX', 'En travaux'

class Gestionnaire(models.TextChoices):
    CROUS_T = 'CROUS_T', 'CROUS-T'
    AMICALE = 'AMICALE', 'Amicale'

class Local(models.Model):
    id_local = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    localisation = models.CharField(max_length=200)
    type_local = models.CharField(max_length=30, choices=TypeLocal.choices)
    zone_cartographie = models.CharField(max_length=50, blank=True)  # ex. "Bloc-A" — hook léger pour une future carte
    surface_m2 = models.FloatField()
    capacite_accueil = models.PositiveIntegerField(default=0)
    etat_physique = models.CharField(max_length=30, choices=EtatLocal.choices, default=EtatLocal.BON_ETAT)
    gestionnaire = models.CharField(max_length=20, choices=Gestionnaire.choices, default=Gestionnaire.CROUS_T)
    est_libre = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.reference} ({self.type_local})"

⌨️

python manage.py makemigrations patrimoine
git add . && git commit -m "feat(patrimoine): modèle Local"
git push -u origin feature/be-patrimoine

📣 “Local est prêt” à BE-A dès que mergé.

11:00 — BE-A : demandes (avec avis sanitaire externe, historique typé, appel + critères)

📝 backend/demandes/models.py

import uuid
from django.db import models
from accounts.models import Demandeur, Utilisateur
from patrimoine.models import Local


class TypeDemande(models.TextChoices):
    RENOVATION = 'RENOVATION', 'Rénovation'
    CONSTRUCTION_CANDIDAT = 'CONSTRUCTION_CANDIDAT', 'Construction (candidat)'
    CONSTRUCTION_CROUST = 'CONSTRUCTION_CROUST', 'Construction (CROUS-T)'
    VENTE_PRODUIT = 'VENTE_PRODUIT', 'Vente de produits'
    PRESTATION_SERVICE = 'PRESTATION_SERVICE', 'Prestation de service'
    LOCAL_ARTISANAL = 'LOCAL_ARTISANAL', 'Local artisanal'


class StatutDemande(models.TextChoices):
    EN_ATTENTE = 'EN_ATTENTE', 'En attente'
    MITIGEE_COMPLEMENT = 'MITIGEE_COMPLEMENT', 'Mitigée - complément demandé'
    FAVORABLE = 'FAVORABLE', 'Favorable'
    DEFAVORABLE = 'DEFAVORABLE', 'Défavorable'


class AvisSanitaireExterne(models.TextChoices):
    NON_CONCERNE = 'NON_CONCERNE', 'Non concerné'
    EN_ATTENTE = 'EN_ATTENTE', 'En attente'
    FAVORABLE = 'FAVORABLE', 'Favorable'
    DEFAVORABLE = 'DEFAVORABLE', 'Défavorable'


class AppelCandidature(models.Model):
    id_appel = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    publie_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='appels_publies')
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name='appels')
    date_lancement = models.DateField()
    date_cloture = models.DateField(null=True, blank=True)
    description = models.TextField()
    est_actif = models.BooleanField(default=True)


class TypeCritere(models.TextChoices):
    GENRE = 'GENRE', 'Genre'
    TRANCHE_AGE = 'TRANCHE_AGE', "Tranche d'âge"
    EXPERIENCE_PREALABLE = 'EXPERIENCE_PREALABLE', 'Expérience préalable'
    AUTRE = 'AUTRE', 'Autre'


class CritereAppel(models.Model):
    """⚠️ RÈGLE NON NÉGOCIABLE : un critère ne sert JAMAIS à exclure un dossier.
    Il alimente uniquement un score de tri d'affichage (voir demandes/services.py::calculer_score_correspondance).
    Ne jamais utiliser ces critères dans une clause .filter()/WHERE — uniquement dans un tri (.order_by / sorted)."""
    appel = models.ForeignKey(AppelCandidature, on_delete=models.CASCADE, related_name='criteres')
    type_critere = models.CharField(max_length=30, choices=TypeCritere.choices)
    valeur_cible = models.CharField(max_length=100)
    poids = models.PositiveSmallIntegerField(default=1)
    actif = models.BooleanField(default=True)


class Demande(models.Model):
    id_demande = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    demandeur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name='demandes')
    date_depot = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=30, choices=TypeDemande.choices)
    statut = models.CharField(max_length=30, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE)

    appel = models.ForeignKey(AppelCandidature, on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes')
    candidature_directe_sur = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True,
                                                  related_name='candidatures_directes')
    concerne_renovation_de = models.ForeignKey('contrats.Contrat', on_delete=models.SET_NULL, null=True, blank=True,
                                                 related_name='demandes_renovation')

    # Avis sanitaire externe (Service d'Hygiène — externe, sans compte, saisi manuellement par un Agent DCUVE)
    avis_sanitaire_externe = models.CharField(max_length=20, choices=AvisSanitaireExterne.choices,
                                                default=AvisSanitaireExterne.NON_CONCERNE)
    date_avis_sanitaire = models.DateField(null=True, blank=True)
    reference_avis_sanitaire = models.CharField(max_length=100, blank=True)

    def verifier_recevabilite(self):
        return self.dossier.est_complet

    def enregistrer_avis_sanitaire_externe(self, avis, reference, auteur: Utilisateur):
        """Saisi par un Agent DCUVE au vu du document reçu du Service d'Hygiène (hors système)."""
        self.avis_sanitaire_externe = avis
        self.reference_avis_sanitaire = reference
        self.date_avis_sanitaire = timezone.now().date()
        self.save()


class Dossier(models.Model):
    demande = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='dossier')
    pieces_recepissees = models.BooleanField(default=False)
    est_complet = models.BooleanField(default=False)


class HistoriqueStatutDemande(models.Model):
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='historique')
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    horodatage = models.DateTimeField(auto_now_add=True)
    ancien_statut = models.CharField(max_length=30, choices=StatutDemande.choices)
    nouveau_statut = models.CharField(max_length=30, choices=StatutDemande.choices)
    commentaire_acteur = models.TextField(blank=True)


# ===================== COMMISSION (vote consultatif) =====================
class MembreCommission(models.Model):
    """Rôle additionnel : n'importe quel Utilisateur peut être désigné, ce n'est pas un nouveau compte."""
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='memberships_commission')
    date_designation = models.DateField(auto_now_add=True)
    actif = models.BooleanField(default=True)


class AvisCommission(models.TextChoices):
    FAVORABLE = 'FAVORABLE', 'Favorable'
    DEFAVORABLE = 'DEFAVORABLE', 'Défavorable'
    ABSTENTION = 'ABSTENTION', 'Abstention'


class VoteCommission(models.Model):
    membre = models.ForeignKey(MembreCommission, on_delete=models.CASCADE, related_name='votes')
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='votes_commission')
    date_vote = models.DateTimeField(auto_now_add=True)
    avis = models.CharField(max_length=20, choices=AvisCommission.choices)
    commentaire = models.TextField(blank=True)

    class Meta:
        unique_together = ('membre', 'demande')  # un membre ne vote qu'une fois par dossier

⌨️

python manage.py makemigrations demandes
git add . && git commit -m "feat(demandes): Demande, Dossier, Historique, AppelCandidature, CritereAppel, Commission"
git push

14:00 — BE-B : contrats (signature bilatérale, gratuité persistée)

📝 backend/contrats/models.py

import uuid
from django.db import models
from accounts.models import Demandeur, Utilisateur
from patrimoine.models import Local

class ModePaiement(models.TextChoices):
    MOBILE_MONEY = 'MOBILE_MONEY', 'Mobile Money'
    VIREMENT = 'VIREMENT', 'Virement'
    ESPECES = 'ESPECES', 'Espèces'
    CHEQUE = 'CHEQUE', 'Chèque'

class StatutEcheance(models.TextChoices):
    NON_ECHUE = 'NON_ECHUE', 'Non échue'
    EXIGIBLE = 'EXIGIBLE', 'Exigible'
    PAYEE = 'PAYEE', 'Payée'
    EN_RETARD = 'EN_RETARD', 'En retard'

class Contrat(models.Model):
    id_contrat = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    titulaire = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name='contrats')
    signe_pour_crous_t = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True,
                                             related_name='contrats_signes')  # le Directeur, signature bilatérale
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name='contrats')
    date_signature = models.DateField()
    date_debut = models.DateField()
    duree_mois = models.PositiveIntegerField()
    preavis_mois = models.PositiveIntegerField(default=2)  # cf. matrice : préavis de résiliation de 2 mois
    redevance_mensuelle = models.FloatField()
    montant_caution = models.FloatField(default=0)
    est_gratuit = models.BooleanField(default=False)
    est_actif = models.BooleanField(default=True)
    date_resiliation = models.DateField(null=True, blank=True)
    motif_resiliation = models.TextField(blank=True)

    def appliquer_gratuite_etudiante(self):
        if self.local.type_local == 'ARTISANAT' and self.titulaire.est_etudiant:
            self.est_gratuit = True
            self.redevance_mensuelle = 0
            self.save()

class Echeance(models.Model):
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='echeances')
    date_exigibilite = models.DateField()
    montant_du = models.FloatField()
    montant_penalite = models.FloatField(default=0)
    statut = models.CharField(max_length=20, choices=StatutEcheance.choices, default=StatutEcheance.NON_ECHUE)

class Paiement(models.Model):
    id_paiement = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    echeance = models.ForeignKey(Echeance, on_delete=models.CASCADE, related_name='paiements')
    date_paiement = models.DateTimeField(auto_now_add=True)
    montant_regle = models.FloatField()
    mode = models.CharField(max_length=20, choices=ModePaiement.choices)
    reference_transaction = models.CharField(max_length=100, blank=True)
    reference_quitus = models.CharField(max_length=100, blank=True)

⌨️

python manage.py makemigrations contrats
git add . && git commit -m "feat(contrats): Contrat (signature bilatérale, gratuité persistée), Echeance, Paiement"
git push

11:00 (parallèle) — BE-C : terrain et notifications (le gros morceau : Sanction multi-source)

📝 backend/terrain/models.py

import uuid
from django.db import models
from accounts.models import Utilisateur, Demandeur
from patrimoine.models import Local
from contrats.models import Contrat

class TypeSignalement(models.TextChoices):
    TECHNIQUE = 'TECHNIQUE', 'Technique'
    NON_CONFORMITE_QHSE = 'NON_CONFORMITE_QHSE', 'Non-conformité QHSE'
    ENVIRONNEMENT = 'ENVIRONNEMENT', 'Environnement'
    DENONCIATION_ILLEGALE = 'DENONCIATION_ILLEGALE', 'Dénonciation occupation illégale'

class NiveauUrgence(models.TextChoices):
    FAIBLE = 'FAIBLE', 'Faible'
    MOYENNE = 'MOYENNE', 'Moyenne'
    ELEVEE = 'ELEVEE', 'Élevée'

class StatutPlainte(models.TextChoices):
    OUVERTE = 'OUVERTE', 'Ouverte'
    EN_COURS_TRAITEMENT = 'EN_COURS_TRAITEMENT', 'En cours de traitement'
    RESOLUE = 'RESOLUE', 'Résolue'
    REJETEE = 'REJETEE', 'Rejetée'

class Plainte(models.Model):
    id_plainte = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='plaintes_deposees')
    traite_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='plaintes_traitees')
    # Optionnel : une dénonciation d'occupation illégale peut ne viser AUCUN Local enregistré
    local = models.ForeignKey(Local, on_delete=models.CASCADE, null=True, blank=True, related_name='plaintes')
    localisation_libre = models.CharField(max_length=255, blank=True)  # utilisé si local est vide

    type = models.CharField(max_length=30, choices=TypeSignalement.choices)
    statut = models.CharField(max_length=30, choices=StatutPlainte.choices, default=StatutPlainte.OUVERTE)
    urgence = models.CharField(max_length=10, choices=NiveauUrgence.choices, default=NiveauUrgence.MOYENNE)
    date_depot = models.DateTimeField(auto_now_add=True)
    date_resolution = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    photo_preuve = models.ImageField(upload_to='plaintes/', blank=True, null=True)
    est_anonyme = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.local and not self.localisation_libre:
            raise ValueError("Une Plainte doit avoir soit un Local, soit une localisation libre.")
        super().save(*args, **kwargs)

    def auteur_affiche(self):
        """Anonymat partiel (cf. grill) : l'auteur reste en base, mais n'est jamais exposé
        publiquement ni à l'agent traitant si est_anonyme=True. Seul le Directeur peut le consulter."""
        return None if self.est_anonyme else self.auteur


class TypeControleQHSE(models.TextChoices):
    SANITAIRE = 'SANITAIRE', 'Sanitaire'
    TECHNIQUE = 'TECHNIQUE', 'Technique'
    ELECTRIQUE = 'ELECTRIQUE', 'Électrique'

class InspectionQHse(models.Model):
    id_inspection = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    inspecteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='inspections')
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name='inspections')
    type_controle = models.CharField(max_length=20, choices=TypeControleQHSE.choices)
    date_visite = models.DateTimeField(auto_now_add=True)
    est_conforme = models.BooleanField()
    observations = models.TextField(blank=True)
    # Géolocalisation : preuve de présence, non bloquante (cf. grill)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)


class NiveauSanction(models.TextChoices):
    AVERTISSEMENT = 'AVERTISSEMENT', 'Avertissement'
    RAPPEL_A_L_ORDRE = 'RAPPEL_A_L_ORDRE', "Rappel à l'ordre"
    CONVOCATION = 'CONVOCATION', 'Convocation'
    EXPULSION = 'EXPULSION', 'Expulsion'

class Sanction(models.Model):
    """Peut naître d'une InspectionQHse OU d'une Plainte — jamais uniquement du Contrat.
    C'est ce qui permet de sanctionner une occupation ILLÉGALE (sans contrat)."""
    id_sanction = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name='sanctions')
    contrat = models.ForeignKey(Contrat, on_delete=models.SET_NULL, null=True, blank=True, related_name='sanctions')
    inspection = models.ForeignKey(InspectionQHse, on_delete=models.SET_NULL, null=True, blank=True)
    plainte = models.ForeignKey(Plainte, on_delete=models.SET_NULL, null=True, blank=True)
    prononcee_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='sanctions_prononcees')
    niveau = models.CharField(max_length=30, choices=NiveauSanction.choices)
    date_application = models.DateTimeField(auto_now_add=True)
    motif = models.TextField()


class StatutAvis(models.TextChoices):
    PUBLIE = 'PUBLIE', 'Publié'
    SIGNALE = 'SIGNALE', 'Signalé'
    MASQUE = 'MASQUE', 'Masqué'

class AvisCantine(models.Model):
    auteur = models.ForeignKey(Demandeur, on_delete=models.CASCADE, related_name='avis')
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name='avis')
    note_etoiles = models.PositiveSmallIntegerField()
    commentaire = models.TextField()
    date_publication = models.DateTimeField(auto_now_add=True)
    date_derniere_modification = models.DateTimeField(auto_now=True)
    statut = models.CharField(max_length=20, choices=StatutAvis.choices, default=StatutAvis.PUBLIE)

    class Meta:
        unique_together = ('auteur', 'local')  # 1 avis par (étudiant, local) — règle anti-spam du grill

⌨️

python manage.py makemigrations terrain
git add . && git commit -m "feat(terrain): Plainte (localisation libre + anonymat), InspectionQHse (géoloc), Sanction (multi-source), AvisCantine (unicité)"
git push -u origin feature/be-terrain-notifs-rapports



JOUR 2 — Auth + vérification étudiante + API Demande

BE-A

git checkout develop && git pull
git checkout -b feature/be-auth-api

Auth JWT — identique au guide précédent (voir Annexe B).

Endpoint de vérification étudiante (accounts/views.py) :

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Demandeur, StatutVerificationEtudiant

class DemandeurViewSet(viewsets.ModelViewSet):
    queryset = Demandeur.objects.all()
    serializer_class = DemandeurSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='soumettre-carte-etudiant')
    def soumettre_carte_etudiant(self, request):
        demandeur = request.user.profil_demandeur
        demandeur.carte_etudiant_fichier = request.FILES['fichier']
        demandeur.statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
        demandeur.save()
        return Response({'statut': demandeur.statut_verification_etudiant})

    @action(detail=True, methods=['post'], url_path='valider-carte-etudiant',
            permission_classes=[permissions.IsAuthenticated])  # restreindre à AGENT_DCUVE en prod
    def valider_carte_etudiant(self, request, pk=None):
        demandeur = self.get_object()
        decision = request.data.get('decision')  # 'VALIDE' ou 'REJETE'
        demandeur.statut_verification_etudiant = decision
        demandeur.carte_etudiant_date_validation = timezone.now()
        demandeur.valide_par = request.user
        demandeur.save()
        return Response({'statut': demandeur.statut_verification_etudiant})

API Demande — identique au guide précédent pour le CRUD de base ; ajoutez l’avis sanitaire :

    @action(detail=True, methods=['post'], url_path='avis-sanitaire')
    def enregistrer_avis_sanitaire(self, request, pk=None):
        demande = self.get_object()
        demande.enregistrer_avis_sanitaire_externe(
            avis=request.data.get('avis'),
            reference=request.data.get('reference', ''),
            auteur=request.user,
        )
        return Response({'avis_sanitaire_externe': demande.avis_sanitaire_externe})

⌨️

python manage.py test accounts demandes
git add . && git commit -m "feat(accounts,demandes): vérification carte étudiante + avis sanitaire externe"
git push



JOUR 3 — Instruction, appel + critères pondérés, commission

BE-A (journée complète)

Recevabilité + complément — identique au guide précédent.

Tri pondéré des critères — le point le plus sensible du projet, à coder avec précaution :

📝 backend/demandes/services.py

def calculer_score_correspondance(demande, appel):
    """⚠️ Ce score sert UNIQUEMENT à trier l'affichage des dossiers pour la commission.
    Il ne doit JAMAIS être utilisé dans une clause de filtrage (.filter()) — un dossier
    avec un score de 0 doit rester visible et décidable, exactement comme les autres."""
    score = 0
    for critere in appel.criteres.filter(actif=True):
        valeur_demandeur = _extraire_valeur(demande.demandeur, critere.type_critere)
        if valeur_demandeur == critere.valeur_cible:
            score += critere.poids
    return score

def _extraire_valeur(demandeur, type_critere):
    # À adapter selon les champs réellement disponibles sur Demandeur/Utilisateur
    mapping = {
        'EXPERIENCE_PREALABLE': 'OUI' if demandeur.contrats.exists() else 'NON',
    }
    return mapping.get(type_critere)

📝 backend/demandes/views.py (extrait) :

    @action(detail=False, methods=['get'], url_path='triees')
    def demandes_triees(self, request):
        appel_id = request.query_params.get('appel')
        demandes = self.get_queryset()
        if appel_id:
            appel = AppelCandidature.objects.get(pk=appel_id)
            demandes = sorted(demandes, key=lambda d: calculer_score_correspondance(d, appel), reverse=True)
        # ⚠️ AUCUN .filter() sur les critères ici — le tri seul, jamais l'exclusion.
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

Commission :

class MembreCommissionViewSet(viewsets.ModelViewSet):
    queryset = MembreCommission.objects.all()
    serializer_class = MembreCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]  # restreindre à DIRECTEUR_CROUS_T pour la création

class VoteCommissionViewSet(viewsets.ModelViewSet):
    queryset = VoteCommission.objects.all()
    serializer_class = VoteCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        membre = MembreCommission.objects.get(utilisateur=self.request.user, actif=True)
        serializer.save(membre=membre)  # unique_together empêche un double vote

Décision finale, tenant compte de la délégation :

    @action(detail=True, methods=['post'])
    def decider(self, request, pk=None):
        demande = self.get_object()
        if not request.user.peut_decider_comme_directeur():
            return Response({'erreur': 'Droits insuffisants (ni Directeur, ni délégation active).'}, status=403)
        ancien = demande.statut
        demande.statut = request.data.get('decision')
        demande.save()
        HistoriqueStatutDemande.objects.create(
            demande=demande, auteur=request.user, ancien_statut=ancien,
            nouveau_statut=demande.statut, commentaire_acteur=request.data.get('commentaire', ''))
        return Response({'statut': demande.statut})

⌨️

git add . && git commit -m "feat(demandes): tri pondéré (non filtrant), commission, décision avec délégation"
git push -u origin feature/be-demandes-instruction



JOUR 4 — Contrats (signature bilatérale) & Paiements

BE-B (journée complète)

class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.all()
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        contrat = serializer.save(signe_pour_crous_t=self.request.user)  # signature bilatérale
        contrat.appliquer_gratuite_etudiante()
        if not contrat.est_gratuit:
            self._generer_echeancier(contrat)

    def _generer_echeancier(self, contrat):
        from dateutil.relativedelta import relativedelta
        for i in range(contrat.duree_mois):
            Echeance.objects.create(
                contrat=contrat,
                date_exigibilite=contrat.date_debut + relativedelta(months=i),
                montant_du=contrat.redevance_mensuelle)

Le reste (paiement, quitus, résiliation) — identique au guide précédent.



JOUR 5 — Terrain : signalement, inspection géolocalisée, sanction multi-source

BE-C (journée complète)

Signalement technique par l’occupant (auto-rattaché à son local, pas de saisie de position) :

class PlainteViewSet(viewsets.ModelViewSet):
    queryset = Plainte.objects.all()
    serializer_class = PlainteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        data = serializer.validated_data
        if data.get('type') == TypeSignalement.TECHNIQUE:
            # L'occupant signale sur SON local : on le retrouve via son contrat actif, jamais une saisie libre
            contrat_actif = self.request.user.profil_demandeur.contrats.filter(est_actif=True).first()
            serializer.save(auteur=self.request.user, local=contrat_actif.local if contrat_actif else None)
        else:
            # DENONCIATION_ILLEGALE : la localisation libre est déjà dans validated_data si pas de Local
            serializer.save(auteur=self.request.user)

Inspection avec capture GPS non bloquante :

class InspectionQHseViewSet(viewsets.ModelViewSet):
    queryset = InspectionQHse.objects.all()
    serializer_class = InspectionQHseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # latitude/longitude arrivent du frontend (navigator.geolocation), peuvent être absentes
        serializer.save(inspecteur=self.request.user)

Sanction — le cœur du correctif du grill : peut naître d’une inspection OU d’une plainte, avec ou sans contrat :

class SanctionViewSet(viewsets.ModelViewSet):
    queryset = Sanction.objects.all()
    serializer_class = SanctionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        local = serializer.validated_data['local']
        contrat_actif = local.contrats.filter(est_actif=True).first()  # peut être None : occupation illégale
        serializer.save(prononcee_par=self.request.user, contrat=contrat_actif)

    @action(detail=True, methods=['post'])
    def depuis_inspection(self, request, pk=None):
        """Créer une sanction directement depuis une inspection non conforme (N22b du diagramme d'activité)."""
        inspection = InspectionQHse.objects.get(pk=request.data['inspection_id'])
        contrat_actif = inspection.local.contrats.filter(est_actif=True).first()
        sanction = Sanction.objects.create(
            local=inspection.local, inspection=inspection, contrat=contrat_actif,
            prononcee_par=request.user, niveau=request.data['niveau'], motif=request.data['motif'])
        return Response(SanctionSerializer(sanction).data, status=201)

⌨️

python manage.py test terrain
git add . && git commit -m "feat(terrain): signalement auto-rattaché, inspection géolocalisée, sanction multi-source"
git push -u origin feature/be-terrain-api



JOUR 6 — Avis cantine (anti-fraude complet) + Notifications + Rapports paramétrés

BE-C — le module le plus riche en règles métier de la semaine :

📝 backend/terrain/views.py (AvisCantine)

from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import PermissionDenied, ValidationError

class AvisCantineViewSet(viewsets.ModelViewSet):
    queryset = AvisCantine.objects.filter(statut=StatutAvis.PUBLIE)
    serializer_class = AvisCantineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        demandeur = self.request.user.profil_demandeur

        # Règle 1 : réservé aux étudiants au statut vérifié
        if not demandeur.peut_laisser_avis():
            raise PermissionDenied("Seuls les étudiants au statut vérifié peuvent laisser un avis.")

        # Règle 2 : commentaire obligatoire, 20 caractères minimum
        if len(serializer.validated_data.get('commentaire', '')) < 20:
            raise ValidationError("Le commentaire doit contenir au moins 20 caractères.")

        # Règle 3 : 1 avis par jour maximum, tous locaux confondus
        dernier_avis = AvisCantine.objects.filter(auteur=demandeur).order_by('-date_publication').first()
        if dernier_avis and dernier_avis.date_publication > timezone.now() - timedelta(days=1):
            raise ValidationError("Un seul nouvel avis par jour est autorisé.")

        # Règle 4 (unicité par local) : gérée nativement par unique_together sur le modèle
        serializer.save(auteur=demandeur)

    def perform_update(self, serializer):
        avis = self.get_object()
        # Cooldown de 30 jours avant de pouvoir modifier un avis existant
        if avis.date_derniere_modification > timezone.now() - timedelta(days=30):
            raise ValidationError("Vous ne pouvez modifier cet avis que 30 jours après sa dernière modification.")
        serializer.save()

    @action(detail=True, methods=['post'], url_path='signaler')
    def signaler(self, request, pk=None):
        avis = self.get_object()
        avis.statut = StatutAvis.SIGNALE
        avis.save()
        return Response({'statut': avis.statut})

    @action(detail=True, methods=['post'], url_path='moderer',
            permission_classes=[permissions.IsAuthenticated])  # restreindre à CELLULE_COMMUNICATION en prod
    def moderer(self, request, pk=None):
        avis = self.get_object()
        avis.statut = request.data.get('decision')  # PUBLIE ou MASQUE
        avis.save()
        return Response({'statut': avis.statut})

Rapports paramétrés par période (calcul à la volée, cf. grill) :

# backend/rapports/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from demandes.models import Demande
from contrats.models import Paiement, Echeance

class RapportView(APIView):
    def get(self, request):
        du = parse_date(request.query_params.get('du')) if request.query_params.get('du') else None
        au = parse_date(request.query_params.get('au')) if request.query_params.get('au') else None

        demandes = Demande.objects.all()
        if du: demandes = demandes.filter(date_depot__gte=du)
        if au: demandes = demandes.filter(date_depot__lte=au)

        return Response({
            'total_demandes': demandes.count(),
            'par_type': list(demandes.values('type').annotate(nombre=Count('id_demande'))),
            'taux_occupation': self._taux_occupation(),
            'paiements_en_retard': Echeance.objects.filter(statut='EN_RETARD').count(),
        })

    def _taux_occupation(self):
        from patrimoine.models import Local
        total = Local.objects.count()
        occupes = Local.objects.filter(est_libre=False).count()
        return round(occupes / total * 100, 1) if total else 0

✅ Endpoint : GET /api/rapports/?du=2026-03-01&au=2026-03-31 — même sans paramètres, renvoie tout.

⌨️

python manage.py test terrain rapports
git add . && git commit -m "feat(terrain): avis cantine anti-fraude complet ; feat(rapports): endpoint paramétré par période"
git push -u origin feature/be-rapports-api



JOUR 7 — Intégration

Identique au guide précédent : rebase, tests bout-en-bout, recette croisée, merge main.

Checklist de fin de projet — Équipe Backend

☐ Vérification étudiante fonctionnelle (upload → validation agent → déblocage droit d’avis + gratuité)

☐ Tri pondéré vérifié : aucun .filter() sur un critère nulle part dans le code

☐ Sanction testée dans les 2 cas : avec contrat actif ET sans contrat (occupation illégale)

☐ Les 4 règles anti-fraude des avis testées individuellement (unicité, cooldown, fréquence, longueur commentaire)

☐ Délégation testée : un Directeur DCUVE sans délégation active ne peut PAS décider

☐ Rapport testé avec et sans paramètres de période

PARTIE 3 — ÉQUIPE FRONTEND : CODE COMPLET DES NOUVEAUX ÉCRANS

JOUR 1-2 — Setup + Auth + Vitrine + Dépôt (identique au guide précédent)

Seul ajout au Jour 2 : le formulaire de dépôt de demande (FE-A) doit maintenant proposer l’upload de la carte étudiante au moment de l’inscription, pas seulement au dépôt d’une demande — c’est ce qui débloque à la fois la gratuité et le droit de laisser un avis plus tard.

📝 frontend/src/pages/Signup.jsx (extrait ajouté à l’écran d’inscription existant) :

export default function Signup() {
  const [estEtudiant, setEstEtudiant] = useState(false);
  const [carteFichier, setCarteFichier] = useState(null);
  // ... champs existants (nom, email, mot de passe) ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/accounts/register/', { /* ...champs... */ est_etudiant: estEtudiant });
    if (estEtudiant && carteFichier) {
      const form = new FormData();
      form.append('fichier', carteFichier);
      await api.post('/accounts/demandeurs/soumettre-carte-etudiant/', form,
        { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    // ... redirection ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* champs existants */}
      <label className="flex items-center gap-2 my-3">
        <input type="checkbox" checked={estEtudiant} onChange={(e) => setEstEtudiant(e.target.checked)} />
        Je suis étudiant(e)
      </label>
      {estEtudiant && (
        <div className="mb-4">
          <label className="block mb-2">Carte étudiante (photo ou PDF)</label>
          <input type="file" onChange={(e) => setCarteFichier(e.target.files[0])} />
          <p className="text-xs text-gray-500 mt-1">
            Vérifiée par un agent DCUVE avant de débloquer la gratuité sur les locaux artisanaux
            et le droit de laisser des avis.
          </p>
        </div>
      )}
      <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Créer mon compte</button>
    </form>
  );
}



JOUR 3 — Instruction DCUVE (avis sanitaire, tri pondéré) + Interface Commission

FE-A (journée complète)

Panneau “avis sanitaire externe” dans le dashboard DCUVE, visible uniquement si demande.type === 'VENTE_PRODUIT' :

function PanneauAvisSanitaire({ demande, onUpdated }) {
  const [avis, setAvis] = useState('FAVORABLE');
  const [reference, setReference] = useState('');

  if (demande.type !== 'VENTE_PRODUIT') return null;

  const enregistrer = async () => {
    await api.post(`/demandes/${demande.id_demande}/avis-sanitaire/`, { avis, reference });
    onUpdated();
  };

  return (
    <div className="border rounded p-4 my-3 bg-amber-50">
      <p className="text-sm font-semibold mb-2">Avis du Service d'Hygiène (transmis hors système)</p>
      <select value={avis} onChange={(e) => setAvis(e.target.value)} className="border p-2 rounded mr-2">
        <option value="FAVORABLE">Favorable</option>
        <option value="DEFAVORABLE">Défavorable</option>
      </select>
      <input placeholder="Référence du courrier/rapport" value={reference}
             onChange={(e) => setReference(e.target.value)} className="border p-2 rounded mr-2" />
      <button onClick={enregistrer} className="bg-amber-600 text-white px-3 py-2 rounded">Enregistrer</button>
    </div>
  );
}

Liste triée par critères pondérés (l’affichage change d’ordre, jamais le contenu de la liste) :

function ListeDossiersAppel({ appelId }) {
  const [dossiers, setDossiers] = useState([]);
  useEffect(() => {
    api.get(`/demandes/triees/?appel=${appelId}`).then((res) => setDossiers(res.data));
  }, [appelId]);
  // Le tri vient du backend — le frontend ne fait qu'afficher l'ordre reçu, sans jamais retirer un dossier.
  return dossiers.map((d) => <DossierCard key={d.id_demande} demande={d} />);
}

Interface Commission (vote) — nouvel écran CommissionVote.jsx :

export default function CommissionVote({ demandeId }) {
  const [avis, setAvis] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    api.get(`/demandes/${demandeId}/votes-commission/`).then((r) => setVotes(r.data));
  }, [demandeId]);

  const voter = async () => {
    await api.post('/demandes/votes-commission/', { demande: demandeId, avis, commentaire });
    const r = await api.get(`/demandes/${demandeId}/votes-commission/`);
    setVotes(r.data);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-3">Avis de la commission</h3>
      <div className="mb-4">
        {votes.map((v) => (
          <div key={v.id} className="flex justify-between border-b py-2 text-sm">
            <span>{v.membre_nom}</span>
            <span className={v.avis === 'FAVORABLE' ? 'text-green-600' : v.avis === 'DEFAVORABLE' ? 'text-red-600' : 'text-gray-500'}>
              {v.avis}
            </span>
          </div>
        ))}
      </div>
      <select value={avis} onChange={(e) => setAvis(e.target.value)} className="border p-2 rounded mr-2">
        <option value="FAVORABLE">Favorable</option>
        <option value="DEFAVORABLE">Défavorable</option>
        <option value="ABSTENTION">Abstention</option>
      </select>
      <input placeholder="Commentaire" value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
             className="border p-2 rounded mr-2" />
      <button onClick={voter} className="bg-blue-600 text-white px-3 py-2 rounded">Voter</button>
    </div>
  );
}

⌨️

git add . && git commit -m "feat(frontend): avis sanitaire externe, tri pondéré, interface de vote commission"
git push -u origin feature/fe-instruction



JOUR 4 — Contrats & Paiements (identique au guide précédent)

Le seul changement visuel : afficher un badge “Contrat gratuit — statut étudiant” sur EspaceOccupant.jsx quand contrat.est_gratuit === true, et masquer la section paiement dans ce cas :

{contrat.est_gratuit ? (
  <div className="bg-green-50 border border-green-300 rounded p-4 my-3">
    ✓ Contrat gratuit (statut étudiant vérifié) — aucune redevance à régler.
  </div>
) : (
  <TableauEcheances echeances={contrat.echeances} />
)}



JOUR 5 — Terrain : signalement, dénonciation anonyme, validation carte étudiante

FE-C (journée complète)

Signalement technique (occupant, pas de position à saisir) :

export default function SignalerProbleme() {
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('MOYENNE');
  const [photo, setPhoto] = useState(null);

  const envoyer = async () => {
    const form = new FormData();
    form.append('type', 'TECHNIQUE');
    form.append('description', description);
    form.append('urgence', urgence);
    if (photo) form.append('photo_preuve', photo);
    // Pas de champ "local" : le backend le déduit automatiquement du contrat actif de l'occupant.
    await api.post('/terrain/plaintes/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Signaler un problème sur mon local</h1>
      <select value={urgence} onChange={(e) => setUrgence(e.target.value)} className="border p-2 rounded w-full mb-3">
        <option value="FAIBLE">Urgence faible</option>
        <option value="MOYENNE">Urgence moyenne</option>
        <option value="ELEVEE">Urgence élevée</option>
      </select>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème..." className="border p-2 rounded w-full mb-3" rows="4" />
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="mb-3" />
      <button onClick={envoyer} className="bg-red-600 text-white px-4 py-2 rounded w-full">Signaler</button>
    </div>
  );
}

Dénonciation anonyme d’occupation illégale — écran distinct, avec localisation libre et choix d’anonymat :

export default function DenoncerOccupationIllegale() {
  const [localisationLibre, setLocalisationLibre] = useState('');
  const [description, setDescription] = useState('');
  const [anonyme, setAnonyme] = useState(true);

  const envoyer = async () => {
    await api.post('/terrain/plaintes/', {
      type: 'DENONCIATION_ILLEGALE',
      localisation_libre: localisationLibre,
      description,
      est_anonyme: anonyme,
      urgence: 'MOYENNE',
    });
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">Signaler une occupation non autorisée</h1>
      <p className="text-sm text-gray-500 mb-4">
        Votre identité peut rester confidentielle — elle ne sera jamais visible par l'agent traitant
        ni par la personne concernée, sauf en cas d'abus avéré vérifié par la Direction.
      </p>
      <input placeholder="Où se situe le local ? (ex. près du Bloc D, côté terrain de basket)"
             value={localisationLibre} onChange={(e) => setLocalisationLibre(e.target.value)}
             className="border p-2 rounded w-full mb-3" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez la situation..." className="border p-2 rounded w-full mb-3" rows="4" />
      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={anonyme} onChange={(e) => setAnonyme(e.target.checked)} />
        Garder mon signalement anonyme
      </label>
      <button onClick={envoyer} className="bg-red-700 text-white px-4 py-2 rounded w-full">Envoyer le signalement</button>
    </div>
  );
}

Capture GPS lors d’une inspection (Agent HSE/Terrain) — non bloquant :

function useGeolocalisation() {
  const [position, setPosition] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return; // pas de blocage si indisponible
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setPosition(null) // échoue silencieusement, l'inspection reste soumettable
    );
  }, []);
  return position;
}

export default function NouvelleInspection({ localId }) {
  const position = useGeolocalisation();
  const [typeControle, setTypeControle] = useState('SANITAIRE');
  const [estConforme, setEstConforme] = useState(true);
  const [observations, setObservations] = useState('');

  const soumettre = async () => {
    await api.post('/terrain/inspections/', {
      local: localId, type_controle: typeControle, est_conforme: estConforme, observations,
      latitude: position?.latitude, longitude: position?.longitude, // undefined si échec, backend accepte
    });
  };

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-2">
        {position ? '📍 Position capturée' : 'Position non disponible — l\'inspection reste soumettable'}
      </p>
      {/* champs du formulaire */}
      <button onClick={soumettre} className="bg-blue-600 text-white px-4 py-2 rounded">Soumettre l'inspection</button>
    </div>
  );
}

Validation de la carte étudiante (Agent DCUVE) :

export default function ValidationCartesEtudiant() {
  const [demandeurs, setDemandeurs] = useState([]);
  useEffect(() => {
    api.get('/accounts/demandeurs/?statut_verification_etudiant=EN_ATTENTE').then((r) => setDemandeurs(r.data));
  }, []);

  const valider = async (id, decision) => {
    await api.post(`/accounts/demandeurs/${id}/valider-carte-etudiant/`, { decision });
    setDemandeurs(demandeurs.filter((d) => d.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Cartes étudiantes en attente</h1>
      {demandeurs.map((d) => (
        <div key={d.id} className="border rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="font-semibold">{d.nom_complet}</p>
            <a href={d.carte_etudiant_fichier} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">
              Voir la pièce jointe
            </a>
          </div>
          <div className="flex gap-2">
            <button onClick={() => valider(d.id, 'VALIDE')} className="bg-green-600 text-white px-3 py-2 rounded">Valider</button>
            <button onClick={() => valider(d.id, 'REJETE')} className="bg-red-600 text-white px-3 py-2 rounded">Rejeter</button>
          </div>
        </div>
      ))}
    </div>
  );
}

⌨️

git add . && git commit -m "feat(frontend): signalement technique, dénonciation anonyme, géoloc inspection, validation carte étudiante"
git push -u origin feature/fe-terrain



JOUR 6 — Avis cantine (règles visibles côté UI) + Dashboard Direction (période) + Sanctions

FE-C

Formulaire d’avis, avec les 4 règles explicites côté UI (pas juste côté serveur — l’utilisateur doit comprendre pourquoi un bouton est désactivé) :

export default function LaisserAvis({ localId, dernierAvis }) {
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const { estEtudiant, statutVerification } = useProfilDemandeur(); // hook existant

  const peutNoter = estEtudiant && statutVerification === 'VALIDE';
  const cooldownActif = dernierAvis && (Date.now() - new Date(dernierAvis.date_derniere_modification)) < 30 * 24 * 3600 * 1000;

  if (!peutNoter) {
    return <p className="text-sm text-gray-500">Seuls les étudiants au statut vérifié peuvent laisser un avis. 
      {statutVerification === 'EN_ATTENTE' && ' Votre carte étudiante est en cours de validation.'}
      {statutVerification === 'NON_SOUMIS' && ' Soumettez votre carte étudiante depuis votre profil.'}
    </p>;
  }

  return (
    <div className="p-4 border rounded">
      {[1,2,3,4,5].map((n) => (
        <button key={n} onClick={() => setNote(n)} className={n <= note ? 'text-amber-500' : 'text-gray-300'}>★</button>
      ))}
      <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} minLength={20}
                placeholder="Votre commentaire (20 caractères minimum)..." className="border p-2 rounded w-full my-3" />
      <p className="text-xs text-gray-500 mb-2">
        {commentaire.length}/20 caractères minimum · 1 avis par local · modifiable après 30 jours
      </p>
      <button disabled={cooldownActif || commentaire.length < 20}
              className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-40">
        {dernierAvis ? 'Modifier mon avis' : 'Publier mon avis'}
      </button>
    </div>
  );
}

Dashboard Direction avec sélecteur de période :

export default function DashboardDirection() {
  const [periode, setPeriode] = useState('mois');
  const [rapport, setRapport] = useState(null);

  const plagesDate = () => {
    const maintenant = new Date();
    if (periode === 'mois') return { du: new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString().slice(0,10) };
    if (periode === 'trimestre') return { du: new Date(maintenant.getFullYear(), maintenant.getMonth()-3, 1).toISOString().slice(0,10) };
    if (periode === 'annee') return { du: new Date(maintenant.getFullYear(), 0, 1).toISOString().slice(0,10) };
    return {};  // "depuis le début"
  };

  useEffect(() => {
    const { du } = plagesDate();
    api.get('/rapports/', { params: du ? { du } : {} }).then((r) => setRapport(r.data));
  }, [periode]);

  return (
    <div className="p-6">
      <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="border p-2 rounded mb-4">
        <option value="mois">Ce mois</option>
        <option value="trimestre">Ce trimestre</option>
        <option value="annee">Cette année</option>
        <option value="tout">Depuis le début</option>
      </select>
      {rapport && (/* cartes KPI + graphiques, identique au guide précédent */ null)}
    </div>
  );
}

⌨️

git add . && git commit -m "feat(frontend): règles avis visibles côté UI, dashboard direction avec sélecteur de période"
git push -u origin feature/fe-rapports



JOUR 7 — Intégration

Identique au guide précédent.

Checklist de fin de projet — Équipe Frontend

☐ Upload carte étudiante fonctionnel dès l’inscription

☐ Panneau avis sanitaire visible uniquement pour les demandes VENTE_PRODUIT

☐ Interface de vote commission fonctionnelle, affichage des votes existants

☐ Signalement technique n’affiche jamais de champ de sélection de local (auto-rattaché)

☐ Écran de dénonciation anonyme distinct de l’écran de signalement technique

☐ Capture GPS testée avec ET sans autorisation navigateur (les deux doivent permettre de soumettre)

☐ Formulaire d’avis : bouton désactivé + message clair pour chacune des 4 règles anti-fraude

☐ Dashboard Direction : les 4 options de période renvoient des résultats différents

PARTIE 4 — JOURS 8 À 10 : DÉPLOIEMENT, DOCUMENTATION, SOUTENANCE

Déploiement (Render MySQL + Vercel), finalisation des Google Docs, répétition de soutenance — identique au guide “2 équipes” antérieur. Un seul ajout à la checklist du Jour 9 :

Cahier de recette — lignes à ajouter pour les nouveaux cas d’usage (UC5b à UC33 du diagramme de cas d’usage corrigé) : - Vérification carte étudiante (soumission → validation agent → déblocage gratuité + avis) - Avis sanitaire externe (saisie manuelle par Agent DCUVE, uniquement sur VENTE_PRODUIT) - Tri pondéré (vérifier qu’un dossier à faible score reste bien visible et décidable, pas filtré) - Vote de commission (un membre ne peut voter qu’une fois par dossier) - Sanction sans contrat (occupation illégale — le cas qui a motivé toute la correction du diagramme de classe) - Les 4 règles anti-fraude sur les avis, testées une par une - Délégation : un Directeur DCUVE sans délégation active reçoit bien une erreur 403 sur decider()



ANNEXE — RAPPELS TECHNIQUES SPÉCIFIQUES À CETTE VERSION

Sur le tri pondéré (le point le plus sensible du projet)

Avant de merger toute Pull Request touchant CritereAppel ou calculer_score_correspondance, le relecteur (lead du jour) doit vérifier une seule chose : est-ce qu’un dossier avec un score de 0 apparaît toujours dans la liste ? Si la réponse est non, c’est un bug bloquant — pas un détail à corriger plus tard. C’est la seule règle de ce projet qui touche à un enjeu légal, pas seulement technique.

Sur la géolocalisation

Ne jamais rendre latitude/longitude obligatoires côté backend (null=True, blank=True déjà posé dans le modèle — ne pas le retirer). Un test à faire systématiquement avant de merger une PR touchant InspectionQHse ou Plainte : soumettre le formulaire avec la géolocalisation refusée par le navigateur, vérifier que ça passe quand même.

Sur l’anonymat des dénonciations

Plainte.est_anonyme ne doit jamais entraîner la suppression de Plainte.auteur en base — seulement son masquage dans les serializers/vues destinées à l’agent traitant et au public. Le champ auteur reste toujours renseigné, consultable uniquement par un compte DIRECTEUR_CROUS_T.

Sur la délégation

Utilisateur.delegation_active ne doit jamais être modifiable directement par l’utilisateur lui-même — seule une action initiée par un DIRECTEUR_CROUS_T peut l’activer sur un compte DIRECTEUR_DCUVE. Vérifier les permissions DRF sur cet endpoint avec la même rigueur que sur decider().



PARTIE 5 — ADDENDUM : RÔLES SUPERADMIN/ADMIN, SANCTION LEVÉE, JOURNAL D’AUDIT

Éléments nouveaux ou modifiés suite à la reconstruction complète du diagramme de cas d’utilisation (65 UC, 8 domaines).



1 — Deux rôles ajoutés, un renommé

📝 backend/accounts/models.py — à mettre à jour :

class RoleUtilisateur(models.TextChoices):
    USAGER = 'USAGER', 'Usager'
    BUREAU_COURRIER = 'BUREAU_COURRIER', 'Bureau du Courrier'
    AGENT_DCUVE = 'AGENT_DCUVE', 'Agent DCUVE'
    DIRECTEUR_DCUVE = 'DIRECTEUR_DCUVE', 'Directeur DCUVE'
    DIRECTEUR_CROUS_T = 'DIRECTEUR_CROUS_T', 'Directeur CROUS-T'
    SERVICE_JURIDIQUE = 'SERVICE_JURIDIQUE', 'Service Juridique'
    SERVICE_COMPTABLE = 'SERVICE_COMPTABLE', 'Service Comptable'
    SERVICE_TECHNIQUE = 'SERVICE_TECHNIQUE', 'Service Technique'          # NOUVEAU (était "Technicien")
    AGENT_TERRAIN = 'AGENT_TERRAIN', 'Agent de Terrain'
    AGENT_QHSE = 'AGENT_QHSE', 'Agent QHSE'                                # RENOMMÉ (était AGENT_HSE)
    CELLULE_COMMUNICATION = 'CELLULE_COMMUNICATION', 'Cellule Communication'
    AMICALE = 'AMICALE', 'Amicale'
    ADMINISTRATEUR_SI = 'ADMINISTRATEUR_SI', 'Administrateur SI'          # NOUVEAU

⚠️ Distinction non négociable, à faire comprendre à toute l’équipe : - ADMINISTRATEUR_SI = superadmin technique. Gère les comptes, les rôles, les paramètres système, consulte le journal d’audit. Correspond à is_superuser=True côté Django. - DIRECTEUR_CROUS_T = admin métier. Décide des attributions, sanctions, résiliations, pilote l’activité. N’a aucun droit technique sur les comptes des autres utilisateurs.

Ne jamais donner à DIRECTEUR_CROUS_T un accès à UC80 (gérer les comptes) ni à ADMINISTRATEUR_SI un accès à UC31 (décider de l’attribution) — même si en pratique la même personne pourrait cumuler les deux casquettes dans une petite structure, les deux comptes/rôles doivent rester séparés dans le système.

Si le renommage AGENT_HSE → AGENT_QHSE a déjà été appliqué par l’équipe (cf. modèle terrain), vérifier qu’aucune migration ni donnée de seed ne référence encore l’ancien nom.



2 — Sanction : ajout du statut (permet UC74 Lever une sanction)

Le modèle Sanction du guide précédent n’avait pas de statut — impossible de distinguer une sanction encore active d’une sanction levée.

📝 backend/terrain/models.py — à ajouter :

class StatutSanction(models.TextChoices):
    NOTIFIEE = 'NOTIFIEE', 'Notifiée'
    LEVEE = 'LEVEE', 'Levée'

class Sanction(models.Model):
    # ... champs existants (id_sanction, local, contrat, inspection, plainte, prononcee_par, niveau, motif) ...
    statut_sanction = models.CharField(max_length=20, choices=StatutSanction.choices, default=StatutSanction.NOTIFIEE)
    date_levee = models.DateTimeField(null=True, blank=True)
    levee_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='sanctions_levees')

    def lever(self, utilisateur):
        self.statut_sanction = StatutSanction.LEVEE
        self.date_levee = timezone.now()
        self.levee_par = utilisateur
        self.save()

📝 backend/terrain/views.py — à ajouter dans SanctionViewSet :

    @action(detail=True, methods=['post'], url_path='lever')
    def lever(self, request, pk=None):
        sanction = self.get_object()
        sanction.lever(request.user)
        return Response({'statut_sanction': sanction.statut_sanction})

Responsable : BE-C (module terrain, déjà en charge de Sanction).



3 — Journal d’audit (UC83) — nouvelle app légère

Ce n’est pas une réintroduction de tout un système de logs — juste une table simple pour tracer les actions transverses qui ne sont pas déjà couvertes par un historique métier existant (HistoriqueStatutDemande couvre déjà les demandes, pas besoin de dupliquer).

📝 backend/audit/models.py (nouvelle app) :

from django.db import models
from accounts.models import Utilisateur

class JournalAudit(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='actions_audit')
    action = models.CharField(max_length=100)   # ex. "ROLE_MODIFIE", "COMPTE_DESACTIVE", "CONNEXION"
    cible = models.CharField(max_length=100, blank=True)  # id de l'objet concerné
    horodatage = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)

📝 Fonction utilitaire réutilisable partout où une action sensible a lieu :

# backend/audit/services.py
from .models import JournalAudit

def tracer(utilisateur, action, cible='', details=''):
    JournalAudit.objects.create(utilisateur=utilisateur, action=action, cible=str(cible), details=details)

Exemple d’utilisation (dans accounts/views.py, à l’endroit où un rôle est modifié) :

from audit.services import tracer

def modifier_role(self, request, pk=None):
    utilisateur = self.get_object()
    ancien_role = utilisateur.role
    utilisateur.role = request.data.get('role')
    utilisateur.save()
    tracer(request.user, 'ROLE_MODIFIE', cible=utilisateur.id_utilisateur,
           details=f"{ancien_role} → {utilisateur.role}")
    return Response({'role': utilisateur.role})

Responsable : BE-A (proche du module accounts).



4 — Gestion des comptes par l’Administrateur SI (UC80)

📝 backend/accounts/views.py — nouveau viewset, réservé à ADMINISTRATEUR_SI :

class GestionComptesViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]  # + vérification role == ADMINISTRATEUR_SI

    def perform_update(self, serializer):
        if self.request.user.role != RoleUtilisateur.ADMINISTRATEUR_SI:
            raise PermissionDenied("Réservé à l'Administrateur SI.")
        serializer.save()
        tracer(self.request.user, 'COMPTE_MODIFIE', cible=serializer.instance.id_utilisateur)

    @action(detail=True, methods=['post'], url_path='desactiver')
    def desactiver(self, request, pk=None):
        utilisateur = self.get_object()
        utilisateur.is_active = False
        utilisateur.save()
        tracer(request.user, 'COMPTE_DESACTIVE', cible=utilisateur.id_utilisateur)
        return Response({'is_active': False})

Écran frontend correspondant (FE-C, à ajouter au Jour 6) : une simple table (nom, email, rôle, statut) avec un sélecteur de rôle et un bouton désactiver — même pattern que l’écran de validation des cartes étudiantes déjà prévu.



5 — Intégration Annuaire Scolarité (vérification automatique, avec secours manuel)

Bonne nouvelle découverte du diagramme de cas d’utilisation final : plutôt que de s’appuyer uniquement sur l’upload manuel de la carte étudiante (option retenue faute d’accès à une source officielle), vous avez accès à l’Annuaire Scolarité. Ordre de priorité à respecter dans le code :

# backend/accounts/services.py
def verifier_statut_etudiant(demandeur):
    resultat = _interroger_annuaire_scolarite(demandeur.matricule_etudiant)  # appel API externe
    if resultat is not None:
        demandeur.statut_verification_etudiant = 'VALIDE' if resultat else 'REJETE'
        demandeur.save()
        return True
    return False  # Annuaire indisponible ou matricule inconnu → on retombe sur le parcours manuel (UC08/UC09)

def _interroger_annuaire_scolarite(matricule):
    # À implémenter selon l'API réellement fournie par l'établissement.
    # Si aucun accès n'est confirmé à temps pour le Jour 2, retourner toujours None
    # (le système bascule automatiquement sur la vérification manuelle, déjà prévue).
    pass

⚠️ Si votre équipe n’a pas confirmé d’accès réel à l’Annuaire Scolarité d’ici le Jour 2, ne perdez pas de temps dessus : laissez _interroger_annuaire_scolarite retourner None systématiquement — le parcours manuel (upload + validation agent, déjà entièrement codé dans le guide précédent) reste pleinement fonctionnel seul. C’est explicitement conçu comme un rehaussement optionnel, pas une dépendance bloquante.



6 — Archivage (UC84)

📝 Ajout sur Demande (backend/demandes/models.py) :

    est_archive = models.BooleanField(default=False)

    def archiver(self):
        self.est_archive = True
        self.save()

Filtrer Demande.objects.filter(est_archive=False) par défaut dans les vues de liste, pour ne pas polluer les tableaux de bord avec les vieux dossiers.



7 — Récapitulatif des responsabilités ajoutées



PARTIE 6 — ANALYSE COMPLÉMENTAIRE : PLAN D’EXÉCUTION, ARCHITECTURE, SÉCURITÉ

Ne redonne pas le planning jour-par-jour (déjà couvert dans les parties précédentes) — prend du recul dessus avec trois regards différents avant que l’équipe ne code : gestion de projet, architecture, sécurité.



PARTIE 6.1 — Plan d’exécution (revue projet)

1.1 Résumé d’intake

La priorité 5 (performance) est volontairement en dernier : c’est un projet académique sans charge réelle, optimiser des requêtes pour un volume qui n’existera jamais serait du temps perdu.

1.2 Scope, formalisé une dernière fois

🟢 Must (bloque la soutenance si absent) : authentification par rôle, dépôt/instruction/décision de demande, contrats et échéancier, paiements, identification des locaux, signalement de base, sanction (avec ou sans contrat).

🟡 Should (attendu mais ne bloque pas) : commission et vote consultatif, critères de sélection pondérés, avis cantine avec les 4 règles anti-fraude, rapports filtrables par période, délégation du Directeur.

🔵 Can defer (après la soutenance si besoin) : intégration réelle de l’Annuaire Scolarité (le secours manuel suffit), export Excel en plus du PDF, mode sombre, carte interactive, notifications push.

⛔ Hors scope, à assumer explicitement : détection algorithmique de fraude coordonnée sur les avis, stockage de fichiers persistant hors du conteneur (voir risque 1.4), authentification multi-facteurs.

1.3 Décisions d’architecture à ne pas rouvrir en cours de route

1.4 Registre des risques

Le premier risque (stockage de fichiers) n’avait pas encore été identifié dans les documents précédents — c’est le principal apport de cette relecture côté planning.



PARTIE 6.2 — Revue d’architecture (mode scan, avant écriture du code)

Aucun code n’existe encore : cette revue porte sur les frontières de modules prévues dans le diagramme de classe et le guide technique, pour éviter de découvrir les problèmes après coup plutôt qu’avant. Trois points, classés par effet de levier.

1. Demande risque de devenir un module “large” plutôt que “profond”

Demande porte déjà : le workflow de statut, l’avis sanitaire externe, l’archivage, et sert de point d’attache à l’historique, aux votes de commission, à l’appel de candidature. Chaque nouvelle règle métier ajoutée directement comme méthode sur ce modèle (enregistrer_avis_sanitaire_externe(), archiver()) élargit son interface sans forcément la rendre plus utile à ses appelants — c’est le symptôme classique du “module large et peu profond”.

Recommandation concrète : garder Demande responsable uniquement de son propre cycle de statut. Déplacer la logique d’avis sanitaire et d’archivage vers demandes/services.py (vous avez déjà commencé ce pattern avec calculer_score_correspondance() — juste à le généraliser) :

# demandes/services.py
def enregistrer_avis_sanitaire(demande, avis, reference, auteur):
    demande.avis_sanitaire_externe = avis
    demande.reference_avis_sanitaire = reference
    demande.date_avis_sanitaire = timezone.now().date()
    demande.save()

Coût : quasi nul si appliqué dès le départ (J3), coûteux à corriger après coup si toute l’équipe a pris l’habitude d’empiler des méthodes sur le modèle.

2. La règle “tri, jamais un filtre” n’est protégée que par un commentaire

C’est la règle la plus sensible du projet (implication légale), et rien dans le code ne la fait respecter mécaniquement — un développeur pressé au Jour 6 pourrait très bien ajouter un .filter() sans relire le commentaire du Jour 3.

Recommandation concrète, réaliste pour 7 jours : un test unitaire obligatoire, pas une réécriture du système de types :

def test_dossier_score_zero_reste_visible():
    """Un dossier qui ne correspond à aucun critère doit rester dans la liste triée."""
    demande_sans_correspondance = creer_demande_test()
    resultat = demandes_triees(appel)
    assert demande_sans_correspondance in resultat

Ce test, une fois écrit, casse immédiatement si quelqu’un transforme le tri en filtre — c’est le test qui remplace la vigilance humaine.

3. Sanction connaît beaucoup de monde — c’est voulu, pas un défaut

Sanction référence Local, Contrat, InspectionQHse, Plainte et Utilisateur. Ça peut ressembler à un couplage fort, mais le test de suppression le confirme légitime : si Sanction disparaissait, on perdrait la capacité de tracer une expulsion jusqu’à son origine — exactement le problème de traçabilité que le projet devait résoudre. Aucune action requise ici, ce point est noté pour que l’équipe ne le “corrige” pas par erreur en pensant réduire du couplage.



PARTIE 6.3 — Sécurité de base (niveau académique, pas un audit de production)

3.1 Profil de sécurité du projet

Pas de note “critique” ici : c’est un projet pédagogique sans vraies données personnelles en jeu, la liste ci-dessous reste volontairement courte et actionnable en quelques heures, pas un audit exhaustif.

3.2 Points à vérifier avant la soutenance

3.3 Correctif concret : validation des fichiers uploadés

Deux endroits du projet acceptent un upload direct d’un usager non encore modéré : la carte étudiante et la photo de preuve d’un signalement. Sans validation, rien n’empêche l’upload d’un exécutable renommé en .jpg.

📝 backend/accounts/validators.py (nouveau, réutilisable partout où un fichier est accepté) :

from django.core.exceptions import ValidationError

TAILLE_MAX_MO = 5
TYPES_AUTORISES = {'image/jpeg', 'image/png', 'application/pdf'}

def valider_fichier_upload(fichier):
    if fichier.size > TAILLE_MAX_MO * 1024 * 1024:
        raise ValidationError(f"Fichier trop volumineux (max {TAILLE_MAX_MO} Mo).")
    if fichier.content_type not in TYPES_AUTORISES:
        raise ValidationError("Type de fichier non autorisé (JPEG, PNG ou PDF uniquement).")

Appliqué sur les champs concernés :

carte_etudiant_fichier = models.FileField(upload_to='cartes_etudiant/', validators=[valider_fichier_upload], blank=True, null=True)
photo_preuve = models.ImageField(upload_to='plaintes/', validators=[valider_fichier_upload], blank=True, null=True)

Responsable : BE-A pour carte_etudiant_fichier, BE-C pour photo_preuve — à ajouter le jour où chaque champ est codé (J2 et J5 respectivement), pas en rattrapage au J7.

3.4 Ce qui est volontairement laissé de côté

Rate limiting global, authentification à deux facteurs, rotation automatique des tokens JWT, chiffrement au repos de la base de données, tests de pénétration. Ces sujets sont réels pour une mise en production commerciale, hors de proportion pour un projet académique de 10 jours — les lister ici plutôt que les ignorer silencieusement permet de répondre avec assurance si la question est posée en soutenance : “nous avons identifié ces points, ils sont documentés comme hors scope pour cette version.”

---

# Mon Suivi Quotidien - Projet SyLOC-T (Backend)

Ce document est ta boussole. Ouvre-le tous les jours pour savoir où tu en es, ce qui est déjà fait, et ce qu'il te reste à accomplir. Coche les cases `[x]` au fur et à mesure de ta progression.

---

## 🎯 Ce qui est déjà terminé (Victoires passées)

- [x] Initialisation du projet Django et configuration MySQL.
- [x] Définition des rôles et de la séparation (Moi = Backend global / Personne 1 = Demandes).
- [x] **Domaine Comptes** : Création des modèles `Utilisateur`, `Demandeur`, `Notification`, `JournalAudit`.
- [x] **Domaine Comptes** : Tests unitaires de base validés.

---

## 🚀 ROADMAP : Ce qu'il reste à faire

*La règle d'or : On ne passe pas à l'étape suivante tant que l'étape en cours n'est pas testée et validée.*

### ÉTAPE 1 : Sécuriser l'accès (Le cœur du système)
*Ton objectif : Faire en sorte que n'importe qui puisse s'inscrire, se connecter et être reconnu selon son rôle.*
- [ ] Configurer JWT (JSON Web Tokens) pour l'authentification.
- [ ] Coder l'API d'inscription (`POST /api/comptes/register/`).
- [ ] Coder l'API de connexion (`POST /api/comptes/login/`).
- [ ] Tester les restrictions de sécurité (ex: bloquer un usager qui tente d'accéder à une route d'admin).

### ÉTAPE 2 : Le Patrimoine (La base des données)
*Ton objectif : Avoir des locaux dans la base pour pouvoir y affecter des contrats plus tard.*
- [ ] Créer le modèle `Local` avec tous ses attributs (type, surface, état).
- [ ] Coder les APIs pour ajouter, lister et modifier un local (`GET/POST/PUT /api/patrimoine/locaux/`).
- [ ] Tester la création d'un local en base.

### ÉTAPE 3 : Les Contrats et Finances
*Ton objectif : Lier un occupant à un local et gérer l'argent.*
- [ ] Créer les modèles `Contrat`, `Echeance`, et `Paiement`.
- [ ] Coder l'API pour générer un contrat d'attribution.
- [ ] Coder la logique qui génère automatiquement l'échéancier (les factures) quand un contrat est signé.
- [ ] Coder l'API de paiement (qui solde une échéance).

### ÉTAPE 4 : Exploitation et Terrain
*Ton objectif : Faire vivre les locaux (plaintes, hygiène, sanctions).*
- [ ] Créer les modèles `Plainte`, `InspectionQHse`, `Sanction`, `AvisCantine`.
- [ ] Coder l'API pour déposer et suivre une plainte.
- [ ] Coder l'API pour les agents QHSE (créer un rapport d'inspection).
- [ ] Coder la logique qui déclenche automatiquement une sanction si une inspection est mauvaise.

---

## 📖 Espace Apprentissage (À remplir)
*Ici, on notera les liens vers les fichiers d'explications pédagogiques que je te générerai à la fin de chaque grande étape.*

1. **Authentification JWT** : *(Fichier à venir une fois l'Étape 1 terminée)*
2. **Gestion des Modèles et Vues Django** : *(Fichier à venir...)*
3. **Logique métier complexe (Génération d'échéancier)** : *(Fichier à venir...)*
