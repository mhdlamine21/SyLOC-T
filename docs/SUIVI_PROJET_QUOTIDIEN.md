# Mon Suivi Quotidien - Projet SyLOC-T (Backend)

Ce document est ta boussole. Ouvre-le tous les jours pour savoir où tu en es, ce qui est déjà fait, et ce qu'il te reste à accomplir. Coche les cases `[x]` au fur et à mesure de ta progression.

---

## 🎯 Ce qui est déjà terminé (Victoires passées)

- [x] Initialisation du projet Django et configuration MySQL.
- [x] Définition des rôles et de la séparation (Moi = Backend global / Personne 1 = Demandes).
- [x] **Domaine Comptes** : Création des modèles `Utilisateur`, `Demandeur`, `Notification`, `JournalAudit`.
- [x] **Domaine Comptes** : Tests unitaires de base validés.

---

## 🚀 ROADMAP : Ce qu'il reste à faire

*La règle d'or : On ne passe pas à l'étape suivante tant que l'étape en cours n'est pas testée et validée.*

### ÉTAPE 1 : Sécuriser l'accès (Le cœur du système)
*Ton objectif : Faire en sorte que n'importe qui puisse s'inscrire, se connecter et être reconnu selon son rôle.*
- [ ] Configurer JWT (JSON Web Tokens) pour l'authentification.
- [ ] Coder l'API d'inscription (`POST /api/comptes/register/`).
- [ ] Coder l'API de connexion (`POST /api/comptes/login/`).
- [ ] Tester les restrictions de sécurité (ex: bloquer un usager qui tente d'accéder à une route d'admin).

### ÉTAPE 2 : Le Patrimoine (La base des données)
*Ton objectif : Avoir des locaux dans la base pour pouvoir y affecter des contrats plus tard.*
- [x] Créer le modèle `Local` avec tous ses attributs (type, surface, état, géolocalisation).
- [x] Coder les APIs pour ajouter, lister et modifier un local (`GET/POST/PUT /api/patrimoine/locaux/`).
- [x] Tester la création d'un local en base.

### ÉTAPE 3 : Les Contrats et Finances
*Ton objectif : Lier un occupant à un local et gérer l'argent.*
- [x] Créer les modèles `Contrat`, `Echeance`, et `Paiement` (avec logs Mobile Money).
- [x] Coder l'API pour générer un contrat d'attribution.
- [x] Coder la logique qui génère automatiquement l'échéancier (les factures) quand un contrat est signé.
- [x] Coder l'API de paiement (qui solde une échéance).

### ÉTAPE 4 : Exploitation et Terrain
*Ton objectif : Faire vivre les locaux (plaintes, hygiène, sanctions).*
- [x] Créer les modèles `Plainte`, `InspectionQHse`, `Sanction`, `AvisCantine`.
- [x] Coder l'API pour déposer et suivre une plainte.
- [x] Coder l'API pour les agents QHSE (créer un rapport d'inspection avec séparation stricte Agent Terrain / Agent QHSE).
- [x] Coder la logique qui déclenche automatiquement une sanction si une inspection est mauvaise ou cumule 3 plaintes.

---

### ÉTAPE 5 : L'intégration Finale (Ce qu'il reste à faire)
*Ton objectif : Préparer l'API pour le frontend et le déploiement.*
- [ ] Configurer l'authentification JWT (Login / Register).
- [ ] Créer les fixtures/seeders pour remplir la base de données.
- [ ] Ajouter drf-yasg/Swagger pour documenter l'API pour l'équipe Frontend.

## 📖 Espace Apprentissage (À remplir)
*Ici, on notera les liens vers les fichiers d'explications pédagogiques que je te générerai à la fin de chaque grande étape.*

1. **Authentification JWT** : *(Fichier à venir une fois l'Étape 1 terminée)*
2. **Gestion des Modèles et Vues Django** : *(Fichier à venir...)*
3. **Logique métier complexe (Génération d'échéancier)** : *(Fichier à venir...)*
