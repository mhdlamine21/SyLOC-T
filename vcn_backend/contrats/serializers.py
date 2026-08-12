from rest_framework import serializers
from .models import Contrat
from paiements.serializers import EcheanceSerializer

class ContratSerializer(serializers.ModelSerializer):
    echeances = EcheanceSerializer(many=True, read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    est_etudiant = serializers.BooleanField(source='demandeur.est_etudiant', read_only=True)

    class Meta:
        model = Contrat
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'est_actif',
                            'date_resiliation', 'motif_resiliation', 'signataire_crous_t']
