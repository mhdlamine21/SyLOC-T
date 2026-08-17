from rest_framework import serializers
from .models import Local, StatutOccupation

class LocalSerializer(serializers.ModelSerializer):
    statut_occupation = serializers.ChoiceField(choices=StatutOccupation.choices, read_only=True)
    statut_occupation_label = serializers.SerializerMethodField()

    class Meta:
        model = Local
        fields = '__all__'
        # La photo de vitrine est attribuee par le systeme selon le type de
        # local : elle n'est jamais saisie par l'agent qui cree la fiche.
        read_only_fields = ('photo_url',)

    def get_statut_occupation_label(self, obj):
        return dict(StatutOccupation.choices).get(obj.statut_occupation, obj.statut_occupation)
