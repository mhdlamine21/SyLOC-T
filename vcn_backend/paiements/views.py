from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Echeance, Paiement, StatutEcheance
from .serializers import EcheanceSerializer, PaiementSerializer, ReglerEcheanceSerializer

class EcheanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Echeance.objects.all()
    serializer_class = EcheanceSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], serializer_class=ReglerEcheanceSerializer)
    def regler(self, request):
        serializer = ReglerEcheanceSerializer(data=request.data)
        if serializer.is_valid():
            echeance_id = serializer.validated_data['echeance_id']
            montant_regle = serializer.validated_data['montant_regle']
            mode = serializer.validated_data['mode']
            ref_transaction = serializer.validated_data.get('reference_transaction')
            
            echeance = get_object_or_404(Echeance, id=echeance_id)
            
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
