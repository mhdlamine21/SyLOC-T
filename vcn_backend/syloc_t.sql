-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 13 août 2026 à 03:00
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `syloc_t`
--

-- --------------------------------------------------------

--
-- Structure de la table `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add user', 6, 'add_utilisateur'),
(22, 'Can change user', 6, 'change_utilisateur'),
(23, 'Can delete user', 6, 'delete_utilisateur'),
(24, 'Can view user', 6, 'view_utilisateur'),
(25, 'Can add demandeur', 7, 'add_demandeur'),
(26, 'Can change demandeur', 7, 'change_demandeur'),
(27, 'Can delete demandeur', 7, 'delete_demandeur'),
(28, 'Can view demandeur', 7, 'view_demandeur'),
(29, 'Can add notification', 8, 'add_notification'),
(30, 'Can change notification', 8, 'change_notification'),
(31, 'Can delete notification', 8, 'delete_notification'),
(32, 'Can view notification', 8, 'view_notification'),
(33, 'Can add journal audit', 9, 'add_journalaudit'),
(34, 'Can change journal audit', 9, 'change_journalaudit'),
(35, 'Can delete journal audit', 9, 'delete_journalaudit'),
(36, 'Can view journal audit', 9, 'view_journalaudit'),
(37, 'Can add local', 10, 'add_local'),
(38, 'Can change local', 10, 'change_local'),
(39, 'Can delete local', 10, 'delete_local'),
(40, 'Can view local', 10, 'view_local'),
(41, 'Can add appel candidature', 11, 'add_appelcandidature'),
(42, 'Can change appel candidature', 11, 'change_appelcandidature'),
(43, 'Can delete appel candidature', 11, 'delete_appelcandidature'),
(44, 'Can view appel candidature', 11, 'view_appelcandidature'),
(45, 'Can add demande', 12, 'add_demande'),
(46, 'Can change demande', 12, 'change_demande'),
(47, 'Can delete demande', 12, 'delete_demande'),
(48, 'Can view demande', 12, 'view_demande'),
(49, 'Can add membre commission', 13, 'add_membrecommission'),
(50, 'Can change membre commission', 13, 'change_membrecommission'),
(51, 'Can delete membre commission', 13, 'delete_membrecommission'),
(52, 'Can view membre commission', 13, 'view_membrecommission'),
(53, 'Can add vote commission', 14, 'add_votecommission'),
(54, 'Can change vote commission', 14, 'change_votecommission'),
(55, 'Can delete vote commission', 14, 'delete_votecommission'),
(56, 'Can view vote commission', 14, 'view_votecommission'),
(57, 'Can add historique statut demande', 15, 'add_historiquestatutdemande'),
(58, 'Can change historique statut demande', 15, 'change_historiquestatutdemande'),
(59, 'Can delete historique statut demande', 15, 'delete_historiquestatutdemande'),
(60, 'Can view historique statut demande', 15, 'view_historiquestatutdemande'),
(61, 'Can add dossier', 16, 'add_dossier'),
(62, 'Can change dossier', 16, 'change_dossier'),
(63, 'Can delete dossier', 16, 'delete_dossier'),
(64, 'Can view dossier', 16, 'view_dossier'),
(65, 'Can add critere appel', 17, 'add_critereappel'),
(66, 'Can change critere appel', 17, 'change_critereappel'),
(67, 'Can delete critere appel', 17, 'delete_critereappel'),
(68, 'Can view critere appel', 17, 'view_critereappel'),
(69, 'Can add contrat', 18, 'add_contrat'),
(70, 'Can change contrat', 18, 'change_contrat'),
(71, 'Can delete contrat', 18, 'delete_contrat'),
(72, 'Can view contrat', 18, 'view_contrat'),
(73, 'Can add echeance', 19, 'add_echeance'),
(74, 'Can change echeance', 19, 'change_echeance'),
(75, 'Can delete echeance', 19, 'delete_echeance'),
(76, 'Can view echeance', 19, 'view_echeance'),
(77, 'Can add paiement', 20, 'add_paiement'),
(78, 'Can change paiement', 20, 'change_paiement'),
(79, 'Can delete paiement', 20, 'delete_paiement'),
(80, 'Can view paiement', 20, 'view_paiement'),
(81, 'Can add transaction log', 21, 'add_transactionlog'),
(82, 'Can change transaction log', 21, 'change_transactionlog'),
(83, 'Can delete transaction log', 21, 'delete_transactionlog'),
(84, 'Can view transaction log', 21, 'view_transactionlog'),
(85, 'Can add inspection q hse', 22, 'add_inspectionqhse'),
(86, 'Can change inspection q hse', 22, 'change_inspectionqhse'),
(87, 'Can delete inspection q hse', 22, 'delete_inspectionqhse'),
(88, 'Can view inspection q hse', 22, 'view_inspectionqhse'),
(89, 'Can add plainte', 23, 'add_plainte'),
(90, 'Can change plainte', 23, 'change_plainte'),
(91, 'Can delete plainte', 23, 'delete_plainte'),
(92, 'Can view plainte', 23, 'view_plainte'),
(93, 'Can add sanction', 24, 'add_sanction'),
(94, 'Can change sanction', 24, 'change_sanction'),
(95, 'Can delete sanction', 24, 'delete_sanction'),
(96, 'Can view sanction', 24, 'view_sanction'),
(97, 'Can add avis cantine', 25, 'add_aviscantine'),
(98, 'Can change avis cantine', 25, 'change_aviscantine'),
(99, 'Can delete avis cantine', 25, 'delete_aviscantine'),
(100, 'Can view avis cantine', 25, 'view_aviscantine'),
(101, 'Can add historique score', 26, 'add_historiquescore'),
(102, 'Can change historique score', 26, 'change_historiquescore'),
(103, 'Can delete historique score', 26, 'delete_historiquescore'),
(104, 'Can view historique score', 26, 'view_historiquescore'),
(105, 'Can add document', 27, 'add_document'),
(106, 'Can change document', 27, 'change_document'),
(107, 'Can delete document', 27, 'delete_document'),
(108, 'Can view document', 27, 'view_document'),
(109, 'Can add annonce', 28, 'add_annonce'),
(110, 'Can change annonce', 28, 'change_annonce'),
(111, 'Can delete annonce', 28, 'delete_annonce'),
(112, 'Can view annonce', 28, 'view_annonce');

-- --------------------------------------------------------

--
-- Structure de la table `comptes_demandeur`
--

CREATE TABLE `comptes_demandeur` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `contact` varchar(50) NOT NULL,
  `est_etudiant` tinyint(1) NOT NULL,
  `matricule_etudiant` varchar(50) DEFAULT NULL,
  `score_fidelite` double NOT NULL,
  `utilisateur_id` char(32) NOT NULL,
  `carte_etudiant_date_validation` datetime(6) DEFAULT NULL,
  `carte_etudiant_fichier` varchar(100) DEFAULT NULL,
  `statut_verification_etudiant` varchar(32) NOT NULL,
  `valide_par_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `comptes_demandeur`
