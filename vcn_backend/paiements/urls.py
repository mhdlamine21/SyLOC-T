from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EcheanceViewSet, PaiementViewSet

router = DefaultRouter()
router.register('echeances', EcheanceViewSet, basename='echeance')
router.register('', PaiementViewSet, basename='paiement')

urlpatterns = [
    path('', include(router.urls)),
]
