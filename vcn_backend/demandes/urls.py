from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppelCandidatureViewSet, DemandeViewSet, DossierViewSet, VoteCommissionViewSet

router = DefaultRouter()
router.register('appels', AppelCandidatureViewSet, basename='appelcandidature')
router.register('demandes', DemandeViewSet, basename='demande')
router.register('dossiers', DossierViewSet, basename='dossier')
router.register('votes', VoteCommissionViewSet, basename='votecommission')

urlpatterns = [
    path('', include(router.urls)),
]
