"""Phase 4 — Service Juridique : modeles de contrat, statut et corps de l'acte."""

import uuid

import django.db.models.deletion
from django.db import migrations, models


def creer_modeles_par_defaut(apps, schema_editor):
    """Amorce la bibliotheque juridique avec les trois actes de reference."""
    ModeleContrat = apps.get_model('contrats', 'ModeleContrat')
    from contrats.services import CLAUSES_STANDARD, CORPS_PAR_DEFAUT

    gabarits = [
        {
            'nom': 'Bail commercial domanial (24 mois)',
            'type_contrat': 'BAIL_COMMERCIAL',
            'objet': "Exploitation commerciale d'un local du site VCN",
            'duree_mois_defaut': 24,
            'preavis_mois_defaut': 3,
        },
        {
            'nom': "Convention d'occupation precaire (12 mois)",
            'type_contrat': 'CONVENTION_OCCUPATION',
            'objet': "Occupation precaire et revocable d'un local domanial",
            'duree_mois_defaut': 12,
            'preavis_mois_defaut': 1,
        },
        {
            'nom': 'Convention etudiante (gratuite)',
            'type_contrat': 'CONVENTION_ETUDIANTE',
            'objet': "Occupation exoneree au titre du statut etudiant verifie",
            'duree_mois_defaut': 12,
            'preavis_mois_defaut': 1,
        },
    ]
    for g in gabarits:
        ModeleContrat.objects.get_or_create(
            nom=g['nom'],
            defaults={
                'id': uuid.uuid4(),
                'type_contrat': g['type_contrat'],
                'objet': g['objet'],
                'corps': CORPS_PAR_DEFAUT,
                'clauses_standard': CLAUSES_STANDARD,
                'duree_mois_defaut': g['duree_mois_defaut'],
                'preavis_mois_defaut': g['preavis_mois_defaut'],
                'est_actif': True,
            },
        )


def referencer_contrats_existants(apps, schema_editor):
    """Attribue une reference et un statut aux baux deja en base."""
    Contrat = apps.get_model('contrats', 'Contrat')
    compteurs = {}
    for contrat in Contrat.objects.all().order_by('date_creation'):
        annee = (contrat.date_signature or contrat.date_creation).year
        compteurs[annee] = compteurs.get(annee, 0) + 1
        contrat.reference = f"CT-{annee}-{compteurs[annee]:04d}"
        if contrat.date_resiliation:
            contrat.statut = 'RESILIE'
        elif contrat.est_actif:
            contrat.statut = 'ACTIF'
        else:
            contrat.statut = 'BROUILLON'
        contrat.save(update_fields=['reference', 'statut'])


def vider(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('contrats', '0002_contrat_demande'),
    ]

    operations = [
        migrations.CreateModel(
            name='ModeleContrat',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=150, unique=True)),
                ('type_contrat', models.CharField(choices=[('BAIL_COMMERCIAL', 'Bail commercial domanial'), ('CONVENTION_OCCUPATION', "Convention d'occupation precaire"), ('CONVENTION_ETUDIANTE', 'Convention etudiante (gratuite)'), ('AVENANT', 'Avenant')], default='BAIL_COMMERCIAL', max_length=40)),
                ('objet', models.CharField(blank=True, max_length=255)),
                ('corps', models.TextField(help_text='Texte du contrat, variables au format {{cle}}')),
                ('clauses_standard', models.TextField(blank=True)),
                ('duree_mois_defaut', models.PositiveIntegerField(default=24)),
                ('preavis_mois_defaut', models.PositiveIntegerField(default=3)),
                ('est_actif', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Modele de contrat',
                'verbose_name_plural': 'Modeles de contrat',
                'ordering': ['nom'],
            },
        ),
        migrations.AddField(
            model_name='contrat',
            name='reference',
            field=models.CharField(blank=True, max_length=40, null=True),
        ),
        migrations.AddField(
            model_name='contrat',
            name='statut',
            field=models.CharField(choices=[('BROUILLON', 'Brouillon (en redaction)'), ('EN_ATTENTE_SIGNATURE', 'En attente de signature'), ('ACTIF', 'Actif'), ('RESILIE', 'Resilie'), ('EXPIRE', 'Expire')], default='BROUILLON', max_length=30),
        ),
        migrations.AddField(
            model_name='contrat',
            name='type_contrat',
            field=models.CharField(choices=[('BAIL_COMMERCIAL', 'Bail commercial domanial'), ('CONVENTION_OCCUPATION', "Convention d'occupation precaire"), ('CONVENTION_ETUDIANTE', 'Convention etudiante (gratuite)'), ('AVENANT', 'Avenant')], default='BAIL_COMMERCIAL', max_length=40),
        ),
        migrations.AddField(
            model_name='contrat',
            name='objet',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='contrat',
            name='clauses_particulieres',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='contrat',
            name='texte_contrat',
            field=models.TextField(blank=True, help_text="Corps redige et fige du contrat"),
        ),
        migrations.AddField(
            model_name='contrat',
            name='modele',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contrats', to='contrats.modelecontrat'),
        ),
        migrations.RunPython(creer_modeles_par_defaut, vider),
        migrations.RunPython(referencer_contrats_existants, vider),
        migrations.AlterField(
            model_name='contrat',
            name='reference',
            field=models.CharField(blank=True, max_length=40, unique=True),
        ),
    ]
