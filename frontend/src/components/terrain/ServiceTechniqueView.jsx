import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FlashOnOutlinedIcon from '@mui/icons-material/FlashOnOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  getPlaintes, updatePlainte,
  getInterventions, createIntervention,
  demarrerIntervention, cloturerIntervention, annulerIntervention,
} from '../../api/terrain';
import { getUtilisateurs } from '../../api/comptes';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField,
  DataTable, Pill, RowActions,
} from '../common/dashboard';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const URGENCE_TONE = { FAIBLE: 'slate', MOYENNE: 'gold', ELEVEE: 'red' };
const STATUT_PLAINTE_TONE = { OUVERTE: 'red', EN_COURS_TRAITEMENT: 'gold', RESOLUE: 'green', REJETEE: 'slate' };
const STATUT_PLAINTE_LABEL = {
  OUVERTE: 'Ouverte',
  EN_COURS_TRAITEMENT: 'En traitement',
  RESOLUE: 'Signalement traité',
  REJETEE: 'Rejetée',
};
const STATUT_INTERV_TONE = { PLANIFIEE: 'slate', EN_COURS: 'gold', TERMINEE: 'green', ANNULEE: 'red' };
const STATUT_INTERV_LABEL = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
const TYPE_INTERV_LABEL = { PREVENTIVE: 'Préventive', CURATIVE: 'Curative', URGENCE: 'Urgence' };

const dateCourte = (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '-';

const formatLocal = (ref, id) => {
  if (ref && !ref.includes('-') && ref.length < 15) return ref;
  if (ref) return ref;
  if (!id) return '-';
  const str = String(id);
  if (str.length > 10) return `LOC-${str.slice(0, 6).toUpperCase()}`;
  return str;
};

const FORM_VIDE = {
  local: '',
  plainte_source: '',
  technicien: '',
  type_intervention: 'CURATIVE',
  description: '',
  date_planifiee: new Date().toISOString().slice(0, 16),
};

const CORPS_METIERS = [
  { id: 'TOUS', label: 'Tous les techniciens', icone: HandymanOutlinedIcon },
  { id: 'Électricien', label: 'Électriciens', icone: FlashOnOutlinedIcon },
  { id: 'Plombier', label: 'Plombiers', icone: WaterDropOutlinedIcon },
  { id: 'Frigoriste', label: 'Climatisation & Froid', icone: AcUnitOutlinedIcon },
  { id: 'Menuisier', label: 'Serrurerie & Menuiserie', icone: BuildOutlinedIcon },
];


/* ── Colonnes tableau signalements ──────────────────────────────────────── */

const COLS_SIGNALEMENTS = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{
        fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, fontWeight: 800,
        color: 'var(--navy, #1e3a5f)', background: 'var(--navy-soft, #eff6ff)',
        padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(30, 58, 95, 0.15)',
        whiteSpace: 'nowrap', display: 'inline-block',
      }}>
        {formatLocal(r.local_reference, r.local)}
      </span>
    ),
  },
  {
    key: 'description',
    label: 'Incident signalé',
    render: (r) => (
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-navy, #0f172a)', lineHeight: 1.4, maxWidth: 380 }}>
        {r.description}
      </div>
    ),
  },
  {
    key: 'urgence',
    label: 'Urgence',
    render: (r) => <Pill tone={URGENCE_TONE[r.urgence] || 'slate'}>{r.urgence}</Pill>,
  },
  {
    key: 'statut',
    label: 'Statut',
    render: (r) => <Pill tone={STATUT_PLAINTE_TONE[r.statut] || 'slate'}>{STATUT_PLAINTE_LABEL[r.statut] || r.statut}</Pill>,
  },
  {
    key: 'date_creation',
    label: 'Date',
    render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateCourte(r.date_creation)}</span>,
  },
];

/* ── Colonnes tableau interventions ─────────────────────────────────────── */

