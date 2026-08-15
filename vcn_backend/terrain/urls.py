from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlainteViewSet, InspectionQHseViewSet, SanctionViewSet, AvisCantineViewSet
from .views_phase5 import OrdreMissionViewSet, InterventionMaintenanceViewSet
from .views_terrain import RapportVisiteTerrainViewSet, DispatchFideliteViewSet

router = DefaultRouter()
router.register('plaintes', PlainteViewSet, basename='plainte')
router.register('inspections', InspectionQHseViewSet, basename='inspection')
router.register('sanctions', SanctionViewSet, basename='sanction')
router.register('avis', AvisCantineViewSet, basename='avis')
router.register('ordres-mission', OrdreMissionViewSet, basename='ordre-mission')
router.register('maintenance', InterventionMaintenanceViewSet, basename='maintenance')
router.register('rapports-visite', RapportVisiteTerrainViewSet, basename='rapport-visite')
router.register('dispatch-fidelite', DispatchFideliteViewSet, basename='dispatch-fidelite')

urlpatterns = [
    path('', include(router.urls)),
]
