from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Chaque personne enregistre ses viewsets ici, ex:
# router = DefaultRouter()
# router.register('demandes', DemandeViewSet, basename='demande')

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
