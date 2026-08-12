from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Echeance, Paiement, StatutEcheance
from .serializers import EcheanceSerializer, PaiementSerializer, ReglerEcheanceSerializer

# Roles autorises a consulter l'integralite des echeances et des paiements.
ROLES_CAISSE = ('SERVICE_COMPTABLE', 'DIRECTEUR_CROUS_T', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI')


def _scoper_aux_contrats_de_lutilisateur(queryset, user, prefixe):
    """Un occupant ne doit voir que son propre echeancier.

    Le guichet (comptabilite, direction, admin SI) garde une vue globale.
    """
    if getattr(user, 'role', None) in ROLES_CAISSE or user.is_superuser:
        return queryset
    return queryset.filter(**{f'{prefixe}demandeur__utilisateur': user})


class EcheanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Echeance.objects.select_related(
        'contrat__local', 'contrat__demandeur__utilisateur'
    ).all()
    serializer_class = EcheanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _scoper_aux_contrats_de_lutilisateur(
            super().get_queryset(), self.request.user, 'contrat__'
        )

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related(
        'echeance__contrat__local', 'echeance__contrat__demandeur__utilisateur'
    ).all()
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _scoper_aux_contrats_de_lutilisateur(
            super().get_queryset(), self.request.user, 'echeance__contrat__'
        )

    @action(detail=False, methods=['post'], serializer_class=ReglerEcheanceSerializer)
    def regler(self, request):
        serializer = ReglerEcheanceSerializer(data=request.data)
        if serializer.is_valid():
            echeance_id = serializer.validated_data['echeance_id']
            montant_regle = serializer.validated_data['montant_regle']
            mode = serializer.validated_data['mode']
            ref_transaction = serializer.validated_data.get('reference_transaction')
            
            echeance = get_object_or_404(
                _scoper_aux_contrats_de_lutilisateur(
                    Echeance.objects.all(), request.user, 'contrat__'
                ),
                id=echeance_id,
            )
            
            if echeance.statut == StatutEcheance.PAYEE:
                return Response({'detail': 'Cette échéance est déjà payée.'}, status=status.HTTP_400_BAD_REQUEST)
            
            paiement = Paiement.objects.create(
                echeance=echeance,
                montant_regle=montant_regle,
                mode=mode,
                reference_transaction=ref_transaction
            )
            paiement.valider_paiement()
            
            return Response(PaiementSerializer(paiement).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
