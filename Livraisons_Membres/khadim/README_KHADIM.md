# 👨‍💻 LIVRAISON DÉVELOPPEUR 2 — KHADIM (`khadim_work`)

Ce dossier contient l'intégralité du code et des composants correspondant aux **5 tickets (LR-8 à LR-12)** attribués à **Khadim**.

---

## 📋 RÉCAPITULATIF DES TICKETS ET COMPOSANTS

| Ticket | Description de la fonction | Composant correspondant |
|--------|----------------------------|-------------------------|
| **LR-8** | Liste des demandes d'occupation (Vue Agent DCUVE) | `components/demandes/InstructionDCUVE.jsx` |
| **LR-9** | Instruction approfondie & Avis Sanitaire Externe | `components/demandes/InstructionDCUVE.jsx` |
| **LR-10** | Vote de la Commission Consultative d'Évaluation | `components/demandes/CommissionVote.jsx` |
| **LR-11** | Espace Occupant Titulaire (Consultation des contrats & baux) | `components/contrats/EspaceOccupant.jsx` |
| **LR-12** | Échéancier de paiement des 12 redevances mensuelles | `components/contrats/Echeancier.jsx` |

---

## 🚀 COMMANDES A EXECUTER SUR TA MACHINE POUR PUSHER TES TÂCHES

Ouvre ton terminal Git Bash ou VS Code sur ton ordinateur et exécute ces commandes :

```bash
# 1. Récupérer les dernières mises à jour du dépôt principal
git checkout develop
git pull origin develop

# 2. Créer et basculer sur ta branche dédiée khadim_work
git checkout -b khadim_work

# 3. Copier les fichiers du dossier Livraisons_Membres/khadim/ vers ton dossier src/

# 4. Commiter tes fichiers
git add .
git commit -m "feat(khadim): tickets LR-8 à LR-12 — instruction dcuve, commission vote, espace occupant et échéanciers"

# 5. Pousser ta branche khadim_work sur GitHub
git push -u origin khadim_work
```

---

## 📁 STRUCTURE DES FICHIERS FOURNIS DANS CE DOSSIER

- `InstructionDCUVE.jsx` (Gestion et instruction des demandes par la DCUVE)
- `CommissionVote.jsx` (Interface de délibération et vote de la commission)
- `EspaceOccupant.jsx` (Tableau de bord de l'occupant titulaire d'un bail)
- `Echeancier.jsx` (Tableau détaillé des 12 échéances mensuelles)
