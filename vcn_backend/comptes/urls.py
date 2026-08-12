from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    DemandeurViewSet,
    UtilisateurViewSet,
    NotificationViewSet,
    JournalAuditViewSet,
    MeView,
    ChangePasswordView,
)

router = DefaultRouter()
router.register('demandeurs', DemandeurViewSet, basename='demandeur')
router.register('utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('audit', JournalAuditViewSet, basename='audit')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('me/', MeView.as_view(), name='me'),
    path('changer-mot-de-passe/', ChangePasswordView.as_view(), name='changer-mot-de-passe'),
]
