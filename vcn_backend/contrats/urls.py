from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContratViewSet, ModeleContratViewSet

router = DefaultRouter()
# Phase 4 : la bibliotheque de modeles est declaree AVANT la route racine,
# sinon `modeles` serait capture comme un identifiant de contrat.
router.register('modeles', ModeleContratViewSet, basename='modele-contrat')
router.register('', ContratViewSet, basename='contrat')

urlpatterns = [
    path('', include(router.urls)),
]
