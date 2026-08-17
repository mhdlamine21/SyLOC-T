import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getInterventions, createIntervention, demarrerIntervention,
  cloturerIntervention, annulerIntervention, getStatistiquesMaintenance, getPlaintes,
} from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, ProgressRow, SplitLayout,
} from '../common/dashboard';
import {
  STATUTS_INTERVENTION_LABELS, TYPES_INTERVENTION,
} from '../../utils/constants';

const STATUT_TONE = {
  PLANIFIEE: 'gold', EN_COURS: 'navy', TERMINEE: 'green', ANNULEE: 'slate',
};
const TYPE_TONE = { PREVENTIVE: 'slate', CURATIVE: 'navy', URGENCE: 'red' };

const FORMULAIRE_VIDE = {
  local: '', type_intervention: 'CURATIVE', description: '',
  date_planifiee: '', plainte_source: '',
};

/**
 * Console de maintenance du Service Technique (Phase 5) : planification,
 * execution et cloture des interventions.
 */
export default function MaintenanceTechnique() {
  const [interventions, setInterventions] = useState([]);
  const [stats, setStats] = useState(null);
  const [locaux, setLocaux] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);
  const [cloture, setCloture] = useState(null);
  const [rapport, setRapport] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const [iv, st, lx, pl] = await Promise.all([
        getInterventions(), getStatistiquesMaintenance(), getLocaux(), getPlaintes(),
      ]);
      setInterventions(toArray(iv));
      setStats(st);
      setLocaux(toArray(lx));
      setPlaintes(toArray(pl).filter((p) => p.statut !== 'RESOLUE'));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement des interventions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const kpis = useMemo(() => {
    const parStatut = stats?.par_statut || {};
    return {
      total: stats?.total ?? interventions.length,
      planifiees: parStatut.PLANIFIEE ?? interventions.filter((i) => i.statut === 'PLANIFIEE').length,
      enCours: parStatut.EN_COURS ?? interventions.filter((i) => i.statut === 'EN_COURS').length,
      terminees: parStatut.TERMINEE ?? interventions.filter((i) => i.statut === 'TERMINEE').length,
      delai: stats?.delai_moyen_jours ?? 0,
    };
  }, [stats, interventions]);

  const rows = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return interventions
      .filter((i) => (statut ? i.statut === statut : true))
      .filter((i) => (type ? i.type_intervention === type : true))
      .filter((i) => !terme
        || (i.description || '').toLowerCase().includes(terme)
        || (i.local_reference || '').toLowerCase().includes(terme)
        || (i.technicien_nom || '').toLowerCase().includes(terme))
      .sort((a, b) => new Date(b.date_planifiee) - new Date(a.date_planifiee));
  }, [interventions, q, statut, type]);

  const soumettre = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    try {
      await createIntervention({
        ...form,
        plainte_source: form.plainte_source || null,
        date_planifiee: new Date(form.date_planifiee).toISOString(),
      });
      toast.success('Intervention planifiee.');
      setModalOuvert(false);
      setForm(FORMULAIRE_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Planification impossible.'));
    } finally {
      setEnregistrement(false);
    }
  };

  const executer = async (action, id, succes) => {
    try {
      await action(id);
      toast.success(succes);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Action impossible.'));
    }
  };

  const validerCloture = async () => {
    if (!rapport.trim()) {
      toast.error("Le rapport d'intervention est obligatoire.");
      return;
    }
    try {
      await cloturerIntervention(cloture.id, rapport.trim());
      toast.success('Intervention cloturee. Le signalement lie est resolu.');
      setCloture(null);
      setRapport('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Cloture impossible.'));
    }
  };

  const colonnes = [
    {
      key: 'local',
      label: 'Local concerne',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || 'Local'}
          subtitle={(r.description || '').slice(0, 48)}
          initials="MT"
          tone={TYPE_TONE[r.type_intervention] || 'navy'}
        />
      ),
    },
    {
      key: 'type_intervention',
      label: 'Type',
      render: (r) => <Pill tone={TYPE_TONE[r.type_intervention] || 'slate'}>{r.type_intervention}</Pill>,
    },
    { key: 'technicien_nom', label: 'Technicien', render: (r) => r.technicien_nom || '-' },
    {
      key: 'date_planifiee',
      label: 'Planifiee le',
      render: (r) => (r.date_planifiee ? new Date(r.date_planifiee).toLocaleDateString('fr-FR') : '-'),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Pill tone={STATUT_TONE[r.statut] || 'slate'}>
          {STATUTS_INTERVENTION_LABELS[r.statut] || r.statut}
        </Pill>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton
            title="Demarrer l'intervention"
            tone="navy"
            disabled={r.statut !== 'PLANIFIEE'}
            onClick={() => executer(demarrerIntervention, r.id, 'Intervention demarree.')}
          >
            ▶
          </IconButton>
          <IconButton
            title="Cloturer et rapporter"
            tone="green"
            disabled={r.statut === 'TERMINEE' || r.statut === 'ANNULEE'}
            onClick={() => { setCloture(r); setRapport(r.rapport || ''); }}
          >
            ✓
          </IconButton>
          <IconButton
            title="Annuler l'intervention"
            tone="red"
            disabled={r.statut === 'TERMINEE' || r.statut === 'ANNULEE'}
            onClick={() => executer(annulerIntervention, r.id, 'Intervention annulee.')}
          >
            ⛔
          </IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<BuildOutlinedIcon style={{ fontSize: 20 }} />}
        title="Maintenance technique"
        subtitle="Planification des interventions preventives et curatives et cloture des signalements."
        actions={(
          <>
            <Button variant="secondary" onClick={charger}>↻ Actualiser</Button>
            <Button onClick={() => setModalOuvert(true)}>+ Planifier une intervention</Button>
          </>
        )}
      />

      <StatGrid cols={3}>
        <KpiCard icon={<CalendarMonthOutlinedIcon style={{ fontSize: 20 }} />} label="Interventions planifiees" value={kpis.planifiees} sub={`${kpis.total} au total`} tone="gold" />
        <KpiCard icon={<HandymanOutlinedIcon style={{ fontSize: 20 }} />} label="En cours" value={kpis.enCours} sub="Chantiers ouverts" tone="navy" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Terminees" value={kpis.terminees} sub={`Delai moyen ${kpis.delai} j`} tone="green" />
      </StatGrid>

      <SplitLayout>
        <Panel icon={<BuildOutlinedIcon style={{ fontSize: 20 }} />} title="Registre des interventions" subtitle={`${rows.length} intervention(s) affichee(s)`}>
          <FilterBar onReset={() => { setQ(''); setStatut(''); setType(''); }}>
            <FilterField label="Recherche">
              <Input placeholder="Local, description…" value={q} onChange={(e) => setQ(e.target.value)} />
            </FilterField>
            <FilterField label="Statut">
              <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="">Tous</option>
                {Object.entries(STATUTS_INTERVENTION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous</option>
                {TYPES_INTERVENTION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FilterField>
          </FilterBar>

          <DataTable
            columns={colonnes}
            rows={rows}
            loading={loading}
            empty="Aucune intervention enregistree."
            emptyIcon={<BuildOutlinedIcon style={{ fontSize: 44 }} />}
            pageSize={10}
          />
        </Panel>

        <Panel icon={<BarChartOutlinedIcon style={{ fontSize: 20 }} />} title="Repartition par type">
          {TYPES_INTERVENTION.map((t) => (
            <ProgressRow
              key={t.value}
              label={t.label}
              value={stats?.par_type?.[t.value] ?? interventions.filter((i) => i.type_intervention === t.value).length}
              total={kpis.total}
              tone={TYPE_TONE[t.value] === 'red' ? 'red' : 'navy'}
            />
          ))}
          <ProgressRow label="Taux d'achevement" value={kpis.terminees} total={kpis.total} tone="green" />
        </Panel>
      </SplitLayout>

      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Planifier une intervention" size="lg">
        <form onSubmit={soumettre}>
          <Field label="Local concerne" required>
            <Select required value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}>
              <option value="">Selectionner un local</option>
              {locaux.map((l) => (
                <option key={l.id} value={l.id}>{l.reference} - {l.designation || l.type_local}</option>
              ))}
            </Select>
          </Field>
          <Field label="Type d'intervention" required>
            <Select value={form.type_intervention} onChange={(e) => setForm({ ...form, type_intervention: e.target.value })}>
              {TYPES_INTERVENTION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Description des travaux" required>
            <Textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Date planifiee" required>
            <Input
              required
              type="datetime-local"
              value={form.date_planifiee}
              onChange={(e) => setForm({ ...form, date_planifiee: e.target.value })}
            />
          </Field>
          <Field label="Signalement a l'origine (optionnel)" hint="La cloture de l'intervention resoudra automatiquement ce signalement.">
            <Select value={form.plainte_source} onChange={(e) => setForm({ ...form, plainte_source: e.target.value })}>
              <option value="">Aucun</option>
              {plaintes.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.type || '').replace(/_/g, ' ')} - {(p.description || '').slice(0, 40)}
                </option>
              ))}
            </Select>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOuvert(false)}>Annuler</Button>
            <Button type="submit" disabled={enregistrement}>
              {enregistrement ? 'Enregistrement…' : 'Planifier'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!cloture}
        onClose={() => { setCloture(null); setRapport(''); }}
        title="Cloturer l'intervention"
      >
        <Field label="Rapport d'intervention" required>
          <Textarea rows={5} value={rapport} onChange={(e) => setRapport(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="secondary" onClick={() => { setCloture(null); setRapport(''); }}>Annuler</Button>
          <Button onClick={validerCloture}>Cloturer l'intervention</Button>
        </div>
      </Modal>
    </div>
  );
}
