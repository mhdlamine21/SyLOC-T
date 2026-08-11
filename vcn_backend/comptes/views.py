# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Demandeur, StatutVerificationEtudiant
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, DemandeurSerializer

Utilisateur = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class DemandeurViewSet(viewsets.ModelViewSet):
    queryset = Demandeur.objects.all()
    serializer_class = DemandeurSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='soumettre-carte-etudiant')
    def soumettre_carte_etudiant(self, request):
        try:
            demandeur = Demandeur.objects.get(utilisateur=request.user)
        except Demandeur.DoesNotExist:
            return Response({'detail': 'Demandeur non trouvé'}, status=404)
            
        if 'fichier' not in request.FILES:
            return Response({'detail': 'Fichier manquant'}, status=400)
            
        demandeur.carte_etudiant_fichier = request.FILES['fichier']
        demandeur.statut_verification_etudiant = StatutVerificationEtudiant.EN_ATTENTE
        demandeur.save()
        return Response({'statut': demandeur.statut_verification_etudiant})

    @action(detail=True, methods=['post'], url_path='valider-carte-etudiant')
    def valider_carte_etudiant(self, request, pk=None):
        demandeur = self.get_object()
        decision = request.data.get('decision')
        demandeur.statut_verification_etudiant = decision
        demandeur.carte_etudiant_date_validation = timezone.now()
        demandeur.valide_par = request.user
        demandeur.save()
        return Response({'statut': demandeur.statut_verification_etudiant})
