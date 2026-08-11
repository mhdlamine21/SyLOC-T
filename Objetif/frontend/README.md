# SyLOC-T — Frontend

Système de gestion des locaux du CROUS de Thiès — React + Vite + Tailwind.

## Démarrage
```bash
npm install
cp .env.example .env
npm run dev
```

## Structure
```
src/
  assets/        logo et images
  components/    Header, Footer, Layout, composants UI réutilisables (ui.jsx)
  context/       AuthContext (auth mockée en attendant le Backend)
  mocks/         données de démonstration (data.js)
  pages/         un fichier par écran
  services/      client API (api.js)
  router.jsx     toutes les routes de l'application
```

## Palette (tailwind.config.js)
Dérivée du logo SyLOC-T : `navy` (#1b2a4e) + `gold` (#c99a3d), fond crème (`bg` #faf9f6).

## Avancement — voir le board Jira (épics SYL-E1 à SYL-E5)
- [x] Phase 1 — Fondations (setup, routeur, auth mockée, vitrine, connexion, inscription)
- [ ] Phase 2 — Dépôt de demande, suivi, carte étudiante
- [ ] Phase 3 — Instruction DCUVE, paiements, comptable
- [ ] Phase 4 — Terrain, dénonciation, avis cantines
- [ ] Phase 5 — Dashboard Direction, intégration API réelle, déploiement
