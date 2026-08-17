"""Middleware anti-cache pour l'API.

Empêche les navigateurs et proxys de servir d'anciennes réponses de l'API,
ce qui donnait l'impression de voir une « ancienne version » de l'application.
Les fichiers média/statique restent cachables.
"""


class NoCacheApiMiddleware:
    EXCLUS = ('/media/', '/static/')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        chemin = request.path or ''
        if not chemin.startswith(self.EXCLUS):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response
