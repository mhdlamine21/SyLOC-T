from django.apps import AppConfig


class ContratsConfig(AppConfig):
    name = 'contrats'

    def ready(self):
        import contrats.signals  # noqa: F401
