import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import ApartmentIcon from '@mui/icons-material/ApartmentOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyOutlined';
import BalanceIcon from '@mui/icons-material/BalanceOutlined';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import BuildIcon from '@mui/icons-material/BuildOutlined';
import CampaignIcon from '@mui/icons-material/CampaignOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCardOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEventsOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ExploreIcon from '@mui/icons-material/ExploreOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOnOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import LocalAtmIcon from '@mui/icons-material/LocalAtmOutlined';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTechOutlined';
import NewReleasesIcon from '@mui/icons-material/NewReleasesOutlined';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningIcon from '@mui/icons-material/WarningOutlined';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bar, Doughnut } from 'react-chartjs-2';
import { baseOptions, cartesianScales } from '../components/charts/chartSetup';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getDashboardComplement, getPaiementsMois } from '../api/dashboard';
import { getClassementFidelite } from '../api/fidelite';
import { getAnnonces, createAnnonce } from '../api/annonces';
import { getMesDemandes } from '../api/demandes';
import { getNotificationsNonLues } from '../api/notifications';
import { getContrats } from '../api/contrats';
import { getEcheances } from '../api/paiements';
import { getPlaintes } from '../api/terrain';
import { getPublicStats } from '../api/public';
import { getSupervisionSysteme } from '../api/supervision';
import { messageErreur } from '../api/utils';
import { ROLES_LABELS } from '../utils/constants';
import { Button, Field, Input, Textarea, Modal } from '../components/common/ui';
import {
  WelcomeBanner, StatGrid, KpiCard, MiniStat, Panel, SplitLayout,
  ProgressRow, RankList, Pill, SectionLabel,
} from '../components/common/dashboard';
import StatistiquesJuridique from '../components/juridique/StatistiquesJuridique';


const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const num = (n) => Number(n || 0).toLocaleString('fr-FR');

