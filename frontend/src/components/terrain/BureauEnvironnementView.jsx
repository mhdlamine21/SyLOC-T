import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getSanctions, updateSanction, createSanction,
  getInspections, getPlaintes,
  getOrdresMission, createOrdreMission,
} from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, Tabs,
} from '../common/dashboard';

const NIVEAU_TONE = {
  AVERTISSEMENT: 'gold', RAPPEL_A_L_ORDRE: 'gold', CONVOCATION: 'red', EXPULSION: 'red',
};
const STATUT_MISSION_TONE = { EMIS: 'gold', EN_COURS: 'navy', EXECUTE: 'green', ANNULE: 'slate' };

const FORM_SANCTION_VIDE = { local: '', niveau: 'AVERTISSEMENT', motif: '' };
const FORM_MISSION_VIDE = { local: '', objet: '', agent_nom: 'Ibrahima Fall (Agent QHSE)' };

/**
 * Bureau Environnement & Salubrité :
 * Console de supervision QHSE pour le suivi des non-conformités,
 * l'émission des ordres de mission et le prononcé des sanctions.
 */
export default function BureauEnvironnementView() {
  const [tab, setTab] = useState('sanctions');
  const [sanctions, setSanctions] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [missions, setMissions] = useState([]);
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filtres & Recherche */
  const [q, setQ] = useState('');
  const [niveau, setNiveau] = useState('');
  const [etat, setEtat] = useState('ACTIVES');

  /* Modales */
  const [modalSanction, setModalSanction] = useState(false);
  const [formSanction, setFormSanction] = useState(FORM_SANCTION_VIDE);
  const [modalMission, setModalMission] = useState(false);
  const [formMission, setFormMission] = useState(FORM_MISSION_VIDE);

  const charger = async () => {
    setLoading(true);
    try {
      const [s, i, p, m, lx] = await Promise.all([
        getSanctions().catch(() => []),
        getInspections().catch(() => []),
        getPlaintes().catch(() => []),
        getOrdresMission().catch(() => []),
        getLocaux().catch(() => []),
      ]);
      setSanctions(toArray(s));
      setInspections(toArray(i).filter((ins) => ins.type_controle === 'SANITAIRE' || ins.type_controle === 'OCCUPATION'));
      setPlaintes(toArray(p));
      setMissions(toArray(m));
      setLocaux(toArray(lx));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement du Bureau Environnement.'));
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

  const soumettreSanction = async (e) => {
    e.preventDefault();
    if (!formSanction.local || !formSanction.motif.trim()) {
      toast.error('Veuillez sélectionner un local et indiquer le motif.');
      return;
    }
    setSaving(true);
    try {
      await createSanction(formSanction);
      toast.success('Sanction administrative notifiée.');
      setModalSanction(false);
      setFormSanction(FORM_SANCTION_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Impossible de créer la sanction.'));
    } finally {
      setSaving(false);
    }
  };

  const soumettreMission = async (e) => {
    e.preventDefault();
    if (!formMission.local || !formMission.objet.trim()) {
      toast.error('Veuillez sélectionner un local et décrire l’objet de la mission.');
      return;
    }
    setSaving(true);
    try {
      await createOrdreMission({
        ...formMission,
        statut: 'EMIS',
      });
      toast.success('Ordre de mission QHSE émis et assigné.');
      setModalMission(false);
      setFormMission(FORM_MISSION_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'émettre l'ordre de mission."));
    } finally {
      setSaving(false);
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
    missionsEnCours: missions.filter((m) => m.statut === 'EN_COURS' || m.statut === 'EMIS').length,
    noteMoy: inspections.filter((i) => i.note_sanitaire != null).length
      ? (inspections.filter((i) => i.note_sanitaire != null)
        .reduce((s, i) => s + Number(i.note_sanitaire), 0)
        / inspections.filter((i) => i.note_sanitaire != null).length).toFixed(1)
      : '-',
  }), [sanctions, inspections, plaintes, missions]);

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
      label: 'Local sanctionné',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || r.local || 'Local non précisé'}
          subtitle={`SAC-${String(r.id).slice(0, 8).toUpperCase()}`}
          initials="⚠️"
          tone={NIVEAU_TONE[r.niveau] === 'red' ? 'red' : 'gold'}
        />
      ),
    },
    { key: 'niveau', label: 'Niveau', render: (r) => <Pill tone={NIVEAU_TONE[r.niveau] || 'slate'}>{(r.niveau || '').replace(/_/g, ' ')}</Pill> },
    { key: 'motif', label: 'Motif', render: (r) => <span title={r.motif}>{(r.motif || '-').slice(0, 70)}</span> },
    {
      key: 'date_application',
      label: 'Prononcée le',
      render: (r) => (r.date_application ? new Date(r.date_application).toLocaleDateString('fr-FR') : '-'),
    },
    {
      key: 'statut_sanction',
      label: 'État',
      render: (r) => <Pill tone={r.statut_sanction === 'LEVEE' ? 'green' : 'red'}>{r.statut_sanction === 'LEVEE' ? 'Levée' : 'Active'}</Pill>,
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
            onClick={() => agir(r.id, { statut_sanction: 'LEVEE', date_levee: new Date().toISOString() }, 'Sanction levée après contre-inspection.')}
          >
            ✓
          </IconButton>
          <IconButton
            title="Escalader en convocation"
            tone="gold"
            disabled={r.niveau === 'CONVOCATION' || r.niveau === 'EXPULSION' || r.statut_sanction === 'LEVEE'}
            onClick={() => agir(r.id, { niveau: 'CONVOCATION' }, 'Convocation émise auprès de la Direction.')}
          >
            ⚖️
          </IconButton>
          <IconButton
            title="Proposer une expulsion"
            tone="red"
            disabled={r.niveau === 'EXPULSION' || r.statut_sanction === 'LEVEE'}
            onClick={() => agir(r.id, { niveau: 'EXPULSION' }, 'Procédure d’expulsion proposée à la Direction.')}
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
      label: 'Local inspecté',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || r.local || 'Local'}
          subtitle={(r.type_controle || '').replace(/_/g, ' ')}
          initials="BE"
          tone={r.est_conforme ? 'green' : 'red'}
        />
      ),
    },
    { key: 'date_visite', label: 'Date de visite', render: (r) => (r.date_visite ? new Date(r.date_visite).toLocaleDateString('fr-FR') : '-') },
    { key: 'note_sanitaire', label: 'Note QHSE', align: 'right', render: (r) => (r.note_sanitaire != null ? `${r.note_sanitaire}/10` : '-') },
    { key: 'est_conforme', label: 'Conformité', render: (r) => <Pill tone={r.est_conforme ? 'green' : 'red'}>{r.est_conforme ? 'Conforme' : 'Non conforme'}</Pill> },
    { key: 'observations', label: 'Observations', render: (r) => (r.observations || '-').slice(0, 60) },
  ];

  const colonnesMissions = [
    {
      key: 'reference',
      label: 'Ordre de mission',
      render: (r) => (
        <IdentityCell
          title={r.reference || 'OM-QHSE'}
          subtitle={r.agent_nom || 'Agent QHSE'}
          initials="📋"
          tone="navy"
        />
      ),
    },
    { key: 'local_reference', label: 'Local', render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.local_reference || r.local || '-'}</span> },
    { key: 'objet', label: 'Objet de la mission', render: (r) => <span>{r.objet}</span> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_MISSION_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    { key: 'date_mission', label: 'Date', render: (r) => (r.date_mission ? new Date(r.date_mission).toLocaleDateString('fr-FR') : '-') },
  ];

  const colonnesPlaintes = [
    { key: 'type', label: 'Type', render: (r) => <Pill tone="gold">{(r.type || '').replace(/_/g, ' ')}</Pill> },
    { key: 'localisation_libre', label: 'Localisation', render: (r) => r.localisation_libre || r.local_reference || '-' },
    { key: 'description', label: 'Description', render: (r) => (r.description || '-').slice(0, 70) },
    { key: 'urgence', label: 'Urgence', render: (r) => <Pill tone={r.urgence === 'ELEVEE' ? 'red' : r.urgence === 'MOYENNE' ? 'gold' : 'slate'}>{r.urgence}</Pill> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={r.statut === 'RESOLUE' ? 'green' : 'red'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
  ];

  const localOptions = locaux.map((l) => (
    <option key={l.id} value={l.id}>{l.reference} - {l.localisation || l.type_local}</option>
  ));

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <PageHeader
        icon={<BiotechOutlinedIcon style={{ fontSize: 26 }} />}
        title="Bureau Environnement, Hygiène & Sécurité"
        subtitle="Supervision de la salubrité du campus, émission d'ordres de mission et sanctions administratives."
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={charger}>↻ Actualiser</Button>
            <Button variant="danger" size="sm" onClick={() => setModalSanction(true)}>
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} /> Émettre une sanction
            </Button>
            <Button variant="amber" size="sm" onClick={() => setModalMission(true)}>
              <AddOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} /> Assigner une mission
            </Button>
          </div>
        }
      />

      <StatGrid cols={4}>
        <KpiCard icon={<WarningAmberOutlinedIcon style={{ fontSize: 22 }} />} label="Sanctions actives" value={stats.actives} sub={`${stats.levees} levée(s)`} tone="red" />
        <KpiCard icon={<CampaignOutlinedIcon style={{ fontSize: 22 }} />} label="Convocations" value={stats.convocations} sub={`${stats.expulsions} expulsion(s)`} tone="gold" />
        <KpiCard icon={<ExploreOutlinedIcon style={{ fontSize: 22 }} />} label="Missions actives" value={stats.missionsEnCours} sub={`${missions.length} au total`} tone="navy" />
        <KpiCard icon={<ScienceOutlinedIcon style={{ fontSize: 22 }} />} label="Note moyenne QHSE" value={`${stats.noteMoy}/10`} sub={`${stats.inspections} contrôle(s) réalisés`} tone="green" />
      </StatGrid>

      <Panel padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: 'sanctions', label: `Sanctions (${rowsSanctions.length})`, icon: '⚠️' },
              { key: 'missions', label: `Ordres de mission (${missions.length})`, icon: <ExploreOutlinedIcon style={{ fontSize: 18 }} /> },
              { key: 'inspections', label: `Inspections (${inspections.length})`, icon: <BiotechOutlinedIcon style={{ fontSize: 18 }} /> },
              { key: 'plaintes', label: `Non-conformités (${plaintes.length})`, icon: <CampaignOutlinedIcon style={{ fontSize: 18 }} /> },
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
                  <option value="RAPPEL_A_L_ORDRE">Rappel à l'ordre</option>
                  <option value="CONVOCATION">Convocation</option>
                  <option value="EXPULSION">Expulsion</option>
                </Select>
              </FilterField>
              <FilterField label="État">
                <Select value={etat} onChange={(e) => setEtat(e.target.value)}>
                  <option value="ACTIVES">Actives</option>
                  <option value="LEVEES">Levées</option>
                  <option value="TOUTES">Toutes</option>
                </Select>
              </FilterField>
            </FilterBar>
          )}
        </div>

        {tab === 'sanctions' && (
          <DataTable columns={colonnesSanctions} rows={rowsSanctions} loading={loading} empty="Aucune sanction pour ce filtre." pageSize={10} dense />
        )}
        {tab === 'missions' && (
          <DataTable columns={colonnesMissions} rows={missions} loading={loading} empty="Aucun ordre de mission émis." pageSize={10} dense />
        )}
        {tab === 'inspections' && (
          <DataTable columns={colonnesInspections} rows={inspections} loading={loading} empty="Aucune inspection enregistrée." pageSize={10} dense />
        )}
        {tab === 'plaintes' && (
          <DataTable columns={colonnesPlaintes} rows={plaintes} loading={loading} empty="Aucune non-conformité signalée." pageSize={10} dense />
        )}
      </Panel>

      {/* Modale d'émission de sanction */}
      {modalSanction && (
        <Modal open onClose={() => setModalSanction(false)} title="⚖️ Émettre une sanction administrative">
          <form onSubmit={soumettreSanction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Local concerné *" required>
              <Select value={formSanction.local} onChange={(e) => setFormSanction({ ...formSanction, local: e.target.value })} required>
                <option value="">-- Choisir un local --</option>
                {localOptions}
              </Select>
            </Field>
            <Field label="Niveau de gravité *" required>
              <Select value={formSanction.niveau} onChange={(e) => setFormSanction({ ...formSanction, niveau: e.target.value })}>
                <option value="AVERTISSEMENT">Avertissement</option>
                <option value="RAPPEL_A_L_ORDRE">Rappel à l'ordre</option>
                <option value="CONVOCATION">Convocation devant la commission</option>
                <option value="EXPULSION">Proposition d'expulsion / résiliation</option>
              </Select>
            </Field>
            <Field label="Motif détaillé de l'infraction *" required>
              <Textarea
                rows={4}
                required
                value={formSanction.motif}
                onChange={(e) => setFormSanction({ ...formSanction, motif: e.target.value })}
                placeholder="Ex. Manquement grave aux normes d'hygiène alimentaire et rupture de la chaîne du froid."
              />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setModalSanction(false)}>Annuler</Button>
              <Button variant="danger" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Notifier la sanction'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale d'assignation d'ordre de mission */}
      {modalMission && (
        <Modal open onClose={() => setModalMission(false)} title="📋 Assigner un ordre de mission QHSE">
          <form onSubmit={soumettreMission} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Local cible *" required>
              <Select value={formMission.local} onChange={(e) => setFormMission({ ...formMission, local: e.target.value })} required>
                <option value="">-- Choisir un local --</option>
                {localOptions}
              </Select>
            </Field>
            <Field label="Agent QHSE assigné *" required>
              <Input
                type="text"
                required
                value={formMission.agent_nom}
                onChange={(e) => setFormMission({ ...formMission, agent_nom: e.target.value })}
                placeholder="Ex. Ibrahima Fall (Agent QHSE)"
              />
            </Field>
            <Field label="Objet du contrôle sanitaire *" required>
              <Textarea
                rows={3}
                required
                value={formMission.objet}
                onChange={(e) => setFormMission({ ...formMission, objet: e.target.value })}
                placeholder="Ex. Contrôle inopiné de la chaîne du froid et de la conformité des denrées alimentaires."
              />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setModalMission(false)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={saving}>
                {saving ? 'Assignation…' : 'Émettre l’ordre de mission'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


