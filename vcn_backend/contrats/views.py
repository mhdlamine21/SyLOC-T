from rest_framework import viewsets, permissions
from .models import Contrat
from .serializers import ContratSerializer

class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.all()
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from comptes.models import RoleUtilisateur
        if user.role == RoleUtilisateur.USAGER:
            return Contrat.objects.filter(demandeur__utilisateur=user)
        return Contrat.objects.all()

    def perform_create(self, serializer):
        contrat = serializer.save(signataire_crous_t=self.request.user)
        # Le signal dans signals.py générera l'échéancier automatiquement
        contrat.appliquer_gratuite_etudiante()
