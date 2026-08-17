from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('demandes', '0007_demande_avis_technique_interne'),
    ]

    operations = [
        migrations.AddField(
            model_name='votecommission',
            name='note_formelle',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='votecommission',
            name='note_technique',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
