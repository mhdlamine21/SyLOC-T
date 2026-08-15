from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('comptes', '0004_alter_utilisateur_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='demandeur',
            name='carte_etudiant_date_soumission',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='demandeur',
            name='motif_rejet_carte',
            field=models.TextField(blank=True, null=True),
        ),
    ]
