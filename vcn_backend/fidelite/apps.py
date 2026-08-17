from django.apps import AppConfig


class FideliteConfig(AppConfig):
    name = 'fidelite'

    def ready(self):
        import fidelite.signals  # noqa: F401
