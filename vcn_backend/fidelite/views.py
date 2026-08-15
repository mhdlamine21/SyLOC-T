from django.db.models import Sum
from rest_framework import views, permissions, status
from rest_framework.response import Response
from comptes.models import Demandeur
from core.permissions import roles_requis
from .models import HistoriqueScore
from .serializers import HistoriqueScoreSerializer


PALIERS = [
    (200, "PLATINE", "Partenaire privilegie du site VCN"),
    (120, "OR", "Occupant exemplaire"),
    (60, "ARGENT", "Bon historique de collaboration"),
    (0, "BRONZE", "Historique en construction"),
]


def palier_du_score(score):
    for seuil, nom, libelle in PALIERS:
        if score >= seuil:
            suivant = next((p for p in reversed(PALIERS) if p[0] > seuil), None)
            return {
                "niveau": nom,
                "libelle": libelle,
                "seuil": seuil,
                "prochain_palier": suivant[1] if suivant else None,
                "points_restants": round(suivant[0] - score, 2) if suivant else 0,
            }
    return {"niveau": "BRONZE", "libelle": "", "seuil": 0, "prochain_palier": None, "points_restants": 0}


class MonScoreFideliteView(views.APIView):
    """Score de fidelite du demandeur connecte + detail des mouvements."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            demandeur = Demandeur.objects.get(utilisateur=request.user)
        except Demandeur.DoesNotExist:
            return Response({"detail": "Profil demandeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        historique = HistoriqueScore.objects.filter(demandeur=demandeur).order_by('-date_creation')
        gagnes = historique.filter(points_modifies__gt=0).aggregate(t=Sum('points_modifies'))['t'] or 0
        perdus = historique.filter(points_modifies__lt=0).aggregate(t=Sum('points_modifies'))['t'] or 0

        return Response({
            "score_actuel": demandeur.score_fidelite,
            "palier": palier_du_score(demandeur.score_fidelite),
            "points_gagnes": round(gagnes, 2),
            "points_perdus": round(abs(perdus), 2),
            "nombre_mouvements": historique.count(),
            "historique": HistoriqueScoreSerializer(historique, many=True).data,
        })


class ClassementFideliteView(views.APIView):
    """Classement des demandeurs par score — pilotage DCUVE / Direction / Occupants."""
    permission_classes = [roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUS_T',
        'SERVICE_JURIDIQUE', 'SERVICE_COMPTABLE', 'AGENT_QHSE')]

    def get(self, request):
        limite = int(request.query_params.get('limit', 10))
        demandeurs = Demandeur.objects.select_related('utilisateur').order_by('-score_fidelite')[:limite]
        return Response([{
            "demandeur_id": str(d.id),
            "nom": d.utilisateur.nom_complet or d.utilisateur.username,
            "est_etudiant": d.est_etudiant,
            "score": d.score_fidelite,
            "palier": palier_du_score(d.score_fidelite)["niveau"],
        } for d in demandeurs])


class AlertesFideliteView(views.APIView):
    """Occupants dont le score de fidelite est fortement negatif.

    Sert de declencheur metier a l'envoi d'un agent de terrain (mediation).
    Le seuil est parametrable (`?seuil=-20`, valeur negative attendue).
    """
    permission_classes = [roles_requis(
        'AGENT_QHSE', 'AGENT_TERRAIN', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE',
        'DIRECTEUR_CROUS_T')]

    def get(self, request):
        try:
            seuil = float(request.query_params.get('seuil', -20))
        except (TypeError, ValueError):
            seuil = -20.0

        demandeurs = (Demandeur.objects
                      .select_related('utilisateur')
                      .filter(score_fidelite__lte=seuil)
                      .order_by('score_fidelite'))

        resultats = []
        for d in demandeurs:
            derniers = HistoriqueScore.objects.filter(demandeur=d).order_by('-date_creation')[:5]
            resultats.append({
                "demandeur_id": str(d.id),
                "nom": d.utilisateur.nom_complet or d.utilisateur.username,
                "contact": getattr(d.utilisateur, 'telephone', '') or '',
                "score": d.score_fidelite,
                "palier": palier_du_score(d.score_fidelite)["niveau"],
                "gravite": "CRITIQUE" if d.score_fidelite <= seuil * 2 else "ELEVEE",
                "derniers_mouvements": HistoriqueScoreSerializer(derniers, many=True).data,
            })

        return Response({
            "seuil": seuil,
            "nombre": len(resultats),
            "resultats": resultats,
        })
