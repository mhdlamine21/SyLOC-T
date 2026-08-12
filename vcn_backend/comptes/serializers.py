# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur, RoleUtilisateur, Demandeur, Notification, JournalAudit


def generer_mot_de_passe():
    from django.utils.crypto import get_random_string
    return get_random_string(12)


def role_effectif(user):
    """Renvoie le role utilise par le frontend.

    Un USAGER qui possede un contrat actif est vu comme OCCUPANT (il a acces
    a l'espace occupant : paiements, quitus, signalements...).
    """
    role = user.role
    if role == RoleUtilisateur.USAGER:
        from contrats.models import Contrat
        if hasattr(user, 'profil_demandeur') and Contrat.objects.filter(
            demandeur=user.profil_demandeur, est_actif=True
        ).exists():
            role = 'OCCUPANT'
    return role


class DemandeurSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(source='utilisateur.nom_complet', read_only=True)
    email = serializers.EmailField(source='utilisateur.email', read_only=True)

    class Meta:
        model = Demandeur
        fields = '__all__'
        read_only_fields = (
            'id', 'date_creation', 'date_modification', 'utilisateur',
            'statut_verification_etudiant', 'carte_etudiant_date_validation',
            'valide_par', 'score_fidelite',
        )


class UtilisateurSerializer(serializers.ModelSerializer):
    """Lecture / mise a jour d'un compte (back-office Administrateur SI)."""
    role_effectif = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Utilisateur
        fields = (
            'id', 'username', 'email', 'nom_complet', 'role', 'role_effectif',
            'is_active', 'is_staff', 'date_joined', 'last_login',
            'delegation_active', 'delegation_expiration', 'password',
        )
        read_only_fields = ('id', 'date_joined', 'last_login', 'is_staff')

    def get_role_effectif(self, obj):
        return role_effectif(obj)

    def create(self, validated_data):
        password = validated_data.pop('password', None) or generer_mot_de_passe()
        user = Utilisateur.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class MeSerializer(serializers.ModelSerializer):
    """Profil de l'utilisateur connecte (GET/PATCH /comptes/me/)."""
    role_effectif = serializers.SerializerMethodField()
    profil_demandeur = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = (
            'id', 'username', 'email', 'nom_complet', 'role', 'role_effectif',
            'is_active', 'date_joined', 'profil_demandeur',
        )
        read_only_fields = ('id', 'username', 'role', 'is_active', 'date_joined')

    def get_role_effectif(self, obj):
        return role_effectif(obj)

    def get_profil_demandeur(self, obj):
        profil = getattr(obj, 'profil_demandeur', None)
        if not profil:
            return None
        return {
            'id': str(profil.id),
            'contact': profil.contact,
            'est_etudiant': profil.est_etudiant,
            'matricule_etudiant': profil.matricule_etudiant,
            'statut_verification_etudiant': profil.statut_verification_etudiant,
            'carte_etudiant_fichier': profil.carte_etudiant_fichier.url if profil.carte_etudiant_fichier else None,
            'score_fidelite': profil.score_fidelite,
        }


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField()
    nouveau_mot_de_passe = serializers.CharField(min_length=8)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'date_creation', 'date_modification', 'destinataire')


class JournalAuditSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.nom_complet', read_only=True)
    utilisateur_role = serializers.CharField(source='utilisateur.role', read_only=True)

    class Meta:
        model = JournalAudit
        fields = (
            'id', 'date_creation', 'action', 'cible', 'details',
            'utilisateur', 'utilisateur_nom', 'utilisateur_role',
        )


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription publique : cree le compte USAGER + son profil Demandeur."""
    password = serializers.CharField(write_only=True, min_length=6)
    nom_complet = serializers.CharField(required=True)
    contact = serializers.CharField(required=False, allow_blank=True, write_only=True)
    est_etudiant = serializers.BooleanField(required=False, default=False, write_only=True)
    matricule_etudiant = serializers.CharField(required=False, allow_blank=True, write_only=True)
    carte_etudiant_fichier = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Utilisateur
        fields = (
            'username', 'email', 'password', 'nom_complet',
            'contact', 'est_etudiant', 'matricule_etudiant', 'carte_etudiant_fichier',
        )

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe deja avec cet email.")
        return value

    def validate(self, attrs):
        if attrs.get('est_etudiant') and not attrs.get('matricule_etudiant'):
            raise serializers.ValidationError(
                {"matricule_etudiant": "Le matricule est obligatoire pour un etudiant."}
            )
        return attrs

    def create(self, validated_data):
        contact = validated_data.pop('contact', '')
        est_etudiant = validated_data.pop('est_etudiant', False)
        matricule = validated_data.pop('matricule_etudiant', '')
        carte = validated_data.pop('carte_etudiant_fichier', None)

        user = Utilisateur.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            nom_complet=validated_data['nom_complet'],
            role=RoleUtilisateur.USAGER,
        )
        from .models import StatutVerificationEtudiant
        Demandeur.objects.create(
            utilisateur=user,
            contact=contact,
            est_etudiant=est_etudiant,
            matricule_etudiant=matricule or None,
            carte_etudiant_fichier=carte,
            statut_verification_etudiant=(
                StatutVerificationEtudiant.EN_ATTENTE if (est_etudiant and carte)
                else StatutVerificationEtudiant.NON_SOUMIS
            ),
        )
        return user

    def to_representation(self, instance):
        return MeSerializer(instance, context=self.context).data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login par email OU username, avec role et nom dans le token."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False
        self.fields['email'] = serializers.CharField(required=False)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = role_effectif(user)
        token['nom_complet'] = user.nom_complet
        return token

    def validate(self, attrs):
        # Le frontend envoie { email, password } : on retrouve le username.
        identifiant = attrs.get(self.username_field) or self.initial_data.get('email') \
            or self.initial_data.get('username')
        if not identifiant:
            raise serializers.ValidationError(
                {"email": "Renseignez votre email ou votre nom d'utilisateur."}
            )
        if self.username_field not in attrs or not attrs.get(self.username_field):
            user = Utilisateur.objects.filter(email__iexact=identifiant).first() \
                or Utilisateur.objects.filter(username__iexact=identifiant).first()
            attrs[self.username_field] = user.username if user else identifiant
        attrs.pop('email', None)

        data = super().validate(attrs)
        data['user'] = MeSerializer(self.user, context=self.context).data
        return data
