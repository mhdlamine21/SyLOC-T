from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('comptes', '0005_carte_etudiant_motif'),
    ]

    operations = [
        migrations.AddField(
            model_name='utilisateur',
            name='telephone',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='utilisateur',
            name='specialite',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
