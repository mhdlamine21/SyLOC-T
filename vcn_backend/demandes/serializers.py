from rest_framework import serializers
from .models import AppelCandidature, CritereAppel, Demande, Dossier, HistoriqueStatutDemande, VoteCommission, Document, MembreCommission

class MembreCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembreCommission
        fields = '__all__'

class CritereAppelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CritereAppel
        fields = '__all__'

class AppelCandidatureSerializer(serializers.ModelSerializer):
    criteres = CritereAppelSerializer(many=True, read_only=True)
    class Meta:
        model = AppelCandidature
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'publie_par']

class DemandeSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    
    class Meta:
        model = Demande
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut', 'date_depot', 'demandeur', 'notes_admin', 'reference_anonyme']

class DemandeAnonymeSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'évaluation à l'aveugle par la commission.
    Le champ 'demandeur' est totalement masqué.
    """
    class Meta:
        model = Demande
        # On exclut volontairement le demandeur
        exclude = ['demandeur']
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut', 'date_depot', 'notes_admin', 'reference_anonyme']


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'dossier', 'est_valide']

class DossierSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    class Meta:
        model = Dossier
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'demande', 'est_complet']

class HistoriqueStatutDemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueStatutDemande
        fields = '__all__'

class VoteCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoteCommission
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'membre']
