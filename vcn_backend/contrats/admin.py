from django.contrib import admin

# Register your models here.

# Phase 4 — bibliotheque de modeles du Service Juridique.
from .models import Contrat, ModeleContrat  # noqa: E402


@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = ('reference', 'local', 'statut', 'type_contrat', 'date_signature', 'date_fin')
    list_filter = ('statut', 'type_contrat')
    search_fields = ('reference',)


@admin.register(ModeleContrat)
class ModeleContratAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type_contrat', 'duree_mois_defaut', 'est_actif')
    list_filter = ('type_contrat', 'est_actif')
    search_fields = ('nom', 'objet')
