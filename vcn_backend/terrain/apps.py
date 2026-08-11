from django.apps import AppConfig


class TerrainConfig(AppConfig):
    name = 'terrain'

    def ready(self):
        import terrain.signals  # noqa: F401
