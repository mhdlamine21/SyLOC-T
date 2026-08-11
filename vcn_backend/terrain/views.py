from rest_framework import viewsets, permissions
from .models import Plainte, InspectionQHse, Sanction, AvisCantine, StatutPlainte
from .serializers import (
    PlainteSerializer,
    PlainteAgentSerializer,
    InspectionQHseSerializer,
    SanctionSerializer,
    AvisCantineSerializer
)
from comptes.models import RoleUtilisateur, Demandeur
from django.utils import timezone

class PlainteViewSet(viewsets.ModelViewSet):
    queryset = Plainte.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role in [RoleUtilisateur.AGENT_TERRAIN, RoleUtilisateur.AGENT_QHSE, RoleUtilisateur.DIRECTEUR_CROUS_T, RoleUtilisateur.DIRECTEUR_DCUVE]:
            return PlainteAgentSerializer
        return PlainteSerializer

    def perform_create(self, serializer):
        from rest_framework import serializers
        local = serializer.validated_data.get('local')
        if local:
            # Check cooldown (e.g., 7 days)
            il_y_a_7_jours = timezone.now() - timezone.timedelta(days=7)
            derniere_plainte = Plainte.objects.filter(
                plaignant=self.request.user,
                local=local,
                date_creation__gte=il_y_a_7_jours
            ).first()
            if derniere_plainte:
                raise serializers.ValidationError({"detail": "Vous avez déjà signalé ce local récemment. Veuillez patienter avant un nouveau signalement."})
        
        serializer.save(plaignant=self.request.user)

    def perform_update(self, serializer):
        # Si la plainte passe en résolue, on met la date de résolution
        instance = serializer.save()
        if instance.statut == StatutPlainte.RESOLUE and not instance.date_resolution:
            instance.date_resolution = timezone.now()
            instance.save()

class InspectionQHseViewSet(viewsets.ModelViewSet):
    queryset = InspectionQHse.objects.all()
    serializer_class = InspectionQHseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        from rest_framework import serializers
        type_controle = serializer.validated_data.get('type_controle')
        user_role = self.request.user.role
        
        # Validation métier : Agent Terrain = Technique/Electrique, Agent QHSE = Sanitaire
        from .models import TypeControleQHSE
        if user_role == RoleUtilisateur.AGENT_TERRAIN and type_controle == TypeControleQHSE.SANITAIRE:
            raise serializers.ValidationError({"detail": "Un agent de terrain ne peut pas faire de contrôle sanitaire (réservé à l'Agent QHSE)."})
        if user_role == RoleUtilisateur.AGENT_QHSE and type_controle in [TypeControleQHSE.TECHNIQUE, TypeControleQHSE.ELECTRIQUE]:
            raise serializers.ValidationError({"detail": "Un agent QHSE ne peut pas faire de contrôle technique ou électrique (réservé à l'Agent Terrain)."})

        # L'inspecteur est l'utilisateur connecté
        serializer.save(inspecteur=self.request.user)

class SanctionViewSet(viewsets.ModelViewSet):
    queryset = Sanction.objects.all()
    serializer_class = SanctionSerializer
    permission_classes = [permissions.IsAuthenticated]

class AvisCantineViewSet(viewsets.ModelViewSet):
    queryset = AvisCantine.objects.all()
    serializer_class = AvisCantineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # On suppose que l'auteur est un demandeur lié à l'utilisateur
        try:
            demandeur = Demandeur.objects.get(utilisateur=self.request.user)
        except Demandeur.DoesNotExist:
            demandeur = Demandeur.objects.create(utilisateur=self.request.user, contact="")
        serializer.save(auteur=demandeur)
