import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getSanctions, updateSanction, getInspections, getPlaintes } from '../../api/terrain';
import { messageErreur } from '../../api/utils';
import { Button, Input, Select } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, Tabs,
} from '../common/dashboard';

const NIVEAU_TONE = {
  AVERTISSEMENT: 'gold', RAPPEL_A_L_ORDRE: 'gold', CONVOCATION: 'red', EXPULSION: 'red',
};

/**
 * Bureau Environnement / QHSE : sanctions disciplinaires, inspections realisees
 * et non-conformites signalees, dans une meme console.
 */
export default function BureauEnvironnementView() {
  const [tab, setTab] = useState('sanctions');
  const [sanctions, setSanctions] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [niveau, setNiveau] = useState('');
  const [etat, setEtat] = useState('ACTIVES');

  const charger = async () => {
    setLoading(true);
    try {
      const [s, i, p] = await Promise.all([getSanctions(), getInspections(), getPlaintes()]);
      setSanctions(s); setInspections(i); setPlaintes(p);
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement du bureau QHSE.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const agir = async (id, patch, msg) => {
    try {
      await updateSanction(id, patch);
      toast.success(msg);
      charger();
    } catch (e) {
      toast.error(messageErreur(e, 'Action impossible.'));
    }
  };

  const stats = useMemo(() => ({
    actives: sanctions.filter((s) => s.statut_sanction !== 'LEVEE').length,
    levees: sanctions.filter((s) => s.statut_sanction === 'LEVEE').length,
    convocations: sanctions.filter((s) => s.niveau === 'CONVOCATION' && s.statut_sanction !== 'LEVEE').length,
    expulsions: sanctions.filter((s) => s.niveau === 'EXPULSION').length,
    inspections: inspections.length,
    nonConformes: inspections.filter((i) => i.est_conforme === false).length,
    qhse: plaintes.filter((p) => p.type === 'NON_CONFORMITE_QHSE' && p.statut !== 'RESOLUE').length,
    noteMoy: inspections.filter((i) => i.note_sanitaire != null).length
      ? (inspections.filter((i) => i.note_sanitaire != null)
        .reduce((s, i) => s + Number(i.note_sanitaire), 0)
        / inspections.filter((i) => i.note_sanitaire != null).length).toFixed(1)
      : '—',
  }), [sanctions, inspections, plaintes]);

  const rowsSanctions = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sanctions
      .filter((s) => (etat === 'ACTIVES' ? s.statut_sanction !== 'LEVEE' : etat === 'LEVEES' ? s.statut_sanction === 'LEVEE' : true))
      .filter((s) => (niveau ? s.niveau === niveau : true))
      .filter((s) => !term || (s.motif || '').toLowerCase().includes(term) || String(s.local_reference || s.local || '').toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date_application) - new Date(a.date_application));
  }, [sanctions, q, niveau, etat]);

  const colonnesSanctions = [
    {
      key: 'local',
      label: 'Local sanctionne',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || r.local || 'Local non precise'}
          subtitle={`SAC-${String(r.id).slice(0, 8).toUpperCase()}`}
          initials="⚠"
          tone={NIVEAU_TONE[r.niveau] === 'red' ? 'red' : 'gold'}
        />
      ),
    },
    { key: 'niveau', label: 'Niveau', render: (r) => <Pill tone={NIVEAU_TONE[r.niveau] || 'slate'}>{(r.niveau || '').replace(/_/g, ' ')}</Pill> },
    { key: 'motif', label: 'Motif', render: (r) => <span title={r.motif}>{(r.motif || '—').slice(0, 70)}</span> },
    {
      key: 'date_application',
      label: 'Prononcee le',
      render: (r) => (r.date_application ? new Date(r.date_application).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'statut_sanction',
      label: 'Etat',
      render: (r) => <Pill tone={r.statut_sanction === 'LEVEE' ? 'green' : 'red'}>{r.statut_sanction}</Pill>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton
            title="Lever la sanction"
            tone="green"
            disabled={r.statut_sanction === 'LEVEE'}
            onClick={() => agir(r.id, { statut_sanction: 'LEVEE', date_levee: new Date().toISOString() }, 'Sanction levee apres contre-inspection.')}
          >
            ✓
          </IconButton>
          <IconButton
            title="Escalader en convocation"
            tone="gold"
            disabled={r.niveau === 'CONVOCATION' || r.niveau === 'EXPULSION' || r.statut_sanction === 'LEVEE'}
            onClick={() => agir(r.id, { niveau: 'CONVOCATION' }, 'Convocation emise aupres de la Direction.')}
          >
            📢
          </IconButton>
          <IconButton
            title="Proposer une expulsion"
            tone="red"
            disabled={r.niveau === 'EXPULSION' || r.statut_sanction === 'LEVEE'}
            onClick={() => agir(r.id, { niveau: 'EXPULSION' }, 'Procedure d\u2019expulsion proposee a la Direction.')}
          >
            ⛔
          </IconButton>
        </RowActions>
      ),
    },
  ];

  const colonnesInspections = [
    {
      key: 'local',
      label: 'Local inspecte',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || r.local || 'Local'}
          subtitle={(r.type_controle || '').replace(/_/g, ' ')}
          initials="🔬"
          tone={r.est_conforme ? 'green' : 'red'}
        />
      ),
    },
    { key: 'date_visite', label: 'Date de visite', render: (r) => (r.date_visite ? new Date(r.date_visite).toLocaleDateString('fr-FR') : '—') },
    { key: 'note_sanitaire', label: 'Note', align: 'right', render: (r) => (r.note_sanitaire != null ? `${r.note_sanitaire}/20` : '—') },
    { key: 'est_conforme', label: 'Conformite', render: (r) => <Pill tone={r.est_conforme ? 'green' : 'red'}>{r.est_conforme ? 'Conforme' : 'Non conforme'}</Pill> },
    { key: 'observations', label: 'Observations', render: (r) => (r.observations || '—').slice(0, 60) },
  ];

  const colonnesPlaintes = [
    { key: 'type', label: 'Type', render: (r) => <Pill tone="gold">{(r.type || '').replace(/_/g, ' ')}</Pill> },
    { key: 'localisation_libre', label: 'Localisation', render: (r) => r.localisation_libre || r.local_reference || '—' },
    { key: 'description', label: 'Description', render: (r) => (r.description || '—').slice(0, 70) },
    { key: 'urgence', label: 'Urgence', render: (r) => <Pill tone={r.urgence === 'ELEVEE' ? 'red' : r.urgence === 'MOYENNE' ? 'gold' : 'slate'}>{r.urgence}</Pill> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={r.statut === 'RESOLUE' ? 'green' : 'red'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
  ];

  return (
    <div>
      <PageHeader
        icon="🔬"
        title="Bureau environnement, hygiene & securite"
        subtitle="Suivi des non-conformites sanitaires, prononce et levee des sanctions disciplinaires."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon="⚠️" label="Sanctions actives" value={stats.actives} sub={`${stats.levees} levee(s)`} tone="red" />
        <KpiCard icon="📢" label="Convocations" value={stats.convocations} sub={`${stats.expulsions} expulsion(s)`} tone="gold" />
        <KpiCard icon="🔬" label="Inspections" value={stats.inspections} sub={`${stats.nonConformes} non conforme(s)`} tone="navy" />
        <KpiCard icon="🧪" label="Note sanitaire moyenne" value={stats.noteMoy} sub={`${stats.qhse} non-conformites signalees`} tone="green" />
      </StatGrid>

      <Panel padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: 'sanctions', label: `Sanctions (${rowsSanctions.length})`, icon: '⚠️' },
              { key: 'inspections', label: `Inspections (${inspections.length})`, icon: '🔬' },
              { key: 'plaintes', label: `Non-conformites (${plaintes.length})`, icon: '📣' },
            ]}
          />

          {tab === 'sanctions' && (
            <FilterBar onReset={() => { setQ(''); setNiveau(''); setEtat('ACTIVES'); }}>
              <FilterField label="Recherche">
                <Input placeholder="Motif, local…" value={q} onChange={(e) => setQ(e.target.value)} />
              </FilterField>
              <FilterField label="Niveau">
                <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                  <option value="">Tous</option>
                  <option value="AVERTISSEMENT">Avertissement</option>
                  <option value="RAPPEL_A_L_ORDRE">Rappel a l&apos;ordre</option>
                  <option value="CONVOCATION">Convocation</option>
                  <option value="EXPULSION">Expulsion</option>
                </Select>
              </FilterField>
              <FilterField label="Etat">
                <Select value={etat} onChange={(e) => setEtat(e.target.value)}>
                  <option value="ACTIVES">Actives</option>
                  <option value="LEVEES">Levees</option>
                  <option value="TOUTES">Toutes</option>
                </Select>
              </FilterField>
            </FilterBar>
          )}
        </div>

        {tab === 'sanctions' && (
          <DataTable columns={colonnesSanctions} rows={rowsSanctions} loading={loading} empty="Aucune sanction pour ce filtre." pageSize={10} dense />
        )}
        {tab === 'inspections' && (
          <DataTable columns={colonnesInspections} rows={inspections} loading={loading} empty="Aucune inspection enregistree." pageSize={10} dense />
        )}
        {tab === 'plaintes' && (
          <DataTable columns={colonnesPlaintes} rows={plaintes} loading={loading} empty="Aucune non-conformite signalee." pageSize={10} dense />
        )}
      </Panel>
    </div>
  );
}
