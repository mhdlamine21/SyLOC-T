from rest_framework import serializers
from .models import Annonce

class AnnonceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annonce
        fields = ['id', 'titre', 'contenu', 'date_publication', 'pin', 'bg', 'est_active']
