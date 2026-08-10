from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, CustomTokenObtainPairView

# Chaque personne enregistre ses viewsets ici, ex:
# router = DefaultRouter()
# router.register('demandes', DemandeViewSet, basename='demande')

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
]
