from django.apps import AppConfig


class DemandesConfig(AppConfig):
    name = 'demandes'

    def ready(self):
        import demandes.signals  # noqa: F401
