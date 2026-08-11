# 🏛️ SyLOC-T — Système de Gestion du Domaine & des Locaux Commerciaux (CROUS-T)

Plateforme web moderne, ultra-responsive et sécurisée dédiée à la dématérialisation complète du processus de gestion domaniale, des candidatures, des baux domaniaux et du recouvrement des redevances du **Centre Régional des Œuvres Universitaires de Thiès (CROUS-T)**.

---

## 🎨 Charte Graphique & Design System

- **Couleurs Principales** :
  - **Bleu Marine Institutionnel** : `#172554` (Fond sombres, en-têtes, boutons d'action d'autorité)
  - **Or Domanial Premium** : `#C9A15C` (Bordures de prestige, badges d'excellence, accents)
- **Typographie** : *Sora* (titres et éléments d'affichage) et *Inter* (corps de texte et tableaux de données).
- **Mode Sombre / Clair** : Basculement dynamique automatique préservant le contraste visuel (`data-theme="dark"`).
- **Navigation Adaptative** :
  - Écrans larges ($\ge 1024\text{px}$) : Menu supérieur horizontal fluide avec logo SVG adaptatif `AppLogo.jsx`.
  - Écrans mobiles ($< 1024\text{px}$) : Tiroir latéral escamotable avec masque d'arrière-plan.

---

## 👥 Rôles & Espaces Métiers (13 Profils Utilisateurs)

1. **Usager / Candidat / Occupant** : Consultation du catalogue des locaux, dépôt de candidature, suivi, paiement d'échéances et quitus.
2. **Directeur Général (DG)** : Dashboard stratégique avec KPIs, graphiques interactifs et rapports téléchargeables (PDF/Excel).
3. **Service de la Vie Étudiante (DCUVE)** : Instruction administrative, vérification de recevabilité et avis sanitaires.
4. **Commission Consultative d'Évaluation** : Session de délibération, notation formelle/technique et vote des demandes.
5. **Service Juridique & Contentieux** : Émission et rédaction des baux domaniaux, procédures de résiliation et rupture de contrat.
6. **Service Comptable & Caisse** : Recouvrement des redevances, échéanciers sur 12 mois, quitus et journaux de paiement.
7. **Service Technique & Maintenance** : Expertise des maquettes 3D, plans de faisabilité et suivi des incidents.
8. **Bureau Environnement (QHSE)** : Inspections sanitaires, notation d'hygiène, capture GPS et levée des sanctions.
9. **Brigade de Contrôle Terrain** : Constats d'occupation sans titre, dénonciations anonymes et vérifications sur le campus.
10. **Cellule Communication & Information** : Publication des appels à candidature et gestion des annonces épinglées sur l'accueil.
11. **Administrateur SI** : Gestion des comptes utilisateurs, attribution des 13 rôles et consultation du journal d'audit.

---

## 🚀 Installation & Lancement en Développement

### Prérequis
- **Node.js** v18+ et **npm** v9+

### Démarrage Rapide
```bash
# 1. Se placer dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement Vite
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

---

## 🌿 Stratégie des Branches Git & Collaboration

- `frontend` : Branche d'intégration principale récapitulant la version finale validée du Frontend.
- `lamine_work` : Branche du Chef d'Équipe (Authentification, Vitrine, Dépôt/Suivi, Dashboards Direction & Admin SI).
- `khadim_work` : Branche du Développeur 2 (DCUVE, Commission, Espace Occupant, Échéancier Baux).
- `diarra_work` : Branche du Développeur 3 (Paiements Caisse, Signalements, Inspection QHSE, Validation Cartes, Avis Cantines).

---

## 📄 Licence
Projet réalisé dans le cadre du module Développement Web Avancé — UFR Sciences & Technologies / CROUS de Thiès.
