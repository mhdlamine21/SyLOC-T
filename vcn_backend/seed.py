"""Ancien point d'entree du seed, conserve pour compatibilite.

Le jeu de donnees vit desormais dans une commande Django, testable et
idempotente :

    python manage.py seed_demo

Ce script se contente de l'appeler.
"""

import os

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command  # noqa: E402


def run():
    call_command('seed_senegal_godmode')


if __name__ == '__main__':
    run()
