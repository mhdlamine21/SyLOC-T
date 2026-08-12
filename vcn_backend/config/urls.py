# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# pyrefly: ignore [missing-import]
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static
from core.views import DashboardStatsView, RapportPeriodeView, TopOccupantsView, PublicStatsView, PublicAnnoncesView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Doc API (Swagger) - utile pour l'equipe front
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Une entree par app/domaine du diagramme de classes.
    # Chaque personne ajoute ses routes dans son propre <app>/urls.py.
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/public/stats/', PublicStatsView.as_view(), name='public-stats'),
    path('api/public/annonces/', PublicAnnoncesView.as_view(), name='public-annonces'),
    path('api/rapports/periode/', RapportPeriodeView.as_view(), name='rapport-periode'),
    path('api/rapports/top-occupants/', TopOccupantsView.as_view(), name='rapport-top-occupants'),
    path('api/annonces/', include('core.urls')),
    path('api/comptes/', include('comptes.urls')),
    path('api/demandes/', include('demandes.urls')),
    path('api/patrimoine/', include('patrimoine.urls')),
    path('api/contrats/', include('contrats.urls')),
    path('api/paiements/', include('paiements.urls')),
    path('api/terrain/', include('terrain.urls')),
    path('api/fidelite/', include('fidelite.urls')),
]

# Fichiers uploades (cartes etudiant, pieces jointes) servis en developpement.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
