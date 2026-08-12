from rest_framework import serializers
from .models import Echeance, ModePaiement, Paiement

class EcheanceSerializer(serializers.ModelSerializer):
    # Champs derives : ils evitent au frontend de recharger le contrat et le
    # local pour afficher l'echeancier ou imprimer un quitus.
    local_reference = serializers.CharField(source='contrat.local.reference', read_only=True)
    local_localisation = serializers.CharField(source='contrat.local.localisation', read_only=True)
    occupant_nom = serializers.CharField(
        source='contrat.demandeur.utilisateur.nom_complet', read_only=True
    )

    class Meta:
        model = Echeance
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut']

class PaiementSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='echeance.contrat.local.reference', read_only=True)
    occupant_nom = serializers.CharField(
        source='echeance.contrat.demandeur.utilisateur.nom_complet', read_only=True
    )
    date_exigibilite = serializers.DateField(source='echeance.date_exigibilite', read_only=True)

    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'date_paiement', 'reference_quitus']

class ReglerEcheanceSerializer(serializers.Serializer):
    echeance_id = serializers.UUIDField()
    montant_regle = serializers.FloatField()
    mode = serializers.ChoiceField(choices=ModePaiement.choices)
    reference_transaction = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