--

INSERT INTO `comptes_demandeur` (`id`, `date_creation`, `date_modification`, `contact`, `est_etudiant`, `matricule_etudiant`, `score_fidelite`, `utilisateur_id`, `carte_etudiant_date_validation`, `carte_etudiant_fichier`, `statut_verification_etudiant`, `valide_par_id`) VALUES
('fa7876ad0ba244c89d1e50e5c9942add', '2026-08-11 19:24:00.981085', '2026-08-11 19:24:00.981355', '', 0, NULL, 0, 'd6ab72e4964a451eb339d99a613d38b7', NULL, '', 'NON_SOUMIS', NULL),
('feed4bfbbd0140b3abe0811596a15587', '2026-08-11 21:19:42.666654', '2026-08-11 21:19:42.666694', '770000000', 0, NULL, 0, '1d24fae778da4675b149037501952f54', NULL, '', 'NON_SOUMIS', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `comptes_journalaudit`
--

CREATE TABLE `comptes_journalaudit` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `action` varchar(255) NOT NULL,
  `cible` varchar(255) NOT NULL,
  `details` longtext NOT NULL,
  `utilisateur_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comptes_notification`
--

CREATE TABLE `comptes_notification` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `contenu` longtext NOT NULL,
  `canal` varchar(16) NOT NULL,
  `est_lue` tinyint(1) NOT NULL,
  `destinataire_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comptes_utilisateur`
--

CREATE TABLE `comptes_utilisateur` (
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `id` char(32) NOT NULL,
  `email` varchar(254) NOT NULL,
  `role` varchar(32) NOT NULL,
  `delegation_active` tinyint(1) NOT NULL,
  `delegation_expiration` datetime(6) DEFAULT NULL,
  `nom_complet` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `comptes_utilisateur`
--

INSERT INTO `comptes_utilisateur` (`password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `is_staff`, `is_active`, `date_joined`, `id`, `email`, `role`, `delegation_active`, `delegation_expiration`, `nom_complet`) VALUES
('pbkdf2_sha256$600000$lOB8dDKsmkAXTGWkH6WWlE$aH77SL1qxQKnYB5WQxj17/A5jsm5fIzYClAkSvfv9Ls=', NULL, 0, 'occupant', '', '', 0, 1, '2026-08-11 18:34:59.035005', '1d24fae778da4675b149037501952f54', 'occupant@example.com', 'USAGER', 0, NULL, 'Occupant Test'),
('pbkdf2_sha256$600000$zqyi5JnUrjVvU4MzGghSHN$O5g/BXeZXP1TyJN87cHFbEdQtNBUjJHe1wLAQEjUhNE=', NULL, 0, 'qhse', '', '', 0, 1, '2026-08-11 20:35:16.117989', '24421f846d8e4a96a178091d40709f36', 'qhse@crous-t.sn', 'AGENT_QHSE', 0, NULL, 'Agent Bureau Environnement'),
('pbkdf2_sha256$600000$2MeMWZbG8NZ96oZD4AVNOm$Wxei9Vkl5qROFEAiBFnslSY242RW2urN+//qCK1X4Pk=', NULL, 0, 'comptable', '', '', 0, 1, '2026-08-11 20:54:50.540172', '2d049a353a6c4864a7c04c72017f93a3', 'comptable@crous-t.sn', 'SERVICE_COMPTABLE', 0, NULL, 'Service Comptable'),
('pbkdf2_sha256$600000$oAQVz9oQEqaAj2EYdEOrYL$/kFaPKNIy/fbQd/IkNFizRm0l7ekitaxxo/nrodb09k=', NULL, 0, 'juridique', '', '', 0, 1, '2026-08-11 20:35:12.557371', '3532d6c4b74e4ac49694f21f2dad8ca0', 'juridique@crous-t.sn', 'SERVICE_JURIDIQUE', 0, NULL, 'Service Juridique'),
('pbkdf2_sha256$600000$3qaRSRVpF2F2pconjIKlL1$NnsSklgHmkGwkUVR65XmSbgq26n1iCu4kDcfVUNhHig=', NULL, 0, 'communication', '', '', 0, 1, '2026-08-11 20:54:51.501849', '4d6ad6bb5acf4032801d49e1719b6833', 'com@crous-t.sn', 'CELLULE_COMMUNICATION', 0, NULL, 'Cellule Communication'),
('pbkdf2_sha256$600000$ZEueJkk4DaLfWPfDWmnwVO$G4d0BBZtA8DmoXHSbRzT/UATL7abHn/B/+5gXDlFuCY=', NULL, 1, 'admin', '', '', 1, 1, '2026-08-11 18:33:50.564748', '79889333144b4bd8b5a809884b68be65', 'admin@crous-t.sn', 'USAGER', 0, NULL, 'Admin SyLOC-T'),
('pbkdf2_sha256$600000$Chzulvw8IbNfnBuomTWNEf$6lDXPkLJ0z+MWELPBpDGZANcsAYxXHkSBA53gkaMmB0=', NULL, 0, 'dcuve', '', '', 0, 1, '2026-08-11 18:35:25.504001', '7f64120879c14ef985d37f2f1498dabb', 'dcuve@crous-t.sn', 'DIRECTEUR_DCUVE', 0, NULL, 'Agent DCUVE'),
('pbkdf2_sha256$600000$vV9Cc1DOovqLFqBOhyvZH3$g0XTxlt8ZPHlGIYXjXrA++ED8qos6pTEZSA3uett9oc=', NULL, 0, 'admin_si', '', '', 0, 1, '2026-08-11 20:54:53.581684', '8666a617c4154e8db67a674bc740c484', 'adminsi@crous-t.sn', 'ADMINISTRATEUR_SI', 0, NULL, 'Administrateur SI'),
('pbkdf2_sha256$600000$qrBIjqvws3KadRVHTBcqbJ$n1X3WdtQ5ykErH6lXCU901ptP+9OjEuSeSp2nky/hV0=', NULL, 0, 'courrier', '', '', 0, 1, '2026-08-11 20:54:49.608067', '929ae4ca653a43f08169018a06aa2ad9', 'courrier@crous-t.sn', 'BUREAU_COURRIER', 0, NULL, 'Bureau du Courrier'),
('pbkdf2_sha256$600000$s1lt7ftsJz6QeGQdedayH3$96Fsv6m2oc/YaBnZgCEa5gQMtUtSfY/NJc9E0g4Gc/w=', NULL, 0, 'commission', '', '', 0, 1, '2026-08-11 20:35:17.202520', '9440a0f753a54a6e8d15458937f802af', 'commission@crous-t.sn', 'DIRECTEUR_CROUS_T', 0, NULL, 'Membre Commission'),
('pbkdf2_sha256$600000$t88NDfMbb1ANxjdbsWxyJQ$PRfLz9BqIA5T4XAdh3vF6z1I4WW+Tm0dm5AqrwhOQ3Y=', NULL, 0, 'terrain', '', '', 0, 1, '2026-08-11 20:35:13.602660', '9c48c6b8c2e74f429aeb56d8a72dc8d5', 'terrain@crous-t.sn', 'AGENT_TERRAIN', 0, NULL, 'Agent Terrain'),
('pbkdf2_sha256$600000$s6K5ARWB0xkBrziDqCMhBZ$x46MIiDf0xjqh4tcNtn62omwuOOvBJWZkKBIi5fyEK0=', NULL, 0, 'etudiant', '', '', 0, 1, '2026-08-11 18:33:51.670356', 'd6ab72e4964a451eb339d99a613d38b7', 'etudiant@example.com', 'USAGER', 0, NULL, 'Etudiant Test'),
('pbkdf2_sha256$600000$TDy40LpfkjWlZBL3s4Ss4S$/ECjapzBvA4LYA0LlOqqrkNFXKFam8thgsGUcneET9A=', NULL, 0, 'amicale', '', '', 0, 1, '2026-08-11 20:54:52.595868', 'e74103fbf3084b6b9e555584bdd0d93f', 'amicale@crous-t.sn', 'AMICALE', 0, NULL, 'Amicale'),
('pbkdf2_sha256$600000$qahesSdbATLiI0kxX16e9s$sghiqyK/yvN+JCYpRElm+DL8a4juxXCXf7r/8A+R92M=', NULL, 0, 'usager1', '', '', 0, 1, '2026-08-10 03:45:57.826187', 'f46e0d3e418e4b6b85f51eebb13e0251', 'usager1@crous-t.sn', 'USAGER', 0, NULL, 'Modou Fall'),
('pbkdf2_sha256$600000$0FGe0jPd1DmcdyHuXOFGTR$ne34sH7AtwTwEVd+nL45UAbcZ6UstKof9VR9wJEO2FY=', NULL, 0, 'technique', '', '', 0, 1, '2026-08-11 20:35:14.830499', 'fe6f1584b5c0441d9d7db8d25433fd38', 'technique@crous-t.sn', 'SERVICE_TECHNIQUE', 0, NULL, 'Service Technique');

-- --------------------------------------------------------

--
-- Structure de la table `comptes_utilisateur_groups`
--

CREATE TABLE `comptes_utilisateur_groups` (
  `id` int(11) NOT NULL,
  `utilisateur_id` char(32) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comptes_utilisateur_user_permissions`
--

CREATE TABLE `comptes_utilisateur_user_permissions` (
  `id` int(11) NOT NULL,
  `utilisateur_id` char(32) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contrats_contrat`
--

CREATE TABLE `contrats_contrat` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `date_signature` date NOT NULL,
  `date_debut` date NOT NULL,
  `duree_mois` int(10) UNSIGNED NOT NULL CHECK (`duree_mois` >= 0),
  `preavis_mois` int(10) UNSIGNED NOT NULL CHECK (`preavis_mois` >= 0),
  `redevance_mensuelle` double NOT NULL,
  `montant_caution` double NOT NULL,
  `est_gratuit` tinyint(1) NOT NULL,
  `est_actif` tinyint(1) NOT NULL,
  `date_resiliation` date DEFAULT NULL,
  `motif_resiliation` longtext DEFAULT NULL,
  `demandeur_id` char(32) NOT NULL,
  `local_id` char(32) NOT NULL,
  `signataire_crous_t_id` char(32) NOT NULL,
  `demande_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `contrats_contrat`
--

INSERT INTO `contrats_contrat` (`id`, `date_creation`, `date_modification`, `date_signature`, `date_debut`, `duree_mois`, `preavis_mois`, `redevance_mensuelle`, `montant_caution`, `est_gratuit`, `est_actif`, `date_resiliation`, `motif_resiliation`, `demandeur_id`, `local_id`, `signataire_crous_t_id`, `demande_id`) VALUES
('949643b7bf2c44a09790e561f9b1543c', '2026-08-11 21:19:42.683887', '2026-08-11 21:19:42.683906', '2026-08-11', '2026-08-11', 24, 3, 50000, 100000, 0, 1, NULL, NULL, 'feed4bfbbd0140b3abe0811596a15587', '2778393db88e4d9581b38925e61502c4', '79889333144b4bd8b5a809884b68be65', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `core_annonce`
--

CREATE TABLE `core_annonce` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `contenu` longtext NOT NULL,
  `date_publication` date NOT NULL,
  `pin` varchar(20) NOT NULL,
  `bg` varchar(20) NOT NULL,
  `est_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_appelcandidature`
--

CREATE TABLE `demandes_appelcandidature` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `date_lancement` datetime(6) NOT NULL,
  `date_cloture` datetime(6) NOT NULL,
  `est_actif` tinyint(1) NOT NULL,
  `local_id` char(32) NOT NULL,
  `publie_par_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_critereappel`
--

CREATE TABLE `demandes_critereappel` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `type_critere` varchar(32) NOT NULL,
  `valeur_cible` varchar(255) NOT NULL,
  `poids` int(11) NOT NULL,
  `actif` tinyint(1) NOT NULL,
  `appel_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_demande`
--

CREATE TABLE `demandes_demande` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `type_demande` varchar(32) NOT NULL,
  `statut` varchar(32) NOT NULL,
  `date_depot` datetime(6) NOT NULL,
  `notes_admin` longtext NOT NULL,
  `appel_candidature_id` char(32) DEFAULT NULL,
  `demandeur_id` char(32) NOT NULL,
  `local_id` char(32) DEFAULT NULL,
  `reference_anonyme` varchar(50) NOT NULL,
  `avis_sanitaire_externe` varchar(50) NOT NULL,
  `reference_avis_sanitaire` varchar(255) NOT NULL,
  `description_projet` longtext NOT NULL,
  `rdv_signature_date` varchar(100) NOT NULL,
  `avis_technique_interne` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demandes_demande`
--

INSERT INTO `demandes_demande` (`id`, `date_creation`, `date_modification`, `type_demande`, `statut`, `date_depot`, `notes_admin`, `appel_candidature_id`, `demandeur_id`, `local_id`, `reference_anonyme`, `avis_sanitaire_externe`, `reference_avis_sanitaire`, `description_projet`, `rdv_signature_date`, `avis_technique_interne`) VALUES
('fffacd01d0f84edf9d761f4878447180', '2026-08-11 19:24:01.013111', '2026-08-11 19:24:01.013200', 'PRESTATION_SERVICE', 'NOUVELLE', '2026-08-11 19:24:01.013273', '', NULL, 'fa7876ad0ba244c89d1e50e5c9942add', '2778393db88e4d9581b38925e61502c4', 'DOSSIER-4D1C49B5', '', '', '', '', '');

-- --------------------------------------------------------

--
-- Structure de la table `demandes_document`
--

CREATE TABLE `demandes_document` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `type_document` varchar(30) NOT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `fichier` varchar(100) NOT NULL,
  `est_valide` tinyint(1) NOT NULL,
  `dossier_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_dossier`
--

CREATE TABLE `demandes_dossier` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `pieces_receptionnees` tinyint(1) NOT NULL,
  `est_complet` tinyint(1) NOT NULL,
  `demande_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demandes_dossier`
--

INSERT INTO `demandes_dossier` (`id`, `date_creation`, `date_modification`, `pieces_receptionnees`, `est_complet`, `demande_id`) VALUES
('c4483563b91f477d88d564337b3ca9a5', '2026-08-11 19:24:01.043149', '2026-08-11 19:24:01.043209', 0, 0, 'fffacd01d0f84edf9d761f4878447180');

-- --------------------------------------------------------

--
-- Structure de la table `demandes_historiquestatutdemande`
--

CREATE TABLE `demandes_historiquestatutdemande` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `ancien_statut` varchar(32) NOT NULL,
  `nouveau_statut` varchar(32) NOT NULL,
  `commentaire_acteur` longtext NOT NULL,
  `auteur_id` char(32) DEFAULT NULL,
  `demande_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_membrecommission`
--

CREATE TABLE `demandes_membrecommission` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `date_designation` datetime(6) NOT NULL,
  `actif` tinyint(1) NOT NULL,
  `utilisateur_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_votecommission`
--

CREATE TABLE `demandes_votecommission` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `avis` varchar(32) NOT NULL,
  `commentaire` longtext NOT NULL,
  `demande_id` char(32) NOT NULL,
  `membre_id` char(32) NOT NULL,
  `note_formelle` double DEFAULT NULL,
  `note_technique` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(1, 'admin', 'logentry'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(7, 'comptes', 'demandeur'),
(9, 'comptes', 'journalaudit'),
(8, 'comptes', 'notification'),
(6, 'comptes', 'utilisateur'),
(4, 'contenttypes', 'contenttype'),
(18, 'contrats', 'contrat'),
(28, 'core', 'annonce'),
(11, 'demandes', 'appelcandidature'),
(17, 'demandes', 'critereappel'),
(12, 'demandes', 'demande'),
(27, 'demandes', 'document'),
(16, 'demandes', 'dossier'),
(15, 'demandes', 'historiquestatutdemande'),
(13, 'demandes', 'membrecommission'),
(14, 'demandes', 'votecommission'),
(26, 'fidelite', 'historiquescore'),
(19, 'paiements', 'echeance'),
(20, 'paiements', 'paiement'),
(21, 'paiements', 'transactionlog'),
(10, 'patrimoine', 'local'),
(5, 'sessions', 'session'),
(25, 'terrain', 'aviscantine'),
(22, 'terrain', 'inspectionqhse'),
(23, 'terrain', 'plainte'),
(24, 'terrain', 'sanction');

-- --------------------------------------------------------

--
-- Structure de la table `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` int(11) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2026-08-10 03:27:46.681610'),
(2, 'contenttypes', '0002_remove_content_type_name', '2026-08-10 03:27:46.873550'),
(3, 'auth', '0001_initial', '2026-08-10 03:27:47.314457'),
(4, 'auth', '0002_alter_permission_name_max_length', '2026-08-10 03:27:47.429969'),
(5, 'auth', '0003_alter_user_email_max_length', '2026-08-10 03:27:47.440001'),
(6, 'auth', '0004_alter_user_username_opts', '2026-08-10 03:27:47.448475'),
(7, 'auth', '0005_alter_user_last_login_null', '2026-08-10 03:27:47.461848'),
(8, 'auth', '0006_require_contenttypes_0002', '2026-08-10 03:27:47.466216'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2026-08-10 03:27:47.475727'),
(10, 'auth', '0008_alter_user_username_max_length', '2026-08-10 03:27:47.484677'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2026-08-10 03:27:47.493787'),
(12, 'auth', '0010_alter_group_name_max_length', '2026-08-10 03:27:47.509141'),
(13, 'auth', '0011_update_proxy_permissions', '2026-08-10 03:27:47.517726'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2026-08-10 03:27:47.525325'),
(15, 'comptes', '0001_initial', '2026-08-10 03:27:48.300427'),
(16, 'admin', '0001_initial', '2026-08-10 03:27:48.511608'),
(17, 'admin', '0002_logentry_remove_auto_add', '2026-08-10 03:27:48.524771'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2026-08-10 03:27:48.538228'),
(19, 'comptes', '0002_remove_demandeur_nom_complet_and_more', '2026-08-10 03:27:48.987279'),
(20, 'sessions', '0001_initial', '2026-08-10 03:27:49.043604'),
(21, 'patrimoine', '0001_initial', '2026-08-10 04:03:13.635009'),
(22, 'comptes', '0003_alter_utilisateur_role', '2026-08-10 21:29:54.693632'),
(23, 'patrimoine', '0002_alter_local_options_rename_id_local_local_id_and_more', '2026-08-10 21:29:54.796346'),
(24, 'contrats', '0001_initial', '2026-08-10 21:29:55.412197'),
(25, 'demandes', '0001_initial', '2026-08-10 21:29:58.312831'),
(26, 'demandes', '0002_demande_reference_anonyme', '2026-08-10 21:29:58.448010'),
(27, 'fidelite', '0001_initial', '2026-08-10 21:29:58.625345'),
(28, 'paiements', '0001_initial', '2026-08-10 21:29:59.074151'),
(29, 'paiements', '0002_transactionlog', '2026-08-10 21:29:59.262202'),
(30, 'patrimoine', '0003_local_latitude_local_longitude', '2026-08-10 21:29:59.322281'),
(31, 'terrain', '0001_initial', '2026-08-10 21:30:01.828470'),
(32, 'demandes', '0003_rename_pieces_recepissees_dossier_pieces_receptionnees_and_more', '2026-08-11 17:57:42.554005'),
(33, 'demandes', '0004_alter_demande_statut_alter_document_type_document_and_more', '2026-08-11 17:57:42.678336'),
(34, 'demandes', '0005_demande_avis_sanitaire_externe_and_more', '2026-08-11 17:57:42.830164'),
(35, 'terrain', '0002_plainte_date_limite_sla_and_more', '2026-08-11 17:57:42.930572'),
(36, 'contrats', '0002_contrat_demande', '2026-08-11 20:27:34.569796'),
(37, 'demandes', '0006_demande_description_projet_and_more', '2026-08-11 21:37:29.508412'),
(38, 'demandes', '0007_demande_avis_technique_interne', '2026-08-11 21:46:25.636716'),
(39, 'terrain', '0003_inspectionqhse_note_sanitaire', '2026-08-11 21:46:25.669447'),
(40, 'comptes', '0004_alter_utilisateur_role', '2026-08-12 04:16:04.128148'),
(41, 'demandes', '0008_votecommission_notes', '2026-08-12 04:16:04.258680'),
(42, 'patrimoine', '0004_local_photo_url', '2026-08-12 04:16:04.352542'),
(43, 'core', '0001_initial', '2026-08-12 04:29:52.786135');

-- --------------------------------------------------------

--
-- Structure de la table `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fidelite_historiquescore`
--

CREATE TABLE `fidelite_historiquescore` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `points_modifies` double NOT NULL,
  `nouveau_score` double NOT NULL,
  `motif` varchar(255) NOT NULL,
  `demandeur_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiements_echeance`
--

CREATE TABLE `paiements_echeance` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `date_exigibilite` date NOT NULL,
  `montant_du` double NOT NULL,
  `montant_penalite` double NOT NULL,
  `statut` varchar(20) NOT NULL,
  `contrat_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `paiements_echeance`
--

INSERT INTO `paiements_echeance` (`id`, `date_creation`, `date_modification`, `date_exigibilite`, `montant_du`, `montant_penalite`, `statut`, `contrat_id`) VALUES
('090a3133557d42f395ee24afc2732b7a', '2026-08-11 21:19:42.702873', '2026-08-11 21:19:42.702879', '2027-08-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('0be1b2ae070c4de5aa1a84cb89f1a182', '2026-08-11 21:19:42.702931', '2026-08-11 21:19:42.702937', '2027-11-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('109a5156957b4250b4ce38968b8a8b1f', '2026-08-11 21:19:42.703090', '2026-08-11 21:19:42.703096', '2028-07-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('12447c0c9f864c959f0b7cabfca0e11c', '2026-08-11 21:19:42.702892', '2026-08-11 21:19:42.702898', '2027-09-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('20db6b12061e4a4d92fb115e1dced775', '2026-08-11 21:19:42.703032', '2026-08-11 21:19:42.703038', '2028-04-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('5c1a1ee960994fa4b9b77c4e8ce12ceb', '2026-08-11 21:19:42.702638', '2026-08-11 21:19:42.702645', '2026-09-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('6896f70fd322480aac68d330c27bdb6a', '2026-08-11 21:19:42.702743', '2026-08-11 21:19:42.702749', '2027-02-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('78ae3ef03bca485bbfa3023deaf1c408', '2026-08-11 21:19:42.702589', '2026-08-11 21:19:42.702609', '2026-08-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('80edcbd7e5c34ddb80346667bb58a9cc', '2026-08-11 21:19:42.702763', '2026-08-11 21:19:42.702768', '2027-03-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('8321c8e8cfa446778765f1ed69cda617', '2026-08-11 21:19:42.702994', '2026-08-11 21:19:42.702999', '2028-02-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('9821ad47140c47f28c3eedb2d434495b', '2026-08-11 21:19:42.703070', '2026-08-11 21:19:42.703076', '2028-06-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('9b31cc60ce464ab98f398a63f88d7827', '2026-08-11 21:19:42.702912', '2026-08-11 21:19:42.702917', '2027-10-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('a491c5f06a02402188a28e4f1d5d6b37', '2026-08-11 21:19:42.702850', '2026-08-11 21:19:42.702859', '2027-07-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('b838804d1cb4495db848c84aa1c1e9d0', '2026-08-11 21:19:42.702830', '2026-08-11 21:19:42.702836', '2027-06-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('c43c0fd32ebd4392ae77052794b86ce6', '2026-08-11 21:19:42.702950', '2026-08-11 21:19:42.702956', '2027-12-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('c7280b73480f40aa94c7c77a5e130285', '2026-08-11 21:19:42.703013', '2026-08-11 21:19:42.703019', '2028-03-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('d6c46b0ac6ad4b0fb7125622bc21f197', '2026-08-11 21:19:42.702703', '2026-08-11 21:19:42.702709', '2026-12-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('d9150895c1dc48c2854c4a9569e97861', '2026-08-11 21:19:42.702782', '2026-08-11 21:19:42.702788', '2027-04-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('e2a112f3acd341449726c27bc62cacb7', '2026-08-11 21:19:42.702661', '2026-08-11 21:19:42.702668', '2026-10-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('e8e3841f77914cfeb1d77f0012b7d058', '2026-08-11 21:19:42.702723', '2026-08-11 21:19:42.702729', '2027-01-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('ed0e367a535147eb9fa4708aea8eb4df', '2026-08-11 21:19:42.702682', '2026-08-11 21:19:42.702689', '2026-11-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('f7f93d75361942dc910b55fb94e01460', '2026-08-11 21:19:42.703051', '2026-08-11 21:19:42.703057', '2028-05-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('fc086398ca52423c840efa64a2b1c8d3', '2026-08-11 21:19:42.702809', '2026-08-11 21:19:42.702815', '2027-05-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c'),
('fe25ddaf106443e99c6e4ed2c4dab4b0', '2026-08-11 21:19:42.702973', '2026-08-11 21:19:42.702980', '2028-01-11', 50000, 0, 'NON_ECHUE', '949643b7bf2c44a09790e561f9b1543c');

-- --------------------------------------------------------

--
-- Structure de la table `paiements_paiement`
--

CREATE TABLE `paiements_paiement` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `date_paiement` datetime(6) NOT NULL,
  `montant_regle` double NOT NULL,
  `mode` varchar(20) NOT NULL,
  `reference_transaction` varchar(100) DEFAULT NULL,
  `reference_quitus` varchar(100) DEFAULT NULL,
  `echeance_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiements_transactionlog`
--

CREATE TABLE `paiements_transactionlog` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_transaction_id` varchar(255) NOT NULL,
  `payload_brut` longtext NOT NULL,
  `statut_api` varchar(50) NOT NULL,
  `erreur` longtext NOT NULL,
  `paiement_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `patrimoine_local`
--

CREATE TABLE `patrimoine_local` (
  `id` char(32) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `localisation` varchar(200) NOT NULL,
  `type_local` varchar(30) NOT NULL,
  `zone_cartographie` varchar(50) NOT NULL,
  `surface_m2` double NOT NULL,
  `capacite_accueil` int(10) UNSIGNED NOT NULL CHECK (`capacite_accueil` >= 0),
  `etat_physique` varchar(30) NOT NULL,
  `gestionnaire` varchar(20) NOT NULL,
  `est_libre` tinyint(1) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `photo_url` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `patrimoine_local`
--

INSERT INTO `patrimoine_local` (`id`, `reference`, `localisation`, `type_local`, `zone_cartographie`, `surface_m2`, `capacite_accueil`, `etat_physique`, `gestionnaire`, `est_libre`, `date_creation`, `date_modification`, `latitude`, `longitude`, `photo_url`) VALUES
('2778393db88e4d9581b38925e61502c4', 'LOC-001', 'Campus 1, Bâtiment A', 'RESTAURATION', '', 25, 20, 'BON_ETAT', 'CROUS_T', 0, '2026-08-11 18:35:26.943575', '2026-08-11 18:35:26.943720', NULL, NULL, ''),
('d8cf1326912f467a826b982e599931b1', 'LOC-002', 'Campus 2, Kiosque', 'MULTISERVICES', '', 10, 2, 'BON_ETAT', 'AMICALE', 1, '2026-08-11 18:35:26.955865', '2026-08-11 18:35:26.955971', NULL, NULL, '');

-- --------------------------------------------------------

--
-- Structure de la table `terrain_aviscantine`
--

CREATE TABLE `terrain_aviscantine` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `note_etoiles` int(11) NOT NULL,
  `commentaire` longtext NOT NULL,
  `statut` varchar(50) NOT NULL,
  `auteur_id` char(32) NOT NULL,
  `local_id` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `terrain_inspectionqhse`
--

CREATE TABLE `terrain_inspectionqhse` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `type_controle` varchar(50) NOT NULL,
  `date_visite` datetime(6) NOT NULL,
  `est_conforme` tinyint(1) NOT NULL,
  `observations` longtext NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `inspecteur_id` char(32) NOT NULL,
  `local_id` char(32) NOT NULL,
  `note_sanitaire` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `terrain_plainte`
--

CREATE TABLE `terrain_plainte` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `type` varchar(50) NOT NULL,
  `statut` varchar(50) NOT NULL,
  `urgence` varchar(50) NOT NULL,
  `date_resolution` datetime(6) DEFAULT NULL,
  `description` longtext NOT NULL,
  `localisation_libre` varchar(255) NOT NULL,
  `photo_preuve` varchar(200) NOT NULL,
  `est_anonyme` tinyint(1) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `agent_traitant_id` char(32) DEFAULT NULL,
  `local_id` char(32) DEFAULT NULL,
  `plaignant_id` char(32) NOT NULL,
  `date_limite_sla` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `terrain_sanction`
--

CREATE TABLE `terrain_sanction` (
  `id` char(32) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `niveau` varchar(50) NOT NULL,
  `statut_sanction` varchar(50) NOT NULL,
  `date_application` datetime(6) NOT NULL,
  `date_levee` datetime(6) DEFAULT NULL,
  `motif` longtext NOT NULL,
  `agent_prononcant_id` char(32) DEFAULT NULL,
  `contrat_id` char(32) DEFAULT NULL,
  `inspection_source_id` char(32) DEFAULT NULL,
  `local_id` char(32) NOT NULL,
  `plainte_source_id` char(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Index pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Index pour la table `comptes_demandeur`
--
ALTER TABLE `comptes_demandeur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `comptes_demandeur_valide_par_id_92be70a7_fk_comptes_u` (`valide_par_id`);

--
-- Index pour la table `comptes_journalaudit`
--
ALTER TABLE `comptes_journalaudit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comptes_journalaudit_utilisateur_id_7f70bed3_fk_comptes_u` (`utilisateur_id`);

--
-- Index pour la table `comptes_notification`
--
ALTER TABLE `comptes_notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comptes_notification_destinataire_id_1936a649_fk_comptes_u` (`destinataire_id`);

--
-- Index pour la table `comptes_utilisateur`
--
ALTER TABLE `comptes_utilisateur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `comptes_utilisateur_groups`
--
ALTER TABLE `comptes_utilisateur_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `comptes_utilisateur_groups_utilisateur_id_group_id_f6703be7_uniq` (`utilisateur_id`,`group_id`),
  ADD KEY `comptes_utilisateur_groups_group_id_40550a17_fk_auth_group_id` (`group_id`);

--
-- Index pour la table `comptes_utilisateur_user_permissions`
--
ALTER TABLE `comptes_utilisateur_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `comptes_utilisateur_user_utilisateur_id_permissio_6ccc9f1d_uniq` (`utilisateur_id`,`permission_id`),
  ADD KEY `comptes_utilisateur__permission_id_6de48079_fk_auth_perm` (`permission_id`);

--
-- Index pour la table `contrats_contrat`
--
ALTER TABLE `contrats_contrat`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `demande_id` (`demande_id`),
  ADD KEY `contrats_contrat_demandeur_id_4fc71c77_fk_comptes_demandeur_id` (`demandeur_id`),
  ADD KEY `contrats_contrat_local_id_12e3c315_fk_patrimoine_local_id` (`local_id`),
  ADD KEY `contrats_contrat_signataire_crous_t_i_64986cb5_fk_comptes_u` (`signataire_crous_t_id`);

--
-- Index pour la table `core_annonce`
--
ALTER TABLE `core_annonce`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `demandes_appelcandidature`
--
ALTER TABLE `demandes_appelcandidature`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandes_appelcandid_local_id_17348426_fk_patrimoin` (`local_id`),
  ADD KEY `demandes_appelcandid_publie_par_id_67047647_fk_comptes_u` (`publie_par_id`);

--
-- Index pour la table `demandes_critereappel`
--
ALTER TABLE `demandes_critereappel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandes_critereappe_appel_id_537c8285_fk_demandes_` (`appel_id`);

--
-- Index pour la table `demandes_demande`
--
ALTER TABLE `demandes_demande`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_anonyme` (`reference_anonyme`),
  ADD KEY `demandes_demande_appel_candidature_id_683fa7a3_fk_demandes_` (`appel_candidature_id`),
  ADD KEY `demandes_demande_demandeur_id_38a14695_fk_comptes_demandeur_id` (`demandeur_id`),
  ADD KEY `demandes_demande_local_id_f01ea925_fk_patrimoine_local_id` (`local_id`);

--
-- Index pour la table `demandes_document`
--
ALTER TABLE `demandes_document`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandes_document_dossier_id_03ab9a5b_fk_demandes_dossier_id` (`dossier_id`);

--
-- Index pour la table `demandes_dossier`
--
ALTER TABLE `demandes_dossier`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `demande_id` (`demande_id`);

--
-- Index pour la table `demandes_historiquestatutdemande`
--
ALTER TABLE `demandes_historiquestatutdemande`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandes_historiques_auteur_id_80960c02_fk_comptes_u` (`auteur_id`),
  ADD KEY `demandes_historiques_demande_id_7b4e6da1_fk_demandes_` (`demande_id`);

--
-- Index pour la table `demandes_membrecommission`
--
ALTER TABLE `demandes_membrecommission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateur_id` (`utilisateur_id`);

--
-- Index pour la table `demandes_votecommission`
--
ALTER TABLE `demandes_votecommission`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandes_votecommiss_demande_id_318fb7d6_fk_demandes_` (`demande_id`),
  ADD KEY `demandes_votecommiss_membre_id_9856228c_fk_demandes_` (`membre_id`);

--
-- Index pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk_comptes_utilisateur_id` (`user_id`);

--
-- Index pour la table `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Index pour la table `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- Index pour la table `fidelite_historiquescore`
--
ALTER TABLE `fidelite_historiquescore`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fidelite_historiques_demandeur_id_0e9b266c_fk_comptes_d` (`demandeur_id`);

--
-- Index pour la table `paiements_echeance`
--
ALTER TABLE `paiements_echeance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paiements_echeance_contrat_id_f65dbfac_fk_contrats_contrat_id` (`contrat_id`);

--
-- Index pour la table `paiements_paiement`
--
ALTER TABLE `paiements_paiement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_transaction` (`reference_transaction`),
  ADD UNIQUE KEY `reference_quitus` (`reference_quitus`),
  ADD KEY `paiements_paiement_echeance_id_cc6c163c_fk_paiements_echeance_id` (`echeance_id`);

--
-- Index pour la table `paiements_transactionlog`
--
ALTER TABLE `paiements_transactionlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paiements_transactio_paiement_id_7e4cf522_fk_paiements` (`paiement_id`);

--
-- Index pour la table `patrimoine_local`
--
ALTER TABLE `patrimoine_local`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`);

--
-- Index pour la table `terrain_aviscantine`
--
ALTER TABLE `terrain_aviscantine`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terrain_aviscantine_auteur_id_40d982db_fk_comptes_demandeur_id` (`auteur_id`),
  ADD KEY `terrain_aviscantine_local_id_d45ca3b6_fk_patrimoine_local_id` (`local_id`);

--
-- Index pour la table `terrain_inspectionqhse`
--
ALTER TABLE `terrain_inspectionqhse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terrain_inspectionqh_inspecteur_id_20862609_fk_comptes_u` (`inspecteur_id`),
  ADD KEY `terrain_inspectionqhse_local_id_39df61c6_fk_patrimoine_local_id` (`local_id`);

--
-- Index pour la table `terrain_plainte`
--
ALTER TABLE `terrain_plainte`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terrain_plainte_agent_traitant_id_a62f1e34_fk_comptes_u` (`agent_traitant_id`),
  ADD KEY `terrain_plainte_local_id_7417c14b_fk_patrimoine_local_id` (`local_id`),
  ADD KEY `terrain_plainte_plaignant_id_33b3fbc0_fk_comptes_utilisateur_id` (`plaignant_id`);

--
-- Index pour la table `terrain_sanction`
--
ALTER TABLE `terrain_sanction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terrain_sanction_agent_prononcant_id_bc692a20_fk_comptes_u` (`agent_prononcant_id`),
  ADD KEY `terrain_sanction_contrat_id_1babb56f_fk_contrats_contrat_id` (`contrat_id`),
  ADD KEY `terrain_sanction_inspection_source_id_5000a40b_fk_terrain_i` (`inspection_source_id`),
  ADD KEY `terrain_sanction_local_id_a2bddc19_fk_patrimoine_local_id` (`local_id`),
  ADD KEY `terrain_sanction_plainte_source_id_20a81e01_fk_terrain_p` (`plainte_source_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT pour la table `comptes_utilisateur_groups`
--
ALTER TABLE `comptes_utilisateur_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `comptes_utilisateur_user_permissions`
--
ALTER TABLE `comptes_utilisateur_user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT pour la table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Contraintes pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Contraintes pour la table `comptes_demandeur`
--
ALTER TABLE `comptes_demandeur`
  ADD CONSTRAINT `comptes_demandeur_utilisateur_id_24b64573_fk_comptes_u` FOREIGN KEY (`utilisateur_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `comptes_demandeur_valide_par_id_92be70a7_fk_comptes_u` FOREIGN KEY (`valide_par_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `comptes_journalaudit`
--
ALTER TABLE `comptes_journalaudit`
  ADD CONSTRAINT `comptes_journalaudit_utilisateur_id_7f70bed3_fk_comptes_u` FOREIGN KEY (`utilisateur_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `comptes_notification`
--
ALTER TABLE `comptes_notification`
  ADD CONSTRAINT `comptes_notification_destinataire_id_1936a649_fk_comptes_u` FOREIGN KEY (`destinataire_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `comptes_utilisateur_groups`
--
ALTER TABLE `comptes_utilisateur_groups`
  ADD CONSTRAINT `comptes_utilisateur__utilisateur_id_2c4242fe_fk_comptes_u` FOREIGN KEY (`utilisateur_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `comptes_utilisateur_groups_group_id_40550a17_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Contraintes pour la table `comptes_utilisateur_user_permissions`
--
ALTER TABLE `comptes_utilisateur_user_permissions`
  ADD CONSTRAINT `comptes_utilisateur__permission_id_6de48079_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `comptes_utilisateur__utilisateur_id_edaf0051_fk_comptes_u` FOREIGN KEY (`utilisateur_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `contrats_contrat`
--
ALTER TABLE `contrats_contrat`
  ADD CONSTRAINT `contrats_contrat_demande_id_fc0a8470_fk_demandes_demande_id` FOREIGN KEY (`demande_id`) REFERENCES `demandes_demande` (`id`),
  ADD CONSTRAINT `contrats_contrat_demandeur_id_4fc71c77_fk_comptes_demandeur_id` FOREIGN KEY (`demandeur_id`) REFERENCES `comptes_demandeur` (`id`),
  ADD CONSTRAINT `contrats_contrat_local_id_12e3c315_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`),
  ADD CONSTRAINT `contrats_contrat_signataire_crous_t_i_64986cb5_fk_comptes_u` FOREIGN KEY (`signataire_crous_t_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `demandes_appelcandidature`
--
ALTER TABLE `demandes_appelcandidature`
  ADD CONSTRAINT `demandes_appelcandid_local_id_17348426_fk_patrimoin` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`),
  ADD CONSTRAINT `demandes_appelcandid_publie_par_id_67047647_fk_comptes_u` FOREIGN KEY (`publie_par_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `demandes_critereappel`
--
ALTER TABLE `demandes_critereappel`
  ADD CONSTRAINT `demandes_critereappe_appel_id_537c8285_fk_demandes_` FOREIGN KEY (`appel_id`) REFERENCES `demandes_appelcandidature` (`id`);

--
-- Contraintes pour la table `demandes_demande`
--
ALTER TABLE `demandes_demande`
  ADD CONSTRAINT `demandes_demande_appel_candidature_id_683fa7a3_fk_demandes_` FOREIGN KEY (`appel_candidature_id`) REFERENCES `demandes_appelcandidature` (`id`),
  ADD CONSTRAINT `demandes_demande_demandeur_id_38a14695_fk_comptes_demandeur_id` FOREIGN KEY (`demandeur_id`) REFERENCES `comptes_demandeur` (`id`),
  ADD CONSTRAINT `demandes_demande_local_id_f01ea925_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`);

--
-- Contraintes pour la table `demandes_document`
--
ALTER TABLE `demandes_document`
  ADD CONSTRAINT `demandes_document_dossier_id_03ab9a5b_fk_demandes_dossier_id` FOREIGN KEY (`dossier_id`) REFERENCES `demandes_dossier` (`id`);

--
-- Contraintes pour la table `demandes_dossier`
--
ALTER TABLE `demandes_dossier`
  ADD CONSTRAINT `demandes_dossier_demande_id_33c81a46_fk_demandes_demande_id` FOREIGN KEY (`demande_id`) REFERENCES `demandes_demande` (`id`);

--
-- Contraintes pour la table `demandes_historiquestatutdemande`
--
ALTER TABLE `demandes_historiquestatutdemande`
  ADD CONSTRAINT `demandes_historiques_auteur_id_80960c02_fk_comptes_u` FOREIGN KEY (`auteur_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `demandes_historiques_demande_id_7b4e6da1_fk_demandes_` FOREIGN KEY (`demande_id`) REFERENCES `demandes_demande` (`id`);

--
-- Contraintes pour la table `demandes_membrecommission`
--
ALTER TABLE `demandes_membrecommission`
  ADD CONSTRAINT `demandes_membrecommi_utilisateur_id_f5dd38a7_fk_comptes_u` FOREIGN KEY (`utilisateur_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `demandes_votecommission`
--
ALTER TABLE `demandes_votecommission`
  ADD CONSTRAINT `demandes_votecommiss_demande_id_318fb7d6_fk_demandes_` FOREIGN KEY (`demande_id`) REFERENCES `demandes_demande` (`id`),
  ADD CONSTRAINT `demandes_votecommiss_membre_id_9856228c_fk_demandes_` FOREIGN KEY (`membre_id`) REFERENCES `demandes_membrecommission` (`id`);

--
-- Contraintes pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_comptes_utilisateur_id` FOREIGN KEY (`user_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `fidelite_historiquescore`
--
ALTER TABLE `fidelite_historiquescore`
  ADD CONSTRAINT `fidelite_historiques_demandeur_id_0e9b266c_fk_comptes_d` FOREIGN KEY (`demandeur_id`) REFERENCES `comptes_demandeur` (`id`);

--
-- Contraintes pour la table `paiements_echeance`
--
ALTER TABLE `paiements_echeance`
  ADD CONSTRAINT `paiements_echeance_contrat_id_f65dbfac_fk_contrats_contrat_id` FOREIGN KEY (`contrat_id`) REFERENCES `contrats_contrat` (`id`);

--
-- Contraintes pour la table `paiements_paiement`
--
ALTER TABLE `paiements_paiement`
  ADD CONSTRAINT `paiements_paiement_echeance_id_cc6c163c_fk_paiements_echeance_id` FOREIGN KEY (`echeance_id`) REFERENCES `paiements_echeance` (`id`);

--
-- Contraintes pour la table `paiements_transactionlog`
--
ALTER TABLE `paiements_transactionlog`
  ADD CONSTRAINT `paiements_transactio_paiement_id_7e4cf522_fk_paiements` FOREIGN KEY (`paiement_id`) REFERENCES `paiements_paiement` (`id`);

--
-- Contraintes pour la table `terrain_aviscantine`
--
ALTER TABLE `terrain_aviscantine`
  ADD CONSTRAINT `terrain_aviscantine_auteur_id_40d982db_fk_comptes_demandeur_id` FOREIGN KEY (`auteur_id`) REFERENCES `comptes_demandeur` (`id`),
  ADD CONSTRAINT `terrain_aviscantine_local_id_d45ca3b6_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`);

--
-- Contraintes pour la table `terrain_inspectionqhse`
--
ALTER TABLE `terrain_inspectionqhse`
  ADD CONSTRAINT `terrain_inspectionqh_inspecteur_id_20862609_fk_comptes_u` FOREIGN KEY (`inspecteur_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `terrain_inspectionqhse_local_id_39df61c6_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`);

--
-- Contraintes pour la table `terrain_plainte`
--
ALTER TABLE `terrain_plainte`
  ADD CONSTRAINT `terrain_plainte_agent_traitant_id_a62f1e34_fk_comptes_u` FOREIGN KEY (`agent_traitant_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `terrain_plainte_local_id_7417c14b_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`),
  ADD CONSTRAINT `terrain_plainte_plaignant_id_33b3fbc0_fk_comptes_utilisateur_id` FOREIGN KEY (`plaignant_id`) REFERENCES `comptes_utilisateur` (`id`);

--
-- Contraintes pour la table `terrain_sanction`
--
ALTER TABLE `terrain_sanction`
  ADD CONSTRAINT `terrain_sanction_agent_prononcant_id_bc692a20_fk_comptes_u` FOREIGN KEY (`agent_prononcant_id`) REFERENCES `comptes_utilisateur` (`id`),
  ADD CONSTRAINT `terrain_sanction_contrat_id_1babb56f_fk_contrats_contrat_id` FOREIGN KEY (`contrat_id`) REFERENCES `contrats_contrat` (`id`),
  ADD CONSTRAINT `terrain_sanction_inspection_source_id_5000a40b_fk_terrain_i` FOREIGN KEY (`inspection_source_id`) REFERENCES `terrain_inspectionqhse` (`id`),
  ADD CONSTRAINT `terrain_sanction_local_id_a2bddc19_fk_patrimoine_local_id` FOREIGN KEY (`local_id`) REFERENCES `patrimoine_local` (`id`),
  ADD CONSTRAINT `terrain_sanction_plainte_source_id_20a81e01_fk_terrain_p` FOREIGN KEY (`plainte_source_id`) REFERENCES `terrain_plainte` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
