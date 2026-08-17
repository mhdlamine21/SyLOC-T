from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AppelCandidatureViewSet, DemandeViewSet, DossierViewSet,
    VoteCommissionViewSet, MembreCommissionViewSet, LotCommissionViewSet,
    CritereAppelViewSet,
)

router = DefaultRouter()
router.register('appels', AppelCandidatureViewSet, basename='appelcandidature')
router.register('criteres', CritereAppelViewSet, basename='critereappel')
router.register('demandes', DemandeViewSet, basename='demande')
router.register('dossiers', DossierViewSet, basename='dossier')
router.register('votes', VoteCommissionViewSet, basename='votecommission')
router.register('membres', MembreCommissionViewSet, basename='membrecommission')
router.register('lots-commission', LotCommissionViewSet, basename='lotcommission')

urlpatterns = [
    path('', include(router.urls)),
]
