# SyLOC-T — Backend (Django + DRF)

API REST du systeme de gestion de l'occupation du site VCN — CROUS de Thies.
Projet Licence 3 GL.

---

## 1. Demarrage rapide

```bash
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # .env est deja fourni, en mode sqlite
python manage.py migrate
python manage.py seed_demo       # jeu de donnees de demonstration complet
python manage.py runserver
```

L'API repond sur `http://127.0.0.1:8000/api/`
(doc Swagger : `/api/docs/`, admin Django : `/admin/`).

Le frontend doit tourner en parallele sur `http://localhost:5173`
(son proxy Vite renvoie tout `/api` vers ce serveur).

### Base de donnees

Par defaut `.env` utilise **SQLite** : rien a installer.
Pour repasser sur MySQL, editez `.env` :

```
DB_ENGINE=mysql
DB_NAME=syloc_t
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

puis `python manage.py migrate`. Les tests tournent toujours sur SQLite.

---

## 2. Comptes de demonstration

`python manage.py seed_demo` est **idempotent** (relancable sans doublon) et
cree un compte par role metier — identifiant = mot de passe :

| Identifiant | Role | Ce qu'il permet de tester |
| --- | --- | --- |
| `admin` | superuser Django | `/admin/` |
| `etudiant` | USAGER | depot de dossier, suivi, avis cantine |
| `occupant` | USAGER + contrat actif | espace occupant, echeancier, paiement + quitus PDF |
| `courrier` | BUREAU_COURRIER | enregistrement et orientation du courrier d'arrivee |
| `agent_dcuve` | AGENT_DCUVE | instruction, validation des cartes etudiantes |
| `dcuve` | DIRECTEUR_DCUVE | instruction, commission, referentiel des locaux |
| `commission` | DIRECTEUR_CROUS_T | pilotage, rapports, decision finale |
| `juridique` | SERVICE_JURIDIQUE | redaction des contrats |
| `comptable` | SERVICE_COMPTABLE | guichet caisse, quitus |
| `technique` | SERVICE_TECHNIQUE | expertise maquettes, pannes |
| `terrain` | AGENT_TERRAIN | constats terrain, denonciation d'occupation |
| `qhse` | AGENT_QHSE | inspections QHSE, avis sanitaire |
| `communication` | CELLULE_COMMUNICATION | annonces, appels a candidature, moderation |
| `amicale` | AMICALE | consultation |
| `admin_si` | ADMINISTRATEUR_SI | gestion des comptes, journal d'audit |

Le seed cree aussi : 5 locaux (avec coordonnees GPS du campus, exploitees par
la carte interactive), un contrat actif, un echeancier de 3 echeances
(payee / exigible / a venir), 3 demandes a des stades differents du workflow
et 2 annonces de vitrine.

---

## 3. Surface de l'API

Toutes les routes sont prefixees par `/api/`. Authentification JWT
(`Authorization: Bearer <access>`), rafraichissement automatique cote frontend.

| Prefixe | Contenu |
| --- | --- |
| `comptes/` | login, refresh, `me/`, utilisateurs, notifications, changement de mot de passe |
| `demandes/` | demandes (+ historique, documents, changement de statut, avis technique/sanitaire, decision, acceptation de contrat), appels a candidature, votes de commission |
| `patrimoine/` | locaux |
| `contrats/` | contrats |
| `paiements/` | echeances, paiements, `paiements/regler/` |
| `terrain/` | plaintes, inspections QHSE, sanctions, avis cantine |
| `fidelite/` | `mon-score/` |
| `cartes_etudiants/` | verification des cartes |
| `rapports/`, `dashboard/`, `audit/`, `annonces/`, `public/` | pilotage, statistiques, journal d'audit, vitrine |

La liste exhaustive et a jour est generee automatiquement : **`/api/docs/`**.

### Portee des donnees

Les echeances et paiements sont filtres par utilisateur : un occupant ne voit
que son propre echeancier, tandis que le Service Comptable, la Direction et
l'Administrateur SI conservent une vue globale (guichet de caisse).

---

## 4. Tests

```bash
python manage.py test
```

Les tests s'executent sur SQLite, independamment de la configuration `.env`.

---

## 5. Structure

```
backend/
├── config/            # settings, urls racine, JWT / DRF / CORS
├── core/              # BaseModel, permissions, audit, annonces, vues publiques
│   └── management/commands/seed_demo.py
├── comptes/           # Utilisateur, Demandeur, Notification
├── demandes/          # Demande, Dossier, Document, appels, commission
├── patrimoine/        # Local (avec coordonnees GPS)
├── contrats/          # Contrat
├── paiements/         # Echeance, Paiement, quitus
├── terrain/           # Plainte, InspectionQHSE, Sanction, AvisCantine
├── fidelite/          # Score de fidelite
├── cartes_etudiants/  # Verification des cartes etudiantes
└── seed.py            # ancien point d'entree -> appelle seed_demo
```
