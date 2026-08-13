-- Fichier de démo pour tester l'insertion manuelle en base de données.
-- À exécuter dans votre outil MySQL (phpMyAdmin, Workbench, etc.)

-- ÉTAPE 1 : Trouver un contrat attribué à l'Amicale.
-- Nous allons chercher l'ID d'une échéance liée à un local géré par l'Amicale.
-- SELECT e.id, e.montant_du, c.local_id 
-- FROM paiements_echeance e
-- JOIN contrats_contrat c ON e.contrat_id = c.id
-- JOIN patrimoine_local l ON c.local_id = l.id
-- WHERE l.gestionnaire = 'AMICALE' AND e.statut = 'NON_ECHUE' LIMIT 1;

-- ÉTAPE 2 : Une fois que vous avez l'ID de l'échéance (ex: 'un-id-uuid-1234'), 
-- vous pouvez insérer le paiement. 
-- REMPLACEZ 'VOTRE_ID_ECHEANCE' par l'ID réel trouvé à l'étape 1.

INSERT INTO paiements_paiement (
    id, 
    date_creation, 
    date_modification, 
    date_paiement, 
    montant_regle, 
    mode, 
    reference_transaction, 
    reference_quitus, 
    echeance_id
) VALUES (
    REPLACE(UUID(), '-', ''), -- Génère un ID unique compatible Django
    NOW(6), 
    NOW(6), 
    NOW(6), 
    15000.0, -- Montant du paiement
    'ESPECES', 
    CONCAT('TXN-', REPLACE(UUID(), '-', '')), 
    CONCAT('QUITUS-', REPLACE(UUID(), '-', '')), 
    'VOTRE_ID_ECHEANCE' -- <<< À REMPLACER
);

-- Dès que cette requête est exécutée dans MySQL, 
-- allez sur l'application Web et actualisez le Tableau de Bord ! 
-- Vous verrez que les montants encaissés s'actualisent en temps réel.

-- NOTE SUR L'AUTOMATISATION DU REVERSEMENT :
-- Puisque vous faites l'INSERT directement en base avec MySQL, le code Python (le hook logiciel) 
-- qui automatise la validation et le reversement à 100% ne sera pas déclenché. C'est normal.
-- Pour tester *l'automatisation du reversement* que je viens de coder, il faut utiliser 
-- l'application elle-même pour payer, ou faire l'INSERT dans la table paiements_reversementamicale vous-même !
