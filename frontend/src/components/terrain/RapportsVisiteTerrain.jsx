import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  getRapportsVisite, creerRapportVisite, transmettreRapportVisite, validerRapportVisite,
  getCadenceVisites, getCandidatsDispatch, getDispatchsFidelite, creerDispatchFidelite,
  assignerDispatchFidelite, cloturerDispatchFidelite,
} from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { getUtilisateurs } from '../../api/comptes';
import { messageErreur, toArray } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton,
} from '../common/dashboard';
import { TYPES_CONTROLE_QHSE } from '../../utils/constants';

const COMMISSIONS = [
  { value: 'COMMISSION_ENVIRONNEMENT', label: 'Commission environnement (QHSE)' },
  { value: 'COMMISSION_TECHNIQUE', label: 'Commission technique' },
  { value: 'COMMISSION_EVALUATION', label: "Commission d'évaluation" },
];

const STATUT_TONE = { BROUILLON: 'slate', TRANSMIS: 'gold', VALIDE: 'green' };
const STATUT_LABEL = { BROUILLON: 'Brouillon', TRANSMIS: 'Transmis', VALIDE: 'Validé' };
const CADENCE_TONE = { A_JOUR: 'green', EN_RETARD: 'red', JAMAIS_VISITE: 'gold' };
const CADENCE_LABEL = { A_JOUR: 'À jour', EN_RETARD: 'En retard', JAMAIS_VISITE: 'Jamais visité' };

const SEUIL_ALERTE = -20;

const FORM_VIDE = {
  local: '',
  date_visite: '',
  type_controle: 'OCCUPATION',
  commission_destinataire: 'COMMISSION_ENVIRONNEMENT',
  conforme: 'true',
  note_globale: '',
  constats: '',
  recommandations: '',
};

const dateCourte = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-');

/**
 * Console de terrain (Agent terrain / QHSE) - Phase 6.
 *
 * Trois volets metier :
 *  1. la cadence reglementaire de 10 jours par local (retards en evidence) ;
 *  2. la redaction et la transmission des rapports a la commission de
 *     rattachement de l'agent ;
 *  3. l'envoi d'un agent aupres d'un occupant au score de fidelite tres
 *     negatif (mediation declenchee par la commission environnement).
 */