const COLS_INTERVENTIONS = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{
        fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, fontWeight: 800,
        color: 'var(--navy, #1e3a5f)', background: 'var(--navy-soft, #eff6ff)',
        padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(30, 58, 95, 0.15)',
        whiteSpace: 'nowrap', display: 'inline-block',
      }}>
        {formatLocal(r.local_reference, r.local)}
      </span>
    ),
  },
  {
    key: 'type_intervention',
    label: 'Type',
    render: (r) => <Pill tone={r.type_intervention === 'URGENCE' ? 'red' : r.type_intervention === 'CURATIVE' ? 'gold' : 'slate'}>{TYPE_INTERV_LABEL[r.type_intervention] || r.type_intervention}</Pill>,
  },
  {
    key: 'technicien_nom',
    label: 'Technicien',
    render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%)',
          color: 'var(--gold, #c9a15c)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 800,
          border: '1px solid var(--gold-tint)', flexShrink: 0,
        }}>
          {(r.technicien_nom || 'T').slice(0, 2).toUpperCase()}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-navy)' }}>{r.technicien_nom || '-'}</span>
      </div>
    ),
  },
  {
    key: 'statut',
    label: 'Statut',
    render: (r) => <Pill tone={STATUT_INTERV_TONE[r.statut] || 'slate'}>{STATUT_INTERV_LABEL[r.statut] || r.statut}</Pill>,
  },
  {
    key: 'date_planifiee',
    label: 'Planifiée le',
    render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateCourte(r.date_planifiee)}</span>,
  },
];

/* ── Colonnes tableau historique ────────────────────────────────────────── */

