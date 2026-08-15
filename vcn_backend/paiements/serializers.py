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
    # Phase 4 — soldes calcules cote serveur (source de verite du recouvrement).
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)
    montant_total_du = serializers.FloatField(read_only=True)
    montant_paye = serializers.FloatField(read_only=True)
    reste_a_payer = serializers.FloatField(read_only=True)
    statut_libelle = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Echeance
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'statut']


class PaiementSerializer(serializers.ModelSerializer):
    local_reference = serializers.CharField(source='echeance.contrat.local.reference', read_only=True)
    local_localisation = serializers.CharField(
        source='echeance.contrat.local.localisation', read_only=True
    )
    occupant_nom = serializers.CharField(
        source='echeance.contrat.demandeur.utilisateur.nom_complet', read_only=True
    )
    date_exigibilite = serializers.DateField(source='echeance.date_exigibilite', read_only=True)
    contrat_id = serializers.UUIDField(source='echeance.contrat.id', read_only=True)
    contrat_reference = serializers.CharField(source='echeance.contrat.reference', read_only=True)
    mode_libelle = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = ['id', 'date_creation', 'date_modification', 'date_paiement', 'reference_quitus', 'statut']

    def validate(self, data):
        mode = data.get('mode', getattr(self.instance, 'mode', None))
        numero_payeur = data.get('numero_payeur', getattr(self.instance, 'numero_payeur', None))
        if mode == ModePaiement.MOBILE_MONEY and not numero_payeur:
            raise serializers.ValidationError({
                'numero_payeur': "Le numero utilise pour le paiement mobile money est obligatoire."
            })
        return data


class ReglerEcheanceSerializer(serializers.Serializer):
    echeance_id = serializers.UUIDField()
    montant_regle = serializers.FloatField()
    mode = serializers.ChoiceField(choices=ModePaiement.choices)
    reference_transaction = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    numero_payeur = serializers.CharField(
        max_length=30, required=False, allow_blank=True, allow_null=True,
        help_text="Numero mobile money utilise par l'occupant (obligatoire si mode = MOBILE_MONEY)."
    )

    def validate(self, data):
        if data.get('mode') == ModePaiement.MOBILE_MONEY and not data.get('numero_payeur'):
            raise serializers.ValidationError({
                'numero_payeur': "Ce champ est requis pour un paiement Mobile Money."
            })
        return data


class ConfigMobileMoneySerializer(serializers.Serializer):
    """Numeros officiels a payer, geres via ParametreSysteme (lecture seule)."""
    orange_money = serializers.CharField(allow_blank=True, required=False)
    wave = serializers.CharField(allow_blank=True, required=False)
    instructions = serializers.CharField(allow_blank=True, required=False)


class QuitusSummarySerializer(serializers.ModelSerializer):
    occupant_nom = serializers.CharField(
        source='echeance.contrat.demandeur.utilisateur.nom_complet', read_only=True
    )
    local_reference = serializers.CharField(source='echeance.contrat.local.reference', read_only=True)
    contrat_reference = serializers.CharField(source='echeance.contrat.reference', read_only=True)
    date_exigibilite = serializers.DateField(source='echeance.date_exigibilite', read_only=True)
    mode_libelle = serializers.CharField(source='get_mode_display', read_only=True)
    statut_libelle = serializers.CharField(source='get_statut_display', read_only=True)
    demandeur_id = serializers.UUIDField(source='echeance.contrat.demandeur.id', read_only=True)

    class Meta:
        model = Paiement
        fields = [
            'id', 'reference_quitus', 'date_paiement', 'montant_regle',
            'mode', 'mode_libelle', 'statut', 'statut_libelle',
            'occupant_nom', 'local_reference', 'contrat_reference',
            'date_exigibilite', 'demandeur_id',
        ]
        read_only_fields = fields
