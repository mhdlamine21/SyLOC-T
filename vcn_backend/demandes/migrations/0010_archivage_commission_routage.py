import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('demandes', '0009_phase3_commission_appels'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(model_name='demande', name='archive', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='demande', name='date_archivage', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='demande', name='motif_archivage', field=models.CharField(blank=True, choices=[('AVIS_DEFAVORABLE', 'Avis défavorable'), ('DOSSIER_INCOMPLET', 'Dossier incomplet'), ('AUTRE', 'Autre')], max_length=32)),
        migrations.AddField(model_name='demande', name='commentaire_archivage', field=models.TextField(blank=True)),
        migrations.AddField(model_name='demande', name='archive_par', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dossiers_archives', to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='demande', name='transmis_service_technique', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='demande', name='date_transmission_technique', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='demande', name='rapport_technique', field=models.TextField(blank=True)),
        migrations.AddField(model_name='demande', name='date_rapport_technique', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='demande', name='rapport_technique_par', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rapports_techniques_rediges', to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='demande', name='transfere_juridique', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='demande', name='date_transfert_juridique', field=models.DateTimeField(blank=True, null=True)),
        migrations.CreateModel(
            name='Commission',
            fields=[
                ('id', models.UUIDField(default=__import__('uuid').uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(default="Commission d'évaluation", max_length=150)),
                ('active', models.BooleanField(default=False)),
                ('date_activation', models.DateTimeField(blank=True, null=True)),
                ('date_desactivation', models.DateTimeField(blank=True, null=True)),
                ('motif_activation', models.CharField(blank=True, choices=[('ABSENCE', 'Absence du Directeur CROUS-T'), ('VOYAGE', 'Voyage / mission du Directeur'), ('ARBITRAGE', 'Arbitrage collégial requis'), ('AUTRE', 'Autre')], max_length=32)),
                ('commentaire_activation', models.TextField(blank=True)),
                ('delegation_directeur', models.BooleanField(default=False)),
                ('creee_par', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='commissions_creees', to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': "Commission d'évaluation", 'verbose_name_plural': "Commissions d'évaluation", 'ordering': ['-date_creation'], 'abstract': False},
        ),
        migrations.AddField(
            model_name='membrecommission',
            name='commission',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='membres', to='demandes.commission'),
        ),
    ]
