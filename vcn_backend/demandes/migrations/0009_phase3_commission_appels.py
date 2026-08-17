from django.db import migrations


class Migration(migrations.Migration):
    """Phase 3 — un seul vote par membre et par dossier, tri des appels."""

    dependencies = [
        ('demandes', '0008_votecommission_notes'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='appelcandidature',
            options={'ordering': ['-date_lancement']},
        ),
        migrations.AlterModelOptions(
            name='votecommission',
            options={'ordering': ['-date_creation']},
        ),
        migrations.AlterUniqueTogether(
            name='votecommission',
            unique_together={('demande', 'membre')},
        ),
    ]
