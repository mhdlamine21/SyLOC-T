import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard, SectionHeader, Card, PageWrapper, Button, Modal, Field, Select, Textarea, AlertBanner } from '../components/common/ui';
import {
  demandesMock, kpisMock, signalementsMock, cartesEtudiantsMock, utilisateursMock, contratMock, appelsMock,
} from '../mocks/data';
import toast from 'react-hot-toast';

// ─── Modal partagé "Dépêcher une mission terrain" ────────────────────────────
function DepecherMissionModal({ open, onClose, defaultOccupant = 'Mamadou Lô (Cantine A)' }) {
  const [occupant, setOccupant] = useState(defaultOccupant);
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('ELEVEE');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Veuillez préciser la directive de mission.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`⚡ Ordre de mission terrain transmis à la Brigade pour ${occupant} ! Notification envoyée.`);
    setLoading(false);
    onClose();
    setDescription('');
  };

  return (
    <Modal open={open} onClose={onClose} title="⚡ Dépêcher une Mission Terrain Urgente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AlertBanner type="warn">
          <strong>Ordre de Mission Terrain (UC69/UC70) :</strong> Cet ordre sera transmis directement aux <strong>Agents de Terrain</strong> et au <strong>Bureau QHSE</strong> pour contrôle immédiat.
        </AlertBanner>

        <Field label="Occupant / Local visé *" required>
          <Select value={occupant} onChange={(e) => setOccupant(e.target.value)}>
            <option value="Mamadou Lô (Cantine A — LOC-004)">Mamadou Lô (Cantine A — LOC-004)</option>
            <option value="Aïssatou Ndiaye (Bloc A — LOC-001)">Aïssatou Ndiaye (Bloc A — LOC-001)</option>
            <option value="Ousmane Traoré (Multiservices — LOC-002)">Ousmane Traoré (Multiservices — LOC-002)</option>
            <option value="Occupant Non Identifié (Bloc C — LOC-003)">Occupant Non Identifié (Bloc C — LOC-003)</option>
          </Select>
        </Field>

        <Field label="Niveau d'urgence *" required>
          <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
            <option value="ELEVEE">🚨 Urgente (Infraction grave / Insanité / Note sous 3.0)</option>
            <option value="MOYENNE">⚠️ Normale (Contrôle de routine / Vérification prix)</option>
            <option value="FAIBLE">ℹ️ Contrôle périodique</option>
          </Select>
        </Field>

        <Field label="Directives & Instructions pour les agents *" required>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Ex. Inspection sanitaire d'urgence : vérifier températures, propreté cuisine, tarifs affichés et conformité du titre d'occupation..."
          />
        </Field>

        <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="stamp" type="submit" disabled={loading}>
            {loading ? 'Transmissions…' : '⚡ Valider et Transmettre l\'Ordre de Mission'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── COMPOSANTS DASHBOARD PAR RÔLE ───────────────────────────────────────────

function DashboardUsager({ user }) {
  const mesDemandes = demandesMock;
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Portail Usager / Candidat"
        title={`Bonjour, ${user?.prenom || user?.nom_complet?.split(' ')[0] || 'Usager'} 👋`}
        subtitle="Votre espace candidat & usager du campus — soumission de projets et suivi des démarches."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Mes dossiers déposés" value={mesDemandes.length} color="teal" icon="📋" />
        <StatCard label="En attente recevabilité" value={mesDemandes.filter((d) => d.statut === 'EN_ATTENTE').length} color="amber" icon="⏳" />
        <StatCard label="Décisions favorables" value={mesDemandes.filter((d) => d.statut === 'FAVORABLE').length} color="ok" icon="✅" />
        <StatCard label="Pièces complémentaires" value={mesDemandes.filter((d) => d.statut === 'MITIGEE_COMPLEMENT').length} color="stamp" icon="📎" />
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Link to="/locaux-catalogue">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/30">
            <span className="text-3xl">🗺️</span>
            <div>
              <p className="font-display font-semibold">Catalogue des Locaux</p>
              <p className="text-xs text-muted">Consulter la carte du campus et les espaces disponibles</p>
            </div>
          </Card>
        </Link>
        <Link to="/depot">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">📝</span>
            <div>
              <p className="font-display font-semibold">Déposer un projet</p>
              <p className="text-xs text-muted">Soumettre une demande d'occupation de local</p>
            </div>
          </Card>
        </Link>
        <Link to="/suivi">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="font-display font-semibold">Suivre mes candidatures</p>
              <p className="text-xs text-muted">Consulter l'avancement de l'instruction</p>
            </div>
          </Card>
        </Link>
      </div>
    </PageWrapper>
  );
}

function DashboardOccupant({ user }) {
  const contrat = contratMock;
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Occupant Titulaire"
        title={`Bienvenue, ${user?.nom_complet || 'Occupant'} 🔑`}
        subtitle={`Gestion de votre bail domanial #${contrat.id_contrat} et redevances mensuelles.`}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Local attribué" value={contrat.local.reference} color="teal" icon="🏢" sub={contrat.local.localisation} />
        <StatCard label="Redevance mensuelle" value={`${(contrat.redevance_mensuelle / 1000).toFixed(0)}k`} color="ok" icon="💰" sub="FCFA / mois" />
        <StatCard label="Score Inspection QHSE" value="★ 4.2 / 5" color="ok" icon="🔬" />
        <StatCard label="Score Avis Étudiants" value="★ 4.5 / 5" color="amber" icon="⭐" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/espace-occupant">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">🏢</span>
            <div>
              <p className="font-display font-semibold">Mon Contrat & Échéancier</p>
              <p className="text-xs text-muted">Voir les 12 échéances et statut des redevances</p>
            </div>
          </Card>
        </Link>
        <Link to="/paiement">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">💳</span>
            <div>
              <p className="font-display font-semibold">Payer ma redevance & Quitus PDF</p>
              <p className="text-xs text-muted">Règlement en ligne et téléchargement du quitus</p>
            </div>
          </Card>
        </Link>
        <Link to="/signaler">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">🔧</span>
            <div>
              <p className="font-display font-semibold">Signaler un problème technique</p>
              <p className="text-xs text-muted">Transmettre une demande d'intervention au service technique</p>
            </div>
          </Card>
        </Link>
      </div>
    </PageWrapper>
  );
}

