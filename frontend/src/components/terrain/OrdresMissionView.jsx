import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getOrdresMission, createOrdreMission, demarrerOrdreMission,
  cloturerOrdreMission, annulerOrdreMission, getPlaintes,
} from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { getUtilisateurs } from '../../api/comptes';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton,
} from '../common/dashboard';
import {
  STATUTS_ORDRE_MISSION_LABELS, TYPES_CONTROLE_QHSE, NIVEAUX_URGENCE,
} from '../../utils/constants';

const STATUT_TONE = {
  EMIS: 'gold', EN_COURS: 'navy', EXECUTE: 'green', ANNULE: 'slate',
};
const PRIORITE_TONE = { ELEVEE: 'red', MOYENNE: 'gold', FAIBLE: 'slate' };

const FORMULAIRE_VIDE = {
  local: '', agent_assigne: '', objet: '', directives: '',
  type_controle: 'SANITAIRE', priorite: 'MOYENNE', date_mission: '', plainte_source: '',
};

/**
 * Console des ordres de mission (Phase 5) : emission par le bureau QHSE,
 * suivi du cycle EMIS -> EN_COURS -> EXECUTE et cloture avec compte rendu.
 */
export default function OrdresMissionView() {
  const [ordres, setOrdres] = useState([]);
  const [locaux, setLocaux] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [priorite, setPriorite] = useState('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);
  const [cloture, setCloture] = useState(null);
  const [compteRendu, setCompteRendu] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const [om, lx, ag, pl] = await Promise.all([
        getOrdresMission(), getLocaux(), getUtilisateurs(), getPlaintes(),
      ]);
      setOrdres(toArray(om));
      setLocaux(toArray(lx));
      setAgents(toArray(ag).filter((u) => ['AGENT_TERRAIN', 'AGENT_QHSE'].includes(u.role)));
      setPlaintes(toArray(pl).filter((p) => p.statut !== 'RESOLUE'));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement des ordres de mission.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const stats = useMemo(() => ({
    emis: ordres.filter((o) => o.statut === 'EMIS').length,
    enCours: ordres.filter((o) => o.statut === 'EN_COURS').length,
    executes: ordres.filter((o) => o.statut === 'EXECUTE').length,
    urgents: ordres.filter((o) => o.priorite === 'ELEVEE' && o.statut !== 'EXECUTE' && o.statut !== 'ANNULE').length,
  }), [ordres]);

  const rows = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return ordres
      .filter((o) => (statut ? o.statut === statut : true))
      .filter((o) => (priorite ? o.priorite === priorite : true))
      .filter((o) => !terme
        || (o.reference || '').toLowerCase().includes(terme)
        || (o.objet || '').toLowerCase().includes(terme)
        || (o.local_reference || '').toLowerCase().includes(terme)
        || (o.agent_nom || '').toLowerCase().includes(terme))
      .sort((a, b) => new Date(b.date_mission) - new Date(a.date_mission));
  }, [ordres, q, statut, priorite]);

  const soumettre = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    try {
      await createOrdreMission({
        ...form,
        plainte_source: form.plainte_source || null,
        date_mission: new Date(form.date_mission).toISOString(),
      });
      toast.success('Ordre de mission emis.');
      setModalOuvert(false);
      setForm(FORMULAIRE_VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Emission de l'ordre impossible."));
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
    if (!compteRendu.trim()) {
      toast.error('Le compte rendu de mission est obligatoire.');
      return;
    }
    try {
      await cloturerOrdreMission(cloture.id, compteRendu.trim());
      toast.success('Mission cloturee et compte rendu enregistre.');
      setCloture(null);
      setCompteRendu('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Cloture impossible.'));
    }
  };

  const colonnes = [
    {
      key: 'reference',
      label: 'Ordre de mission',
      render: (r) => (
        <IdentityCell
          title={r.reference || 'OM en attente'}
          subtitle={r.objet}
          initials="OM"
          tone={STATUT_TONE[r.statut] === 'green' ? 'green' : 'navy'}
        />
      ),
    },
    { key: 'local_reference', label: 'Local', render: (r) => r.local_reference || '-' },
    { key: 'agent_nom', label: 'Agent assigne', render: (r) => r.agent_nom || '-' },
    {
      key: 'type_controle',
      label: 'Controle',
      render: (r) => <Pill tone="slate">{(r.type_controle || '').replace(/_/g, ' ')}</Pill>,
    },
    {
      key: 'priorite',
      label: 'Priorite',
      render: (r) => <Pill tone={PRIORITE_TONE[r.priorite] || 'slate'}>{r.priorite}</Pill>,
    },
    {
      key: 'date_mission',
      label: 'Date de mission',
      render: (r) => (r.date_mission ? new Date(r.date_mission).toLocaleDateString('fr-FR') : '-'),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Pill tone={STATUT_TONE[r.statut] || 'slate'}>
          {STATUTS_ORDRE_MISSION_LABELS[r.statut] || r.statut}
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
            title="Demarrer la mission"
            tone="navy"
            disabled={r.statut !== 'EMIS'}
            onClick={() => executer(demarrerOrdreMission, r.id, 'Mission demarree.')}
          >
            ▶
          </IconButton>
          <IconButton
            title="Cloturer avec compte rendu"
            tone="green"
            disabled={r.statut !== 'EN_COURS'}
            onClick={() => { setCloture(r); setCompteRendu(r.compte_rendu || ''); }}
          >
            ✓
          </IconButton>
          <IconButton
            title="Annuler l'ordre"
            tone="red"
            disabled={r.statut === 'EXECUTE' || r.statut === 'ANNULE'}
            onClick={() => executer(annulerOrdreMission, r.id, 'Ordre de mission annule.')}
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
        icon={<ExploreOutlinedIcon style={{ fontSize: 20 }} />}
        title="Ordres de mission terrain"
        subtitle="Emission, suivi et cloture des missions de controle confiees aux agents de terrain."
        actions={(
          <>
            <Button variant="secondary" onClick={charger}>↻ Actualiser</Button>
            <Button onClick={() => setModalOuvert(true)}>+ Emettre un ordre</Button>
          </>
        )}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<MarkEmailUnreadOutlinedIcon style={{ fontSize: 20 }} />} label="Ordres emis" value={stats.emis} sub="En attente de demarrage" tone="gold" />
        <KpiCard icon={<DirectionsWalkOutlinedIcon style={{ fontSize: 20 }} />} label="Missions en cours" value={stats.enCours} sub="Agents sur le terrain" tone="navy" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Missions executees" value={stats.executes} sub="Comptes rendus recus" tone="green" />
        <KpiCard icon={<LocalFireDepartmentOutlinedIcon style={{ fontSize: 20 }} />} label="Priorite elevee" value={stats.urgents} sub="A traiter en priorite" tone="red" />
      </StatGrid>

      <Panel icon={<ExploreOutlinedIcon style={{ fontSize: 20 }} />} title="Registre des ordres de mission" subtitle={`${rows.length} ordre(s) affiche(s)`}>
        <FilterBar onReset={() => { setQ(''); setStatut(''); setPriorite(''); }}>
          <FilterField label="Recherche">
            <Input placeholder="Reference, objet, agent…" value={q} onChange={(e) => setQ(e.target.value)} />
          </FilterField>
          <FilterField label="Statut">
            <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(STATUTS_ORDRE_MISSION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Priorite">
            <Select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              <option value="">Toutes</option>
              {NIVEAUX_URGENCE.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </Select>
          </FilterField>
        </FilterBar>

        <DataTable
          columns={colonnes}
          data={rows}
          loading={loading}
          emptyLabel="Aucun ordre de mission enregistre."
        />
      </Panel>

      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Emettre un ordre de mission" size="lg">
        <form onSubmit={soumettre}>
          <Field label="Local a controler" required>
            <Select
              required
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            >
              <option value="">Selectionner un local</option>
              {locaux.map((l) => (
                <option key={l.id} value={l.id}>{l.reference} - {l.designation || l.type_local}</option>
              ))}
            </Select>
          </Field>
          <Field label="Agent assigne" required>
            <Select
              required
              value={form.agent_assigne}
              onChange={(e) => setForm({ ...form, agent_assigne: e.target.value })}
            >
              <option value="">Selectionner un agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.nom_complet || a.email} ({a.role})</option>
              ))}
            </Select>
          </Field>
          <Field label="Objet de la mission" required>
            <Input
              required
              placeholder="Ex : Controle sanitaire du local B12"
              value={form.objet}
              onChange={(e) => setForm({ ...form, objet: e.target.value })}
            />
          </Field>
          <Field label="Type de controle" required>
            <Select value={form.type_controle} onChange={(e) => setForm({ ...form, type_controle: e.target.value })}>
              {TYPES_CONTROLE_QHSE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Priorite">
            <Select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}>
              {NIVEAUX_URGENCE.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </Select>
          </Field>
          <Field label="Date de mission" required>
            <Input
              required
              type="datetime-local"
              value={form.date_mission}
              onChange={(e) => setForm({ ...form, date_mission: e.target.value })}
            />
          </Field>
          <Field label="Signalement a l'origine (optionnel)">
            <Select value={form.plainte_source} onChange={(e) => setForm({ ...form, plainte_source: e.target.value })}>
              <option value="">Aucun</option>
              {plaintes.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.type || '').replace(/_/g, ' ')} - {(p.description || '').slice(0, 40)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Directives donnees a l'agent">
            <Textarea
              rows={3}
              value={form.directives}
              onChange={(e) => setForm({ ...form, directives: e.target.value })}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOuvert(false)}>Annuler</Button>
            <Button type="submit" disabled={enregistrement}>
              {enregistrement ? 'Emission…' : 'Emettre la mission'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!cloture}
        onClose={() => { setCloture(null); setCompteRendu(''); }}
        title={`Cloturer ${cloture?.reference || 'la mission'}`}
      >
        <Field label="Compte rendu de mission" required hint="Constats, mesures prises et suites a donner.">
          <Textarea rows={6} value={compteRendu} onChange={(e) => setCompteRendu(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="secondary" onClick={() => { setCloture(null); setCompteRendu(''); }}>Annuler</Button>
          <Button onClick={validerCloture}>Enregistrer le compte rendu</Button>
        </div>
      </Modal>
    </div>
  );
}
