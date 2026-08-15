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
const STATUT_PLAINTE_LABEL = { OUVERTE: 'Ouverte', EN_COURS_TRAITEMENT: 'En traitement', RESOLUE: 'Résolue', REJETEE: 'Rejetée' };
const STATUT_INTERV_TONE = { PLANIFIEE: 'slate', EN_COURS: 'gold', TERMINEE: 'green', ANNULEE: 'red' };
const STATUT_INTERV_LABEL = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
const TYPE_INTERV_LABEL = { PREVENTIVE: 'Préventive', CURATIVE: 'Curative', URGENCE: 'Urgence' };

const fmt = (n) => n ? `${Number(n).toLocaleString('fr-FR')} FCFA` : '—';
const dateCourte = (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '—';

const FORM_VIDE = {
  local: '',
  plainte_source: '',
  technicien: '',
  type_intervention: 'CURATIVE',
  description: '',
  date_planifiee: new Date().toISOString().slice(0, 16),
  cout_estime: '',
};

/* ── Colonnes tableau signalements ──────────────────────────────────────── */

const COLS_SIGNALEMENTS = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
        {r.local_reference || r.local || '—'}
      </span>
    ),
  },
  {
    key: 'description',
    label: 'Description',
    render: (r) => (
      <span style={{ fontSize: 12.5, maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {r.description}
      </span>
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
    render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_creation)}</span>,
  },
];

/* ── Colonnes tableau interventions ─────────────────────────────────────── */

const COLS_INTERVENTIONS = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
        {r.local_reference || r.local || '—'}
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
      <span style={{ fontSize: 12.5 }}>{r.technicien_nom || '—'}</span>
    ),
  },
  {
    key: 'statut',
    label: 'Statut',
    render: (r) => <Pill tone={STATUT_INTERV_TONE[r.statut] || 'slate'}>{STATUT_INTERV_LABEL[r.statut] || r.statut}</Pill>,
  },
  {
    key: 'date_planifiee',
    label: 'Date planifiée',
    render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{dateCourte(r.date_planifiee)}</span>,
  },
  {
    key: 'cout_estime',
    label: 'Coût estimé',
    render: (r) => <span style={{ fontSize: 12 }}>{fmt(r.cout_estime)}</span>,
  },
];

/* ── Colonnes tableau historique ────────────────────────────────────────── */

