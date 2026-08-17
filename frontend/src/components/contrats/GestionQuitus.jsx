import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import MoneyOutlinedIcon from '@mui/icons-material/MoneyOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllQuitus, getEspecesEnAttente, validerPaiement } from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import { Button } from '../common/ui';
import {
  DataTable, FilterBar, FilterField, IdentityCell, KpiCard,
  PageHeader, Panel, Pill, RowActions, StatGrid,
} from '../common/dashboard';

const fmt = (n) => `${(+n || 0).toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-');
const fmtPeriode = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '-';

const MODE_TONE = { ESPECES: 'gold', MOBILE_MONEY: 'blue' };
const MODE_ICON = {
  ESPECES: <MoneyOutlinedIcon style={{ fontSize: 14 }} />,
  MOBILE_MONEY: <PhoneAndroidOutlinedIcon style={{ fontSize: 14 }} />,
};

const ANNEE_OPTS = Array.from({ length: 4 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: String(y), label: String(y) };
});
const MOIS_OPTS = [
  { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
];

const selStyle = {
  padding: '6px 10px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  cursor: 'pointer',
};

function printQuitus(q) {
  const win = window.open('', '_blank', 'width=720,height=950');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8">
    <title>Quitus - ${q.reference_quitus}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',sans-serif;background:#fff;color:#1e293b;padding:48px}
      .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1e3a5f;margin-bottom:28px}
      .org{font-size:22px;font-weight:700;color:#1e3a5f}.org small{display:block;font-size:12px;font-weight:400;color:#64748b;margin-top:3px}
      .badge{background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 18px;text-align:right}
      .badge .lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
      .badge .ref{font-size:14px;font-weight:700;color:#1e3a5f;margin-top:3px;font-family:monospace}
      h2{font-size:17px;font-weight:700;color:#1e3a5f;margin-bottom:20px}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
      .row .lbl{color:#64748b}.row .val{font-weight:600}
      .amount{font-size:28px;font-weight:800;color:#1e3a5f;text-align:center;margin:28px 0;padding:20px;background:#f0f9ff;border-radius:12px;border:2px solid #bae6fd}
      .stamp{text-align:center;margin-top:32px}
      .stamp span{color:#16a34a;font-weight:700;font-size:15px;border:2px solid #16a34a;display:inline-block;padding:8px 28px;border-radius:8px}
      .footer{margin-top:44px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px}
      @media print{body{padding:24px}}
    </style></head><body>
    <div class="hd">
      <div class="org">CROUS-T - SyLOC-T<small>Système de Gestion des Locaux Commerciaux</small></div>
      <div class="badge"><div class="lbl">Référence Quitus</div><div class="ref">${q.reference_quitus}</div></div>
    </div>
    <h2>Quittance de Paiement</h2>
    <div class="row"><span class="lbl">Occupant</span><span class="val">${q.occupant_nom || '-'}</span></div>
    <div class="row"><span class="lbl">Local</span><span class="val">${q.local_reference || '-'}</span></div>
    <div class="row"><span class="lbl">Contrat</span><span class="val">${q.contrat_reference || '-'}</span></div>
    <div class="row"><span class="lbl">Période</span><span class="val">${fmtPeriode(q.date_exigibilite)}</span></div>
    <div class="row"><span class="lbl">Date de paiement</span><span class="val">${q.date_paiement ? new Date(q.date_paiement).toLocaleString('fr-FR') : '-'}</span></div>
    <div class="row"><span class="lbl">Mode de règlement</span><span class="val">${q.mode_libelle || q.mode}</span></div>
    <div class="amount">${(+q.montant_regle || 0).toLocaleString('fr-FR')} FCFA</div>
    <div class="stamp"><span>✓ PAIEMENT VALIDÉ</span></div>
    <div class="footer">Ce document constitue une preuve officielle de paiement émise par le CROUS-T via SyLOC-T.<br>${q.reference_quitus}</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

const COLS_ATTENTE = [
  {
    key: 'occupant_nom',
    label: 'Occupant',
    render: (r) => <IdentityCell primary={r.occupant_nom} secondary={r.local_reference} />,
  },
  {
    key: 'contrat_reference',
    label: 'Contrat',
    render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.contrat_reference || '-'}</span>,
  },
  {
    key: 'date_exigibilite',
    label: 'Période',
    render: (r) => fmtPeriode(r.date_exigibilite),
  },
  { key: 'montant_regle', label: 'Montant', render: (r) => <strong>{fmt(r.montant_regle)}</strong> },
  { key: 'date_paiement', label: 'Déclaré le', render: (r) => fmtDate(r.date_paiement) },
];

const COLS_QUITUS = [
  {
    key: 'reference_quitus',
    label: 'Référence',
    render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--navy, #1e3a5f)', fontWeight: 700 }}>
        {r.reference_quitus}
      </span>
    ),
  },
  {
    key: 'occupant_nom',
    label: 'Occupant',
    render: (r) => <IdentityCell primary={r.occupant_nom} secondary={r.local_reference} />,
  },
  {
    key: 'mode',
    label: 'Mode',
    render: (r) => (
      <Pill tone={MODE_TONE[r.mode] || 'slate'} icon={MODE_ICON[r.mode]}>
        {r.mode_libelle}
      </Pill>
    ),
  },
  { key: 'date_exigibilite', label: 'Période', render: (r) => fmtPeriode(r.date_exigibilite) },
  { key: 'montant_regle', label: 'Montant', render: (r) => <strong>{fmt(r.montant_regle)}</strong> },
  { key: 'date_paiement', label: 'Validé le', render: (r) => fmtDate(r.date_paiement) },
];

function PanelEnAttente() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getEspecesEnAttente()); }
    catch (e) { toast.error(messageErreur(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleValider = async (id) => {
    setValidating(id);
    try {
      await validerPaiement(id);
      toast.success('Paiement validé - quitus généré et disponible pour l\'occupant !');
      load();
    } catch (e) {
      toast.error(messageErreur(e));
    } finally {
      setValidating(null);
    }
  };

  const cols = [
    ...COLS_ATTENTE,
    {
      key: '_actions',
      label: 'Action',
      render: (r) => (
        <RowActions>
          <Button
            variant="success"
            size="sm"
            disabled={validating === r.id}
            onClick={() => handleValider(r.id)}
            id={`valider-especes-${r.id}`}
          >
            <CheckCircleOutlineIcon style={{ fontSize: 15, marginRight: 4 }} />
            {validating === r.id ? 'Validation…' : 'Valider'}
          </Button>
        </RowActions>
      ),
    },
  ];

  const items = Array.isArray(data) ? data : [];

  return (
    <Panel
      icon={<HourglassEmptyOutlinedIcon style={{ fontSize: 20 }} />}
      title={`Espèces en attente de validation (${items.length})`}
      badge={items.length > 0 ? { label: `${items.length} à traiter`, tone: 'red' } : undefined}
    >
      {!loading && items.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 0', fontSize: 13.5 }}>
          ✓ Aucun paiement en espèces en attente de validation.
        </p>
      ) : (
        <DataTable columns={cols} rows={items.map((d) => ({ ...d, key: d.id }))} loading={loading} />
      )}
    </Panel>
  );
}

function PanelTousQuitus({ readOnly = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState('');
  const [mois, setMois] = useState('');
  const [mode, setMode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (annee) params.annee = annee;
      if (mois) params.mois = mois;
      if (mode) params.mode = mode;
      const res = await getAllQuitus(params);
      setData(Array.isArray(res) ? res : []);
    } catch (e) {
      toast.error(messageErreur(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [annee, mois, mode]);

  useEffect(() => { load(); }, [load]);

  const items = Array.isArray(data) ? data : [];
  const total = items.reduce((s, q) => s + (q.montant_regle || 0), 0);

  const dlCol = {
    key: '_dl',
    label: '',
    render: (r) => (
      <RowActions>
        <Button variant="ghost" size="sm" onClick={() => printQuitus(r)} id={`dl-quitus-${r.id}`}>
          <DownloadOutlinedIcon style={{ fontSize: 15, marginRight: 4 }} />
          PDF
        </Button>
      </RowActions>
    ),
  };

  const cols = [...COLS_QUITUS, dlCol];

  return (
    <Panel
      icon={<ReceiptLongOutlinedIcon style={{ fontSize: 20 }} />}
      title="Tous les quitus émis"
    >
      <FilterBar>
        <FilterField label="Année">
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={selStyle}>
            <option value="">Toutes</option>
            {ANNEE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Mois">
          <select value={mois} onChange={(e) => setMois(e.target.value)} style={selStyle}>
            <option value="">Tous</option>
            {MOIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Mode">
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={selStyle}>
            <option value="">Tous</option>
            <option value="ESPECES">Espèces</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
          </select>
        </FilterField>
      </FilterBar>

      <StatGrid cols={3} style={{ marginBottom: 20 }}>
        <KpiCard icon={<VerifiedOutlinedIcon />} label="Quitus émis" value={items.length} tone="blue" />
        <KpiCard
          icon={<MoneyOutlinedIcon />}
          label="Espèces validées"
          value={items.filter((q) => q.mode === 'ESPECES').length}
          tone="gold"
        />
        <KpiCard icon={<ReceiptLongOutlinedIcon />} label="Total encaissé" value={fmt(total)} tone="green" />
      </StatGrid>

      <DataTable columns={cols} rows={items.map((d) => ({ ...d, key: d.id }))} loading={loading} />
    </Panel>
  );
}

const TABS = [
  { id: 'attente', label: 'En attente (espèces)', icon: <HourglassEmptyOutlinedIcon style={{ fontSize: 16 }} /> },
  { id: 'quitus', label: 'Tous les quitus', icon: <ReceiptLongOutlinedIcon style={{ fontSize: 16 }} /> },
];

export default function GestionQuitus({ readOnly = false }) {
  const [tab, setTab] = useState(readOnly ? 'quitus' : 'attente');

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Quitus & Reçus"
        subtitle={
          readOnly
            ? 'Vue lecture - Directeur CROUS-T'
            : 'Validation des espèces & registre des quitus émis'
        }
        icon={<ReceiptLongOutlinedIcon style={{ fontSize: 26 }} />}
      />

      {!readOnly && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 28,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-quitus-${t.id}`}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #2563eb' : '2px solid transparent',
                background: 'none',
                color: tab === t.id ? '#2563eb' : 'var(--text-muted)',
                fontWeight: tab === t.id ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {tab === 'attente' && !readOnly && <PanelEnAttente />}
        {tab === 'quitus' && <PanelTousQuitus readOnly={readOnly} />}
      </div>
    </div>
  );
}
