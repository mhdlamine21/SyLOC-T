from django.contrib import admin
from .models import Annonce

@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'date_publication', 'est_active')
    list_filter = ('est_active', 'pin')
    search_fields = ('titre', 'contenu')
