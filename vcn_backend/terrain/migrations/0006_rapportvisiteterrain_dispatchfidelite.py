from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('comptes', '0004_alter_utilisateur_role'),
        ('patrimoine', '0006_merge_0005_local_photo_0005_photos_automatiques'),
        ('terrain', '0005_alter_plainte_photo_preuve'),
    ]

    operations = [
        migrations.CreateModel(
            name='RapportVisiteTerrain',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('reference', models.CharField(blank=True, max_length=40, unique=True)),
                ('date_visite', models.DateTimeField()),
                ('date_prochaine_visite', models.DateTimeField(blank=True, null=True)),
                ('type_controle', models.CharField(choices=[('SANITAIRE', 'Sanitaire'), ('TECHNIQUE', 'Technique'), ('ELECTRIQUE', 'Electrique'), ('OCCUPATION', 'Occupation')], default='OCCUPATION', max_length=50)),
                ('commission_destinataire', models.CharField(choices=[('COMMISSION_EVALUATION', "Commission d'évaluation"), ('COMMISSION_ENVIRONNEMENT', 'Commission environnement (QHSE)'), ('COMMISSION_TECHNIQUE', 'Commission technique')], default='COMMISSION_ENVIRONNEMENT', max_length=40)),
                ('statut', models.CharField(choices=[('BROUILLON', 'Brouillon'), ('TRANSMIS', 'Transmis à la commission'), ('VALIDE', 'Validé par la commission')], default='BROUILLON', max_length=20)),
                ('conforme', models.BooleanField(default=True)),
                ('note_globale', models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(20)])),
                ('constats', models.TextField()),
                ('recommandations', models.TextField(blank=True)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='rapports_visite/')),
                ('date_transmission', models.DateTimeField(blank=True, null=True)),
                ('latitude', models.FloatField(blank=True, null=True)),
                ('longitude', models.FloatField(blank=True, null=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='rapports_visite', to=settings.AUTH_USER_MODEL)),
                ('inspection', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rapports_visite', to='terrain.inspectionqhse')),
                ('local', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rapports_visite', to='patrimoine.local')),
                ('ordre_mission', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rapports_visite', to='terrain.ordremission')),
            ],
            options={
                'verbose_name': 'Rapport de visite terrain',
                'verbose_name_plural': 'Rapports de visite terrain',
                'ordering': ['-date_visite'],
            },
        ),
        migrations.CreateModel(
            name='DispatchFidelite',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('reference', models.CharField(blank=True, max_length=40, unique=True)),
                ('score_constate', models.FloatField(blank=True, null=True)),
                ('motif', models.TextField()),
                ('urgence', models.CharField(choices=[('FAIBLE', 'Faible'), ('MOYENNE', 'Moyenne'), ('ELEVEE', 'Elevée')], default='ELEVEE', max_length=20)),
                ('statut', models.CharField(choices=[('DEMANDE', 'Demandé'), ('ASSIGNE', 'Agent assigné'), ('EN_COURS', 'En cours'), ('CLOTURE', 'Clôturé'), ('ANNULE', 'Annulé')], default='DEMANDE', max_length=20)),
                ('date_intervention', models.DateTimeField(blank=True, null=True)),
                ('compte_rendu', models.TextField(blank=True)),
                ('agent_assigne', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dispatchs_recus', to=settings.AUTH_USER_MODEL)),
                ('demandeur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dispatchs_fidelite', to='comptes.demandeur')),
                ('demandeur_par', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dispatchs_declenches', to=settings.AUTH_USER_MODEL)),
                ('local', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dispatchs_fidelite', to='patrimoine.local')),
            ],
            options={
                'verbose_name': 'Dispatch agent (fidélité)',
                'verbose_name_plural': 'Dispatchs agent (fidélité)',
                'ordering': ['-date_creation'],
            },
        ),
    ]