function DashboardComptable({ user }) {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Comptable & Financement"
        title={`Guichet Caisse & Recouvrement : ${user?.nom_complet}`}
        subtitle="Suivi des échéanciers, encaissements au guichet, relances d'impayés et quitus officiels."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Recettes ce mois" value="225k" color="ok" icon="💰" sub="FCFA perçus" />
        <StatCard label="Impayés & Dettes" value={`${(kpisMock.impayés_montant / 1000).toFixed(0)}k`} color="stamp" icon="💸" sub="FCFA à recouvrer" />
        <StatCard label="Redevances exigibles" value="3" color="amber" icon="⏳" sub="Ce mois" />
        <StatCard label="Quitus émis" value="5" color="teal" icon="📄" sub="Valides" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/paiement">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/40 border-teal/30">
            <span className="text-4xl">🏢</span>
            <div>
              <p className="font-display font-bold text-lg text-teal">Portefeuille Occupants & Échéanciers 12 Mois</p>
              <p className="text-sm text-muted">Générer les échéanciers baux, suivre les dettes et relancer les impayés (+5% pénalité)</p>
            </div>
          </Card>
        </Link>
        <Link to="/paiement">
          <Card className="flex items-center gap-4 hover:border-amber transition-colors border bg-amber-pale/30 border-amber/30">
            <span className="text-4xl">🏦</span>
            <div>
              <p className="font-display font-bold text-lg text-amber-deep">Encaisser au Guichet & Imprimer Quitus PDF</p>
              <p className="text-sm text-muted">Enregistrer les règlements espèces, chèques, virements et imprimer le quitus officiel</p>
            </div>
          </Card>
        </Link>
      </div>
    </PageWrapper>
  );
}