function BarChart({ data, height = 220 }) {
  if (!data || !data.length) return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune donnée disponible.</p>;

  const chartData = {
    labels: data.map((d) => d.mois),
    datasets: [
      {
        label: 'Soumises',
        data: data.map((d) => d.soumises || 0),
        backgroundColor: '#172554', // var(--navy)
        borderRadius: 6,
        maxBarThickness: 36,
      },
      {
        label: 'Favorables',
        data: data.map((d) => d.favorables || 0),
        backgroundColor: '#16a34a', // var(--green)
        borderRadius: 6,
        maxBarThickness: 36,
      },
      {
        label: 'Défavorables',
        data: data.map((d) => d.defavorables || 0),
        backgroundColor: '#dc2626', // var(--red)
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const options = baseOptions({
    scales: cartesianScales(),
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
  });

  return (
    <div style={{ height, width: '100%', paddingTop: 8 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

function DoughnutChart({ data }) {
  if (!data || !data.length) return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune donnée disponible.</p>;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [{
      data: data.map((d) => d.value),
      backgroundColor: ['#172554', '#c9a15c', '#16a34a', '#dc2626', '#0284c7', '#ca8a04'],
    }],
  };

  return (
    <div style={{ height: 200, width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
      <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
}

function DcuveAnalyticsPanel({ stats, loading }) {
  const [vue, setVue] = useState('mensuel');

  const evolutionData = stats?.evolution_mensuelle || [];
  const repartitionTypes = stats?.repartition_types_locaux || [];
  const totalDemandes = stats?.demandes_total || 0;
  const favorables = stats?.demandes_favorables || 0;
  const defavorables = stats?.demandes_defavorables || 0;
  const enCours = stats?.demandes_en_cours || 0;
  const totalDecidees = favorables + defavorables;
  const tauxAcceptation = stats?.taux_favorable || (totalDecidees > 0 ? ((favorables / totalDecidees) * 100).toFixed(1) : 0);

  return (
    <Panel
      icon={<BarChartIcon />}
      title="Dynamique d'instruction & Activité des candidatures"
      subtitle="Suivi de la volumétrie des dossiers, arbitrage des décisions et flux d'instruction du bureau DCUVE"
      action={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-2)', padding: 3, borderRadius: 8, gap: 4 }}>
            {[
              { id: 'mensuel', label: 'Flux mensuel' },
              { id: 'types', label: 'Types de projets' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVue(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: vue === tab.id ? 'var(--navy)' : 'transparent',
                  color: vue === tab.id ? 'var(--text-on-navy)' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Pill tone="gold">{tauxAcceptation}% d'avis favorables</Pill>
        </div>
      )}
    >
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Chargement des données analytiques…</p>
      ) : (
        <div>
          {/* Top Quick Summary Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(201, 161, 92, 0.25)',
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.15)',
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--gold, #c9a15c)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                Total dossiers déposés
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-soft, #f4e8d3)', fontFamily: 'var(--font-display)', marginTop: 4 }}>
                {totalDemandes}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244, 232, 211, 0.75)', marginTop: 3 }}>
                100% des candidatures
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(201, 161, 92, 0.25)',
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.15)',
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--gold, #c9a15c)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                Avis favorables & Contrats
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-soft, #f4e8d3)', fontFamily: 'var(--font-display)', marginTop: 4 }}>
                {favorables}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244, 232, 211, 0.75)', marginTop: 3 }}>
                Validés, en signature & signés
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(201, 161, 92, 0.25)',
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.15)',
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--gold, #c9a15c)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                Avis défavorables & Archivés
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-soft, #f4e8d3)', fontFamily: 'var(--font-display)', marginTop: 4 }}>
                {defavorables}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244, 232, 211, 0.75)', marginTop: 3 }}>
                Rejets, archivages & refus
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(201, 161, 92, 0.25)',
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.15)',
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--gold, #c9a15c)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                En cours d'instruction
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-soft, #f4e8d3)', fontFamily: 'var(--font-display)', marginTop: 4 }}>
                {enCours}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244, 232, 211, 0.75)', marginTop: 3 }}>
                Nouvelles & expertises actives
              </div>
            </div>
          </div>

          {/* VUE 1 : FLUX MENSUEL */}
          {vue === 'mensuel' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: '#172554', borderRadius: 2 }} /> Candidatures reçues ({totalDemandes})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16a34a' }}>
                  <span style={{ width: 10, height: 10, background: '#16a34a', borderRadius: 2 }} /> Favorables & Contrats ({favorables})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626' }}>
                  <span style={{ width: 10, height: 10, background: '#dc2626', borderRadius: 2 }} /> Défavorables & Archivés ({defavorables})
                </span>
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <BarChart data={evolutionData} height={250} />
              </div>
            </div>
          )}

          {/* VUE 2 : TYPES DE PROJETS */}
          {vue === 'types' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div>
                <h5 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-navy)', fontWeight: 700 }}>
                  Répartition par type d'activité candidate
                </h5>
                {repartitionTypes.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>Aucune donnée disponible.</p>
                ) : (
                  repartitionTypes.map((t) => (
                    <ProgressRow
                      key={t.type_local}
                      label={`${(t.type_local || '').replace(/_/g, ' ')} - ${t.total} projet(s)`}
                      value={t.total}
                      total={stats?.locaux_total || 1}
                      tone="gold"
                    />
                  ))
                )}
              </div>
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-navy)', fontWeight: 700 }}>
                  Indicateur de tension du parc
                </h5>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Les projets commerciaux et alimentaires représentent la part prépondérante des candidatures déposées au CROUS-T. Le taux d'occupation actuel est de <strong>{(((stats?.locaux_occupes || 0) / (stats?.locaux_total || 1)) * 100).toFixed(0)}%</strong>.
                </p>
                <div style={{ marginTop: 12 }}>
                  <ProgressRow
                    label={`Locaux occupés (${stats?.locaux_occupes || 0} / ${stats?.locaux_total || 0})`}
                    value={stats?.locaux_occupes || 0}
                    total={stats?.locaux_total || 1}
                    tone="green"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function WeekChart({ series, estComptable }) {
  if (!series || !series.length) return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune activite sur la periode.</p>;
  
  let datasets = [
    {
      label: 'Dossiers',
      data: series.map((d) => d.demandes || 0),
      backgroundColor: '#172554', // var(--navy)
      borderRadius: 4,
    },
    {
      label: 'Decisions',
      data: series.map((d) => d.decisions || 0),
      backgroundColor: '#16a34a', // var(--green)
      borderRadius: 4,
    },
    {
      label: 'Paiements',
      data: series.map((d) => d.paiements || 0),
      backgroundColor: '#c9a15c', // var(--gold)
      borderRadius: 4,
    },
  ];

  if (estComptable) {
    datasets = datasets.filter((d) => d.label === 'Paiements');
  }

  const chartData = {
    labels: series.map((d) => d.jour),
    datasets,
  };

  const options = baseOptions({
    scales: cartesianScales(),
    plugins: {
      legend: { display: false },
    },
  });

  return (
    <div style={{ height: 170, width: '100%', paddingTop: 8 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

/* ─── Tableau de bord adaptatif ─────────────────────────────────────── */
/** Libelles metier affiches dans « Repartition des dossiers par statut ». */
const LIBELLES_STATUT_DOSSIER = {
  NOUVELLE: 'Nouvelle',
  MITIGEE_ARCHIVEE: 'Archivée',
  DEFAVORABLE: 'Avis défavorable',
  FAVORABLE: 'Avis favorable',
  CONTRAT_REFUSE: 'Contrat refusé',
};

export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [mesDemandes, setMesDemandes] = useState([]);
  const [mesContrats, setMesContrats] = useState([]);
  const [mesEcheances, setMesEcheances] = useState([]);
  const [mesPlaintes, setMesPlaintes] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [complement, setComplement] = useState(null);
  const [topOccupants, setTopOccupants] = useState([]);
  const [supervisionSI, setSupervisionSI] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sélecteur de mois pour le Service Comptable
  const now = new Date();
  const [moisSel, setMoisSel] = useState(now.getMonth() + 1);
  const [anneeSel, setAnneeSel] = useState(now.getFullYear());
  const [paiementsMois, setPaiementsMois] = useState(null);
  const [paiementsMoisLoading, setPaiementsMoisLoading] = useState(false);

  const estUsager = role === 'USAGER';
  const estOccupant = role === 'OCCUPANT';
  const estDCUVE = role === 'DIRECTEUR_DCUVE' || role === 'AGENT_DCUVE';
  const estDirection = role === 'DIRECTEUR_CROUST' || role === 'DIRECTEUR_CROUS_T' || role === 'DIRECTEUR_DCUVE';
  const estJuridique = role === 'SERVICE_JURIDIQUE';
  const estComptable = role === 'SERVICE_COMPTABLE';
  const estCommunication = role === 'CELLULE_COMMUNICATION';
  const estEnvironnement = role === 'AGENT_QHSE';
  const estTerrain = role === 'AGENT_TERRAIN';
  const estMaintenance = role === 'SERVICE_TECHNIQUE';
  const estTechnique = estEnvironnement || estTerrain || estMaintenance;
  const estCourrier = role === 'BUREAU_COURRIER';
  const estAdminSI = role === 'ADMINISTRATEUR_SI';
  // Acteurs transversaux sans perìmetre metier : ils n'ont pas acces aux KPI
  // de gestion (dossiers, recettes, contrats). Voir core/acteurs.py cote API.
  const estSansDonneesMetier = estCommunication || estAdminSI;

  const [nbTopOccupantsAffiches, setNbTopOccupantsAffiches] = useState(10);

  const [comModal, setComModal] = useState(false);
  const [comForm, setComForm] = useState({ titre: '', contenu: '', consigne_direction: '' });
  const [comSubmitting, setComSubmitting] = useState(false);

  const handleEnvoyerAnnonceCom = async (e) => {
    e?.preventDefault?.();
    if (!comForm.titre || !comForm.contenu) {
      toast.error('Veuillez renseigner le titre et le texte de l’annonce.');
      return;
    }
    setComSubmitting(true);
    try {
      await createAnnonce({
        titre: comForm.titre,
        contenu: comForm.contenu,
        consigne_direction: comForm.consigne_direction,
        statut: 'A_PUBLIER',
        est_active: false,
      });
      toast.success('Annonce transmise à la Cellule Communication avec succès.');
      setComForm({ titre: '', contenu: '', consigne_direction: '' });
      setComModal(false);
      const a = await getAnnonces();
      setAnnonces(a || []);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la transmission à la Cellule Communication.'));
    } finally {
      setComSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      const taches = [
        (estSansDonneesMetier ? getPublicStats() : getDashboardStats())
          .then(setStats)
          .catch(() => null),
        getAnnonces().then((a) => setAnnonces((a || []).slice(0, 5))).catch(() => null),
        getNotificationsNonLues()
          .then((d) => setNonLues(Array.isArray(d) ? d.length : (d?.count ?? d?.results?.length ?? 0)))
          .catch(() => null),
      ];
      if (estAdminSI) {
        taches.push(
          getSupervisionSysteme()
            .then(setSupervisionSI)
            .catch(() => null),
        );
      }
      if (estSansDonneesMetier) {
        // Aucun complement metier ni classement fidelite pour ces acteurs.
      } else if (estUsager) {
        taches.push(getMesDemandes().then(setMesDemandes).catch(() => null));
      } else if (estOccupant) {
        taches.push(getContrats().then(setMesContrats).catch(() => null));
        taches.push(getEcheances().then(setMesEcheances).catch(() => null));
        taches.push(getPlaintes().then(setMesPlaintes).catch(() => null));
        taches.push(
          getClassementFidelite(10)
            .then((d) => setTopOccupants(Array.isArray(d) ? d : []))
            .catch(() => null),
        );
      } else {
        // Phase 2 : series 7 jours, repartition des paiements, classements.
        taches.push(getDashboardComplement({ limit: 5 }).then(setComplement).catch(() => null));
        taches.push(
          getClassementFidelite(50)
            .then((d) => setTopOccupants(Array.isArray(d) ? d : []))
            .catch(() => null),
        );
      }
      try {
        await Promise.all(taches);
      } catch (e) {
        toast.error(messageErreur(e, 'Chargement partiel du tableau de bord.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [estUsager, estOccupant, estAdminSI, estSansDonneesMetier]);

  // Rechargement des paiements du mois sélectionné pour le comptable
  useEffect(() => {
    if (!estComptable) return;
    setPaiementsMoisLoading(true);
    getPaiementsMois(anneeSel, moisSel)
      .then(setPaiementsMois)
      .catch(() => null)
      .finally(() => setPaiementsMoisLoading(false));
  }, [estComptable, anneeSel, moisSel]);



  const s = stats || {};
  let repartitionStatuts = (s.repartition_statuts || []);
  if (role === 'BUREAU_COURRIER') {
    repartitionStatuts = repartitionStatuts.filter(r => ['NOUVELLE', 'MITIGEE_ARCHIVEE'].includes(r.statut));
  }
  repartitionStatuts = repartitionStatuts.slice(0, 6);
  const totalDemandes = s.demandes_total || 1;

  /* KPI principaux selon le profil */
  const kpis = useMemo(() => {
    if (estUsager) {
      const enCours = mesDemandes.filter((d) => !['FAVORABLE', 'DEFAVORABLE', 'CONTRAT_REFUSE'].includes(d.statut)).length;
      const favorables = mesDemandes.filter((d) => d.statut === 'FAVORABLE' || d.statut === 'CONTRAT_ACCEPTE_RDV_FIXE').length;
      return [
        { icon: <FolderIcon fontSize="large" />, label: 'Mes candidatures', value: mesDemandes.length, sub: `${enCours} en cours`, tone: 'navy' },
        { icon: <CheckCircleIcon fontSize="large" />, label: 'Avis favorables', value: favorables, sub: 'Dossiers retenus', tone: 'green' },
      ];
    }
    if (estOccupant) {
      const contratsList = Array.isArray(mesContrats) ? mesContrats : (mesContrats?.results || []);
      const contratsActifs = contratsList.filter(c => c.est_actif).length;
      
      const echeancesList = Array.isArray(mesEcheances) ? mesEcheances : (mesEcheances?.results || []);
      const impayes = echeancesList
        .filter(e => e.statut === 'EXIGIBLE' || e.statut === 'EN_RETARD')
        .reduce((sum, e) => sum + parseFloat(e.montant_du || 0) + parseFloat(e.montant_penalite || 0), 0);
      const nbEcheancesRetard = echeancesList.filter(e => e.statut === 'EN_RETARD' || e.statut === 'EXIGIBLE').length;
      
      const plaintesList = Array.isArray(mesPlaintes) ? mesPlaintes : (mesPlaintes?.results || []);
      const signalementsOuverts = plaintesList.filter(p => p.statut !== 'RESOLUE' && p.statut !== 'REJETEE').length;

      return [
        { icon: <ApartmentIcon fontSize="large" />, label: 'Contrat actif', value: contratsActifs > 0 ? 'Actif' : 'Non actif', sub: 'Bail en cours', tone: contratsActifs > 0 ? 'green' : 'slate' },
        { icon: <CreditCardIcon fontSize="large" />, label: 'Reste à payer', value: `${impayes.toLocaleString('fr-SN')} F`, sub: nbEcheancesRetard > 0 ? `${nbEcheancesRetard} échéance(s)` : 'À jour', tone: impayes > 0 ? 'red' : 'green' },
        { icon: <ErrorOutlinedIcon fontSize="large" />, label: 'Signalements', value: signalementsOuverts, sub: 'En cours de traitement', tone: signalementsOuverts > 0 ? 'gold' : 'navy' },
      ];
    }
    if (role === 'SERVICE_COMPTABLE') {
      return [
        { icon: <LocalAtmIcon fontSize="large" />, label: 'Recettes du mois', value: fmt(s.recettes_mois), sub: 'Encaissements valides', tone: 'green' },
        { icon: <WarningIcon fontSize="large" />, label: 'Impayes', value: fmt(s.impayes_montant), sub: `${num(s.impayes_nombre)} echeance(s)`, tone: 'red' },
        { icon: <DescriptionIcon fontSize="large" />, label: 'Contrats actifs', value: num(s.contrats_actifs), sub: `${num(s.contrats_a_echeance)} a echeance`, tone: 'navy' },
        { icon: <ApartmentIcon fontSize="large" />, label: 'Locaux occupes', value: num(s.locaux_occupes), sub: `${num(s.locaux_libres)} libres`, tone: 'gold' },
      ];
    }
    if (estJuridique) {
      return [
        { icon: <DescriptionIcon fontSize="large" />, label: 'Contrats actifs', value: num(s.contrats_actifs), sub: 'En cours de validite', tone: 'green' },
        { icon: <AccessTimeIcon fontSize="large" />, label: 'Contrats a echeance', value: num(s.contrats_a_echeance), sub: 'Renouvellement/Fin', tone: 'gold' },
        { icon: <BalanceIcon fontSize="large" />, label: 'Commissions', value: 'Active', sub: 'Avis juridique', tone: 'navy' },
        { icon: <ApartmentIcon fontSize="large" />, label: 'Patrimoine', value: num(s.locaux_total), sub: `${num(s.locaux_occupes)} occupes`, tone: 'slate' },
      ];
    }
    if (estDCUVE) {
      return [
        { icon: <WarningIcon fontSize="large" />, label: 'Action requise', value: num(s.demandes_en_cours), sub: "En attente d'instruction", tone: s.demandes_en_cours > 0 ? 'red' : 'green' },
        { icon: <FolderIcon fontSize="large" />, label: 'Dossiers traités', value: num(s.demandes_total) - num(s.demandes_en_cours), sub: 'Total historiques', tone: 'navy' },
        { icon: <CheckCircleIcon fontSize="large" />, label: 'Taux favorable', value: `${s.taux_favorable ?? 0}%`, sub: `${num(s.demandes_favorables)} accords`, tone: 'green' },
        { icon: <ApartmentIcon fontSize="large" />, label: 'Locaux disponibles', value: num(s.locaux_libres), sub: 'À attribuer', tone: 'slate' },
      ];
    }
    if (estEnvironnement) {
      const isAgentTerrain = user?.username === 'agent_qhse' || user?.nom_complet?.toLowerCase().includes('agent');
      return [
        {
          icon: <ExploreIcon fontSize="large" />,
          label: isAgentTerrain ? 'Missions assignées' : 'Missions émises',
          value: num(complement?.missions?.emis ?? complement?.missions?.en_cours ?? 0),
          sub: `${num(complement?.missions?.en_cours)} en cours`,
          tone: 'navy',
        },
        { icon: <ScienceIcon fontSize="large" />, label: 'Inspections sanitaires', value: num(s.inspections_mois), sub: 'Contrôles du mois', tone: 'green' },
        { icon: <StarIcon fontSize="large" />, label: 'Score QHSE moyen', value: s.score_qhse_moyen ?? 0, sub: `${num(s.avis_publies)} avis collectés`, tone: 'gold' },
        { icon: <ErrorOutlinedIcon fontSize="large" />, label: 'Signalements ouverts', value: num(s.signalements_ouverts), sub: `${num(s.signalements_total)} au total`, tone: 'red' },
      ];
    }
    if (estMaintenance) {
      return [
        { icon: <BuildIcon fontSize="large" />, label: 'Interventions en cours', value: num(complement?.maintenance?.en_cours), sub: `${num(complement?.maintenance?.planifiees)} planifiees`, tone: 'navy' },
        { icon: <AttachMoneyIcon fontSize="large" />, label: 'Cout estime global', value: fmt(complement?.maintenance?.cout_estime_total), sub: 'Sur la periode', tone: 'gold' },
        { icon: <ErrorOutlinedIcon fontSize="large" />, label: 'Signalements ouverts', value: num(s.signalements_ouverts), sub: `${num(s.signalements_total)} au total`, tone: 'red' },
        { icon: <ApartmentIcon fontSize="large" />, label: 'Locaux suivis', value: num(s.locaux_total), sub: `${num(s.locaux_occupes)} occupes`, tone: 'slate' },
      ];
    }
    if (estTerrain) {
      return [
        { icon: <ErrorOutlinedIcon fontSize="large" />, label: 'Signalements ouverts', value: num(s.signalements_ouverts), sub: `${num(s.signalements_total)} au total`, tone: 'red' },
        { icon: <ExploreIcon fontSize="large" />, label: 'Missions executees', value: num(complement?.missions?.executes), sub: `${num(complement?.missions?.en_cours)} en cours`, tone: 'navy' },
        { icon: <ScienceIcon fontSize="large" />, label: 'Inspections du mois', value: num(s.inspections_mois), sub: 'Controles realises', tone: 'green' },
        { icon: <StarIcon fontSize="large" />, label: 'Score QHSE moyen', value: s.score_qhse_moyen ?? 0, sub: `${num(s.avis_publies)} avis`, tone: 'gold' },
      ];
    }
    if (estAdminSI) {
      const srv = supervisionSI?.services || [];
      const nbOk = srv.filter((service) => service.statut === 'OK').length;
      return [
        { icon: <MemoryIcon fontSize="large" />, label: 'Services opérationnels', value: `${nbOk}/${srv.length || 4}`, sub: supervisionSI?.status || 'OPERATIONNEL', tone: 'green' },
        { icon: <AssignmentIcon fontSize="large" />, label: "Journal d'audit", value: num(supervisionSI?.volumetrie?.audit || 0), sub: `${num(supervisionSI?.volumetrie?.audit_24h || 0)} dernières 24h`, tone: 'navy' },
        { icon: <SpeedIcon fontSize="large" />, label: 'Latence BDD', value: `${supervisionSI?.systeme?.db_latency_ms ?? 12} ms`, sub: 'Temps de réponse', tone: 'gold' },
        { icon: <SecurityIcon fontSize="large" />, label: 'Mode Supervision', value: 'Actif', sub: 'Observabilité globale', tone: 'slate' },
      ];
    }
    if (estCommunication) {
      return [
        { icon: <CampaignIcon fontSize="large" />, label: 'Annonces actives', value: annonces.length, sub: 'Sur le reseau', tone: 'navy' },
        { icon: <StarIcon fontSize="large" />, label: 'Avis publies', value: num(s.avis_publies), sub: 'Retours usagers', tone: 'green' },
        { icon: <EmojiEventsIcon fontSize="large" />, label: 'Satisfaction moyenne', value: s.note_satisfaction ?? 0, sub: 'Note vitrine', tone: 'gold' },
        { icon: <ApartmentIcon fontSize="large" />, label: 'Patrimoine', value: num(s.locaux_total), sub: `${num(s.locaux_libres)} libres`, tone: 'slate' },
      ];
    }
    if (estCourrier) {
      return [
        { icon: <FolderIcon fontSize="large" />, label: 'Dossiers reçus', value: num(s.demandes_total), sub: '', tone: 'navy' },
        { icon: <CheckCircleIcon fontSize="large" />, label: 'Dossiers traités', value: num(s.demandes_total) - num(s.demandes_en_cours), sub: 'Orientés', tone: 'green' },
        { icon: <WarningIcon fontSize="large" />, label: 'Dossiers en attente', value: num(s.demandes_en_cours), sub: 'À traiter', tone: s.demandes_en_cours > 0 ? 'red' : 'slate' },
      ];
    }
    return [
      { icon: <FolderIcon fontSize="large" />, label: 'Demandes traitees', value: num(s.demandes_total), sub: `${num(s.demandes_en_cours)} en cours`, tone: 'navy' },
      { icon: <AttachMoneyIcon fontSize="large" />, label: 'Recettes du mois', value: fmt(s.recettes_mois), sub: `${fmt(s.impayes_montant)} d'impayes`, tone: 'gold' },
      { icon: <ApartmentIcon fontSize="large" />, label: 'Patrimoine', value: num(s.locaux_total), sub: `${num(s.locaux_libres)} locaux libres`, tone: 'slate' },
    ];
  }, [estUsager, estOccupant, estAdminSI, estCommunication, supervisionSI, annonces, complement, role, mesDemandes, nonLues, s]);

  const occupantAlert = useMemo(() => {
    if (!estOccupant) return null;
    const echeancesList = Array.isArray(mesEcheances) ? mesEcheances : (mesEcheances?.results || []);
    const retardEcheances = echeancesList.filter(e => e.statut === 'EN_RETARD' || e.statut === 'EXIGIBLE');
    if (retardEcheances.length === 0) return null;
    const montantTotal = retardEcheances.reduce((sum, e) => sum + parseFloat(e.montant_du || 0) + parseFloat(e.montant_penalite || 0), 0);
    const penalitesTotal = retardEcheances.reduce((sum, e) => sum + parseFloat(e.montant_penalite || 0), 0);
    return {
      nb: retardEcheances.length,
      montant: montantTotal,
      penalites: penalitesTotal,
      estCritique: retardEcheances.length >= 2 || montantTotal >= 200000,
    };
  }, [estOccupant, mesEcheances]);

  return (
    <div>
      <WelcomeBanner
        title={`Bonjour ${user?.nom_complet?.split(' ')[0] || ''}`}
        subtitle={`Espace ${ROLES_LABELS?.[role] || (role || '').replace(/_/g, ' ')} - voici la situation en temps reel du parc domanial du CROUS-T.`}
        meta={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={nonLues > 0 ? <Pill tone="gold">{nonLues} notification(s) non lue(s)</Pill> : null}
      />

      {/* Alerte impayé & Malus de fidélité pour l'occupant */}
      {estOccupant && occupantAlert && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.06)',
          border: '1.5px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260, flex: 1 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--red, #dc2626)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
            }}>
              <WarningIcon style={{ fontSize: 24 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, color: 'var(--red, #b91c1c)', fontSize: 14.5, fontWeight: 800 }}>
                  Alerte Impayé : Vous avez des redevances en retard
                </h4>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--red, #dc2626)',
                  color: '#ffffff',
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}>
                  Malus fidélité actif
                </span>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--text-navy)', lineHeight: 1.4 }}>
                Vous avez <strong>{occupantAlert.nb} échéance(s) impayée(s)</strong> pour un total de <strong>{fmt(occupantAlert.montant)}</strong>.
                Chaque retard dégrade votre <strong>score de fidélité occupant (-5 à -15 pts)</strong> et bloque vos renouvellements prioritaires.
              </p>
            </div>
          </div>
          <Link to="/paiement">
            <Button variant="danger" size="md">
              💳 Régulariser mes impayés
            </Button>
          </Link>
        </div>
      )}

      {!estJuridique && (
        <div style={{ marginBottom: 32 }}>
          <StatGrid cols={4}>
            {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
          </StatGrid>
        </div>
      )}

      {/* Indicateurs secondaires (pilotage) */}
      {!(estUsager || estOccupant || estDCUVE || estJuridique || estComptable || estTechnique || estCommunication || estCourrier || estAdminSI) && (
        <>
          <SectionLabel icon={<FlashOnIcon fontSize="small" style={{ marginBottom: -4 }} />}>Etat du reseau</SectionLabel>
          <StatGrid cols={5}>
            <MiniStat icon={<NewReleasesIcon fontSize="small" />} label="Nouvelles demandes" value={num(s.demandes_nouvelles)} tone="gold" />
            <MiniStat icon={<DescriptionIcon fontSize="small" />} label="Contrats actifs" value={num(s.contrats_actifs)} tone="navy" />
            <MiniStat icon={<AccessTimeIcon fontSize="small" />} label="Contrats a echeance" value={num(s.contrats_a_echeance)} tone="red" />
            <MiniStat icon={<GroupIcon fontSize="small" />} label="Utilisateurs actifs" value={num(s.utilisateurs_total)} tone="slate" />
            <MiniStat icon={<ErrorOutlinedIcon fontSize="small" />} label="Signalements ouverts" value={num(s.signalements_ouverts)} tone="red" />
          </StatGrid>
        </>
      )}

      {/* Section DCUVE : Pleine largeur optimisée avec analytique riche */}
      {estDCUVE && (
        <div style={{ display: 'grid', gap: 32, marginBottom: 32 }}>
          <DcuveAnalyticsPanel stats={s} loading={loading} />
        </div>
      )}

      {/* Section Service Juridique : Vue analytique dédiée */}
      {estJuridique && (
        <div style={{ marginBottom: 32 }}>
          <StatistiquesJuridique />
        </div>
      )}

      {/* Cellule Communication : vitrine institutionnelle uniquement */}
      {estCommunication && (
        <div style={{ display: 'grid', gap: 32, marginBottom: 32 }}>
          <Panel
            icon={<CampaignIcon />}
            title="Annonces officielles publiees"
            subtitle="Vitrine institutionnelle du CROUS-T"
            action={<Link to="/communication"><Button variant="ghost" size="sm">Gerer</Button></Link>}
          >
            <RankList
              items={annonces.map((a) => ({
                key: a.id,
                title: a.titre,
                subtitle: a.date_publication ? new Date(a.date_publication).toLocaleDateString('fr-FR') : '',
              }))}
              empty="Aucune annonce publiee."
            />
          </Panel>
          <Panel icon={<StarIcon />} title="Moderation des avis" subtitle="Retours usagers a publier ou masquer" action={<Link to="/moderation-avis"><Button variant="ghost" size="sm">Ouvrir</Button></Link>}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0, padding: 16 }}>
              {num(s.avis_publies)} avis publies sur la vitrine. Les dossiers de candidature, contrats et paiements ne relevent pas de votre perimetre.
            </p>
          </Panel>
        </div>
      )}

      {/* Administrateur SI : supervision technique et observabilité */}
      {estAdminSI && (
        <div style={{ display: 'grid', gap: 32, marginBottom: 32 }}>
          <Panel icon={<MemoryIcon />} title="Supervision & Administration Technique" subtitle="Santé système, audit, paramètres et observabilité">
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                Espace d'observabilité et d'administration technique : supervision de la santé du système, journal d'audit, paramètres et consultation du patrimoine.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/admin/supervision"><Button variant="ghost" size="sm">Supervision & Santé</Button></Link>
                <Link to="/admin/audit"><Button variant="ghost" size="sm">Journal d'audit</Button></Link>
                <Link to="/admin/parametres"><Button variant="ghost" size="sm">Paramètres système</Button></Link>
                <Link to="/patrimoine/locaux"><Button variant="ghost" size="sm">Référentiel des locaux</Button></Link>
                <Link to="/rapports"><Button variant="ghost" size="sm">Rapports d'activité</Button></Link>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Section Communication Direction : Pleine largeur horizontale */}
      {estDirection && (
        <div style={{ marginBottom: 32 }}>
          <Panel
            icon={<CampaignIcon />}
            title="Communication Direction"
            subtitle="Transmettre une annonce officielle à la Cellule Communication"
            action={
              <Button variant="primary" size="sm" onClick={() => setComModal(true)} style={{ fontWeight: 700 }}>
                📢 Nouvelle annonce
              </Button>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'stretch' }}>
              <div style={{
                padding: '16px 18px',
                background: 'var(--surface-2)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', marginBottom: 6 }}>
                    Canal de diffusion officiel
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Rédigez vos communiqués officiels. Ils sont directement transmis à la <strong>Cellule Communication</strong> pour mise en forme et diffusion sur le réseau vitrine.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setComModal(true)}
                  style={{ fontWeight: 700, alignSelf: 'flex-start' }}
                >
                  + Rédiger un communiqué
                </Button>
              </div>

              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--text-navy)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>Dernières transmissions ({annonces.length})</span>
                  {annonces.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                      {Math.min(annonces.length, 3)} affichée(s)
                    </span>
                  )}
                </div>

                {annonces.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    background: 'var(--surface-2)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 12.5,
                    color: 'var(--muted)',
                    textAlign: 'center',
                  }}>
                    Aucune annonce transmise pour le moment.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                  }}>
                    {annonces.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '14px 16px',
                          background: 'var(--surface-2)',
                          borderRadius: 12,
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-navy)',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {a.titre}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            {new Date(a.date_creation || a.date_publication).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div style={{ alignSelf: 'flex-start' }}>
                          <Pill tone={a.statut === 'PUBLIEE' ? 'green' : 'gold'}>
                            {a.statut === 'PUBLIEE' ? '✓ Diffusée' : '⏳ Transmise Com'}
                          </Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Autres rôles : Disposition SplitLayout */}
      {!(estDCUVE || estJuridique || estAdminSI || estCommunication) && (
        <SplitLayout ratio={(estUsager || estOccupant) ? '1fr' : '1.6fr 1fr'}>
          <div style={{ display: 'grid', gap: 32, alignContent: 'start' }}>
            {!(estUsager || estOccupant || estJuridique || estComptable || estTechnique || estCommunication || estCourrier || estAdminSI) && (
              <Panel
                icon={<BarChartIcon />}
                title="Activite des 6 derniers mois"
                subtitle="Demandes soumises, avis favorables et defavorables"
                action={(
                  <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>
                    <span>■ Soumises</span>
                    <span style={{ color: 'var(--green, #16a34a)' }}>■ Favorables</span>
                    <span style={{ color: 'var(--red, #dc2626)' }}>■ Defavorables</span>
                  </div>
                )}
              >
                {loading ? <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Chargement…</p> : <BarChart data={s.evolution_mensuelle || []} />}
              </Panel>
            )}

            {/* Panel paiements mensuel - Service Comptable uniquement */}
            {estComptable && (() => {
              const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
              const seriesMois = paiementsMois?.series || [];
              const chartDataMois = {
                labels: seriesMois.map((d) => d.jour),
                datasets: [{
                  label: 'Paiements',
                  data: seriesMois.map((d) => d.paiements),
                  backgroundColor: '#c9a15c',
                  borderRadius: 4,
                  maxBarThickness: 22,
                }],
              };
              const optionsMois = baseOptions({ scales: cartesianScales(), plugins: { legend: { display: false } } });
              return (
                <Panel
                  icon={<TrendingUpIcon />}
                  title={`Paiements de ${MOIS_NOMS[moisSel - 1]} ${anneeSel}`}
                  subtitle={`${paiementsMois?.nb_paiements ?? '-'} encaissements · Total : ${fmt(paiementsMois?.total_montant)}`}
                  action={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={moisSel}
                        onChange={(e) => setMoisSel(Number(e.target.value))}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}
                      >
                        {MOIS_NOMS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                      <select
                        value={anneeSel}
                        onChange={(e) => setAnneeSel(Number(e.target.value))}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}
                      >
                        {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  )}
                >
                  {paiementsMoisLoading
                    ? <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Chargement…</p>
                    : seriesMois.length === 0
                      ? <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: 0 }}>Aucun paiement ce mois.</p>
                      : <div style={{ height: 200, width: '100%', paddingTop: 8 }}><Bar data={chartDataMois} options={optionsMois} /></div>
                  }
                </Panel>
              );
            })()}

            {/* Panel 7 derniers jours - autres rôles (hors comptable) */}
            {!(estUsager || estOccupant || estJuridique || estComptable || estTechnique || estCommunication || estCourrier || estAdminSI) && (
              <Panel
                icon={<TrendingUpIcon />}
                title="Evolution des 7 derniers jours"
                subtitle="Dossiers deposes, decisions rendues et paiements encaisses"
                action={(
                  <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>
                    <span>■ Dossiers</span>
                    <span style={{ color: 'var(--green, #16a34a)' }}>■ Decisions</span>
                    <span style={{ color: 'var(--gold, #c9a15c)' }}>■ Paiements</span>
                  </div>
                )}
              >
                {loading
                  ? <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Chargement…</p>
                  : <WeekChart series={complement?.evolution_7_jours || []} estComptable={false} />}
              </Panel>
            )}

            {!(estUsager || estOccupant || estJuridique || estTechnique || estCommunication || estCourrier || estAdminSI) && (
              <Panel
                icon={<CreditCardIcon />}
                title="Repartition des paiements par mode"
                subtitle={`Total encaisse : ${fmt(complement?.repartition_paiements?.total)}`}
              >
                {(complement?.repartition_paiements?.lignes || []).length === 0
                  ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucun encaissement enregistre.</p>
                  : (complement?.repartition_paiements?.lignes || []).map((l) => (
                    <ProgressRow
                      key={l.mode}
                      label={`${(l.mode || '').replace(/_/g, ' ')} - ${fmt(l.montant)} (${l.nombre} operation(s))`}
                      value={l.part}
                      total={100}
                      tone="green"
                      suffix="%"
                    />
                  ))}
              </Panel>
            )}

            {estUsager && (
              <Panel icon={<FolderIcon />} title="Mes dernieres candidatures" action={<Link to="/suivi"><Button variant="ghost" size="sm">Tout voir</Button></Link>}>
                <RankList
                  items={mesDemandes.slice(0, 5).map((d) => ({
                    key: d.id,
                    title: (d.type_demande || '').replace(/_/g, ' '),
                    subtitle: `${d.reference_anonyme || ''} · depose le ${d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '-'}`,
                    value: (d.statut || '').replace(/_/g, ' '),
                  }))}
                  empty="Vous n'avez encore depose aucun dossier."
                />
              </Panel>
            )}

            {estOccupant && (
              <Panel
                icon={<BuildIcon />}
                title="Suivi de mes signalements techniques"
                subtitle="État d'avancement des interventions par le Service Technique"
                action={<Link to="/signaler"><Button variant="ghost" size="sm">+ Signaler un problème</Button></Link>}
              >
                <RankList
                  items={(Array.isArray(mesPlaintes) ? mesPlaintes : (mesPlaintes?.results || [])).map((p) => ({
                    key: p.id,
                    title: p.description,
                    subtitle: `Local : ${p.local_reference || '-'} · Déposé le ${p.date_creation ? new Date(p.date_creation).toLocaleDateString('fr-FR') : '-'}`,
                    value: p.statut === 'RESOLUE' ? '✓ Signalement traité' : p.statut === 'EN_COURS_TRAITEMENT' ? '⏳ En traitement' : '📨 Transmis',
                    tone: p.statut === 'RESOLUE' ? 'green' : p.statut === 'EN_COURS_TRAITEMENT' ? 'gold' : 'navy',
                  }))}
                  empty="Aucun signalement technique déposé."
                />
              </Panel>
            )}

            {!(estUsager || estOccupant || estComptable || estTechnique || estCommunication || estAdminSI) && (
              <Panel icon={<ExploreIcon />} title="Repartition des dossiers par statut">
                {repartitionStatuts.length === 0
                  ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucun dossier enregistre.</p>
                  : repartitionStatuts.map((r) => (
                    <ProgressRow
                      key={r.statut}
                      label={`${LIBELLES_STATUT_DOSSIER[r.statut] || (r.statut || '').replace(/_/g, ' ')} - ${r.total}`}
                      value={r.total}
                      total={totalDemandes}
                      tone={r.statut === 'FAVORABLE' ? 'green' : r.statut === 'DEFAVORABLE' ? 'red' : 'navy'}
                    />
                  ))}
              </Panel>
            )}

            {estEnvironnement && (
              <Panel icon={<ExploreIcon />} title="Repartition des missions par statut">
                {!complement?.missions?.par_statut || Object.keys(complement.missions.par_statut).length === 0
                  ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune mission enregistree.</p>
                  : <DoughnutChart data={Object.entries(complement.missions.par_statut).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))} />}
              </Panel>
            )}

            {estMaintenance && (
              <Panel icon={<BuildIcon />} title="Repartition de la maintenance par statut">
                {!complement?.maintenance?.par_statut || Object.keys(complement.maintenance.par_statut).length === 0
                  ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune intervention enregistree.</p>
                  : <DoughnutChart data={Object.entries(complement.maintenance.par_statut).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))} />}
              </Panel>
            )}

            {(estJuridique || estTechnique || estOccupant) && (
              <Panel icon={<MilitaryTechIcon />} title="Classement des occupants" subtitle="Comparez votre score avec les meilleurs locataires">
                <RankList
                  items={topOccupants.map((o, idx) => ({
                    key: o.demandeur_id || idx,
                    rank: o.rang,
                    highlight: Boolean(o.est_moi || (user?.nom_complet && o.nom === user.nom_complet) || (user?.username && o.nom === user.username)),
                    title: o.nom,
                    subtitle: `Niveau ${o.palier || 'BRONZE'}`,
                    value: o.score != null ? `${Number(o.score).toFixed(0)} pts` : '-',
                  }))}
                  empty="Aucun occupant noté."
                />
              </Panel>
            )}
          </div>

          {!(estUsager || estOccupant || estJuridique || estAdminSI || estCommunication) && (
            <div style={{ display: 'grid', gap: 32, alignContent: 'start' }}>
              <Panel icon={<ApartmentIcon />} title="Types de locaux">
                {(s.repartition_types_locaux || []).length === 0
                  ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Patrimoine non renseigne.</p>
                  : (s.repartition_types_locaux || []).map((t) => (
                    <ProgressRow key={t.type_local} label={`${(t.type_local || '').replace(/_/g, ' ')} - ${t.total}`} value={t.total} total={s.locaux_total || 1} tone="gold" />
                  ))}
              </Panel>

              {!(estJuridique || estComptable || estTechnique || estCourrier || estAdminSI || estCommunication) && (
                <Panel
                  icon={<MilitaryTechIcon />}
                  title="Top occupants"
                  subtitle="Classement par score de fidélité & exemplarité"
                  action={
                    topOccupants.length > 0 && (
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700 }}>
                        {Math.min(nbTopOccupantsAffiches, topOccupants.length)} / {topOccupants.length}
                      </span>
                    )
                  }
                >
                  <RankList
                    items={topOccupants.slice(0, nbTopOccupantsAffiches).map((o) => ({
                      key: o.demandeur_id || o.nom,
                      title: o.nom,
                      subtitle: `Niveau ${o.palier || 'BRONZE'}${o.est_etudiant ? ' · Étudiant' : ''}`,
                      value: o.score != null ? `${Number(o.score).toFixed(0)} pts` : '-',
                    }))}
                    empty="Aucun occupant noté."
                  />
                  {topOccupants.length > nbTopOccupantsAffiches && (
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setNbTopOccupantsAffiches((prev) => prev + 10)}
                        style={{ width: '100%', fontWeight: 700 }}
                      >
                        Voir plus ({topOccupants.length - nbTopOccupantsAffiches} restants) ↓
                      </Button>
                    </div>
                  )}
                  {nbTopOccupantsAffiches > 10 && (
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNbTopOccupantsAffiches(10)}
                        style={{ fontSize: 11.5, color: 'var(--muted)' }}
                      >
                        Réduire l'affichage (10 premiers) ↑
                      </Button>
                    </div>
                  )}
                </Panel>
              )}

              {!(estDirection || estJuridique || estComptable || estTechnique || estCourrier || estAdminSI || estCommunication) && (
                <Panel icon={<CampaignIcon />} title="Communiqués officiels">
                  <RankList
                    items={annonces.map((a) => ({
                      key: a.id,
                      title: a.titre,
                      subtitle: a.date_publication ? new Date(a.date_publication).toLocaleDateString('fr-FR') : '',
                    }))}
                    empty="Aucune annonce publiée."
                  />
                </Panel>
              )}
            </div>
          )}
        </SplitLayout>
      )}

      {/* Modal de transmission d'une annonce à la Cellule Communication */}
      <Modal
        open={comModal}
        onClose={() => setComModal(false)}
        title="Transmettre une annonce à la Cellule Communication"
        size="lg"
      >
        <form onSubmit={handleEnvoyerAnnonceCom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
            color: 'var(--gold-soft)',
            borderRadius: 10,
            fontSize: 12.5,
            border: '1px solid rgba(201, 161, 92, 0.35)',
            lineHeight: 1.45,
          }}>
            🏛️ <strong>Circuit Direction ➔ Communication :</strong> Votre communiqué sera instantanément notifié et transmis à la <strong>Cellule Communication</strong> qui assurera sa vérification et sa diffusion sur la vitrine officielle.
          </div>

          <Field label="Titre de l'annonce ou du communiqué" required>
            <Input
              value={comForm.titre}
              onChange={(e) => setComForm({ ...comForm, titre: e.target.value })}
              placeholder="Ex : Appel à candidatures exceptionnel pour les kiosques du campus..."
              required
            />
          </Field>

          <Field label="Texte officiel de l'annonce" required>
            <Textarea
              value={comForm.contenu}
              onChange={(e) => setComForm({ ...comForm, contenu: e.target.value })}
              placeholder="Rédigez ici le contenu officiel de l'annonce à publier..."
              rows={5}
              required
            />
          </Field>

          <Field label="Consignes ou directives pour la Cellule Communication (optionnel)">
            <Input
              value={comForm.consigne_direction}
              onChange={(e) => setComForm({ ...comForm, consigne_direction: e.target.value })}
              placeholder="Ex : À diffuser en priorité d'ici demain midi..."
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => setComModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={comSubmitting} style={{ fontWeight: 700 }}>
              {comSubmitting ? 'Transmission en cours...' : '📢 Envoyer à la Cellule Communication'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


