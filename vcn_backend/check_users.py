import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vcn_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
users = User.objects.all()
for u in users:
    print(f"User: {u.username}, Role: {getattr(u, 'role', 'No role')}, Is Active: {u.is_active}")