function DashboardJuridique({ user }) {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title={`Espace Juridique : ${user?.nom_complet}`}
        subtitle="Rédaction des baux d'occupation, validation juridique des ruptures et émission d'actes."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Baux à rédiger" value="1" color="amber" icon="📜" sub="Candidat retenu" />
        <StatCard label="Procédures de rupture" value="1" color="stamp" icon="⚖️" sub="En attente de visa" />
        <StatCard label="Convocations & Rappels" value="2" color="teal" icon="📢" sub="Actes émis" />
        <StatCard label="Litiges domaniaux" value="0" color="ok" icon="🛡️" sub="Régularisés" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/juridique">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/30">
            <span className="text-3xl">📜</span>
            <div>
              <p className="font-display font-semibold">Rédaction des Contrats & Baux</p>
              <p className="text-xs text-muted">Dossiers favorables prêts pour proposition de bail</p>
            </div>
          </Card>
        </Link>
        <Link to="/juridique">
          <Card className="flex items-center gap-4 hover:border-stamp transition-colors border bg-stamp-pale/30">
            <span className="text-3xl">⚖️</span>
            <div>
              <p className="font-display font-semibold text-stamp">Procédures de Rupture de Contrat</p>
              <p className="text-xs text-muted">Valider les résiliations initiées par la Direction</p>
            </div>
          </Card>
        </Link>
        <Link to="/juridique">
          <Card className="flex items-center gap-4 hover:border-amber transition-colors border">
            <span className="text-3xl">📢</span>
            <div>
              <p className="font-display font-semibold">Actes & Convocations</p>
              <p className="text-xs text-muted">Émettre rappels à l'ordre, convocations et mises en demeure</p>
            </div>
          </Card>
        </Link>
      </div>
    </PageWrapper>
  );
}

function DashboardTechnique({ user }) {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Technique & Maintenance"
        title={`Espace Technique : ${user?.nom_complet}`}
        subtitle="Analyse de faisabilité technique (maquettes & plans) et maintenance du patrimoine."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Expertises maquettes" value="1 en cours" color="amber" icon="📐" />
        <StatCard label="Pannes à dépanner" value="2 ouvertes" color="stamp" icon="🔧" />
        <StatCard label="Patrimoine locaux" value="6" color="teal" icon="🏗️" />
        <StatCard label="Commission consultative" value="Membre Actif" color="ok" icon="⚖" />
      </div>
      <Link to="/service-technique">
        <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/30">
          <span className="text-4xl">📐</span>
          <div>
            <p className="font-display font-bold text-lg text-teal">Expertise Maquettes & Suivi Dépannages</p>
            <p className="text-sm text-muted">Consulter les dossiers techniques, valider les structures et réparer les signalements</p>
          </div>
        </Card>
      </Link>
    </PageWrapper>
  );
}

function DashboardCommunication({ user }) {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication"
        title={`Espace Communication : ${user?.nom_complet}`}
        subtitle="Publication des appels à candidature et gestion du panneau d'affichage officiel."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Appels à projet actifs" value={appelsMock.filter((a) => a.est_actif).length} color="teal" icon="📢" />
        <StatCard label="Actualités affichées" value="3" color="amber" icon="📌" />
        <StatCard label="Score moyen cantines" value="★ 4.2 / 5" color="ok" icon="⭐" />
        <StatCard label="Seuil alerte note < 3.0" value="1 alerte" color="stamp" icon="⚠️" />
      </div>
      <Link to="/communication">
        <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/30">
          <span className="text-4xl">📢</span>
          <div>
            <p className="font-display font-bold text-lg text-teal">Gérer les Appels & Panneau d'Affichage</p>
            <p className="text-sm text-muted">Lancer des appels à projets (avec/sans local), fixer les critères de préférence et épingler les actualités</p>
          </div>
        </Card>
      </Link>
    </PageWrapper>
  );
}

