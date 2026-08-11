from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlainteViewSet, InspectionQHseViewSet, SanctionViewSet, AvisCantineViewSet

router = DefaultRouter()
router.register('plaintes', PlainteViewSet, basename='plainte')
router.register('inspections', InspectionQHseViewSet, basename='inspection')
router.register('sanctions', SanctionViewSet, basename='sanction')
router.register('avis', AvisCantineViewSet, basename='avis')

urlpatterns = [
    path('', include(router.urls)),
]
