from django.contrib import admin
from .models import Annonce, ParametreSysteme

@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'date_publication', 'est_active')
    list_filter = ('est_active', 'pin')
    search_fields = ('titre', 'contenu')


@admin.register(ParametreSysteme)
class ParametreSystemeAdmin(admin.ModelAdmin):
    list_display = ('cle', 'libelle', 'categorie', 'est_public', 'date_modification')
    list_filter = ('categorie', 'est_public')
    search_fields = ('cle', 'libelle')
