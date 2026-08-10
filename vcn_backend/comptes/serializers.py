# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur, RoleUtilisateur

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    nom_complet = serializers.CharField(required=True)

    class Meta:
        model = Utilisateur
        fields = ('username', 'email', 'password', 'nom_complet')

    def create(self, validated_data):
        user = Utilisateur.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            nom_complet=validated_data['nom_complet'],
            role=RoleUtilisateur.USAGER
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['nom_complet'] = user.nom_complet
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses here
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'nom_complet': self.user.nom_complet
        }
        return data
