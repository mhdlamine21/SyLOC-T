# 👩‍💻 LIVRAISON DÉVELOPPEUR 3 — DIARRA (`diarra_work`)

Ce dossier contient l'intégralité du code et des composants correspondant aux **6 tickets (LR-13 à LR-18)** attribués à **Diarra**.

---

## 📋 RÉCAPITULATIF DES TICKETS ET COMPOSANTS

| Ticket | Description de la fonction | Composant correspondant |
|--------|----------------------------|-------------------------|
| **LR-13** | Paiement d'échéances & Quitus Officiel | `components/contrats/Paiement.jsx` |
| **LR-14** | Signalement technique (auto-rattaché au contrat actif) | `components/terrain/SignalerProbleme.jsx` |
| **LR-15** | Dénonciation anonyme d'occupation illégale sans titre | `components/terrain/DenoncerOccupation.jsx` |
| **LR-16** | Inspection QHSE sanitaire avec géolocalisation GPS | `components/terrain/InspectionQHSE.jsx` |
| **LR-17** | Validation des cartes étudiantes (secours) | `components/terrain/ValidationCartes.jsx` |
| **LR-18** | Avis cantines rédigé avec les 4 règles anti-fraude | `components/avis/LaisserAvis.jsx` |

---

## 🚀 COMMANDES A EXECUTER SUR TA MACHINE POUR PUSHER TES TÂCHES

Ouvre ton terminal Git Bash ou VS Code sur ton ordinateur et exécute ces commandes :

```bash
# 1. Récupérer les dernières mises à jour du dépôt principal
git checkout develop
git pull origin develop

# 2. Créer et basculer sur ta branche dédiée diarra_work
git checkout -b diarra_work

# 3. Copier les fichiers de ce dossier vers ton projet frontend/src/

# 4. Commiter tes fichiers
git add .
git commit -m "feat(diarra): tickets LR-13 à LR-18 — paiement caisse, signalements, inspection qhse, cartes et avis cantine"

# 5. Pousser ta branche diarra_work sur GitHub
git push -u origin diarra_work
```
