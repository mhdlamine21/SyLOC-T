from django.urls import path
from .views import MonScoreFideliteView

urlpatterns = [
    path('mon-score/', MonScoreFideliteView.as_view(), name='mon-score'),
]
