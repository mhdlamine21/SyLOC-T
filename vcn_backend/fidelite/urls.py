from django.urls import path
from .views import MonScoreFideliteView, ClassementFideliteView, AlertesFideliteView

urlpatterns = [
    path('mon-score/', MonScoreFideliteView.as_view(), name='mon-score'),
    path('classement/', ClassementFideliteView.as_view(), name='classement-fidelite'),
    path('alertes/', AlertesFideliteView.as_view(), name='alertes-fidelite'),
]