function DashboardQHSE({ user }) {
  const [showDepecherModal, setShowDepecherModal] = useState(false);
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau Environnement, Hygiène & Sécurité (QHSE)"
        title={`Bureau QHSE : ${user?.nom_complet}`}
        subtitle="Inspections sanitaires des cantines, scoring QHSE et suivi des convocations."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Inspections réalisées" value={kpisMock.inspections_mois} color="teal" icon="🔬" />
        <StatCard label="Score QHSE moyen" value={`★ ${kpisMock.score_qhse_moyen} / 5`} color="amber" icon="📊" />
        <StatCard label="Convocations actives" value="2" color="stamp" icon="⚠️" />
        <StatCard label="Sanctions notifiées" value="1" color="stamp" icon="📜" />
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="stamp" onClick={() => setShowDepecherModal(true)}>
          ⚡ Dépêcher une Mission Terrain Urgente
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/terrain/inspections">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">🔬</span>
            <div>
              <p className="font-display font-semibold">Inspections & Scores QHSE</p>
              <p className="text-xs text-muted">Visites sanitaires et attribution des notes d'hygiène</p>
            </div>
          </Card>
        </Link>
        <Link to="/bureau-environnement">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">📋</span>
            <div>
              <p className="font-display font-semibold">Convocations & Suivi Sanctions</p>
              <p className="text-xs text-muted">Traiter les constats de la brigade terrain et prononcer les rappels</p>
            </div>
          </Card>
        </Link>
      </div>

      <DepecherMissionModal open={showDepecherModal} onClose={() => setShowDepecherModal(false)} />
    </PageWrapper>
  );
}

function DashboardBureauCourrier({ user }) {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier"
        title={`Bureau du Courrier : ${user?.nom_complet}`}
        subtitle="Réception et contrôle de recevabilité administrative des dossiers reçus."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Dossiers reçus" value="8" color="teal" icon="📬" />
        <StatCard label="En attente contrôle" value="3" color="amber" icon="⏳" />
        <StatCard label="Transmis à la DCUVE" value="5" color="ok" icon="✅" />
      </div>
      <Link to="/instruction">
        <Card className="flex items-center gap-4 hover:border-teal transition-colors border bg-teal-pale/30">
          <span className="text-4xl">📬</span>
          <div>
            <p className="font-display font-bold text-lg text-teal">File de Recevabilité du Courrier</p>
            <p className="text-sm text-muted">Vérifier la présence des pièces obligatoires avant enregistrement</p>
          </div>
        </Card>
      </Link>
    </PageWrapper>
  );
}

function DashboardDCUVE({ user }) {
  const [showDepecherModal, setShowDepecherModal] = useState(false);
  const enAttente = demandesMock.filter((d) => d.statut === 'EN_ATTENTE').length;
  const cartesEnAttente = cartesEtudiantsMock.filter((c) => c.statut === 'EN_ATTENTE').length;
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction de la Vie Étudiante (DCUVE)"
        title={`Espace DCUVE : ${user?.nom_complet}`}
        subtitle="Instruction des dossiers d'attribution et contrôle des cartes étudiantes."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Dossiers à instruire" value={enAttente} color="amber" icon="📂" />
        <StatCard label="Cartes à valider" value={cartesEnAttente} color="stamp" icon="🪪" />
        <StatCard label="Avis favorables émis" value="3" color="ok" icon="✅" />
        <StatCard label="Missions terrain" value="1 dépêchée" color="teal" icon="⚡" />
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="stamp" onClick={() => setShowDepecherModal(true)}>
          ⚡ Dépêcher une Mission Terrain Urgente
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/instruction">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">📂</span>
            <div><p className="font-display font-semibold">Instruction des dossiers de candidature</p><p className="text-sm text-muted">{enAttente} dossier(s) en attente d'évaluation</p></div>
          </Card>
        </Link>
        <Link to="/validation-cartes">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">🪪</span>
            <div><p className="font-display font-semibold">Validation des cartes étudiantes</p><p className="text-sm text-muted">{cartesEnAttente} carte(s) à vérifier</p></div>
          </Card>
        </Link>
      </div>

      <DepecherMissionModal open={showDepecherModal} onClose={() => setShowDepecherModal(false)} />
    </PageWrapper>
  );
}

