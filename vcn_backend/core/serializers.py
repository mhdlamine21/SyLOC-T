from rest_framework import serializers
from .models import Annonce, ParametreSysteme

class AnnonceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annonce
        fields = [
            'id', 'titre', 'contenu', 'date_publication', 'pin', 'bg',
            'est_active', 'statut', 'emetteur_nom', 'consigne_direction', 'date_creation',
        ]


class ParametreSystemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametreSysteme
        fields = ['id', 'cle', 'libelle', 'valeur', 'categorie', 'description',
                  'est_public', 'date_modification']
        read_only_fields = ['id', 'date_modification']