export default function RapportsVisiteTerrain() {
  const { user } = useAuth();
  const [rapports, setRapports] = useState([]);
  const [cadence, setCadence] = useState({ resultats: [], cadence_jours: 10 });
  const [locaux, setLocaux] = useState([]);
  const [agents, setAgents] = useState([]);
  const [dispatchs, setDispatchs] = useState([]);
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [onglet, setOnglet] = useState('CADENCE');
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [commission, setCommission] = useState('');

  const [modalRapport, setModalRapport] = useState(false);
  const [form, setForm] = useState(FORM_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);

  const [modalDispatch, setModalDispatch] = useState(null); // candidat sélectionné
  const [motifDispatch, setMotifDispatch] = useState('');
  const [clotureDispatch, setClotureDispatch] = useState(null);
  const [compteRendu, setCompteRendu] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const [rv, cad, lx, ag, dp, cd] = await Promise.all([
        getRapportsVisite().catch(() => []),
        getCadenceVisites().catch(() => ({ resultats: [], cadence_jours: 10 })),
        getLocaux().catch(() => []),
        getUtilisateurs().catch(() => []),
        getDispatchsFidelite().catch(() => []),
        getCandidatsDispatch(SEUIL_ALERTE).catch(() => ({ resultats: [] })),
      ]);
      setRapports(toArray(rv));
      setCadence(cad || { resultats: [] });
      setLocaux(toArray(lx));
      setAgents(toArray(ag).filter((u) => ['AGENT_TERRAIN', 'AGENT_QHSE'].includes(u.role)));
      setDispatchs(toArray(dp));
      setCandidats(toArray(cd?.resultats ?? cd));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement de la console terrain.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const lignesCadence = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return (cadence.resultats || []).filter((l) => !terme
      || (l.reference || '').toLowerCase().includes(terme)
      || (l.localisation || '').toLowerCase().includes(terme));
  }, [cadence, q]);

  const lignesRapports = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return rapports
      .filter((r) => (statut ? r.statut === statut : true))
      .filter((r) => (commission ? r.commission_destinataire === commission : true))
      .filter((r) => !terme
        || (r.reference || '').toLowerCase().includes(terme)
        || (r.local_reference || '').toLowerCase().includes(terme)
        || (r.agent_nom || '').toLowerCase().includes(terme));
  }, [rapports, q, statut, commission]);

  const stats = useMemo(() => ({
    enRetard: (cadence.resultats || []).filter((l) => l.statut_cadence === 'EN_RETARD').length,
    jamais: (cadence.resultats || []).filter((l) => l.statut_cadence === 'JAMAIS_VISITE').length,
    aTransmettre: rapports.filter((r) => r.statut === 'BROUILLON').length,
    alertes: candidats.filter((c) => !c.dispatch_en_cours).length,
  }), [cadence, rapports, candidats]);

  /* ---------------------------------------------------------------- actions */
  const ouvrirRapport = (localId = '') => {
    setForm({ ...FORM_VIDE, local: localId, date_visite: new Date().toISOString().slice(0, 16) });
    setModalRapport(true);
  };

  const soumettreRapport = async (e) => {
    e.preventDefault();
    if (!form.local || !form.constats.trim()) {
      toast.error('Le local et les constats sont obligatoires.');
      return;
    }
    setEnregistrement(true);
    try {
      await creerRapportVisite({
        ...form,
        conforme: form.conforme === 'true',
        note_globale: form.note_globale === '' ? null : Number(form.note_globale),
      });
      toast.success('Rapport de visite enregistré.');
      setModalRapport(false);
      setOnglet('RAPPORTS');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer ce rapport."));
    } finally {
      setEnregistrement(false);
    }
  };

  const transmettre = async (r) => {
    try {
      await transmettreRapportVisite(r.id);
      toast.success('Rapport transmis à la commission.');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Transmission impossible.'));
    }
  };

  const valider = async (r) => {
    try {
      await validerRapportVisite(r.id);
      toast.success('Rapport validé.');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Validation impossible.'));
    }
  };

  const envoyerAgent = async (e) => {
    e.preventDefault();
    if (!motifDispatch.trim()) {
      toast.error('Merci de motiver l’envoi de l’agent.');
      return;
    }
    setEnregistrement(true);
    try {
      await creerDispatchFidelite({ demandeur: modalDispatch.demandeur_id, motif: motifDispatch });
      toast.success('Agent de terrain dépêché auprès de l’occupant.');
      setModalDispatch(null);
      setMotifDispatch('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de déclencher l'envoi d'un agent."));
    } finally {
      setEnregistrement(false);
    }
  };

  const assigner = async (d, agentId) => {
    if (!agentId) return;
    try {
      await assignerDispatchFidelite(d.id, agentId);
      toast.success('Agent assigné.');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Assignation impossible.'));
    }
  };

  const cloturer = async (e) => {
    e.preventDefault();
    try {
      await cloturerDispatchFidelite(clotureDispatch.id, compteRendu);
      toast.success('Mission clôturée.');
      setClotureDispatch(null);
      setCompteRendu('');
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Clôture impossible.'));
    }
  };

  /* ---------------------------------------------------------------- colonnes */
  const colonnesCadence = [
    {
      key: 'local',
      label: 'Local',
      render: (l) => <IdentityCell title={l.reference} subtitle={l.localisation} tone="navy" />,
    },
    { key: 'derniere', label: 'Dernière visite', render: (l) => dateCourte(l.derniere_visite) },
    { key: 'prochaine', label: 'Prochaine échéance', render: (l) => dateCourte(l.prochaine_visite) },
    {
      key: 'statut',
      label: 'Cadence',
      render: (l) => (
        <Pill tone={CADENCE_TONE[l.statut_cadence]}>
          {CADENCE_LABEL[l.statut_cadence]}
          {l.jours_retard ? ` · +${l.jours_retard} j` : ''}
        </Pill>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (l) => (
        <RowActions>
          <Button size="sm" onClick={() => ouvrirRapport(l.local_id)}>Rédiger le rapport</Button>
        </RowActions>
      ),
    },
  ];

  const colonnesRapports = [
    {
      key: 'ref',
      label: 'Rapport',
      render: (r) => <IdentityCell title={r.reference} subtitle={r.local_reference} tone="gold" />,
    },
    { key: 'agent', label: 'Agent', render: (r) => r.agent_nom || '-' },
    { key: 'date', label: 'Visite', render: (r) => dateCourte(r.date_visite) },
    {
      key: 'conforme',
      label: 'Conformité',
      render: (r) => (
        <Pill tone={r.conforme ? 'green' : 'red'}>{r.conforme ? 'Conforme' : 'Non conforme'}</Pill>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (r) => COMMISSIONS.find((c) => c.value === r.commission_destinataire)?.label || '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => <Pill tone={STATUT_TONE[r.statut]}>{STATUT_LABEL[r.statut]}</Pill>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <RowActions>
          {r.statut === 'BROUILLON' && (
            <IconButton title="Transmettre à la commission" tone="navy" onClick={() => transmettre(r)}>
              <SendOutlinedIcon style={{ fontSize: 17 }} />
            </IconButton>
          )}
          {r.statut === 'TRANSMIS' && (
            <IconButton title="Valider (commission)" tone="green" onClick={() => valider(r)}>
              <FactCheckOutlinedIcon style={{ fontSize: 17 }} />
            </IconButton>
          )}
        </RowActions>
      ),
    },
  ];

  const colonnesAlertes = [
    {
      key: 'occupant',
      label: 'Occupant',
      render: (c) => <IdentityCell title={c.nom} subtitle={`Score ${c.score}`} tone="red" />,
    },
    {
      key: 'gravite',
      label: 'Gravité',
      render: (c) => (
        <Pill tone={c.score <= SEUIL_ALERTE * 2 ? 'red' : 'gold'}>
          {c.score <= SEUIL_ALERTE * 2 ? 'Critique' : 'Élevée'}
        </Pill>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <RowActions>
          <Button
            size="sm"
            disabled={c.dispatch_en_cours}
            onClick={() => { setModalDispatch(c); setMotifDispatch(''); }}
          >
            {c.dispatch_en_cours ? 'Agent déjà dépêché' : 'Envoyer un agent'}
          </Button>
        </RowActions>
      ),
    },
  ];

  const colonnesDispatchs = [
    {
      key: 'ref',
      label: 'Mission',
      render: (d) => <IdentityCell title={d.reference} subtitle={d.demandeur_nom} tone="navy" />,
    },
    { key: 'local', label: 'Local', render: (d) => d.local_reference || '-' },
    { key: 'score', label: 'Score constaté', render: (d) => (d.score_constate ?? '-') },
    { key: 'statut', label: 'Statut', render: (d) => <Pill tone={d.statut === 'CLOTURE' ? 'green' : 'gold'}>{d.statut}</Pill> },
    {
      key: 'agent',
      label: 'Agent',
      render: (d) => (d.agent_nom ? d.agent_nom : (
        <Select
          value=""
          onChange={(e) => assigner(d, e.target.value)}
          options={[{ value: '', label: 'Assigner…' },
            ...agents.map((a) => ({ value: a.id, label: a.nom_complet || a.username }))]}
        />
      )),
    },
    {
      key: 'actions',
      label: '',
      render: (d) => (
        <RowActions>
          {d.statut !== 'CLOTURE' && (
            <Button size="sm" onClick={() => { setClotureDispatch(d); setCompteRendu(''); }}>
              Clôturer
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  const ONGLETS = [
    { id: 'CADENCE', label: `Cadence ${cadence.cadence_jours || 10} jours` },
    { id: 'RAPPORTS', label: 'Mes rapports' },
    { id: 'ALERTES', label: 'Alertes fidélité' },
  ];

  return (
    <div>
      <PageHeader
        icon={<EventRepeatOutlinedIcon style={{ fontSize: 26 }} />}
        title="Visites de terrain & rapports de commission"
        subtitle={`Cadence réglementaire de ${cadence.cadence_jours || 10} jours par local - transmission directe à votre commission de rattachement.`}
        actions={<Button onClick={() => ouvrirRapport()}>Nouveau rapport de visite</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<WarningAmberOutlinedIcon />} tone="red" label="Locaux en retard" value={stats.enRetard} sub="Cadence dépassée" />
        <KpiCard icon={<EventRepeatOutlinedIcon />} tone="gold" label="Jamais visités" value={stats.jamais} sub="À planifier" />
        <KpiCard icon={<AssignmentTurnedInOutlinedIcon />} tone="navy" label="Rapports à transmettre" value={stats.aTransmettre} sub="Brouillons" />
        <KpiCard icon={<PersonSearchOutlinedIcon />} tone="red" label="Occupants à risque" value={stats.alertes} sub={`Score ≤ ${SEUIL_ALERTE}`} />
      </StatGrid>

      <div style={{ display: 'flex', gap: 8, margin: '20px 0 12px' }}>
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: onglet === o.id ? 'var(--navy)' : 'transparent',
              color: onglet === o.id ? 'var(--text-on-navy)' : 'var(--text-navy)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <FilterBar onReset={() => { setQ(''); setStatut(''); setCommission(''); }}>
        <FilterField label="Recherche">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, local, agent…" />
        </FilterField>
        {onglet === 'RAPPORTS' && (
          <>
            <FilterField label="Statut">
              <Select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                options={[{ value: '', label: 'Tous' },
                  ...Object.entries(STATUT_LABEL).map(([value, label]) => ({ value, label }))]}
              />
            </FilterField>
            <FilterField label="Commission">
              <Select
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                options={[{ value: '', label: 'Toutes' }, ...COMMISSIONS]}
              />
            </FilterField>
          </>
        )}
      </FilterBar>

      {onglet === 'CADENCE' && (
        <Panel
          icon={<EventRepeatOutlinedIcon style={{ fontSize: 20 }} />}
          title="Suivi de la cadence des visites"
          subtitle="Les locaux en retard sont remontés en tête de liste."
          padded={false}
        >
          <DataTable columns={colonnesCadence} rows={lignesCadence} loading={loading} emptyLabel="Aucun local à suivre." />
        </Panel>
      )}

      {onglet === 'RAPPORTS' && (
        <Panel
          icon={<AssignmentTurnedInOutlinedIcon style={{ fontSize: 20 }} />}
          title="Rapports de visite"
          subtitle="Brouillon → transmis à la commission → validé."
          padded={false}
        >
          <DataTable columns={colonnesRapports} rows={lignesRapports} loading={loading} emptyLabel="Aucun rapport de visite." />
        </Panel>
      )}

      {onglet === 'ALERTES' && (
        <>
          <Panel
            icon={<PersonSearchOutlinedIcon style={{ fontSize: 20 }} />}
            title="Occupants au score très négatif"
            subtitle={`Seuil de déclenchement : ${SEUIL_ALERTE} points. Un agent peut être dépêché sur place.`}
            padded={false}
          >
            <DataTable columns={colonnesAlertes} rows={candidats} loading={loading} emptyLabel="Aucun occupant sous le seuil d'alerte." />
          </Panel>
          <div style={{ height: 20 }} />
          <Panel
            icon={<SendOutlinedIcon style={{ fontSize: 20 }} />}
            title="Missions de médiation"
            subtitle="Suivi des agents dépêchés."
            padded={false}
          >
            <DataTable columns={colonnesDispatchs} rows={dispatchs} loading={loading} emptyLabel="Aucune mission en cours." />
          </Panel>
        </>
      )}

      <Modal open={modalRapport} onClose={() => setModalRapport(false)} title="Rapport de visite de terrain">
        <form onSubmit={soumettreRapport}>
          <Field label="Local visité" required>
            <Select
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
              options={[{ value: '', label: 'Sélectionner un local' },
                ...locaux.map((l) => ({ value: l.id, label: `${l.reference} - ${l.localisation}` }))]}
            />
          </Field>
          <Field label="Date et heure de la visite" required>
            <Input
              type="datetime-local"
              value={form.date_visite}
              onChange={(e) => setForm({ ...form, date_visite: e.target.value })}
            />
          </Field>
          <Field label="Type de contrôle">
            <Select
              value={form.type_controle}
              onChange={(e) => setForm({ ...form, type_controle: e.target.value })}
              options={TYPES_CONTROLE_QHSE}
            />
          </Field>
          <Field label="Commission destinataire">
            <Select
              value={form.commission_destinataire}
              onChange={(e) => setForm({ ...form, commission_destinataire: e.target.value })}
              options={COMMISSIONS}
            />
          </Field>
          <Field label="Conformité">
            <Select
              value={form.conforme}
              onChange={(e) => setForm({ ...form, conforme: e.target.value })}
              options={[{ value: 'true', label: 'Conforme' }, { value: 'false', label: 'Non conforme' }]}
            />
          </Field>
          <Field label="Note globale (sur 20)">
            <Input
              type="number" min="0" max="20"
              value={form.note_globale}
              onChange={(e) => setForm({ ...form, note_globale: e.target.value })}
            />
          </Field>
          <Field label="Constats" required>
            <Textarea
              rows={4}
              value={form.constats}
              onChange={(e) => setForm({ ...form, constats: e.target.value })}
              placeholder="Observations relevées sur place…"
            />
          </Field>
          <Field label="Recommandations">
            <Textarea
              rows={3}
              value={form.recommandations}
              onChange={(e) => setForm({ ...form, recommandations: e.target.value })}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setModalRapport(false)}>Annuler</Button>
            <Button type="submit" disabled={enregistrement}>
              {enregistrement ? 'Enregistrement…' : 'Enregistrer le rapport'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(modalDispatch)}
        onClose={() => setModalDispatch(null)}
        title={`Envoyer un agent - ${modalDispatch?.nom || ''}`}
      >
        <form onSubmit={envoyerAgent}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Score de fidélité constaté : <strong>{modalDispatch?.score}</strong>. La mission de
            médiation sera tracée et rattachée au dossier de l’occupant.
          </p>
          <Field label="Motif de la mission" required>
            <Textarea
              rows={4}
              value={motifDispatch}
              onChange={(e) => setMotifDispatch(e.target.value)}
              placeholder="Impayés répétés, nuisances constatées, non-conformité persistante…"
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setModalDispatch(null)}>Annuler</Button>
            <Button type="submit" disabled={enregistrement}>Dépêcher un agent</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(clotureDispatch)}
        onClose={() => setClotureDispatch(null)}
        title={`Clôturer la mission ${clotureDispatch?.reference || ''}`}
      >
        <form onSubmit={cloturer}>
          <Field label="Compte rendu de l’agent">
            <Textarea rows={4} value={compteRendu} onChange={(e) => setCompteRendu(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setClotureDispatch(null)}>Annuler</Button>
            <Button type="submit">Clôturer</Button>
          </div>
        </form>
      </Modal>

      {user?.role === 'AGENT_TERRAIN' && (
        <p style={{ marginTop: 18, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Vos rapports sont transmis à la commission environnement pour arbitrage collégial.
        </p>
      )}
    </div>
  );
}
