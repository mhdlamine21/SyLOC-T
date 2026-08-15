from django.db import migrations

from patrimoine.photos import photo_pour_local


def attribuer_photos(apps, schema_editor):
    Local = apps.get_model('patrimoine', 'Local')
    utilisees = {}
    for local in Local.objects.all().order_by('reference'):
        if local.photo_url:
            utilisees.setdefault(local.type_local, set()).add(local.photo_url)
    for local in Local.objects.all().order_by('reference'):
        if local.photo_url:
            continue
        prises = utilisees.setdefault(local.type_local, set())
        local.photo_url = photo_pour_local(local.reference, local.type_local, prises)
        prises.add(local.photo_url)
        local.save(update_fields=['photo_url'])


def rien(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('patrimoine', '0004_local_photo_url'),
    ]

    operations = [
        migrations.RunPython(attribuer_photos, rien),
    ]