function DashboardDirection({ user }) {
  const [showDepecherModal, setShowDepecherModal] = useState(false);
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction Générale CROUS-T"
        title={`Direction Générale : ${user?.nom_complet}`}
        subtitle="Pilotage global du patrimoine locatif, décisions d'attribution et gestion des alertes."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Demandes en cours" value={kpisMock.demandes_en_cours} color="amber" icon="📋" />
        <StatCard label="Taux d'attribution favorable" value={`${kpisMock.taux_favorable}%`} color="ok" icon="✅" />
        <StatCard label="Impayés redevances" value={`${(kpisMock.impayés_montant / 1000).toFixed(0)}k FCFA`} color="stamp" icon="💸" />
        <StatCard label="Signalements ouverts" value={kpisMock.signalements_ouverts} color="stamp" icon="🚩" />
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="stamp" onClick={() => setShowDepecherModal(true)}>
          ⚡ Dépêcher une Mission Terrain Urgente
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/dashboard-direction">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">📊</span>
            <div><p className="font-display font-semibold">Tableau de bord de pilotage & Ranking Occupants</p><p className="text-sm text-muted">Double scoring, alertes et dépêche de missions terrain</p></div>
          </Card>
        </Link>
        <Link to="/admin/comptes">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">👥</span>
            <div><p className="font-display font-semibold">Gestion des utilisateurs & Membres Commission</p><p className="text-sm text-muted">Création des comptes d'agents et nomination des membres de la commission</p></div>
          </Card>
        </Link>
      </div>

      <DepecherMissionModal open={showDepecherModal} onClose={() => setShowDepecherModal(false)} />
    </PageWrapper>
  );
}

function DashboardAdmin({ user }) {
  const [showChangeDirectorModal, setShowChangeDirectorModal] = useState(false);
  const [showDepecherModal, setShowDepecherModal] = useState(false);
  const [newDirectorUser, setNewDirectorUser] = useState('USR-006');
  const [loading, setLoading] = useState(false);

  const changerDirecteur = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Nouveau Directeur Général nommé dans le système !');
    setShowChangeDirectorModal(false);
    setLoading(false);
  };

  const nbOccupants = utilisateursMock.filter((u) => u.role === 'OCCUPANT').length;
  const nbCandidats = utilisateursMock.filter((u) => u.role === 'USAGER' && u.type_usager === 'CANDIDAT').length;
  const nbEtudiants = utilisateursMock.filter((u) => u.est_etudiant).length;
  const nbAgents = utilisateursMock.filter((u) => u.role !== 'USAGER' && u.role !== 'OCCUPANT').length;

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Supervision du Système d'Information"
        title={`Espace Administration SI : ${user?.nom_complet}`}
        subtitle="Supervision système globale, traçabilité des comptes, sécurité et paramétrage."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Agents & Personnel" value={nbAgents} color="teal" icon="🏢" sub="Comptes de service" />
        <StatCard label="Occupants Titulaires" value={nbOccupants} color="amber" icon="🔑" sub="Contrats actifs" />
        <StatCard label="Candidats enregistrés" value={nbCandidats} color="teal" icon="💼" sub="En cours" />
        <StatCard label="Étudiants UIDT" value={nbEtudiants} color="ok" icon="🎓" sub="Cartes vérifiées" />
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="stamp" onClick={() => setShowDepecherModal(true)}>
          ⚡ Dépêcher une Mission Terrain Urgente
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Link to="/admin/comptes">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">👥</span>
            <div>
              <p className="font-display font-semibold">Création d'Agents & Rôles</p>
              <p className="text-xs text-muted">Créer les comptes de service et nommer membres commission</p>
            </div>
          </Card>
        </Link>
        <Link to="/admin/audit">
          <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
            <span className="text-3xl">📋</span>
            <div>
              <p className="font-display font-semibold">Journal d'Audit Système</p>
              <p className="text-xs text-muted">Traçabilité infalsifiable des accès et décisions</p>
            </div>
          </Card>
        </Link>
        <button onClick={() => setShowChangeDirectorModal(true)} className="text-left">
          <Card className="flex items-center gap-4 hover:border-amber transition-colors border bg-amber-pale/40">
            <span className="text-3xl">👑</span>
            <div>
              <p className="font-display font-semibold text-amber-deep">Nommer / Remplacer le Directeur</p>
              <p className="text-xs text-muted">Changer le compte attribué à la Direction Générale</p>
            </div>
          </Card>
        </button>
      </div>

      {/* Modal Changement de Directeur Général */}
      <Modal open={showChangeDirectorModal} onClose={() => setShowChangeDirectorModal(false)} title="Supervision SI — Nommer le Directeur Général">
        <div className="space-y-4">
          <p className="text-xs text-muted">
            En tant que Superviseur Admin SI, vous pouvez réaffecter le rôle de Directeur Général CROUS-T à un membre du personnel.
          </p>

          <Field label="Sélectionner l'utilisateur à nommer Directeur Général *" required>
            <Select value={newDirectorUser} onChange={(e) => setNewDirectorUser(e.target.value)}>
              {utilisateursMock.filter((u) => u.role !== 'USAGER').map((u) => (
                <option key={u.id} value={u.id}>{u.nom_complet} — {u.service} ({u.role})</option>
              ))}
            </Select>
          </Field>

          <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
            <Button variant="ghost" onClick={() => setShowChangeDirectorModal(false)}>Annuler</Button>
            <Button variant="amber" onClick={changerDirecteur} disabled={loading}>
              {loading ? 'Affectation…' : '👑 Valider l\'affectation du Directeur'}
            </Button>
          </div>
        </div>
      </Modal>

      <DepecherMissionModal open={showDepecherModal} onClose={() => setShowDepecherModal(false)} />
    </PageWrapper>
  );
}

