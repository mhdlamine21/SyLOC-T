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

class DemandeSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    dossier = DossierSerializer(read_only=True)
    motif_complement = serializers.SerializerMethodField()
    score_moyen = serializers.SerializerMethodField()
    nb_votes = serializers.SerializerMethodField()
    
    class Meta:
        model = Demande
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut', 'date_depot', 'demandeur', 'notes_admin', 'reference_anonyme']

    def get_score_moyen(self, obj):
        votes = obj.votes.all()
        if not votes.exists():
            return None
        notes = []
        for v in votes:
            if v.note_formelle is not None: notes.append(v.note_formelle)
            if v.note_technique is not None: notes.append(v.note_technique)
        if notes:
            return round(sum(notes) / len(notes), 2)
        return None

    def get_nb_votes(self, obj):
        return obj.votes.count()

    def get_motif_complement(self, obj):
        if obj.statut == 'MITIGEE_COMPLEMENT':
            historique = obj.historique.filter(nouveau_statut='MITIGEE_COMPLEMENT').order_by('-date_creation').first()
            return historique.commentaire_acteur if historique else ""
        return None

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


class HistoriqueStatutDemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueStatutDemande
        fields = '__all__'

class VoteCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoteCommission
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'membre']