const COLS_HISTORIQUE = [
  {
    key: 'local_reference',
    label: 'Local',
    render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
        {r.local_reference || r.local || '—'}
      </span>
    ),
  },
  {
    key: 'technicien_nom',
    label: 'Technicien',
    render: (r) => <span style={{ fontSize: 12.5 }}>{r.technicien_nom || '—'}</span>,
  },
  {
    key: 'date_realisation',
    label: 'Réalisée le',
    render: (r) => <span style={{ fontSize: 12 }}>{dateCourte(r.date_realisation)}</span>,
  },
  {
    key: 'cout_reel',
    label: 'Coût réel',
    render: (r) => <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(r.cout_reel)}</span>,
  },
  {
    key: 'rapport',
    label: 'Rapport',
    render: (r) => (
      <span style={{ fontSize: 12, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
        {r.rapport || '—'}
      </span>
    ),
  },
];

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function ServiceTechniqueView() {
  const [onglet, setOnglet] = useState('signalements');
  const [plaintes, setPlaintes] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);

  /* filtres */
  const [filtreStatutPlainte, setFiltreStatutPlainte] = useState('');
  const [filtreStatutInterv, setFiltreStatutInterv] = useState('');
  const [q, setQ] = useState('');

  /* modal planification */
  const [modalPlanifier, setModalPlanifier] = useState(null); // plainte source
  const [form, setForm] = useState(FORM_VIDE);
  const [saving, setSaving] = useState(false);

  /* modal clôture */
  const [modalCloturer, setModalCloturer] = useState(null); // intervention
  const [rapport, setRapport] = useState('');
  const [coutReel, setCoutReel] = useState('');
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
      setTechniciens(toArray(us));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  /* ── Stats ──────────────────────────────────────────────────────────── */

  const stats = useMemo(() => ({
    ouvertes: plaintes.filter((p) => p.statut === 'OUVERTE').length,
    urgentes: plaintes.filter((p) => p.urgence === 'ELEVEE' && p.statut !== 'RESOLUE').length,
    planifiees: interventions.filter((i) => i.statut === 'PLANIFIEE').length,
    enCours: interventions.filter((i) => i.statut === 'EN_COURS').length,
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
    setForm({
      ...FORM_VIDE,
      local: plainte.local || '',
      plainte_source: plainte.id,
      date_planifiee: new Date().toISOString().slice(0, 16),
    });
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
      await createIntervention({
        local: form.local,
        plainte_source: form.plainte_source || null,
        technicien: form.technicien,
        type_intervention: form.type_intervention,
        description: form.description,
        date_planifiee: form.date_planifiee,
        ...(form.cout_estime ? { cout_estime: Number(form.cout_estime) } : {}),
      });
      if (form.plainte_source) {
        await updatePlainte(form.plainte_source, { statut: 'EN_COURS_TRAITEMENT' });
      }
      toast.success('Intervention planifiée ! Le signalement est passé en cours de traitement.');
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
      await cloturerIntervention(modalCloturer.id, rapport, coutReel);
      if (modalCloturer.plainte_source) {
        await updatePlainte(modalCloturer.plainte_source, { statut: 'RESOLUE' });
      }
      toast.success('Intervention clôturée ! Le signalement est marqué comme résolu.');
      setModalCloturer(null);
      setRapport('');
      setCoutReel('');
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
      label: '',
      render: (r) => (
        <RowActions>
          {r.statut !== 'RESOLUE' && r.statut !== 'REJETEE' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => ouvrirModal(r)}
              id={`btn-planifier-${r.id}`}
            >
              <AddOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
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
      label: '',
      render: (r) => (
        <RowActions>
          {r.statut === 'PLANIFIEE' && (
            <Button variant="primary" size="sm" onClick={() => handleDemarrer(r)} id={`btn-demarrer-${r.id}`}>
              <PlayArrowOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
              Démarrer
            </Button>
          )}
          {r.statut === 'EN_COURS' && (
            <Button variant="success" size="sm" onClick={() => { setModalCloturer(r); setRapport(''); setCoutReel(''); }} id={`btn-cloturer-${r.id}`}>
              <CheckCircleOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
              Clôturer
            </Button>
          )}
          {(r.statut === 'PLANIFIEE') && (
            <Button variant="ghost" size="sm" onClick={() => handleAnnuler(r)} id={`btn-annuler-${r.id}`}>
              Annuler
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */

  const tabs = [
    { id: 'signalements', label: 'Signalements', icon: <ReportProblemOutlinedIcon style={{ fontSize: 16 }} />, count: stats.ouvertes },
    { id: 'interventions', label: 'Interventions', icon: <BuildOutlinedIcon style={{ fontSize: 16 }} />, count: stats.planifiees + stats.enCours },
    { id: 'historique', label: 'Historique', icon: <HistoryOutlinedIcon style={{ fontSize: 16 }} /> },
  ];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <PageHeader
        icon={<EngineeringOutlinedIcon style={{ fontSize: 26 }} />}
        title="Service Technique"
        subtitle="Signalements techniques des occupants — planification et suivi des interventions"
      />

      <StatGrid>
        <KpiCard
          label="Signalements ouverts"
          value={stats.ouvertes}
          icon={<ReportProblemOutlinedIcon style={{ fontSize: 22 }} />}
          tone="red"
        />
        <KpiCard
          label="Urgences actives"
          value={stats.urgentes}
          icon={<WarningAmberOutlinedIcon style={{ fontSize: 22 }} />}
          tone="red"
        />
        <KpiCard
          label="Interventions planifiées"
          value={stats.planifiees}
          icon={<EventOutlinedIcon style={{ fontSize: 22 }} />}
          tone="gold"
        />
        <KpiCard
          label="En cours"
          value={stats.enCours}
          icon={<BuildOutlinedIcon style={{ fontSize: 22 }} />}
          tone="navy"
        />
      </StatGrid>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
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
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                background: onglet === tab.id ? 'var(--navy, #1e3a5f)' : 'var(--border)',
                color: onglet === tab.id ? '#fff' : 'var(--muted)',
                borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Onglet 1 — Signalements */}
      {onglet === 'signalements' && (
        <Panel
          icon={<ReportProblemOutlinedIcon style={{ fontSize: 20 }} />}
          title="Signalements techniques"
          subtitle="Signalements de type technique déposés par les occupants"
          padded={false}
        >
          <FilterBar>
            <FilterField label="Recherche">
              <Input
                placeholder="Local ou description..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 200 }}
              />
            </FilterField>
            <FilterField label="Statut">
              <Select value={filtreStatutPlainte} onChange={(e) => setFiltreStatutPlainte(e.target.value)}>
                <option value="">Tous</option>
                <option value="OUVERTE">Ouverts</option>
                <option value="EN_COURS_TRAITEMENT">En traitement</option>
                <option value="RESOLUE">Résolus</option>
              </Select>
            </FilterField>
          </FilterBar>
          <DataTable
            columns={colsSignalementsAvecAction}
            rows={lignesSignalements}
            loading={loading}
            empty="Aucun signalement technique."
            pageSize={10}
          />
        </Panel>
      )}

      {/* Onglet 2 — Interventions actives */}
      {onglet === 'interventions' && (
        <Panel
          icon={<BuildOutlinedIcon style={{ fontSize: 20 }} />}
          title="Interventions en cours"
          subtitle="Planification et suivi des interventions de maintenance"
          padded={false}
        >
          <FilterBar>
            <FilterField label="Statut">
              <Select value={filtreStatutInterv} onChange={(e) => setFiltreStatutInterv(e.target.value)}>
                <option value="">Tous</option>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En cours</option>
              </Select>
            </FilterField>
          </FilterBar>
          <DataTable
            columns={colsIntervAvecAction}
            rows={lignesActives}
            loading={loading}
            empty="Aucune intervention active. Planifiez depuis les signalements."
            pageSize={10}
          />
        </Panel>
      )}

      {/* Onglet 3 — Historique */}
      {onglet === 'historique' && (
        <Panel
          icon={<HistoryOutlinedIcon style={{ fontSize: 20 }} />}
          title="Historique des interventions"
          subtitle="Interventions terminées"
          padded={false}
        >
          <DataTable
            columns={COLS_HISTORIQUE}
            rows={lignesHistorique}
            loading={loading}
            empty="Aucune intervention terminée."
            pageSize={12}
          />
        </Panel>
      )}

      {/* ── Modal planification ───────────────────────────────────────────── */}
      <Modal
        open={!!modalPlanifier}
        onClose={() => setModalPlanifier(null)}
        title="Planifier une intervention"
      >
        {modalPlanifier && (
          <form onSubmit={soumettrePlanification} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Résumé du signalement */}
            <div style={{
              background: 'var(--surface-2, #f8fafc)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Signalement source
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy, #1e3a5f)' }}>
                {modalPlanifier.description}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Local : {modalPlanifier.local_reference || modalPlanifier.local || '—'} — Urgence : {modalPlanifier.urgence}
              </span>
            </div>

            <Field label="Technicien assigné *">
              <Select
                value={form.technicien}
                onChange={(e) => setForm((f) => ({ ...f, technicien: e.target.value }))}
                required
              >
                <option value="">Choisir un technicien...</option>
                {techniciens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom_complet || t.username}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Type d'intervention *">
              <Select
                value={form.type_intervention}
                onChange={(e) => setForm((f) => ({ ...f, type_intervention: e.target.value }))}
              >
                <option value="CURATIVE">Curative (réparation)</option>
                <option value="PREVENTIVE">Préventive</option>
                <option value="URGENCE">Urgence</option>
              </Select>
            </Field>

            <Field label="Description de la mission *">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Détaillez les travaux à effectuer..."
                required
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Date planifiée *">
                <Input
                  type="datetime-local"
                  value={form.date_planifiee}
                  onChange={(e) => setForm((f) => ({ ...f, date_planifiee: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Coût estimé (FCFA)">
                <Input
                  type="number"
                  value={form.cout_estime}
                  onChange={(e) => setForm((f) => ({ ...f, cout_estime: e.target.value }))}
                  placeholder="Ex: 50000"
                  min={0}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="ghost" type="button" onClick={() => setModalPlanifier(null)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Planification...' : 'Confirmer la planification'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal clôture ─────────────────────────────────────────────────── */}
      <Modal
        open={!!modalCloturer}
        onClose={() => setModalCloturer(null)}
        title="Clôturer l'intervention"
      >
        {modalCloturer && (
          <form onSubmit={soumettreCloture} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'var(--surface-2, #f8fafc)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '12px 16px',
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy, #1e3a5f)' }}>
                {modalCloturer.description}
              </span>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Local : {modalCloturer.local_reference || '—'} — Technicien : {modalCloturer.technicien_nom || '—'}
              </div>
            </div>

            <Field label="Rapport de clôture *">
              <Textarea
                value={rapport}
                onChange={(e) => setRapport(e.target.value)}
                rows={4}
                placeholder="Décrivez les travaux effectués, les pièces remplacées..."
                required
              />
            </Field>

            <Field label="Coût réel (FCFA)">
              <Input
                type="number"
                value={coutReel}
                onChange={(e) => setCoutReel(e.target.value)}
                placeholder="Montant réel dépensé"
                min={0}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="ghost" type="button" onClick={() => setModalCloturer(null)}>Annuler</Button>
              <Button variant="success" type="submit" disabled={cloturing}>
                {cloturing ? 'Clôture...' : 'Valider la clôture'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
