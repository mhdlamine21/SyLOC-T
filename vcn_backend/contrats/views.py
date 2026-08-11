from rest_framework import viewsets, permissions
from .models import Contrat
from .serializers import ContratSerializer

class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.all()
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        contrat = serializer.save()
        # Le signal dans signals.py générera l'échéancier automatiquement
        contrat.appliquer_gratuite_etudiante()
