import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  getInspections, createInspection,
  getSanctions, createSanction,
  getOrdresMission, demarrerOrdreMission, cloturerOrdreMission,
  getRapportsVisite, creerRapportVisite, transmettreRapportVisite,
} from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField,
  DataTable, Pill, RowActions,
} from '../common/dashboard';
import { TYPES_CONTROLE_QHSE } from '../../utils/constants';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const CONTR_TONE = { SANITAIRE: 'green', TECHNIQUE: 'navy', ELECTRIQUE: 'gold', OCCUPATION: 'slate' };
const NIVEAU_TONE = { AVERTISSEMENT: 'gold', RAPPEL_A_L_ORDRE: 'gold', CONVOCATION: 'red', EXPULSION: 'red' };
const STATUT_MISSION_TONE = { EMIS: 'gold', EN_COURS: 'navy', EXECUTE: 'green', ANNULE: 'slate' };
const STATUT_RAPPORT_TONE = { BROUILLON: 'slate', TRANSMIS: 'gold', VALIDE: 'green' };
const STATUT_RAPPORT_LABEL = { BROUILLON: 'Brouillon', TRANSMIS: 'Transmis', VALIDE: 'Validé' };

const dateCourte = (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '-';

const FORM_INSP_VIDE = {
  local: '',
  type_controle: 'SANITAIRE',
  date_visite: new Date().toISOString().slice(0, 16),
  est_conforme: 'true',
  note_sanitaire: '',
  observations: '',
};

const FORM_RAPPORT_VIDE = {
  local: '',
  type_controle: 'OCCUPATION',
  commission_destinataire: 'COMMISSION_ENVIRONNEMENT',
  date_visite: new Date().toISOString().slice(0, 16),
  conforme: 'true',
  note_globale: '',
  constats: '',
  recommandations: '',
};

const FORM_SANCTION_VIDE = {
  local: '',
  niveau: 'AVERTISSEMENT',
  motif: '',
};

/* ── Colonnes ────────────────────────────────────────────────────────────── */

const COLS_INSP = [
  { key: 'local_reference', label: 'Local', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{r.local_reference || r.local || '-'}</span> },
  { key: 'type_controle', label: 'Type', render: (r) => <Pill tone={CONTR_TONE[r.type_controle] || 'slate'}>{r.type_controle}</Pill> },
  { key: 'est_conforme', label: 'Conformité', render: (r) => <Pill tone={r.est_conforme ? 'green' : 'red'}>{r.est_conforme ? 'Conforme' : 'Non conforme'}</Pill> },
  { key: 'note_sanitaire', label: 'Note', render: (r) => <span style={{ fontSize: 13, fontWeight: 700 }}>{r.note_sanitaire != null ? `${r.note_sanitaire}/10` : '-'}</span> },
  { key: 'date_visite', label: 'Date', render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_visite)}</span> },
];

const COLS_RAPPORTS = [
  { key: 'reference', label: 'Référence', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{r.reference || '-'}</span> },
  { key: 'local_reference', label: 'Local', render: (r) => <span style={{ fontSize: 12.5 }}>{r.local_reference || r.local || '-'}</span> },
  { key: 'type_controle', label: 'Type', render: (r) => <Pill tone={CONTR_TONE[r.type_controle] || 'slate'}>{r.type_controle}</Pill> },
  { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_RAPPORT_TONE[r.statut] || 'slate'}>{STATUT_RAPPORT_LABEL[r.statut] || r.statut}</Pill> },
  { key: 'date_visite', label: 'Date visite', render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_visite)}</span> },
];

const COLS_SANCTIONS = [
  { key: 'local_reference', label: 'Local', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{r.local_reference || r.local || '-'}</span> },
  { key: 'niveau', label: 'Niveau', render: (r) => <Pill tone={NIVEAU_TONE[r.niveau] || 'slate'}>{(r.niveau || '').replace(/_/g, ' ')}</Pill> },
  { key: 'statut_sanction', label: 'Statut', render: (r) => <Pill tone={r.statut_sanction === 'LEVEE' ? 'green' : 'red'}>{r.statut_sanction === 'LEVEE' ? 'Levée' : 'Active'}</Pill> },
  { key: 'motif', label: 'Motif', render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motif || '-'}</span> },
  { key: 'date_application', label: 'Date', render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_application)}</span> },
];

