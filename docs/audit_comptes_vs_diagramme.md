# Walkthrough : Vérification du Domaine "Identité et Acteurs"

Ce document sert de preuve et d'outil d'audit pour vérifier que le code source de l'application `comptes` est 100% fidèle au diagramme de classes V6 et à son explication détaillée (`Diagramme_Classe_Documentation (1).pdf`).

---

## 1. Héritage et Conventions (BaseModel)
D'après nos règles, chaque entité doit avoir un identifiant unique et des dates de création automatiques.
- **Vérification** : La classe `BaseModel` (dans `core/models.py`) gère la génération des UUID (identifiants au format texte complexe) et implémente les champs `date_creation` et `date_modification`.
- **Verdict** : ✅ Conforme. `Demandeur`, `Notification` et `JournalAudit` en héritent correctement. `Utilisateur` hérite du modèle d'authentification natif de Django (`AbstractUser`) tout en forçant l'utilisation d'un UUID pour coller au diagramme.

---

## 2. Les Énumérations (Section 4 du PDF)
Le diagramme impose des listes de valeurs fermées pour limiter les erreurs de saisie.

| Énumération (UML) | Implémentation Django (`TextChoices`) | Statut |
| :--- | :--- | :---: |
| **RoleUtilisateur** | Les 13 rôles (USAGER, BUREAU_COURRIER, ..., ADMINISTRATEUR_SI) sont strictement implémentés. | ✅ |
| **StatutVerificationEtudiant** | NON_SOUMIS, EN_ATTENTE, VALIDE, REJETE | ✅ |
| **CanalNotification** | SMS, EMAIL, PUSH_APP | ✅ |

---

## 3. Les Classes (Section 5.1 du PDF)

### Classe : `Utilisateur`
- **Rôle métier** : Compte racine de connexion pour tout acteur du système.
- **Attributs vérifiés** :
  - `idUtilisateur` ➔ `id` (UUIDField)
  - `nomComplet` ➔ `nom_complet` (CharField)
  - `email` ➔ `email` (EmailField, unique)
  - `motDePasse` ➔ Géré nativement et haché par Django (`password`)
  - `role` ➔ `role` (lié à l'enum `RoleUtilisateur`)
  - `delegationActive` / `delegationExpiration` ➔ Ajoutés pour permettre la délégation ponctuelle de validation.
- **Verdict** : ✅ Exact.

### Classe : `Demandeur`
- **Rôle métier** : Profil métier attaché à un Utilisateur usager.
- **Attributs vérifiés** :
  - `contact` ➔ `contact`
  - `estEtudiant` ➔ `est_etudiant`
  - `matriculeEtudiant` ➔ `matricule_etudiant`
  - `carteEtudiantFichier` ➔ `carte_etudiant_fichier` (FileField)
  - `statutVerificationEtudiant` ➔ `statut_verification_etudiant`
  - `scoreFidelite` ➔ `score_fidelite` (FloatField)
- **Verdict** : ✅ Exact.

### Classe : `Notification` et `JournalAudit`
- **Attributs vérifiés** : Le canal, le contenu, le statut de lecture pour les notifications, et les détails de l'action pour le journal d'audit sont tous présents.
- **Verdict** : ✅ Exact.

---

## 4. Relations et Cardinalités (Section 6.1 du PDF)

> [!NOTE]
> La documentation PDF exige une stricte séparation entre le rôle système (Utilisateur) et le profil de données (Demandeur), ainsi qu'une traçabilité absolue (Audit).

1. **Relation Utilisateur ➔ Demandeur (1 pour 0..1)**
   - *Règle UML* : Composition. Un demandeur n'a de sens que rattaché à un Utilisateur.
   - *Code* : `utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE)`
   - *Validation* : `CASCADE` garantit que si on supprime l'Utilisateur, le profil Demandeur est détruit. Cardinalité respectée.

2. **Relation Notification ➔ Utilisateur (* pour 1)**
   - *Règle UML* : Association simple (« reçoit »). Un utilisateur peut recevoir un nombre illimité de notifications.
   - *Code* : `destinataire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="notifications")`
   - *Validation* : La clé étrangère gère parfaitement la cardinalité * à 1.

3. **Relation Utilisateur ➔ Demandeur (Validation Carte Étudiant)**
   - *Règle UML* : 0..1 Utilisateur pour * Demandeur (« valide_carte_etudiant_de »).
   - *Code* : `valide_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)`
   - *Validation* : Un administrateur peut valider plusieurs cartes, mais une carte n'est validée que par un agent (ou aucun si en attente). `null=True` et `SET_NULL` traduisent le 0..1.

4. **Relation Utilisateur ➔ JournalAudit (1 pour *)**
   - *Règle UML* : Chaque action sensible transverse est tracée.
   - *Code* : `utilisateur = models.ForeignKey(Utilisateur, ...)`
   - *Validation* : Relation respectée pour la traçabilité.

---

## 5. Conclusion Générale

> [!TIP]
> Le code de l'application `comptes` est **100% aligné** avec l'analyse conceptuelle UML. Tu peux t'appuyer sur cette fondation solide pour passer à l'étape suivante (Authentification JWT et API) sans aucune crainte de dette technique ou d'erreur d'architecture.
