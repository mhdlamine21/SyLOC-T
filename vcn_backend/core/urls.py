from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AnnonceViewSet

router = DefaultRouter()
router.register('', AnnonceViewSet, basename='annonce')

urlpatterns = [
    path('', include(router.urls)),
]
