from rest_framework import serializers

from paiements.serializers import EcheanceSerializer

from .models import Contrat, ModeleContrat


class ModeleContratSerializer(serializers.ModelSerializer):
    """Gabarits de contrat geres par le Service Juridique (Phase 4)."""

    nb_contrats = serializers.SerializerMethodField()

    class Meta:
        model = ModeleContrat
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification']

    def get_nb_contrats(self, obj):
        return obj.contrats.count()


class ContratSerializer(serializers.ModelSerializer):
    echeances = EcheanceSerializer(many=True, read_only=True)
    local_reference = serializers.CharField(source='local.reference', read_only=True)
    local_localisation = serializers.CharField(source='local.localisation', read_only=True)
    demandeur_nom = serializers.CharField(source='demandeur.utilisateur.nom_complet', read_only=True)
    demandeur_contact = serializers.CharField(source='demandeur.contact', read_only=True)
    est_etudiant = serializers.BooleanField(source='demandeur.est_etudiant', read_only=True)
    signataire_nom = serializers.CharField(source='signataire_crous_t.nom_complet', read_only=True)
    modele_nom = serializers.CharField(source='modele.nom', read_only=True)

    # Phase 4 — donnees derivees utiles a l'edition/impression des actes.
    date_fin = serializers.DateField(read_only=True)
    date_fin_preavis = serializers.DateField(read_only=True)
    statut_libelle = serializers.CharField(source='get_statut_display', read_only=True)
    solde_restant = serializers.SerializerMethodField()
    nb_echeances_payees = serializers.SerializerMethodField()

    class Meta:
        model = Contrat
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'est_actif',
                            'date_resiliation', 'motif_resiliation', 'signataire_crous_t',
                            'reference', 'texte_contrat']

    def get_solde_restant(self, obj):
        return obj.solde_du()

    def get_nb_echeances_payees(self, obj):
        return obj.echeances.filter(statut='PAYEE').count()


class ResiliationSerializer(serializers.Serializer):
    """Acte de resiliation / rupture de bail (Service Juridique)."""

    motif = serializers.CharField()
    date_effet = serializers.DateField(required=False, allow_null=True)


class RedactionSerializer(serializers.Serializer):
    """Regeneration du corps de l'acte a partir d'un modele."""

    modele = serializers.UUIDField(required=False, allow_null=True)
    clauses_particulieres = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    objet = serializers.CharField(required=False, allow_blank=True, allow_null=True)
