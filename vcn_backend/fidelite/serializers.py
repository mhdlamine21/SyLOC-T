from rest_framework import serializers
from .models import HistoriqueScore

class HistoriqueScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueScore
        fields = '__all__'
