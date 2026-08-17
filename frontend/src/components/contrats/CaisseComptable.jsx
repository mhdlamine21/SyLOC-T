import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getEcheances, reglerPaiement, actualiserEcheances, getCaisse, getRecus, getPaiementsEnAttente, validerPaiement
} from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Modal } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, RankList,
} from '../common/dashboard';
import { LineChart, DoughnutChart, ProgressBars } from '../charts';
import QuitusFormatModal from './QuitusFormatModal';
import { MODES_PAIEMENT } from '../../utils/constants';

const STATUT_TONE = { PAYEE: 'green', EXIGIBLE: 'gold', EN_RETARD: 'red', NON_ECHUE: 'slate' };
const STATUT_LABEL = { NON_ECHUE: 'Non échue', EXIGIBLE: 'Exigible', PAYEE: 'Payée', EN_RETARD: 'En retard' };
const MODE_LABEL = Object.fromEntries(MODES_PAIEMENT.map((m) => [m.value, m.label]));
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

/**
 * Guichet comptable : caisse consolidee (repartition, journal, debiteurs),
 * echeancier consolide avec encaissement au comptoir, et registre des recus.
 * Vue 100% pleine largeur, empilée verticalement pour une ergonomie optimale.
 */
export default function CaisseComptable() {
  const [echeances, setEcheances] = useState([]);
  const [caisse, setCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [cible, setCible] = useState(null);
  const [form, setForm] = useState({ montant_regle: '', mode: 'ESPECES', reference_transaction: '' });
  const [envoi, setEnvoi] = useState(false);
  const [actualisation, setActualisation] = useState(false);
  const [quitusAffiche, setQuitusAffiche] = useState(null);

  // Registre des recus
  const [recusFiltre, setRecusFiltre] = useState({ debut: '', fin: '', mode: '' });
  const [recus, setRecus] = useState({ total: 0, resultats: [] });
  const [recusLoading, setRecusLoading] = useState(false);

  // Paiements declares par les occupants, en attente de la caisse (especes + mobile money)
  const [attentes, setAttentes] = useState([]);

  const charger = async () => {
    setLoading(true);
    try {
      const [e, c, att] = await Promise.all([getEcheances(), getCaisse(), getPaiementsEnAttente()]);
      setEcheances(e);
      setCaisse(c);
      setAttentes(att);
    } catch (err) {
      toast.error(messageErreur(err, 'Chargement de la caisse impossible.'));
    } finally {
      setLoading(false);
    }
  };

  const chargerRecus = async (params = recusFiltre) => {
    setRecusLoading(true);
    try {
      const filtres = {};
      if (params.debut) filtres.debut = params.debut;
      if (params.fin) filtres.fin = params.fin;
      if (params.mode) filtres.mode = params.mode;
      const data = await getRecus(filtres);
      setRecus(data);
    } catch (err) {
      toast.error(messageErreur(err, 'Chargement du registre des reçus impossible.'));
    } finally {
      setRecusLoading(false);
    }
  };

  useEffect(() => { charger(); chargerRecus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const actualiser = async () => {
    setActualisation(true);
    try {
      const res = await actualiserEcheances();
      toast.success(res.detail || `${res.nb_modifiees} échéance(s) actualisée(s).`);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "Échec de l'actualisation des échéances."));
    } finally {
      setActualisation(false);
    }
  };

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

  const topDebiteurs = useMemo(() => (caisse?.top_debiteurs || []).map((d, index) => {
    const rang = d.rang || (index + 1);
    const malus = d.malus_points != null ? d.malus_points : (d.nb >= 2 ? null : -12);
    return {
      key: `${d.occupant}-${index}`,
      occupant: d.occupant,
      local: d.local,
      nb: d.nb,
      montant: d.montant,
      rang,
      malus_points: malus,
      score_fidelite: d.score_fidelite,
      critique: d.nb >= 2,
    };
  }), [caisse]);

  const journalSeries = useMemo(() => {
    const journal = caisse?.journal_14j || [];
    return {
      labels: journal.map((j) => new Date(j.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
      series: [{ label: 'Encaissements (FCFA)', data: journal.map((j) => j.total) }],
    };
  }, [caisse]);

  const parModeData = useMemo(() => (caisse?.par_mode || []).map((m) => ({
    label: `${MODE_LABEL[m.mode] || m.mode} (${m.nb})`,
    value: m.total,
  })), [caisse]);

  const repartitionItems = useMemo(() => {
    const rep = caisse?.repartition_echeances || {};
    return Object.entries(rep).map(([statutKey, valeur]) => ({
      label: STATUT_LABEL[statutKey] || statutKey,
      value: valeur,
    }));
  }, [caisse]);

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
      const paiement = await reglerPaiement(cible.id, montant, form.mode, form.reference_transaction);
      toast.success('Encaissement enregistré.');
      setCible(null);
      setQuitusAffiche(paiement.quitus || null);
      await Promise.all([charger(), chargerRecus()]);
    } catch (err) {
      toast.error(messageErreur(err, "Echec de l'encaissement."));
    } finally {
      setEnvoi(false);
    }
  };

  const validerAttente = async (paiementId) => {
    try {
      const p = await validerPaiement(paiementId);
      toast.success('Paiement validé avec succès.');
      setQuitusAffiche(p.quitus);
      await Promise.all([charger(), chargerRecus()]);
    } catch (err) {
      toast.error(messageErreur(err, 'Impossible de valider ce paiement.'));
    }
  };

  const rejouerQuitus = async (paiement) => {
    setQuitusAffiche({
      reference_quitus: paiement.reference_quitus,
      reference_transaction: paiement.reference_transaction,
      date_paiement: paiement.date_paiement,
      mode: paiement.mode,
      mode_libelle: paiement.mode_libelle,
      montant_regle: paiement.montant_regle,
      date_exigibilite: paiement.date_exigibilite,
      occupant_nom: paiement.occupant_nom,
      local_reference: paiement.local_reference,
      local_localisation: paiement.local_localisation,
      contrat_reference: paiement.contrat_reference,
      organisme: 'CROUS de Thies - SyLOC-T',
      service_emetteur: 'Service Comptable & Financement',
    });
  };

  const columns = [
    {
      key: 'occupant',
      label: 'Occupant',
      render: (r) => (
        <IdentityCell
          title={r.occupant_nom || 'Occupant'}
          subtitle={`${r.local_reference || '-'} · ${r.local_localisation || ''}`}
          initials={(r.occupant_nom || 'OC').slice(0, 2).toUpperCase()}
        />
      ),
    },
    {
      key: 'date_exigibilite',
      label: 'Exigibilite',
      render: (r) => (r.date_exigibilite ? new Date(r.date_exigibilite).toLocaleDateString('fr-FR') : '-'),
    },
    { key: 'montant_du', label: 'Montant du', align: 'right', render: (r) => fmt(r.montant_du) },
    {
      key: 'montant_penalite',
      label: 'Penalite',
      align: 'right',
      render: (r) => (Number(r.montant_penalite) > 0
        ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>{fmt(r.montant_penalite)}</span>
        : '-'),
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
      render: (r) => {
        if (r.statut === 'PAYEE') {
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(22, 163, 74, 0.12)',
                color: 'var(--green)',
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              ✓ Réglée
            </span>
          );
        }
        return (
          <Button
            size="sm"
            variant={r.statut === 'EN_RETARD' ? 'danger' : (r.statut === 'EXIGIBLE' ? 'gold' : 'navy')}
            onClick={() => ouvrir(r)}
            style={{ fontSize: 11.5, padding: '4px 10px', minHeight: 30 }}
            title={r.statut === 'NON_ECHUE' ? "Encaisser par anticipation au guichet" : "Encaisser au guichet"}
          >
            💵 Encaisser
          </Button>
        );
      },
    },
  ];

  const attentesColumns = [
    {
      key: 'occupant',
      label: 'Occupant',
      render: (r) => (
        <IdentityCell
          title={r.occupant_nom || 'Occupant'}
          subtitle={`${r.local_reference || '-'} · ${r.local_localisation || ''}`}
          initials={(r.occupant_nom || 'OC').slice(0, 2).toUpperCase()}
        />
      ),
    },
    {
      key: 'date_paiement',
      label: 'Date déclaration',
      render: (r) => (r.date_paiement ? new Date(r.date_paiement).toLocaleString('fr-FR') : '-'),
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (r) => (
        <Pill tone={r.mode === 'ESPECES' ? 'gold' : 'navy'}>
          {r.mode === 'ESPECES' ? 'Espèces - sur place' : (r.mode_libelle || 'Mobile Money')}
        </Pill>
      ),
    },
    {
      key: 'reference_transaction',
      label: 'Référence / Payeur',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {r.numero_payeur ? `${r.numero_payeur} · ` : ''}{r.reference_transaction || '-'}
        </span>
      ),
    },
    { key: 'montant_regle', label: 'Montant', align: 'right', render: (r) => fmt(r.montant_regle) },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <Button variant="navy" size="sm" onClick={() => validerAttente(r.id)}>
          {r.mode === 'ESPECES' ? "Encaisser & valider" : 'Confirmer le dépôt'}
        </Button>
      ),
    },
  ];

  const recusColumns = [
    { key: 'reference_quitus', label: 'N° Quitus', render: (r) => r.reference_quitus || '-' },
    {
      key: 'date_paiement',
      label: 'Date',
      render: (r) => (r.date_paiement ? new Date(r.date_paiement).toLocaleString('fr-FR') : '-'),
    },
    { key: 'occupant_nom', label: 'Occupant', render: (r) => r.occupant_nom || '-' },
    { key: 'local_reference', label: 'Local', render: (r) => r.local_reference || '-' },
    { key: 'mode_libelle', label: 'Mode', render: (r) => r.mode_libelle || r.mode || '-' },
    { key: 'montant_regle', label: 'Montant', align: 'right', render: (r) => fmt(r.montant_regle) },
    {
      key: 'actions',
      label: 'Reédition',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Rééditer le quitus" tone="navy" onClick={() => rejouerQuitus(r)}>
            <PrintOutlinedIcon style={{ fontSize: 17 }} />
          </IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        icon={<PaidOutlinedIcon style={{ fontSize: 20 }} />}
        title="Caisse & encaissements"
        subtitle="Guichet comptable : suivi du recouvrement des redevances et encaissement au comptoir."
        actions={(
          <>
            <Button variant="secondary" onClick={actualiser} disabled={actualisation}>
              {actualisation ? 'Actualisation…' : '⚙️ Actualiser les échéances'}
            </Button>
            <Button variant="secondary" onClick={charger}>↻ Actualiser</Button>
          </>
        )}
      />

      {/* KPIs pleine largeur */}
      <StatGrid cols={5}>
        <KpiCard icon={<AccountBalanceWalletOutlinedIcon style={{ fontSize: 20 }} />} label="Caisse du jour" value={fmt(caisse?.caisse_du_jour?.total)} sub={`${caisse?.caisse_du_jour?.nb || 0} opération(s)`} tone="green" />
        <KpiCard icon={<CalendarMonthOutlinedIcon style={{ fontSize: 20 }} />} label="Caisse du mois" value={fmt(caisse?.caisse_du_mois?.total)} sub={`${caisse?.caisse_du_mois?.nb || 0} opération(s)`} tone="navy" />
        <KpiCard icon={<ReceiptLongOutlinedIcon style={{ fontSize: 20 }} />} label="Total encaissé" value={fmt(caisse?.total_encaisse)} sub={`sur ${fmt(caisse?.total_attendu)} attendu`} tone="navy" />
        <KpiCard icon={<WarningAmberOutlinedIcon style={{ fontSize: 20 }} />} label="Restant dû" value={fmt(caisse?.restant_du)} sub={`${caisse?.nb_echeances || 0} échéance(s)`} tone="red" />
        <KpiCard icon={<BarChartOutlinedIcon style={{ fontSize: 20 }} />} label="Taux de recouvrement" value={`${caisse?.taux_recouvrement ?? 0}%`} sub={`Pénalités : ${fmt(caisse?.penalites_cumulees)}`} tone="gold" />
      </StatGrid>

      {/* Paiements en attente - pleine largeur, si présents */}
      {attentes.length > 0 && (
        <Panel icon={<FolderCopyOutlinedIcon style={{ fontSize: 20 }} />} title="Paiements déclarés en attente de validation" subtitle="Espèces : l'occupant se présente au guichet, vous encaissez puis validez. Mobile Money : vous confirmez simplement le dépôt. Le quitus est émis à la validation.">
          <DataTable columns={attentesColumns} rows={attentes} empty="Aucun paiement en attente." pageSize={10} dense />
        </Panel>
      )}

      {/* Échéancier & Encaissements - pleine largeur */}
      <Panel icon={<ReceiptLongOutlinedIcon style={{ fontSize: 20 }} />} title="Échéancier & Encaissements" subtitle="Recouvrement manuel et statuts des redevances" padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <FilterBar onReset={() => { setQ(''); setStatut(''); }}>
            <FilterField label="Recherche">
              <Input placeholder="Occupant, local, localisation…" value={q} onChange={(e) => setQ(e.target.value)} />
            </FilterField>
            <FilterField label="Statut">
              <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="NON_ECHUE">Non échue</option>
                <option value="EXIGIBLE">Exigible</option>
                <option value="EN_RETARD">En retard</option>
                <option value="PAYEE">Payée</option>
              </Select>
            </FilterField>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          empty="Aucune échéance ne correspond aux filtres."
          pageSize={12}
          dense
        />
      </Panel>

      {/* Répartition par mode de règlement - pleine largeur */}
      <Panel icon={<PieChartOutlinedIcon style={{ fontSize: 20 }} />} title="Répartition par mode de règlement" subtitle="Volume encaissé par canal de paiement">
        <DoughnutChart data={parModeData} height={260} />
      </Panel>

      {/* Plus gros impayés & Arriérés critiques - pleine largeur */}
      <Panel
        icon={<WarningAmberOutlinedIcon style={{ fontSize: 20, color: 'var(--red, #dc2626)' }} />}
        title="Arriérés d'impayés & Alertes de recouvrement"
        subtitle="Seuil d'alerte : au-delà de 2 mois d'arriérés (60 jours), mise en demeure et engagement de la procédure de résiliation / libération des lieux."
      >
        {topDebiteurs.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucun impayé : parc locatif à jour.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {topDebiteurs.map((d, i) => (
              <div
                key={d.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: d.critique ? 'rgba(220, 38, 38, 0.04)' : 'var(--surface-2)',
                  border: d.critique ? '1.5px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--border)',
                  boxShadow: d.critique ? '0 2px 8px rgba(220, 38, 38, 0.08)' : 'var(--shadow-sm)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: d.critique ? 'var(--red, #dc2626)' : 'var(--slate-soft)',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      fontWeight: 900,
                      flexShrink: 0,
                      boxShadow: d.critique ? '0 2px 6px rgba(220, 38, 38, 0.35)' : 'none',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: d.critique ? 'var(--red, #b91c1c)' : 'var(--text-navy)' }}>
                      {d.occupant}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap', fontSize: 11 }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
                        {d.nb} échéance{d.nb > 1 ? 's' : ''} en retard ({d.nb} mois) · {d.local || 'Local non spécifié'}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 9px',
                          borderRadius: 6,
                          background: d.critique ? 'rgba(220, 38, 38, 0.12)' : 'rgba(217, 119, 6, 0.1)',
                          color: d.critique ? 'var(--red, #dc2626)' : 'var(--amber, #d97706)',
                          fontWeight: 800,
                          fontSize: 10.5,
                        }}
                      >
                        {d.critique
                          ? "🚨 Avis d'expulsion (Procédure de résiliation)"
                          : `⚠️ 1 mois de retard · Malus fidélité (${d.malus_points ?? -12} pts)`}
                      </span>
                      {!d.critique && d.score_fidelite != null && (
                        <span style={{ color: 'var(--muted)', fontSize: 10.5, fontWeight: 600 }}>
                          Score :{' '}
                          <strong style={{ color: d.score_fidelite < 50 ? 'var(--red)' : 'var(--text-navy)' }}>
                            {d.score_fidelite} pts
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 15,
                      fontWeight: 900,
                      color: d.critique ? 'var(--red, #dc2626)' : 'var(--text-navy)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {fmt(d.montant)}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--red, #dc2626)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>
                    Arriéré impayé
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Répartition des échéances - pleine largeur */}
      <Panel icon={<SquareFootOutlinedIcon style={{ fontSize: 20 }} />} title="Répartition des échéances par statut">
        <ProgressBars items={repartitionItems} />
      </Panel>

      {/* Journal des encaissements - pleine largeur */}
      <Panel icon={<TrendingUpOutlinedIcon style={{ fontSize: 20 }} />} title="Journal des encaissements (14 derniers jours)" subtitle="Évolution quotidienne des recettes">
        <LineChart labels={journalSeries.labels} series={journalSeries.series} height={220} />
      </Panel>

      {/* Registre des reçus - pleine largeur */}
      <Panel icon={<FolderCopyOutlinedIcon style={{ fontSize: 20 }} />} title="Registre des reçus" subtitle="Réédition des quitus émis (période / mode de règlement)">
        <FilterBar onReset={() => { const r = { debut: '', fin: '', mode: '' }; setRecusFiltre(r); chargerRecus(r); }}>
          <FilterField label="Du">
            <Input type="date" value={recusFiltre.debut}
              onChange={(e) => { const r = { ...recusFiltre, debut: e.target.value }; setRecusFiltre(r); chargerRecus(r); }} />
          </FilterField>
          <FilterField label="Au">
            <Input type="date" value={recusFiltre.fin}
              onChange={(e) => { const r = { ...recusFiltre, fin: e.target.value }; setRecusFiltre(r); chargerRecus(r); }} />
          </FilterField>
          <FilterField label="Mode">
            <Select value={recusFiltre.mode}
              onChange={(e) => { const r = { ...recusFiltre, mode: e.target.value }; setRecusFiltre(r); chargerRecus(r); }}>
              <option value="">Tous les modes</option>
              {MODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </FilterField>
        </FilterBar>
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--muted)' }}>
          Total de la période : <strong style={{ color: 'var(--text-navy)' }}>{fmt(recus.total)}</strong>
          {' '}({recus.resultats?.length || 0} reçu(s))
        </div>
        <DataTable columns={recusColumns} rows={recus.resultats || []} loading={recusLoading} empty="Aucun reçu sur cette période." pageSize={10} dense />
      </Panel>

      <Modal open={!!cible} onClose={() => setCible(null)} title="Encaisser une echeance" size="md">
        {cible && (
          <form onSubmit={encaisser}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5 }}>
              <div><strong>{cible.occupant_nom || 'Occupant'}</strong> · {cible.local_reference}</div>
              <div style={{ color: 'var(--muted)' }}>
                Exigible le {cible.date_exigibilite ? new Date(cible.date_exigibilite).toLocaleDateString('fr-FR') : '-'} ·
                {' '}Du : {fmt(cible.montant_du)}{Number(cible.montant_penalite) > 0 ? ` + penalite ${fmt(cible.montant_penalite)}` : ''}
              </div>
            </div>
            <Field label="Montant regle" hint="Réglement partiel autorisé" required>
              <Input type="number" min="1" step="1" value={form.montant_regle}
                onChange={(e) => setForm({ ...form, montant_regle: e.target.value })} required />
            </Field>
            {Number(form.montant_regle) > 0 && Number(form.montant_regle) < (Number(cible.montant_du) + Number(cible.montant_penalite)) && (
              <p style={{ fontSize: 12, color: 'var(--gold-deep, var(--gold))', margin: '-8px 0 12px' }}>
                Règlement partiel - reste à payer estimé : {fmt((Number(cible.montant_du) + Number(cible.montant_penalite)) - Number(form.montant_regle))}
              </p>
            )}
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

      <QuitusFormatModal quitus={quitusAffiche} onClose={() => setQuitusAffiche(null)} />
    </div>
  );
}
