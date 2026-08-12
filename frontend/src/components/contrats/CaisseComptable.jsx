import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getEcheances, getPaiements, reglerPaiement } from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Modal } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, SplitLayout, RankList,
} from '../common/dashboard';

const STATUT_TONE = { PAYEE: 'green', EXIGIBLE: 'gold', EN_RETARD: 'red', NON_ECHUE: 'slate' };
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

/**
 * Guichet comptable : vue consolidee de toutes les echeances du parc,
 * indicateurs de recouvrement et encaissement direct au comptoir.
 */
export default function CaisseComptable() {
  const [echeances, setEcheances] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [cible, setCible] = useState(null);
  const [form, setForm] = useState({ montant_regle: '', mode: 'ESPECES', reference_transaction: '' });
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([getEcheances(), getPaiements()]);
      setEcheances(e);
      setPaiements(p);
    } catch (err) {
      toast.error(messageErreur(err, 'Chargement de la caisse impossible.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const stats = useMemo(() => {
    const total = echeances.reduce((s, e) => s + Number(e.montant_du || 0), 0);
    const payees = echeances.filter((e) => e.statut === 'PAYEE');
    const retard = echeances.filter((e) => e.statut === 'EN_RETARD');
    const exigibles = echeances.filter((e) => e.statut === 'EXIGIBLE');
    const encaisse = paiements.reduce((s, p) => s + Number(p.montant_regle || 0), 0);
    const penalites = echeances.reduce((s, e) => s + Number(e.montant_penalite || 0), 0);
    const today = new Date().toDateString();
    const jour = paiements.filter((p) => p.date_paiement && new Date(p.date_paiement).toDateString() === today);
    return {
      total, encaisse, penalites,
      impayes: total - encaisse,
      nbPayees: payees.length,
      nbRetard: retard.length,
      nbExigibles: exigibles.length,
      caisseJour: jour.reduce((s, p) => s + Number(p.montant_regle || 0), 0),
      nbJour: jour.length,
      tauxRecouvrement: total > 0 ? Math.round((encaisse / total) * 100) : 0,
    };
  }, [echeances, paiements]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return echeances
      .filter((e) => (statut ? e.statut === statut : true))
      .filter((e) => !term
        || (e.occupant_nom || '').toLowerCase().includes(term)
        || (e.local_reference || '').toLowerCase().includes(term)
        || (e.local_localisation || '').toLowerCase().includes(term))
      .sort((a, b) => new Date(a.date_exigibilite) - new Date(b.date_exigibilite));
  }, [echeances, q, statut]);

  const topDebiteurs = useMemo(() => {
    const map = new Map();
    echeances.filter((e) => e.statut === 'EN_RETARD' || e.statut === 'EXIGIBLE').forEach((e) => {
      const k = e.occupant_nom || 'Occupant inconnu';
      const prev = map.get(k) || { total: 0, n: 0, local: e.local_reference };
      map.set(k, { total: prev.total + Number(e.montant_du || 0), n: prev.n + 1, local: prev.local });
    });
    return [...map.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([nom, v]) => ({ key: nom, title: nom, subtitle: `${v.n} echeance(s) · ${v.local || '—'}`, value: fmt(v.total) }));
  }, [echeances]);

  const ouvrir = (e) => {
    setCible(e);
    setForm({
      montant_regle: String(Number(e.montant_du || 0) + Number(e.montant_penalite || 0)),
      mode: 'ESPECES',
      reference_transaction: '',
    });
  };

  const encaisser = async (ev) => {
    ev.preventDefault();
    if (!cible) return;
    const montant = Number(form.montant_regle);
    if (!montant || montant <= 0) return toast.error('Montant invalide.');
    setEnvoi(true);
    try {
      await reglerPaiement(cible.id, montant, form.mode, form.reference_transaction);
      toast.success('Encaissement enregistre. Quitus genere.');
      setCible(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "Echec de l'encaissement."));
    } finally {
      setEnvoi(false);
    }
  };

  const columns = [
    {
      key: 'occupant',
      label: 'Occupant',
      render: (r) => (
        <IdentityCell
          title={r.occupant_nom || 'Occupant'}
          subtitle={`${r.local_reference || '—'} · ${r.local_localisation || ''}`}
          initials={(r.occupant_nom || 'OC').slice(0, 2).toUpperCase()}
        />
      ),
    },
    {
      key: 'date_exigibilite',
      label: 'Exigibilite',
      render: (r) => (r.date_exigibilite ? new Date(r.date_exigibilite).toLocaleDateString('fr-FR') : '—'),
    },
    { key: 'montant_du', label: 'Montant du', align: 'right', render: (r) => fmt(r.montant_du) },
    {
      key: 'montant_penalite',
      label: 'Penalite',
      align: 'right',
      render: (r) => (Number(r.montant_penalite) > 0
        ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>{fmt(r.montant_penalite)}</span>
        : '—'),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => <Pill tone={STATUT_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton
            title="Encaisser"
            tone="green"
            disabled={r.statut === 'PAYEE'}
            onClick={() => ouvrir(r)}
          >
            💵
          </IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="💰"
        title="Caisse & encaissements"
        subtitle="Guichet comptable : suivi du recouvrement des redevances et encaissement au comptoir."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon="💵" label="Encaisse ce jour" value={fmt(stats.caisseJour)} sub={`${stats.nbJour} operation(s)`} tone="green" />
        <KpiCard icon="🧾" label="Total encaisse" value={fmt(stats.encaisse)} sub={`${paiements.length} paiement(s)`} tone="navy" />
        <KpiCard icon="⚠️" label="Restant du" value={fmt(stats.impayes)} sub={`${stats.nbRetard} en retard`} tone="red" />
        <KpiCard icon="📊" label="Taux de recouvrement" value={`${stats.tauxRecouvrement}%`} sub={`${stats.nbPayees}/${echeances.length} echeances payees`} tone="gold" />
      </StatGrid>

      <SplitLayout ratio="1.7fr 1fr">
        <Panel icon="📋" title="Echeancier consolide" subtitle="Toutes les echeances du parc locatif" padded={false}>
          <div style={{ padding: '14px 16px 0' }}>
            <FilterBar onReset={() => { setQ(''); setStatut(''); }}>
              <FilterField label="Recherche">
                <Input placeholder="Occupant, local, localisation…" value={q} onChange={(e) => setQ(e.target.value)} />
              </FilterField>
              <FilterField label="Statut">
                <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="NON_ECHUE">Non echue</option>
                  <option value="EXIGIBLE">Exigible</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="PAYEE">Payee</option>
                </Select>
              </FilterField>
            </FilterBar>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            empty="Aucune echeance ne correspond aux filtres."
            pageSize={12}
            dense
          />
        </Panel>

        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel icon="🔻" title="Principaux debiteurs">
            <RankList items={topDebiteurs} empty="Aucun impaye : parc a jour." />
          </Panel>
          <Panel icon="⚖️" title="Penalites cumulees">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 900, color: 'var(--red)' }}>
              {fmt(stats.penalites)}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
              Penalites de retard appliquees sur l&apos;ensemble des echeances.
            </p>
          </Panel>
        </div>
      </SplitLayout>

      <Modal open={!!cible} onClose={() => setCible(null)} title="Encaisser une echeance" size="md">
        {cible && (
          <form onSubmit={encaisser}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5 }}>
              <div><strong>{cible.occupant_nom || 'Occupant'}</strong> · {cible.local_reference}</div>
              <div style={{ color: 'var(--muted)' }}>
                Exigible le {cible.date_exigibilite ? new Date(cible.date_exigibilite).toLocaleDateString('fr-FR') : '—'} ·
                {' '}Du : {fmt(cible.montant_du)}{Number(cible.montant_penalite) > 0 ? ` + penalite ${fmt(cible.montant_penalite)}` : ''}
              </div>
            </div>
            <Field label="Montant regle" required>
              <Input type="number" min="1" step="1" value={form.montant_regle}
                onChange={(e) => setForm({ ...form, montant_regle: e.target.value })} required />
            </Field>
            <Field label="Mode de paiement" required>
              <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="ESPECES">Especes</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </Select>
            </Field>
            {form.mode === 'MOBILE_MONEY' && (
              <Field label="Reference transaction" hint="Identifiant fourni par l'operateur">
                <Input value={form.reference_transaction}
                  onChange={(e) => setForm({ ...form, reference_transaction: e.target.value })} />
              </Field>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button type="button" variant="ghost" onClick={() => setCible(null)}>Annuler</Button>
              <Button type="submit" disabled={envoi}>{envoi ? 'Traitement…' : 'Valider l\u2019encaissement'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
