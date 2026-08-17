# Phase 2 — Parametres systeme (Administrateur SI) + contenus de la vitrine.

import uuid

from django.db import migrations, models


DEFAUTS = [
    {
        "cle": "vitrine_hero",
        "libelle": "Bandeau d'accueil de la vitrine",
        "categorie": "VITRINE",
        "est_public": True,
        "valeur": {
            "titre": "SyLOC-T — Gestion de l'occupation du site VCN",
            "sous_titre": (
                "Plateforme officielle du CROUS de Thies pour la candidature, "
                "l'attribution et le suivi des locaux domaniaux du campus."
            ),
            "cta": "Deposer une demande",
        },
    },
    {
        "cle": "vitrine_etapes",
        "libelle": "Etapes du parcours candidat",
        "categorie": "VITRINE",
        "est_public": True,
        "valeur": {
            "items": [
                {"idx": 1, "icon": "\U0001F464", "h": "1. Creer un compte",
                 "p": "Inscrivez-vous avec les informations de votre structure ou votre matricule etudiant.",
                 "who": "Candidat", "col": "#172554"},
                {"idx": 2, "icon": "\U0001F4C4", "h": "2. Deposer une demande",
                 "p": "Choisissez un local dans le catalogue ou faites une demande de construction/renovation.",
                 "who": "Candidat", "col": "#5f7f9c"},
                {"idx": 3, "icon": "\U0001F4C2", "h": "3. Instruction & Courrier",
                 "p": "Le Bureau du Courrier receptionne les pieces et la DCUVE instruit l'eligibilite.",
                 "who": "Bureau Courrier / DCUVE", "col": "#8a94a6"},
                {"idx": 4, "icon": "\u2696", "h": "4. Commission consultative",
                 "p": "Evaluation technique et formelle par la commission avec notation ponderee.",
                 "who": "Commission consultative", "col": "#93714a"},
                {"idx": 5, "icon": "\U0001F511", "h": "5. Signature & Cles",
                 "p": "Le Service Juridique edite le bail domanial et remet le titre d'occupation.",
                 "who": "Service Juridique", "col": "#c9a15c"},
            ]
        },
    },
    {
        "cle": "vitrine_faq",
        "libelle": "Questions frequentes",
        "categorie": "VITRINE",
        "est_public": True,
        "valeur": {
            "items": [
                {"q": "Qui peut deposer une candidature pour un local commercial au CROUS-T ?",
                 "a": "Toute personne physique ou morale (commercants, artisans, etudiants prestataires, associations) souhaitant exercer une activite commerciale ou de service sur les campus du CROUS de Thies."},
                {"q": "Puis-je soumettre un dossier hors periode d'appel a candidature ?",
                 "a": "Oui. Meme hors appel a candidature, la plateforme permet de deposer une demande libre depuis votre espace personnel."},
                {"q": "Quels sont les delais moyens d'instruction d'un dossier ?",
                 "a": "L'instruction dure en moyenne 3 a 6 semaines a compter de la reception d'un dossier repute complet."},
                {"q": "Comment s'effectue le paiement des redevances d'occupation ?",
                 "a": "Aupres du Service Comptable via le guichet de caisse, avec emission immediate d'un quitus officiel."},
                {"q": "Comment contacter le Bureau du Courrier ou la DCUVE ?",
                 "a": "Via votre espace personnel ou par e-mail a courrier@crous-thies.sn, du lundi au vendredi de 8h a 16h."},
            ]
        },
    },
    {
        "cle": "vitrine_contacts",
        "libelle": "Coordonnees affichees sur la vitrine",
        "categorie": "VITRINE",
        "est_public": True,
        "valeur": {
            "email": "courrier@crous-thies.sn",
            "telephone": "+221 33 000 00 00",
            "adresse": "Campus social VCN, CROUS de Thies, Senegal",
            "horaires": "Lundi au vendredi, 8h - 16h",
        },
    },
    {
        "cle": "delai_instruction_jours",
        "libelle": "Delai cible d'instruction (jours)",
        "categorie": "WORKFLOW",
        "est_public": True,
        "valeur": {"valeur": 30},
    },
    {
        "cle": "penalite_retard_pourcentage",
        "libelle": "Penalite de retard appliquee aux echeances (%)",
        "categorie": "WORKFLOW",
        "est_public": False,
        "valeur": {"valeur": 5},
    },
    {
        "cle": "notifications_email_actives",
        "libelle": "Envoi des notifications par e-mail",
        "categorie": "NOTIFICATION",
        "est_public": False,
        "valeur": {"valeur": True},
    },
    {
        "cle": "maintenance_active",
        "libelle": "Mode maintenance de la plateforme",
        "categorie": "GENERAL",
        "est_public": True,
        "valeur": {"valeur": False, "message": ""},
    },
]


def charger_defauts(apps, schema_editor):
    Parametre = apps.get_model("core", "ParametreSysteme")
    for item in DEFAUTS:
        Parametre.objects.get_or_create(cle=item["cle"], defaults=item)


def supprimer_defauts(apps, schema_editor):
    Parametre = apps.get_model("core", "ParametreSysteme")
    Parametre.objects.filter(cle__in=[d["cle"] for d in DEFAUTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ParametreSysteme",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                ("date_modification", models.DateTimeField(auto_now=True)),
                ("cle", models.CharField(max_length=100, unique=True)),
                ("libelle", models.CharField(max_length=200)),
                ("valeur", models.JSONField(blank=True, default=dict)),
                ("categorie", models.CharField(choices=[("GENERAL", "General"), ("VITRINE", "Vitrine publique"), ("WORKFLOW", "Workflow & delais"), ("NOTIFICATION", "Notifications")], default="GENERAL", max_length=30)),
                ("description", models.TextField(blank=True)),
                ("est_public", models.BooleanField(default=False)),
            ],
            options={"ordering": ["categorie", "cle"]},
        ),
        migrations.RunPython(charger_defauts, supprimer_defauts),
    ]
