# Backend — Systeme de gestion de l'occupation du site VCN (CROUS-T)

Django + Django REST Framework. Projet Licence 3 GL — Data Processing/BDA.

## Demarrage rapide (local)

```bash
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API dispo sur `http://127.0.0.1:8000/api/`, doc Swagger sur `/api/docs/`,
admin Django sur `/admin/`.

## Demarrage sur Google Colab

```python
!git clone <URL_DU_REPO>
%cd vcn_backend
!pip install -r requirements.txt --break-system-packages -q
!python manage.py migrate
# Pour exposer le serveur publiquement (demo/tests) :
!pip install pyngrok -q
from pyngrok import ngrok
public_url = ngrok.connect(8000)
print(public_url)
!python manage.py runserver 0.0.0.0:8000
```

## Structure du projet

```
vcn_backend/
├── config/          # settings, urls racine, JWT/DRF/CORS
├── core/            # BaseModel + permissions partagees
├── comptes/         # Utilisateur, Demandeur, Notification   (Personne 1)
├── demandes/        # Demande, Dossier, Document, ...        (Personne 1)
├── patrimoine/      # Local                                  (Personne 2)
├── contrats/        # Contrat, Echeance                      (Personne 2)
├── paiements/       # Paiement                                (Personne 2)
├── terrain/         # Plainte, InspectionQHse, Sanction       (Personne 3)
├── fidelite/         # AvisCantine                            (Personne 3)
└── CONTEXT.md        # a donner a votre agent avant de coder une app
```

## Workflow d'equipe

1. Lisez `CONTEXT.md` (ou donnez-le a votre agent Antigravity) avant de
   generer le code d'une app.
2. Une branche par app/personne, jamais de push direct sur `main`.
3. PR -> review Antigravity (coherence front/back) -> review humaine -> merge.
4. `python manage.py test` doit passer avant tout merge.

## Prochaine etape pour chaque personne

Dans votre app, creez `models.py` (deja un `Utilisateur` fonctionnel pour
Personne 1 en exemple), puis `serializers.py`, puis `views.py`
(ViewSets DRF), puis enregistrez vos routes dans `urls.py` de votre app.
