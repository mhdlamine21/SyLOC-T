from rest_framework import serializers
from .models import Plainte, InspectionQHse, Sanction, AvisCantine

class PlainteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plainte
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'plaignant', 'date_resolution', 'statut']

class PlainteAgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plainte
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification']

class InspectionQHseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionQHse
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'inspecteur']

class SanctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sanction
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'date_application']

class AvisCantineSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    auteur_nom = serializers.CharField(source='auteur.utilisateur.nom_complet', read_only=True)

    class Meta:
        model = AvisCantine
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'auteur', 'statut']

    def validate(self, data):
        # Si une note est donnée, le commentaire est obligatoire
        if 'note_etoiles' in data and not data.get('commentaire', '').strip():
            raise serializers.ValidationError({"commentaire": "Vous devez rédiger un commentaire pour justifier votre note."})
        return data