const COLS_HISTORIQUE = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{
        fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, fontWeight: 800,
        color: 'var(--navy, #1e3a5f)', background: 'var(--navy-soft, #eff6ff)',
        padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', display: 'inline-block',
      }}>
        {formatLocal(r.local_reference, r.local)}
      </span>
    ),
  },
  {
    key: 'technicien_nom',
    label: 'Technicien',
    render: (r) => <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.technicien_nom || '-'}</span>,
  },
  {
    key: 'date_realisation',
    label: 'Réalisée le',
    render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateCourte(r.date_realisation)}</span>,
  },
  {
    key: 'statut',
    label: 'État',
    render: () => <Pill tone="green">✓ Signalement traité</Pill>,
  },
  {
    key: 'rapport',
    label: 'Rapport',
    render: (r) => (
      <span style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 260, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {r.rapport || 'Travaux finalisés avec succès.'}
      </span>
    ),
  },
];

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function ServiceTechniqueView() {
  const [onglet, setOnglet] = useState('signalements');
  const [plaintes, setPlaintes] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [techniciensRaw, setTechniciensRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  /* filtres */
  const [filtreStatutPlainte, setFiltreStatutPlainte] = useState('');
  const [filtreStatutInterv, setFiltreStatutInterv] = useState('');
  const [q, setQ] = useState('');

  /* modal planification */
  const [modalPlanifier, setModalPlanifier] = useState(null); // plainte source
  const [form, setForm] = useState(FORM_VIDE);
  const [filtreMetier, setFiltreMetier] = useState('TOUS');
  const [rechercheTech, setRechercheTech] = useState('');
  const [saving, setSaving] = useState(false);

  /* modal clôture */
  const [modalCloturer, setModalCloturer] = useState(null); // intervention
  const [rapport, setRapport] = useState('');
  const [cloturing, setCloturing] = useState(false);

  /* ── Chargement ─────────────────────────────────────────────────────── */

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [pl, iv, us] = await Promise.all([
        getPlaintes().catch(() => []),
        getInterventions().catch(() => []),
        getUtilisateurs({ role: 'SERVICE_TECHNIQUE' }).catch(() => []),
      ]);
      const techniquesOnly = toArray(pl).filter((p) => p.type === 'TECHNIQUE');
      setPlaintes(techniquesOnly);
      setInterventions(toArray(iv));
      setTechniciensRaw(toArray(us));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  /* ── Techniciens qualifiés avec catalogue complet & disponibilités ────── */

  const listeTechniciens = useMemo(() => {
    // 100 % backend : le roster provient des comptes SERVICE_TECHNIQUE
    // (champs `specialite` / `telephone` du profil utilisateur).
    const baseRoster = techniciensRaw.map((u) => ({
      id: u.id,
      backendId: u.id,
      nom: u.nom_complet || u.username,
      specialite: u.specialite || 'Non renseignée',
      roleLabel: u.specialite || '',
      avatar: u.photo || null,
      telephone: u.telephone || 'Téléphone non renseigné',
    }));

    return baseRoster.map((tech) => {
      const assignedBackendId = tech.backendId;
      const enMission = interventions.some(
        (i) => i.statut === 'EN_COURS' && (i.technicien === assignedBackendId || (i.technicien_nom && i.technicien_nom.includes(tech.nom)))
      );

      return {
        ...tech,
        backendId: assignedBackendId,
        disponible: !enMission,
        enMission,
      };
    });
  }, [techniciensRaw, interventions]);

  const techniciensFiltres = useMemo(() => {
    return listeTechniciens.filter((t) => {
      const matchMetier = filtreMetier === 'TOUS' || t.specialite.toLowerCase().includes(filtreMetier.toLowerCase());
      const matchSearch = !rechercheTech.trim()
        || t.nom.toLowerCase().includes(rechercheTech.toLowerCase())
        || t.specialite.toLowerCase().includes(rechercheTech.toLowerCase())
        || (t.roleLabel && t.roleLabel.toLowerCase().includes(rechercheTech.toLowerCase()));
      return matchMetier && matchSearch;
    });
  }, [listeTechniciens, filtreMetier, rechercheTech]);

  /* ── Stats ──────────────────────────────────────────────────────────── */

  const stats = useMemo(() => ({
    ouvertes: plaintes.filter((p) => p.statut === 'OUVERTE').length,
    urgentes: plaintes.filter((p) => p.urgence === 'ELEVEE' && p.statut !== 'RESOLUE').length,
    planifiees: interventions.filter((i) => i.statut === 'PLANIFIEE').length,
    enCours: interventions.filter((i) => i.statut === 'EN_COURS').length,
    traitees: plaintes.filter((p) => p.statut === 'RESOLUE').length,
  }), [plaintes, interventions]);

  /* ── Filtres ─────────────────────────────────────────────────────────── */

  const lignesSignalements = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return plaintes
      .filter((p) => filtreStatutPlainte ? p.statut === filtreStatutPlainte : true)
      .filter((p) => !terme || (p.description || '').toLowerCase().includes(terme) || (p.local_reference || '').toLowerCase().includes(terme));
  }, [plaintes, filtreStatutPlainte, q]);

  const lignesActives = useMemo(() =>
    interventions.filter((i) => i.statut !== 'TERMINEE' && i.statut !== 'ANNULEE')
      .filter((i) => filtreStatutInterv ? i.statut === filtreStatutInterv : true),
    [interventions, filtreStatutInterv]);

  const lignesHistorique = useMemo(() =>
    interventions.filter((i) => i.statut === 'TERMINEE'),
    [interventions]);

  /* ── Actions ─────────────────────────────────────────────────────────── */

  const ouvrirModal = (plainte) => {
    const premierDispo = listeTechniciens.find((t) => t.disponible) || listeTechniciens[0];
    setForm({
      ...FORM_VIDE,
      local: plainte.local || '',
      plainte_source: plainte.id,
      technicien: premierDispo ? premierDispo.id : '',
      date_planifiee: new Date().toISOString().slice(0, 16),
      description: `Intervention suite au signalement : ${plainte.description || ''}`,
    });
    setFiltreMetier('TOUS');
    setRechercheTech('');
    setModalPlanifier(plainte);
  };

  const soumettrePlanification = async (e) => {
    e.preventDefault();
    if (!form.local || !form.technicien || !form.description.trim()) {
      toast.error('Local, technicien et description sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const selectedTech = listeTechniciens.find((t) => t.id === form.technicien) || listeTechniciens[0];
      const targetUserId = selectedTech?.backendId || techniciensRaw[0]?.id || form.technicien;

      await createIntervention({
        local: form.local,
        plainte_source: form.plainte_source || null,
        technicien: targetUserId,
        type_intervention: form.type_intervention,
        description: form.description,
        date_planifiee: form.date_planifiee,
      });
      if (form.plainte_source) {
        await updatePlainte(form.plainte_source, { statut: 'EN_COURS_TRAITEMENT' });
      }
      toast.success('Intervention planifiée avec succès ! Le technicien a été affecté.');
      setModalPlanifier(null);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la planification'));
    } finally {
      setSaving(false);
    }
  };

  const handleDemarrer = async (intervention) => {
    try {
      await demarrerIntervention(intervention.id);
      toast.success('Intervention démarrée !');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const handleAnnuler = async (intervention) => {
    if (!window.confirm('Confirmer l\'annulation de cette intervention ?')) return;
    try {
      await annulerIntervention(intervention.id);
      toast.success('Intervention annulée.');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const soumettreCloture = async (e) => {
    e.preventDefault();
    if (!rapport.trim()) { toast.error('Un rapport de clôture est requis.'); return; }
    setCloturing(true);
    try {
      await cloturerIntervention(modalCloturer.id, rapport);
      if (modalCloturer.plainte_source) {
        await updatePlainte(modalCloturer.plainte_source, { statut: 'RESOLUE' });
      }
      toast.success('Intervention clôturée ! Le signalement est marqué comme "Signalement traité".');
      setModalCloturer(null);
      setRapport('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setCloturing(false);
    }
  };

  /* ── Colonnes avec actions ───────────────────────────────────────────── */

  const colsSignalementsAvecAction = [
    ...COLS_SIGNALEMENTS,
    {
      key: '_action',
      label: 'Action',
      align: 'right',
      render: (r) => (
        <RowActions>
          {r.statut !== 'RESOLUE' && r.statut !== 'REJETEE' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => ouvrirModal(r)}
              id={`btn-planifier-${r.id}`}
              style={{ fontWeight: 700, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
            >
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 3 }} />
              Planifier
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  const colsIntervAvecAction = [
    ...COLS_INTERVENTIONS,
    {
      key: '_action',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          {r.statut === 'PLANIFIEE' && (
            <Button variant="primary" size="sm" onClick={() => handleDemarrer(r)} id={`btn-demarrer-${r.id}`} style={{ fontWeight: 700, borderRadius: 8, whiteSpace: 'nowrap' }}>
              <PlayArrowOutlinedIcon style={{ fontSize: 15, marginRight: 3 }} />
              Démarrer
            </Button>
          )}
          {r.statut === 'EN_COURS' && (
            <Button variant="success" size="sm" onClick={() => { setModalCloturer(r); setRapport(''); }} id={`btn-cloturer-${r.id}`} style={{ fontWeight: 700, borderRadius: 8, whiteSpace: 'nowrap' }}>
              <CheckCircleOutlinedIcon style={{ fontSize: 15, marginRight: 3 }} />
              Clôturer
            </Button>
          )}
          {(r.statut === 'PLANIFIEE') && (
            <Button variant="ghost" size="sm" onClick={() => handleAnnuler(r)} id={`btn-annuler-${r.id}`} style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>
              Annuler
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */

  const tabs = [
    { id: 'signalements', label: 'Signalements reçus', icon: <ReportProblemOutlinedIcon style={{ fontSize: 17 }} />, count: stats.ouvertes },
    { id: 'interventions', label: 'Interventions en cours', icon: <BuildOutlinedIcon style={{ fontSize: 17 }} />, count: stats.planifiees + stats.enCours },
    { id: 'historique', label: 'Historique & Traités', icon: <HistoryOutlinedIcon style={{ fontSize: 17 }} />, count: stats.traitees },
  ];

  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <PageHeader
        icon={<EngineeringOutlinedIcon style={{ fontSize: 26 }} />}
        title="Service Technique"
        subtitle="Pilotage des signalements occupants, affectation des techniciens qualifiés et suivi des chantiers"
        actions={
          <Button variant="secondary" onClick={charger} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <RefreshOutlinedIcon style={{ fontSize: 18 }} />
            Actualiser
          </Button>
        }
      />

      {/* Grille des KPIs 4 colonnes */}
      <StatGrid cols={4}>
        <KpiCard
          label="Signalements ouverts"
          value={stats.ouvertes}
          icon={<ReportProblemOutlinedIcon style={{ fontSize: 22 }} />}
          tone="red"
          sub="À affecter aux techniciens"
        />
        <KpiCard
          label="Urgences actives"
          value={stats.urgentes}
          icon={<WarningAmberOutlinedIcon style={{ fontSize: 22 }} />}
          tone="red"
          sub="Priorité immédiate"
        />
        <KpiCard
          label="Interventions planifiées"
          value={stats.planifiees}
          icon={<EventOutlinedIcon style={{ fontSize: 22 }} />}
          tone="gold"
          sub="En attente de démarrage"
        />
        <KpiCard
          label="En intervention"
          value={stats.enCours}
          icon={<BuildOutlinedIcon style={{ fontSize: 22 }} />}
          tone="navy"
          sub="Techniciens sur le terrain"
        />
      </StatGrid>

      {/* Barre d'onglets au design moderne */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '5px',
        background: 'var(--surface-2, #f1f5f9)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        {tabs.map((tab) => {
          const estActif = onglet === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setOnglet(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: estActif ? '#ffffff' : 'transparent',
                color: estActif ? 'var(--navy, #1e3a5f)' : 'var(--muted, #64748b)',
                boxShadow: estActif ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: estActif ? 800 : 600,
                transition: 'all .2s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  background: estActif ? 'var(--navy, #1e3a5f)' : 'rgba(100, 116, 139, 0.15)',
                  color: estActif ? '#ffffff' : 'var(--muted, #64748b)',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Onglet 1 - Signalements */}
      {onglet === 'signalements' && (
        <Panel
          icon={<ReportProblemOutlinedIcon style={{ fontSize: 20 }} />}
          title="Signalements techniques des occupants"
          subtitle="Sélectionnez un incident pour dépêcher un agent technicien qualifié (électricien, plombier, frigoriste...)"
          padded={false}
        >
          <FilterBar>
            <FilterField label="Recherche">
              <Input
                placeholder="Rechercher par local ou mot-clé..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 200 }}
              />
            </FilterField>
            <FilterField label="Statut">
              <Select value={filtreStatutPlainte} onChange={(e) => setFiltreStatutPlainte(e.target.value)}>
                <option value="">Tous les signalements</option>
                <option value="OUVERTE">Ouverts uniquement</option>
                <option value="EN_COURS_TRAITEMENT">En cours de traitement</option>
                <option value="RESOLUE">Signalements traités</option>
              </Select>
            </FilterField>
          </FilterBar>
          <DataTable
            columns={colsSignalementsAvecAction}
            rows={lignesSignalements}
            loading={loading}
            empty="Aucun signalement technique pour le moment."
            pageSize={10}
          />
        </Panel>
      )}

      {/* Onglet 2 - Interventions actives */}
      {onglet === 'interventions' && (
        <Panel
          icon={<BuildOutlinedIcon style={{ fontSize: 20 }} />}
          title="Interventions en cours sur le terrain"
          subtitle="Suivi opérationnel des missions confiées aux techniciens et clôture des chantiers"
          padded={false}
        >
          <FilterBar>
            <FilterField label="Statut">
              <Select value={filtreStatutInterv} onChange={(e) => setFiltreStatutInterv(e.target.value)}>
                <option value="">Toutes les interventions</option>
                <option value="PLANIFIEE">Planifiée (en attente)</option>
                <option value="EN_COURS">En cours sur le terrain</option>
              </Select>
            </FilterField>
          </FilterBar>
          <DataTable
            columns={colsIntervAvecAction}
            rows={lignesActives}
            loading={loading}
            empty="Aucune intervention active. Cliquez sur Planifier depuis les signalements pour en lancer une."
            pageSize={10}
          />
        </Panel>
      )}

      {/* Onglet 3 - Historique */}
      {onglet === 'historique' && (
        <Panel
          icon={<HistoryOutlinedIcon style={{ fontSize: 20 }} />}
          title="Historique des signalements traités"
          subtitle="Registre officiel de l'ensemble des interventions achevées et validées"
          padded={false}
        >
          <DataTable
            columns={COLS_HISTORIQUE}
            rows={lignesHistorique}
            loading={loading}
            empty="Aucune intervention enregistrée dans l'historique."
            pageSize={12}
          />
        </Panel>
      )}

      {/* ── Modal planification avec sélection visuelle des techniciens ───────────── */}
      <Modal
        open={!!modalPlanifier}
        onClose={() => setModalPlanifier(null)}
        title="Planifier l'intervention & Affecter un technicien"
        size="lg"
      >
        {modalPlanifier && (
          <form onSubmit={soumettrePlanification} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Résumé du signalement */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.06) 0%, rgba(201, 161, 92, 0.1) 100%)',
              border: '1.5px solid rgba(201, 161, 92, 0.3)',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-deep, #b48328)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Signalement occupant concerné
                </span>
                <Pill tone={URGENCE_TONE[modalPlanifier.urgence] || 'slate'}>
                  Urgence {modalPlanifier.urgence}
                </Pill>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1e3a5f)', lineHeight: 1.4 }}>
                {modalPlanifier.description}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 Local concerné : <strong style={{ color: 'var(--text-navy)' }}>{formatLocal(modalPlanifier.local_reference, modalPlanifier.local)}</strong>
              </span>
            </div>

            {/* Sélecteur visuel d'agents techniciens */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-navy, #1e3a5f)', display: 'block' }}>
                    Sélectionner un technicien qualifié *
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Choisissez l'agent spécialiste disponible pour exécuter la mission
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 700, background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 20 }}>
                  {techniciensFiltres.length} profil(s)
                </span>
              </div>

              {/* Filtres par corps de métier */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {CORPS_METIERS.map((m) => {
                  const Icone = m.icone;
                  const actif = filtreMetier === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFiltreMetier(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 20,
                        border: actif ? '1.5px solid var(--navy, #1e3a5f)' : '1px solid var(--border)',
                        background: actif ? 'var(--navy, #1e3a5f)' : 'var(--surface-2, #f8fafc)',
                        color: actif ? '#ffffff' : 'var(--text, #334155)',
                        fontSize: 12.5, fontWeight: actif ? 700 : 500,
                        cursor: 'pointer', transition: 'all .15s ease',
                      }}
                    >
                      <Icone style={{ fontSize: 15, color: actif ? 'var(--gold, #c9a15c)' : 'inherit' }} />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Grille des cartes techniciens */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
                maxHeight: 290,
                overflowY: 'auto',
                padding: 3,
              }}>
                {techniciensFiltres.map((t) => {
                  const estChoisi = form.technicien === t.id;
                  return (
                    <div
                      key={t.id}
                      data-testid={`technicien-card-${t.id}`}
                      onClick={() => setForm((f) => ({ ...f, technicien: t.id }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        border: estChoisi
                          ? '2px solid var(--gold-deep, #b48328)'
                          : '1px solid var(--border)',
                        background: estChoisi
                          ? 'linear-gradient(135deg, rgba(201, 161, 92, 0.15) 0%, rgba(201, 161, 92, 0.05) 100%)'
                          : 'var(--surface, #ffffff)',
                        boxShadow: estChoisi ? '0 4px 14px rgba(201, 161, 92, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: estChoisi ? 'scale(1.01)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {/* Photo / Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {t.avatar && (
                          <img
                            src={t.avatar}
                            alt={t.nom}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'grid';
                            }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `2.5px solid ${estChoisi ? 'var(--gold-deep, #b48328)' : 'var(--border)'}`,
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: t.avatar ? 'none' : 'grid',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'var(--navy)',
                            color: '#fff',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                          }}
                        >
                          {t.nom.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Pastille de disponibilité */}
                        <span
                          title={t.disponible ? 'Disponible' : 'En mission'}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            background: t.disponible ? '#16a34a' : '#f59e0b',
                            border: '2px solid #ffffff',
                            boxShadow: '0 0 6px rgba(0,0,0,0.2)',
                          }}
                        />
                      </div>

                      {/* Infos technicien */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy, #1e3a5f)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.nom}
                          </span>
                          {estChoisi && (
                            <span style={{
                              background: 'var(--gold-deep, #b48328)', color: '#fff',
                              borderRadius: '50%', width: 20, height: 20, display: 'grid', placeItems: 'center',
                              boxShadow: '0 2px 6px rgba(180, 131, 40, 0.4)',
                            }}>
                              <CheckOutlinedIcon style={{ fontSize: 13 }} />
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-deep, #b48328)', marginTop: 1 }}>
                          {t.specialite}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: 4,
                            background: t.disponible ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                            color: t.disponible ? '#15803d' : '#b45309',
                          }}>
                            {t.disponible ? '● Disponible' : '● En mission'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {t.telephone}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Type d'intervention *">
                <Select
                  value={form.type_intervention}
                  onChange={(e) => setForm((f) => ({ ...f, type_intervention: e.target.value }))}
                >
                  <option value="CURATIVE">Curative (réparation / dépannage)</option>
                  <option value="PREVENTIVE">Préventive (maintenance)</option>
                  <option value="URGENCE">Urgence absolue</option>
                </Select>
              </Field>

              <Field label="Date & Heure planifiée *">
                <Input
                  type="datetime-local"
                  value={form.date_planifiee}
                  onChange={(e) => setForm((f) => ({ ...f, date_planifiee: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field label="Description & Directives pour le technicien *">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Détaillez les travaux à effectuer..."
                required
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="ghost" type="button" onClick={() => setModalPlanifier(null)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={saving || !form.technicien} style={{ fontWeight: 800, padding: '10px 24px' }}>
                {saving ? 'Planification en cours...' : 'Confirmer la planification'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal clôture ─────────────────────────────────────────────────── */}
      <Modal
        open={!!modalCloturer}
        onClose={() => setModalCloturer(null)}
        title="Clôturer l'intervention & Marquer comme traité"
      >
        {modalCloturer && (
          <form onSubmit={soumettreCloture} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--surface-2, #f8fafc)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 18px',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
                {modalCloturer.description}
              </span>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                📍 Local : <strong>{formatLocal(modalCloturer.local_reference, modalCloturer.local)}</strong> — Technicien : <strong>{modalCloturer.technicien_nom || '-'}</strong>
              </div>
            </div>

            <Field label="Rapport d'intervention technique *" hint="Le signalement de l'occupant passera automatiquement à l'état Traité.">
              <Textarea
                value={rapport}
                onChange={(e) => setRapport(e.target.value)}
                rows={4}
                placeholder="Décrivez les travaux réalisés, les réparations effectuées et confirmez le bon fonctionnement..."
                required
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="ghost" type="button" onClick={() => setModalCloturer(null)}>Annuler</Button>
              <Button variant="success" type="submit" disabled={cloturing} style={{ fontWeight: 700, padding: '10px 20px' }}>
                {cloturing ? 'Validation...' : 'Valider & Marquer comme traité'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
