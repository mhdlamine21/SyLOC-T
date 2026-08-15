from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('paiements', '0004_paiement_statut'),
    ]

    operations = [
        migrations.AddField(
            model_name='paiement',
            name='numero_payeur',
            field=models.CharField(
                blank=True, max_length=30, null=True,
                help_text="Numero mobile money utilise par l'occupant pour regler (obligatoire si mode = MOBILE_MONEY).",
            ),
        ),
    ]
