from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppelCandidatureViewSet, DemandeViewSet, DossierViewSet, VoteCommissionViewSet, MembreCommissionViewSet

router = DefaultRouter()
router.register('appels', AppelCandidatureViewSet, basename='appelcandidature')
router.register('demandes', DemandeViewSet, basename='demande')
router.register('dossiers', DossierViewSet, basename='dossier')
router.register('votes', VoteCommissionViewSet, basename='votecommission')
router.register('membres', MembreCommissionViewSet, basename='membrecommission')

urlpatterns = [
    path('', include(router.urls)),
]
