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


from .models import OrdreMission, InterventionMaintenance


class OrdreMissionSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    agent_nom = serializers.CharField(source='agent_assigne.nom_complet', read_only=True)
    emetteur_nom = serializers.CharField(source='emetteur.nom_complet', read_only=True)

    class Meta:
        model = OrdreMission
        fields = '__all__'
        read_only_fields = [
            'id', 'date_creation', 'date_modification', 'reference',
            'emetteur', 'statut', 'compte_rendu', 'inspection_resultat',
        ]


class InterventionMaintenanceSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    technicien_nom = serializers.CharField(source='technicien.nom_complet', read_only=True)

    class Meta:
        model = InterventionMaintenance
        fields = '__all__'
        read_only_fields = [
            'id', 'date_creation', 'date_modification',
            'statut', 'date_realisation', 'cout_reel', 'rapport',
        ]


# ── Phase 6 - rapports de visite terrain & dispatch fidelite ──────────────
from .models import RapportVisiteTerrain, DispatchFidelite, CADENCE_VISITE_JOURS  # noqa: E402


class RapportVisiteTerrainSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    local_localisation = serializers.CharField(source='local.localisation', read_only=True)
    agent_nom = serializers.CharField(source='agent.nom_complet', read_only=True)
    est_en_retard = serializers.BooleanField(read_only=True)
    cadence_jours = serializers.SerializerMethodField()

    class Meta:
        model = RapportVisiteTerrain
        fields = '__all__'
        read_only_fields = [
            'id', 'date_creation', 'date_modification', 'reference', 'agent',
            'statut', 'date_transmission', 'date_prochaine_visite',
        ]

    def get_cadence_jours(self, obj):
        return CADENCE_VISITE_JOURS


class DispatchFideliteSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    score_actuel = serializers.FloatField(source='demandeur.score_fidelite', read_only=True)
    agent_nom = serializers.CharField(source='agent_assigne.nom_complet', read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)

    class Meta:
        model = DispatchFidelite
        fields = '__all__'
        read_only_fields = [
            'id', 'date_creation', 'date_modification', 'reference',
            'demandeur_par', 'score_constate',
        ]