const COLS_MISSIONS = [
  { key: 'reference', label: 'Référence', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{r.reference || '-'}</span> },
  { key: 'objet', label: 'Objet', render: (r) => <span style={{ fontSize: 12.5, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.objet}</span> },
  { key: 'agent_nom', label: 'Agent assigné', render: (r) => <span style={{ fontSize: 12.5 }}>{r.agent_nom || '-'}</span> },
  { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_MISSION_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
  { key: 'date_mission', label: 'Date', render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_mission)}</span> },
];

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function AgentQHSEView() {
  const [onglet, setOnglet] = useState('inspections');
  const [inspections, setInspections] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);

  /* modals */
  const [modalInsp, setModalInsp] = useState(false);
  const [formInsp, setFormInsp] = useState(FORM_INSP_VIDE);
  const [modalRapport, setModalRapport] = useState(false);
  const [formRapport, setFormRapport] = useState(FORM_RAPPORT_VIDE);
  const [modalSanction, setModalSanction] = useState(false);
  const [formSanction, setFormSanction] = useState(FORM_SANCTION_VIDE);
  const [modalCloturer, setModalCloturer] = useState(null);
  const [compteRendu, setCompteRendu] = useState('');
  const [saving, setSaving] = useState(false);

  /* filtres */
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatutRapport, setFiltreStatutRapport] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [insp, rap, sanc, miss, lx] = await Promise.all([
        getInspections().catch(() => []),
        getRapportsVisite().catch(() => []),
        getSanctions().catch(() => []),
        getOrdresMission().catch(() => []),
        getLocaux().catch(() => []),
      ]);
      setInspections(toArray(insp));
      setRapports(toArray(rap));
      setSanctions(toArray(sanc));
      setMissions(toArray(miss));
      setLocaux(toArray(lx));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  /* ── Stats ──────────────────────────────────────────────────────────── */

  const stats = useMemo(() => ({
    inspections: inspections.length,
    nonConformes: inspections.filter((i) => i.est_conforme === false).length,
    rapportsBrouillon: rapports.filter((r) => r.statut === 'BROUILLON').length,
    sanctionsActives: sanctions.filter((s) => s.statut_sanction !== 'LEVEE').length,
  }), [inspections, rapports, sanctions]);

  /* ── Données filtrées ────────────────────────────────────────────────── */

  const inspFiltrees = useMemo(() =>
    inspections.filter((i) => filtreType ? i.type_controle === filtreType : true),
    [inspections, filtreType]);

  const rapportsFiltres = useMemo(() =>
    rapports.filter((r) => filtreStatutRapport ? r.statut === filtreStatutRapport : true),
    [rapports, filtreStatutRapport]);

  /* ── Actions ─────────────────────────────────────────────────────────── */

  const soumettreInspection = async (e) => {
    e.preventDefault();
    if (!formInsp.local || !formInsp.observations.trim()) {
      toast.error('Local et observations sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await createInspection({
        ...formInsp,
        est_conforme: formInsp.est_conforme === 'true',
        note_sanitaire: formInsp.note_sanitaire !== '' ? Number(formInsp.note_sanitaire) : null,
      });
      toast.success('Inspection enregistrée !');
      setModalInsp(false);
      setFormInsp(FORM_INSP_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer l'inspection."));
    } finally {
      setSaving(false);
    }
  };

  const soumettreRapport = async (e) => {
    e.preventDefault();
    if (!formRapport.local || !formRapport.constats.trim()) {
      toast.error('Local et constats sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await creerRapportVisite({
        ...formRapport,
        conforme: formRapport.conforme === 'true',
        note_globale: formRapport.note_globale !== '' ? Number(formRapport.note_globale) : null,
      });
      toast.success('Rapport de visite enregistré.');
      setModalRapport(false);
      setFormRapport(FORM_RAPPORT_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer le rapport."));
    } finally {
      setSaving(false);
    }
  };

  const soumettreSanction = async (e) => {
    e.preventDefault();
    if (!formSanction.local || !formSanction.motif.trim()) {
      toast.error('Local et motif sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await createSanction(formSanction);
      toast.success('Sanction émise !');
      setModalSanction(false);
      setFormSanction(FORM_SANCTION_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'émettre la sanction."));
    } finally {
      setSaving(false);
    }
  };

  const handleTransmettre = async (rapport) => {
    if (rapport.statut !== 'BROUILLON') return;
    try {
      await transmettreRapportVisite(rapport.id);
      toast.success('Rapport transmis à la commission !');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const handleDemarrerMission = async (mission) => {
    try {
      await demarrerOrdreMission(mission.id);
      toast.success('Mission démarrée !');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const soumettreCloturer = async (e) => {
    e.preventDefault();
    if (!compteRendu.trim()) { toast.error('Un compte rendu est requis.'); return; }
    setSaving(true);
    try {
      await cloturerOrdreMission(modalCloturer.id, compteRendu);
      toast.success('Mission clôturée !');
      setModalCloturer(null);
      setCompteRendu('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Colonnes avec actions ───────────────────────────────────────────── */

  const colsRapportsAction = [
    ...COLS_RAPPORTS,
    {
      key: '_action',
      label: '',
      render: (r) => (
        <RowActions>
          {r.statut === 'BROUILLON' && (
            <Button variant="primary" size="sm" onClick={() => handleTransmettre(r)} id={`btn-transmettre-${r.id}`}>
              <SendOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
              Transmettre
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  const colsMissionsAction = [
    ...COLS_MISSIONS,
    {
      key: '_action',
      label: '',
      render: (r) => (
        <RowActions>
          {r.statut === 'EMIS' && (
            <Button variant="primary" size="sm" onClick={() => handleDemarrerMission(r)} id={`btn-dem-${r.id}`}>
              <PlayArrowOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
              Démarrer
            </Button>
          )}
          {r.statut === 'EN_COURS' && (
            <Button variant="success" size="sm" onClick={() => { setModalCloturer(r); setCompteRendu(''); }} id={`btn-clo-${r.id}`}>
              <CheckCircleOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
              Clôturer
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  /* ── Onglets ─────────────────────────────────────────────────────────── */

  const tabs = [
    { id: 'inspections', label: 'Inspections', icon: <ScienceOutlinedIcon style={{ fontSize: 16 }} />, count: stats.nonConformes },
    { id: 'rapports', label: 'Rapports de visite', icon: <AssignmentOutlinedIcon style={{ fontSize: 16 }} />, count: stats.rapportsBrouillon },
    { id: 'sanctions', label: 'Sanctions', icon: <GavelOutlinedIcon style={{ fontSize: 16 }} />, count: stats.sanctionsActives },
    { id: 'missions', label: 'Ordres de mission', icon: <ExploreOutlinedIcon style={{ fontSize: 16 }} /> },
  ];

  const selStyle = { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--font-display)', outline: 'none' };

  const localOptions = locaux.map((l) => (
    <option key={l.id} value={l.id}>{l.reference} - {l.localisation || l.type_local}</option>
  ));

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <PageHeader
        icon={<BiotechOutlinedIcon style={{ fontSize: 26 }} />}
        title="Espace Agent QHSE"
        subtitle="Inspections sanitaires, rapports de visite, sanctions et ordres de mission"
      />

      <StatGrid>
        <KpiCard label="Inspections réalisées" value={stats.inspections} icon={<ScienceOutlinedIcon style={{ fontSize: 22 }} />} tone="navy" />
        <KpiCard label="Non conformités" value={stats.nonConformes} icon={<WarningAmberOutlinedIcon style={{ fontSize: 22 }} />} tone="red" />
        <KpiCard label="Rapports à transmettre" value={stats.rapportsBrouillon} icon={<SendOutlinedIcon style={{ fontSize: 22 }} />} tone="gold" />
        <KpiCard label="Sanctions actives" value={stats.sanctionsActives} icon={<GavelOutlinedIcon style={{ fontSize: 22 }} />} tone="red" />
      </StatGrid>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-qhse-${tab.id}`}
            onClick={() => setOnglet(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
              color: onglet === tab.id ? 'var(--navy, #1e3a5f)' : 'var(--muted)',
              borderBottom: onglet === tab.id ? '2.5px solid var(--navy, #1e3a5f)' : '2.5px solid transparent',
              marginBottom: -2, transition: 'all .15s',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span style={{
                background: onglet === tab.id ? 'var(--navy)' : 'var(--border)',
                color: onglet === tab.id ? 'var(--text-on-navy)' : 'var(--muted)',
                borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet 1 : Inspections ── */}
      {onglet === 'inspections' && (
        <Panel
          icon={<ScienceOutlinedIcon style={{ fontSize: 20 }} />}
          title="Inspections QHSE"
          subtitle="Contrôles sanitaires, techniques, électriques et d'occupation"
          padded={false}
          action={
            <Button variant="primary" size="sm" onClick={() => setModalInsp(true)} id="btn-new-inspection">
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} /> Nouvelle inspection
            </Button>
          }
        >
          <FilterBar>
            <FilterField label="Type de contrôle">
              <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} style={selStyle}>
                <option value="">Tous</option>
                {TYPES_CONTROLE_QHSE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FilterField>
          </FilterBar>
          <DataTable columns={COLS_INSP} rows={inspFiltrees} loading={loading} empty="Aucune inspection enregistrée." pageSize={10} />
        </Panel>
      )}

      {/* ── Onglet 2 : Rapports de visite ── */}
      {onglet === 'rapports' && (
        <Panel
          icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />}
          title="Rapports de visite terrain"
          subtitle="Cadence réglementaire de 10 jours par local"
          padded={false}
          action={
            <Button variant="primary" size="sm" onClick={() => setModalRapport(true)} id="btn-new-rapport">
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} /> Nouveau rapport
            </Button>
          }
        >
          <FilterBar>
            <FilterField label="Statut">
              <select value={filtreStatutRapport} onChange={(e) => setFiltreStatutRapport(e.target.value)} style={selStyle}>
                <option value="">Tous</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="TRANSMIS">Transmis</option>
                <option value="VALIDE">Validé</option>
              </select>
            </FilterField>
          </FilterBar>
          <DataTable columns={colsRapportsAction} rows={rapportsFiltres} loading={loading} empty="Aucun rapport de visite rédigé." pageSize={10} />
        </Panel>
      )}

      {/* ── Onglet 3 : Sanctions ── */}
      {onglet === 'sanctions' && (
        <Panel
          icon={<GavelOutlinedIcon style={{ fontSize: 20 }} />}
          title="Sanctions & constats"
          subtitle="Sanctions émises suite aux contrôles et inspections"
          padded={false}
          action={
            <Button variant="danger" size="sm" onClick={() => setModalSanction(true)} id="btn-new-sanction">
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} /> Émettre une sanction
            </Button>
          }
        >
          <DataTable columns={COLS_SANCTIONS} rows={sanctions} loading={loading} empty="Aucune sanction enregistrée." pageSize={10} />
        </Panel>
      )}

      {/* ── Onglet 4 : Ordres de mission ── */}
      {onglet === 'missions' && (
        <Panel
          icon={<ExploreOutlinedIcon style={{ fontSize: 20 }} />}
          title="Ordres de mission"
          subtitle="Missions terrain émises ou reçues"
          padded={false}
        >
          <DataTable columns={colsMissionsAction} rows={missions} loading={loading} empty="Aucun ordre de mission." pageSize={10} />
        </Panel>
      )}

      {/* ── Modal inspection ─────────────────────────────────────────────── */}
      <Modal open={modalInsp} onClose={() => setModalInsp(false)} title="Nouvelle inspection QHSE">
        <form onSubmit={soumettreInspection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Local *">
            <Select value={formInsp.local} onChange={(e) => setFormInsp((f) => ({ ...f, local: e.target.value }))} required>
              <option value="">Choisir un local…</option>
              {localOptions}
            </Select>
          </Field>
          <Field label="Type de contrôle *">
            <Select value={formInsp.type_controle} onChange={(e) => setFormInsp((f) => ({ ...f, type_controle: e.target.value }))}>
              {TYPES_CONTROLE_QHSE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Date de visite *">
              <Input type="datetime-local" value={formInsp.date_visite} onChange={(e) => setFormInsp((f) => ({ ...f, date_visite: e.target.value }))} required />
            </Field>
            <Field label="Note sanitaire (0-10)">
              <Input type="number" min={0} max={10} value={formInsp.note_sanitaire} onChange={(e) => setFormInsp((f) => ({ ...f, note_sanitaire: e.target.value }))} placeholder="Ex: 7" />
            </Field>
          </div>
          <Field label="Résultat">
            <Select value={formInsp.est_conforme} onChange={(e) => setFormInsp((f) => ({ ...f, est_conforme: e.target.value }))}>
              <option value="true">Conforme</option>
              <option value="false">Non conforme</option>
            </Select>
          </Field>
          <Field label="Observations *">
            <Textarea value={formInsp.observations} onChange={(e) => setFormInsp((f) => ({ ...f, observations: e.target.value }))} rows={3} placeholder="Décrivez les constats observés lors du contrôle…" required />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setModalInsp(false)}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer l\'inspection'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal rapport de visite ───────────────────────────────────────── */}
      <Modal open={modalRapport} onClose={() => setModalRapport(false)} title="Nouveau rapport de visite">
        <form onSubmit={soumettreRapport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Local *">
            <Select value={formRapport.local} onChange={(e) => setFormRapport((f) => ({ ...f, local: e.target.value }))} required>
              <option value="">Choisir un local…</option>
              {localOptions}
            </Select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type de contrôle *">
              <Select value={formRapport.type_controle} onChange={(e) => setFormRapport((f) => ({ ...f, type_controle: e.target.value }))}>
                {TYPES_CONTROLE_QHSE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Commission destinataire *">
              <Select value={formRapport.commission_destinataire} onChange={(e) => setFormRapport((f) => ({ ...f, commission_destinataire: e.target.value }))}>
                <option value="COMMISSION_ENVIRONNEMENT">Commission environnement</option>
                <option value="COMMISSION_TECHNIQUE">Commission technique</option>
                <option value="COMMISSION_EVALUATION">Commission d'évaluation</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Date de visite *">
              <Input type="datetime-local" value={formRapport.date_visite} onChange={(e) => setFormRapport((f) => ({ ...f, date_visite: e.target.value }))} required />
            </Field>
            <Field label="Note globale (0-10)">
              <Input type="number" min={0} max={10} value={formRapport.note_globale} onChange={(e) => setFormRapport((f) => ({ ...f, note_globale: e.target.value }))} placeholder="Ex: 8" />
            </Field>
          </div>
          <Field label="Conformité">
            <Select value={formRapport.conforme} onChange={(e) => setFormRapport((f) => ({ ...f, conforme: e.target.value }))}>
              <option value="true">Conforme</option>
              <option value="false">Non conforme</option>
            </Select>
          </Field>
          <Field label="Constats *">
            <Textarea value={formRapport.constats} onChange={(e) => setFormRapport((f) => ({ ...f, constats: e.target.value }))} rows={3} placeholder="Décrivez les constats de la visite…" required />
          </Field>
          <Field label="Recommandations">
            <Textarea value={formRapport.recommandations} onChange={(e) => setFormRapport((f) => ({ ...f, recommandations: e.target.value }))} rows={2} placeholder="Actions correctives recommandées…" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setModalRapport(false)}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le rapport'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal sanction ────────────────────────────────────────────────── */}
      <Modal open={modalSanction} onClose={() => setModalSanction(false)} title="Émettre une sanction">
        <form onSubmit={soumettreSanction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Local concerné *">
            <Select value={formSanction.local} onChange={(e) => setFormSanction((f) => ({ ...f, local: e.target.value }))} required>
              <option value="">Choisir un local…</option>
              {localOptions}
            </Select>
          </Field>
          <Field label="Niveau de sanction *">
            <Select value={formSanction.niveau} onChange={(e) => setFormSanction((f) => ({ ...f, niveau: e.target.value }))}>
              <option value="AVERTISSEMENT">Avertissement</option>
              <option value="RAPPEL_A_L_ORDRE">Rappel à l'ordre</option>
              <option value="CONVOCATION">Convocation</option>
              <option value="EXPULSION">Expulsion</option>
            </Select>
          </Field>
          <Field label="Motif *">
            <Textarea value={formSanction.motif} onChange={(e) => setFormSanction((f) => ({ ...f, motif: e.target.value }))} rows={3} placeholder="Expliquez le motif de la sanction…" required />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setModalSanction(false)}>Annuler</Button>
            <Button variant="danger" type="submit" disabled={saving}>{saving ? 'Émission…' : 'Émettre la sanction'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal clôture mission ─────────────────────────────────────────── */}
      <Modal open={!!modalCloturer} onClose={() => setModalCloturer(null)} title="Clôturer l'ordre de mission">
        {modalCloturer && (
          <form onSubmit={soumettreCloturer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)' }}>{modalCloturer.reference} - {modalCloturer.objet}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Local : {modalCloturer.local_reference || '-'} - Agent : {modalCloturer.agent_nom || '-'}</div>
            </div>
            <Field label="Compte rendu de la mission *">
              <Textarea value={compteRendu} onChange={(e) => setCompteRendu(e.target.value)} rows={4} placeholder="Décrivez les actions réalisées…" required />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setModalCloturer(null)}>Annuler</Button>
              <Button variant="success" type="submit" disabled={saving}>{saving ? 'Clôture…' : 'Valider la clôture'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
