from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from comptes.models import RoleUtilisateur, Demandeur
from .models import AppelCandidature, Demande, Dossier, VoteCommission, MembreCommission, StatutDemande
from .serializers import (
    AppelCandidatureSerializer, DemandeSerializer, DemandeAnonymeSerializer, DossierSerializer, VoteCommissionSerializer, MembreCommissionSerializer
)
from .services import DemandeService, calculer_score_correspondance

class AppelCandidatureViewSet(viewsets.ModelViewSet):
    queryset = AppelCandidature.objects.all()
    serializer_class = AppelCandidatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(publie_par=self.request.user)

class DemandeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Si c'est un usager (le créateur), il peut voir ses propres infos
        if self.request.user.role == RoleUtilisateur.USAGER:
            return DemandeSerializer
            
        # Si c'est le directeur ou la commission, on vérifie si la demande est clôturée
        if self.action in ['retrieve', 'update', 'partial_update']:
            demande = self.get_object()
            if demande.statut in [StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]:
                return DemandeSerializer # Identité révélée car le vote est fini
        
        # Par défaut (ex: GET /demandes/), identité toujours masquée (Blind Review)
        return DemandeAnonymeSerializer


    def get_queryset(self):
        user = self.request.user
        if user.role == RoleUtilisateur.USAGER:
            return Demande.objects.filter(demandeur__utilisateur=user)
        return Demande.objects.all()

    def perform_create(self, serializer):
        try:
            demandeur = Demandeur.objects.get(utilisateur=self.request.user)
        except Demandeur.DoesNotExist:
            demandeur = Demandeur.objects.create(utilisateur=self.request.user, contact="")
        serializer.save(demandeur=demandeur)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def changer_statut(self, request, pk=None):
        demande = self.get_object()
        nouveau_statut = request.data.get('statut')
        commentaire = request.data.get('commentaire', '')
        
        if not nouveau_statut:
            return Response({"detail": "Statut manquant."}, status=status.HTTP_400_BAD_REQUEST)
            
        demande_maj = DemandeService.changer_statut(demande, nouveau_statut, request.user, commentaire)
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['post'], url_path='avis-sanitaire', permission_classes=[permissions.IsAdminUser])
    def enregistrer_avis_sanitaire(self, request, pk=None):
        demande = self.get_object()
        demande.avis_sanitaire_externe = request.data.get('avis', '')
        demande.reference_avis_sanitaire = request.data.get('reference', '')
        demande.save(update_fields=['avis_sanitaire_externe', 'reference_avis_sanitaire'])
        
        return Response({'avis_sanitaire_externe': demande.avis_sanitaire_externe})

    @action(detail=False, methods=['get'], url_path='triees')
    def demandes_triees(self, request):
        appel_id = request.query_params.get('appel')
        demandes = self.get_queryset()
        if appel_id:
            try:
                appel = AppelCandidature.objects.get(pk=appel_id)
                demandes = sorted(demandes, key=lambda d: calculer_score_correspondance(d, appel), reverse=True)
            except AppelCandidature.DoesNotExist:
                pass
        
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def decider(self, request, pk=None):
        demande = self.get_object()
        decision = request.data.get('decision')
        commentaire = request.data.get('commentaire', '')
        if decision not in [StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]:
            return Response({"detail": "Décision invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
        demande_maj = DemandeService.changer_statut(demande, decision, request.user, commentaire)
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def valider(self, request, pk=None):
        demande = self.get_object()
        commentaire = request.data.get('commentaire', 'Validation par le service')
        demande_maj = DemandeService.valider_demande(demande, request.user, commentaire)
        return Response(DemandeSerializer(demande_maj).data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analyse_equidistance(self, request, pk=None):
        demande = self.get_object()
        if not demande.local or demande.local.latitude is None or demande.local.longitude is None:
            return Response({"detail": "Le local ciblé n'a pas de coordonnées GPS."}, status=status.HTTP_400_BAD_REQUEST)
        
        # On importe la fonction utilitaire et le modèle Local
        from patrimoine.utils import calculer_distance_haversine
        from patrimoine.models import Local
        
        type_cible = demande.local.type_local
        # On cherche tous les autres locaux actifs du même type
        autres_locaux = Local.objects.filter(
            type_local=type_cible, est_libre=False
        ).exclude(id=demande.local.id)
        
        conflits = []
        distance_limite_metres = 200.0  # La règle des 200 mètres
        
        for autre in autres_locaux:
            if autre.latitude and autre.longitude:
                dist = calculer_distance_haversine(
                    demande.local.latitude, demande.local.longitude,
                    autre.latitude, autre.longitude
                )
                if dist <= distance_limite_metres:
                    conflits.append({
                        "local_id": autre.id,
                        "reference": autre.reference,
                        "distance_metres": round(dist, 2)
                    })
                    
        return Response({
            "alerte": len(conflits) > 0,
            "conflits": conflits,
            "message": f"{len(conflits)} locaux de type {type_cible} détectés à moins de {distance_limite_metres}m."
        })

class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all()
    serializer_class = DossierSerializer
    permission_classes = [permissions.IsAuthenticated]

class MembreCommissionViewSet(viewsets.ModelViewSet):
    queryset = MembreCommission.objects.all()
    serializer_class = MembreCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class VoteCommissionViewSet(viewsets.ModelViewSet):
    queryset = VoteCommission.objects.all()
    serializer_class = VoteCommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            membre = MembreCommission.objects.get(utilisateur=self.request.user)
        except MembreCommission.DoesNotExist:
            # Pour la démo, si l'utilisateur n'est pas membre, on bloque
            # ou on pourrait lever une ValidationError
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Vous n'êtes pas membre de la commission.")
        serializer.save(membre=membre)
