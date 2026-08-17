from django.db import migrations


class Migration(migrations.Migration):
    """Un local commercial se decrit par sa surface (m2), pas par une capacite
    d'accueil de type salle : le champ est retire du referentiel."""

    dependencies = [
        ("patrimoine", "0006_merge_0005_local_photo_0005_photos_automatiques"),
    ]

    operations = [
        migrations.RemoveField(model_name="local", name="capacite_accueil"),
    ]
