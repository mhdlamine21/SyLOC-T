from rest_framework import serializers
from .models import Echeance, Paiement

class EcheanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Echeance
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut']

class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'date_paiement']

class ReglerEcheanceSerializer(serializers.Serializer):
    echeance_id = serializers.UUIDField()
    montant_regle = serializers.FloatField()
    mode = serializers.CharField(max_length=20)
    reference_transaction = serializers.CharField(max_length=100, required=False)
