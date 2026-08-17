from rest_framework import serializers
from .models import (
    AppelCandidature, CritereAppel, Demande, Dossier, HistoriqueStatutDemande,
    VoteCommission, Document, MembreCommission, Commission, LotCommission,
)

class MembreCommissionSerializer(serializers.ModelSerializer):
    nom_membre = serializers.CharField(source='utilisateur.nom_complet', read_only=True)
    role_membre = serializers.CharField(source='utilisateur.role', read_only=True)

    class Meta:
        model = MembreCommission
        fields = '__all__'

class CritereAppelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CritereAppel
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'appel']

class AppelCandidatureSerializer(serializers.ModelSerializer):
    criteres = CritereAppelSerializer(many=True, read_only=True)
    # Les criteres peuvent etre poses des la publication de l'appel.
    criteres_input = CritereAppelSerializer(many=True, write_only=True, required=False)
    est_ouvert = serializers.BooleanField(read_only=True)
    nombre_candidatures = serializers.SerializerMethodField()
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    local_type = serializers.CharField(source='local.type_local', read_only=True)
    local_surface = serializers.FloatField(source='local.surface_m2', read_only=True)
    local_localisation = serializers.CharField(source='local.localisation', read_only=True)
    publie_par_nom = serializers.CharField(source='publie_par.nom_complet', read_only=True)

    class Meta:
        model = AppelCandidature
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'publie_par']

    def get_nombre_candidatures(self, obj):
        return obj.candidatures.count()

    def create(self, validated_data):
        criteres = validated_data.pop('criteres_input', [])
        appel = super().create(validated_data)
        for critere in criteres:
            CritereAppel.objects.create(appel=appel, **critere)
        return appel

class DemandeSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    statut_label = serializers.CharField(read_only=True)
    type_label = serializers.CharField(source='get_type_demande_display', read_only=True)
    appel_titre = serializers.CharField(source='appel_candidature.titre', read_only=True)
    est_cloturee = serializers.BooleanField(read_only=True)
    nombre_documents = serializers.SerializerMethodField()
    nb_renvois = serializers.SerializerMethodField()
    derniere_note_complement = serializers.SerializerMethodField()

    class Meta:
        model = Demande
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut', 'date_depot', 'demandeur', 'notes_admin', 'reference_anonyme']

    def get_nombre_documents(self, obj):
        dossier = getattr(obj, 'dossier', None)
        return dossier.documents.count() if dossier else 0

    def get_nb_renvois(self, obj):
        return obj.historique.filter(nouveau_statut='MITIGEE_COMPLEMENT').count()

    def get_derniere_note_complement(self, obj):
        dernier = obj.historique.filter(
            nouveau_statut='MITIGEE_COMPLEMENT'
        ).order_by('-date_creation').first()
        return dernier.commentaire_acteur if dernier else ''

class DemandeAnonymeSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'évaluation à l'aveugle par la commission.
    Le champ 'demandeur' est totalement masqué.
    """
    statut_label = serializers.CharField(read_only=True)
    type_label = serializers.CharField(source='get_type_demande_display', read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)

    class Meta:
        model = Demande
        # On exclut volontairement le demandeur
        exclude = ['demandeur']
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut', 'date_depot', 'notes_admin', 'reference_anonyme']


class DocumentSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_document_display', read_only=True)

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
    ancien_statut_label = serializers.CharField(source='get_ancien_statut_display', read_only=True)
    nouveau_statut_label = serializers.CharField(source='get_nouveau_statut_display', read_only=True)
    auteur_nom = serializers.CharField(source='auteur.nom_complet', read_only=True)
    auteur_role = serializers.CharField(source='auteur.role', read_only=True)

    class Meta:
        model = HistoriqueStatutDemande
        fields = '__all__'

class VoteCommissionSerializer(serializers.ModelSerializer):
    note_moyenne = serializers.FloatField(read_only=True)
    membre_nom = serializers.CharField(source='membre.utilisateur.nom_complet', read_only=True)
    avis_label = serializers.CharField(source='get_avis_display', read_only=True)
    reference_dossier = serializers.CharField(source='demande.reference_anonyme', read_only=True)
    # Permet a l'interface de recharger la position du membre connecte (revision de vote).
    est_mon_vote = serializers.SerializerMethodField()

    class Meta:
        model = VoteCommission
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'membre']

    def get_est_mon_vote(self, obj):
        request = self.context.get('request')
        utilisateur = getattr(request, 'user', None)
        if not utilisateur or not utilisateur.is_authenticated:
            return False
        return obj.membre_id is not None and obj.membre.utilisateur_id == utilisateur.id


class CommissionSerializer(serializers.ModelSerializer):
    membres = MembreCommissionSerializer(many=True, read_only=True)
    nb_membres = serializers.SerializerMethodField()

    class Meta:
        model = Commission
        fields = '__all__'
        read_only_fields = [
            'id', 'date_creation', 'date_modification', 'active', 'date_activation',
            'date_desactivation', 'motif_activation', 'commentaire_activation',
            'delegation_directeur', 'creee_par',
        ]

    def get_nb_membres(self, obj):
        return obj.membres.filter(actif=True).count()


class ArchivageSerializer(serializers.Serializer):
    motif_archivage = serializers.ChoiceField(choices=[
        ('AVIS_DEFAVORABLE', 'Avis défavorable'),
        ('DOSSIER_INCOMPLET', 'Dossier incomplet'),
        ('AUTRE', 'Autre'),
    ])
    commentaire = serializers.CharField(required=True, allow_blank=False)


class LotCommissionSerializer(serializers.ModelSerializer):
    demandes = DemandeSerializer(many=True, read_only=True)
    demandes_ids = serializers.PrimaryKeyRelatedField(
        source='demandes', many=True, queryset=Demande.objects.all(), write_only=True
    )
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    local_id = serializers.IntegerField(source='local.id', read_only=True)
    commission_nom = serializers.CharField(source='commission.nom', read_only=True)
    commission_active = serializers.BooleanField(source='commission.active', read_only=True)
    nb_demandes = serializers.SerializerMethodField()
    cree_par_nom = serializers.CharField(source='cree_par.nom_complet', read_only=True)

    class Meta:
        model = LotCommission
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'cree_par', 'commission', 'statut']

    def get_nb_demandes(self, obj):
        return obj.demandes.count()
