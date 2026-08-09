from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, Demandeur, Notification


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    fieldsets = UserAdmin.fieldsets + (("Role metier", {"fields": ("role",)}),)


admin.site.register(Demandeur)
admin.site.register(Notification)
