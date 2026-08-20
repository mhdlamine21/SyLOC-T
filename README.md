# SyLOC-T (CROUS de Thiès - Université Iba Der Thiam)

> **Système de Gestion des Locaux Commerciaux du CROUS de Thiès (SyLOC-T)**

---

## 🎓 Contexte Académique & Présentation

Ce projet a été conçu et réalisé dans le cadre du cursus universitaire à l'**Université Iba Der Thiam de Thiès** :

- **Niveau & Formation** : Licence 3 Informatique — Option **Génie Logiciel**
- **Semestre** : Semestre 5 (L3 S5)
- **Matière / Cours** : **Bases de Données Avancées**

### 📌 À propos de SyLOC-T

**SyLOC-T** signifie **Système de Gestion des Locaux Commerciaux du CROUS de Thiès**.

Il a été développé pour répondre aux problématiques de gestion, d'attribution et de suivi des locaux commerciaux et des cantines au niveau de notre université :

- **Attribution des cantines & locaux** : réception et instruction des dossiers de candidature, commission d'attribution et génération des baux.
- **Gestion financière** : suivi des loyers, quittances, paiements (Wave, Orange Money) et gestion des conventions subventionnées pour les étudiants.
- **Gestion technique & QHSE** : suivi de la maintenance, signalement d'incidents, constats d'occupation et inspections sanitaires.

### 👥 Équipe du Projet

| Équipe          | Membre                  | Contact Email                                                       |
| --------------- | ----------------------- | ------------------------------------------------------------------- |
| 🎨 **Frontend** | Mouhamadou Lamine NIANG | [mouhamedlniang@gmail.com](mailto:mouhamedlniang@gmail.com)         |
| 🎨 **Frontend** | Diarra DIOUM            | [diarra.dioum@univ-thies.sn](mailto:diarra.dioum@univ-thies.sn)     |
| 🎨 **Frontend** | Serigne Khadim DIAGNE   | [skhadim.diagne@univ-thies.sn](mailto:skhadim.diagne@univ-thies.sn) |
| ⚙️ **Backend**  | El Hadji Malick SY      | [ehmalick.sy1@univ-thies.sn](mailto:ehmalick.sy1@univ-thies.sn)     |
| ⚙️ **Backend**  | Papa Assane KASSE       | [passane.kasse@univ-thies.sn](mailto:passane.kasse@univ-thies.sn)   |
| ⚙️ **Backend**  | Asta MBATHIE            | [asta.mbathie@univ-thies.sn](mailto:asta.mbathie@univ-thies.sn)     |

---

## 🚀 Démarrage Rapide (1-Click)

Les dossiers `node_modules` et `.venv` ne sont **pas versionnés** dans Git. Le projet est configuré pour **télécharger et installer automatiquement toutes les dépendances** au premier lancement.

### Sous Windows :

Double-cliquez sur le fichier ou lancez dans le terminal :

```cmd
start.bat
```

### Sous Linux / macOS :

```bash
chmod +x start.sh
./start.sh
```

---

## 🛠️ Démarrage Manuel

### 1. Backend (Django / DRF)

```bash
cd vcn_backend
python -m venv .venv
# Windows :
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py runserver

# Linux / Mac :
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend (React / Vite)

```bash
cd frontend
# Les dépendances node_modules s'installent automatiquement via predev :
npm run dev
```

---

## 🗄️ Base de Données MySQL

- **Nom de la base** : `syloc_t`
- **Fichier de dump initial** : [`syloc_t.sql`](./syloc_t.sql)
- **Rechargement de la base** :

```bash
cd vcn_backend
.venv\Scripts\python seed.py
```

---

## 🔑 Comptes de Démonstration (Mot de passe = Identifiant)

| Profil                              | Identifiant     | Mot de passe    | Espace                                            |
| ----------------------------------- | --------------- | --------------- | ------------------------------------------------- |
| **Candidat / Usager postulant**     | `candidat`      | `candidat`      | Espace Candidat (dépôt, suivi, avis)              |
| **Occupant Titulaire (Commerçant)** | `occupant`      | `occupant`      | Espace Occupant (loyers Wave/OM, bail, pannes)    |
| **Étudiant Titulaire subventionné** | `etudiant`      | `etudiant`      | Espace Occupant (convention subventionnée 0 FCFA) |
| **Bureau du Courrier**              | `courrier`      | `courrier`      | Registre courrier d'arrivée & validation cartes   |
| **Agent DCUVE**                     | `agent_dcuve`   | `agent_dcuve`   | Instruction dossiers & recevabilité               |
| **Directeur DCUVE**                 | `dcuve`         | `dcuve`         | Décisions & gestion patrimoine                    |
| **Directeur Général CROUS-T**       | `commission`    | `commission`    | Commission d'attribution & signature baux         |
| **Service Juridique**               | `juridique`     | `juridique`     | Rédaction des baux & modèles de contrats          |
| **Service Comptable**               | `comptable`     | `comptable`     | Caisse, quitus fiscaux, suivi impayés             |
| **Service Technique**               | `technique`     | `technique`     | Maintenance, signalements & interventions         |
| **Agent de Terrain**                | `terrain`       | `terrain`       | Constats d'occupation, ordres de mission          |
| **Inspectrice QHSE**                | `qhse`          | `qhse`          | Fiches d'inspection sanitaire & salubrité         |
| **Cellule Communication**           | `communication` | `communication` | Annonces vitrine & modération des avis            |
| **Amicale des Étudiants**           | `amicale`       | `amicale`       | Gestion locaux & reversements (15%)               |
| **Super Administrateur SI**         | `admin`         | `admin`         | Gestion globale, sécurité & audit                 |
