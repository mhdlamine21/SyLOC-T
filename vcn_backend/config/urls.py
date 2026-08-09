from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

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
    path('api/comptes/', include('comptes.urls')),
    path('api/demandes/', include('demandes.urls')),
    path('api/patrimoine/', include('patrimoine.urls')),
    path('api/contrats/', include('contrats.urls')),
    path('api/paiements/', include('paiements.urls')),
    path('api/terrain/', include('terrain.urls')),
    path('api/fidelite/', include('fidelite.urls')),
]
