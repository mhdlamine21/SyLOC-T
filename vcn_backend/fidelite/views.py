from rest_framework import views, permissions, status
from rest_framework.response import Response
from comptes.models import Demandeur
from .models import HistoriqueScore
from .serializers import HistoriqueScoreSerializer

class MonScoreFideliteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            demandeur = Demandeur.objects.get(utilisateur=request.user)
        except Demandeur.DoesNotExist:
            return Response({"detail": "Profil demandeur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        
        historique = HistoriqueScore.objects.filter(demandeur=demandeur).order_by('-date_creation')
        
        return Response({
            "score_actuel": demandeur.score_fidelite,
            "historique": HistoriqueScoreSerializer(historique, many=True).data
        })