function DashboardTerrain({ user }) {
  const [showDepecherModal, setShowDepecherModal] = useState(false);
  const ouverts = signalementsMock.filter((s) => s.statut === 'OUVERTE').length;
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Contrôle Terrain"
        title={`Espace Terrain : ${user?.nom_complet}`}
        subtitle="Inspections d'occupation, constatations d'infraction et missions urgentes dépêchées."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Constats ouverts" value={ouverts} color="stamp" icon="🚩" />
        <StatCard label="Transmis au Bureau Env." value="2" color="ok" icon="✅" />
        <StatCard label="Missions urgentes reçues" value="1 active" color="amber" icon="⚡" />
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="stamp" onClick={() => setShowDepecherModal(true)}>
          ⚡ Rédiger un Ordre de Mission Terrain
        </Button>
      </div>

      <Link to="/terrain/signalements">
        <Card className="flex items-center gap-4 hover:border-teal transition-colors border">
          <span className="text-3xl">🗺️</span>
          <div>
            <p className="font-display font-semibold">Rédiger & Consulter les Constats Terrain</p>
            <p className="text-sm text-muted">Signalement d'occupations sans titre et tarifs anormaux</p>
          </div>
        </Card>
      </Link>

      <DepecherMissionModal open={showDepecherModal} onClose={() => setShowDepecherModal(false)} />
    </PageWrapper>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, role } = useAuth();

  if (!role) return null;

  if (role === 'OCCUPANT')             return <DashboardOccupant user={user} />;
  if (role === 'SERVICE_COMPTABLE')    return <DashboardComptable user={user} />;
  if (role === 'SERVICE_TECHNIQUE')    return <DashboardTechnique user={user} />;
  if (role === 'SERVICE_JURIDIQUE')    return <DashboardJuridique user={user} />;
  if (role === 'CELLULE_COMMUNICATION') return <DashboardCommunication user={user} />;
  if (role === 'AGENT_QHSE')           return <DashboardQHSE user={user} />;
  if (role === 'BUREAU_COURRIER')      return <DashboardBureauCourrier user={user} />;
  if (role === 'DIRECTEUR_CROUS_T')    return <DashboardDirection user={user} />;
  if (role === 'ADMINISTRATEUR_SI')    return <DashboardAdmin user={user} />;
  if (role === 'AGENT_DCUVE' || role === 'DIRECTEUR_DCUVE') return <DashboardDCUVE user={user} />;
  if (role === 'AGENT_TERRAIN')        return <DashboardTerrain user={user} />;

  if (role === 'USAGER')               return <DashboardUsager user={user} />;

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Personnel"
        title={`Bienvenue, ${user?.nom_complet}`}
        subtitle={`Rôle : ${role?.replace(/_/g, ' ')} — Service : ${user?.service || 'non défini'}`}
      />
      <Card>
        <p className="text-sm text-muted">Votre espace est configuré par l'administration. Utilisez la navigation latérale pour accéder à vos fonctions.</p>
      </Card>
    </PageWrapper>
  );
}
