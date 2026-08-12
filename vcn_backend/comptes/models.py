import uuid
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models
from core.models import BaseModel


class RoleUtilisateur(models.TextChoices):
    USAGER = "USAGER", "Usager"
    BUREAU_COURRIER = "BUREAU_COURRIER", "Bureau du Courrier"
    AGENT_DCUVE = "AGENT_DCUVE", "Agent DCUVE"
    DIRECTEUR_DCUVE = "DIRECTEUR_DCUVE", "Directeur DCUVE"
    DIRECTEUR_CROUS_T = "DIRECTEUR_CROUS_T", "Directeur CROUS-T"
    SERVICE_JURIDIQUE = "SERVICE_JURIDIQUE", "Service Juridique"
    SERVICE_COMPTABLE = "SERVICE_COMPTABLE", "Service Comptable"
    SERVICE_TECHNIQUE = "SERVICE_TECHNIQUE", "Service Technique"
    AGENT_TERRAIN = "AGENT_TERRAIN", "Agent de Terrain"
    AGENT_QHSE = "AGENT_QHSE", "Agent QHSE"
    CELLULE_COMMUNICATION = "CELLULE_COMMUNICATION", "Cellule Communication"
    AMICALE = "AMICALE", "Amicale"
    ADMINISTRATEUR_SI = "ADMINISTRATEUR_SI", "Administrateur SI"


class Utilisateur(AbstractUser):
    """
    Etend le User Django standard (garde username/password/is_active...)
    et ajoute le role métier + un id UUID pour rester cohérent avec
    les autres modèles du diagramme de classes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom_complet = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=RoleUtilisateur.choices, default=RoleUtilisateur.USAGER)
    delegation_active = models.BooleanField(default=False)
    delegation_expiration = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return f"{self.username} ({self.role})"


class StatutVerificationEtudiant(models.TextChoices):
    NON_SOUMIS = "NON_SOUMIS", "Non soumis"
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    VALIDE = "VALIDE", "Validé"
    REJETE = "REJETE", "Rejeté"


class Demandeur(BaseModel):
    """Profil metier complementaire pour un Utilisateur qui candidate."""
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="profil_demandeur")
    contact = models.CharField(max_length=50)
    est_etudiant = models.BooleanField(default=False)
    matricule_etudiant = models.CharField(max_length=50, blank=True, null=True)
    carte_etudiant_fichier = models.FileField(upload_to="cartes_etudiants/", blank=True, null=True)
    statut_verification_etudiant = models.CharField(
        max_length=32, 
        choices=StatutVerificationEtudiant.choices, 
        default=StatutVerificationEtudiant.NON_SOUMIS
    )
    carte_etudiant_date_validation = models.DateTimeField(null=True, blank=True)
    valide_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name="demandeurs_valides")
    score_fidelite = models.FloatField(default=0.0)

    @property
    def est_etudiant_verifie(self):
        return self.statut_verification_etudiant == StatutVerificationEtudiant.VALIDE and self.carte_etudiant_date_validation is not None

    def __str__(self):
        if self.utilisateur.nom_complet:
            return self.utilisateur.nom_complet
        return f"Demandeur: {self.utilisateur.username}"


class CanalNotification(models.TextChoices):
    SMS = "SMS", "SMS"
    EMAIL = "EMAIL", "Email"
    PUSH_APP = "PUSH_APP", "Notification push"


class Notification(BaseModel):
    """Service de notification generique, utilise par les autres apps."""
    destinataire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="notifications")
    contenu = models.TextField()
    canal = models.CharField(max_length=16, choices=CanalNotification.choices, default=CanalNotification.EMAIL)
    est_lue = models.BooleanField(default=False)

    def __str__(self):
        return f"Notif -> {self.destinataire} [{self.canal}]"


class JournalAudit(BaseModel):
    """Journalisation des actions transverses declenchees par les utilisateurs (UC80-84)."""
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name="audits")
    action = models.CharField(max_length=255)
    cible = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"Audit {self.action} par {self.utilisateur}"
