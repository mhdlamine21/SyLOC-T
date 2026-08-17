import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import TrafficOutlinedIcon from '@mui/icons-material/TrafficOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getContrats } from '../../api/contrats';
import { getPaiements, getQuitusPaiement } from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import { Button, Select } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, Pill, SplitLayout,
  ProgressRow, MiniStat, RowActions, IconButton,
} from '../common/dashboard';
import QuitusFormatModal from './QuitusFormatModal';
import { ouvrirBailPDF } from '../../utils/pdfGenerator';

const STATUT_TONE = { PAYEE: 'green', EXIGIBLE: 'gold', EN_RETARD: 'red', NON_ECHUE: 'slate' };
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

/**
 * Espace occupant : bail domanial, echeancier complet, historique des
 * paiements et reedition des quitus (Ticket ou Facture A4).
 */
export default function EspaceOccupant() {
  const { role } = useAuth();
  const [contrats, setContrats] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState('');
  const [quitusAffiche, setQuitusAffiche] = useState(null);

  useEffect(() => {
    Promise.all([getContrats(), getPaiements()])
      .then(([c, p]) => {
        setContrats(c);
        setPaiements(p);
        if (c?.length) setSelId(c[0].id);
      })
      .catch((e) => toast.error(messageErreur(e, 'Erreur de chargement des contrats.')))
      .finally(() => setLoading(false));
  }, []);

  const contrat = useMemo(
    () => contrats.find((c) => c.id === selId) || contrats[0] || null,
    [contrats, selId],
  );

  const echeances = contrat?.echeances || [];

  const historique = useMemo(
    () => paiements
      .filter((p) => p.contrat_id === contrat?.id)
      .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement)),
    [paiements, contrat],
  );

  const stats = useMemo(() => {
    const total = echeances.reduce((s, e) => s + Number(e.montant_du || 0) + Number(e.montant_penalite || 0), 0);
    const payees = echeances.filter((e) => e.statut === 'PAYEE');
    const paye = historique.reduce((s, p) => s + Number(p.montant_regle || 0), 0);
    const retard = echeances.filter((e) => e.statut === 'EN_RETARD');
    const prochaine = echeances
      .filter((e) => e.statut !== 'PAYEE')
      .sort((a, b) => new Date(a.date_exigibilite) - new Date(b.date_exigibilite))[0];
    return {
      total, paye, reste: Math.max(total - paye, 0),
      nbPayees: payees.length,
      nbRetard: retard.length,
      penalites: echeances.reduce((s, e) => s + Number(e.montant_penalite || 0), 0),
      prochaine,
    };
  }, [echeances, historique]);

  const rejouerQuitus = async (paiement) => {
    try {
      const quitus = await getQuitusPaiement(paiement.id);
      setQuitusAffiche(quitus);
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de récupérer ce quitus."));
    }
  };

  const columns = [
    {
      key: 'idx',
      label: 'Echeance',
      render: (r) => {
        const i = echeances.indexOf(r);
        return <strong style={{ fontFamily: 'var(--font-mono)' }}>Mois #{i + 1}</strong>;
      },
    },
    { key: 'date_exigibilite', label: 'Date limite', render: (r) => (r.date_exigibilite ? new Date(r.date_exigibilite).toLocaleDateString('fr-FR') : '-') },
    { key: 'montant_du', label: 'Montant', align: 'right', render: (r) => fmt(r.montant_du) },
    {
      key: 'montant_penalite',
      label: 'Penalite',
      align: 'right',
      render: (r) => (Number(r.montant_penalite) > 0 ? <span style={{ color: 'var(--red)' }}>{fmt(r.montant_penalite)}</span> : '-'),
    },
    {
      key: 'reste_a_payer',
      label: 'Reste à payer',
      align: 'right',
      render: (r) => (r.reste_a_payer != null ? fmt(r.reste_a_payer) : '-'),
    },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    {
      key: 'quitus',
      label: 'Quitus',
      align: 'right',
      render: (r) => {
        const paiementLie = r.statut === 'PAYEE'
          ? historique.find((p) => p.echeance === r.id || p.echeance_id === r.id)
          : null;
        return (
          <Button
            variant="secondary"
            size="sm"
            disabled={r.statut !== 'PAYEE' || !paiementLie}
            onClick={() => paiementLie && rejouerQuitus(paiementLie)}
            style={{ padding: '5px 12px', fontSize: 11.5 }}
          >
            <DownloadOutlinedIcon style={{ fontSize: 15 }} /> Télécharger mon quitus
          </Button>
        );
      },
    },
  ];

  const historiqueColumns = [
    {
      key: 'date_paiement',
      label: 'Date',
      render: (r) => (r.date_paiement ? new Date(r.date_paiement).toLocaleString('fr-FR') : '-'),
    },
    { key: 'reference_quitus', label: 'N° Quitus', render: (r) => r.reference_quitus || '-' },
    { key: 'mode_libelle', label: 'Mode', render: (r) => r.mode_libelle || r.mode || '-' },
    { key: 'montant_regle', label: 'Montant', align: 'right', render: (r) => fmt(r.montant_regle) },
    {
      key: 'actions',
      label: 'Quitus',
      align: 'right',
      render: (r) => {
        if (r.statut === 'EN_ATTENTE') {
          return (
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#b45309',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: 6,
              padding: '3px 8px',
            }}
              title={r.mode === 'ESPECES'
                ? "Présentez-vous au Service Comptable pour remettre le montant : votre quitus sera émis après encaissement."
                : "Le Service Comptable doit confirmer votre dépôt Mobile Money avant l'émission du quitus."}
            >
              ⏳ {r.mode === 'ESPECES' ? 'À régler au Service Comptable' : 'En attente de confirmation'}
            </span>
          );
        }
        if (!r.reference_quitus) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>;
        return (
          <RowActions>
            <IconButton title="Réimprimer le quitus" tone="navy" onClick={() => rejouerQuitus(r)}>
              <PrintOutlinedIcon style={{ fontSize: 17 }} />
            </IconButton>
          </RowActions>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<ApartmentOutlinedIcon style={{ fontSize: 20 }} />}
        title="Mon contrat & echeancier"
        subtitle="Consultation de votre bail domanial, de l'echeancier des redevances et de vos quitus."
        actions={contrats.length > 1 ? (
          <Select value={selId} onChange={(e) => setSelId(e.target.value)} style={{ minWidth: 220 }}>
            {contrats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.local_reference || 'Bail'} - {c.demandeur_nom || ''}
              </option>
            ))}
          </Select>
        ) : null}
      />

      {loading ? (
        <Panel><p style={{ color: 'var(--muted)', margin: 0 }}>Recherche de vos baux domaniaux…</p></Panel>
      ) : !contrat ? (
        <Panel><p style={{ color: 'var(--muted)', margin: 0 }}>Aucun contrat actif pour le moment.</p></Panel>
      ) : (
        <>
          {stats.nbRetard > 0 && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.06)',
              border: '1.5px solid rgba(220, 38, 38, 0.3)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--red, #dc2626)', color: '#ffffff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <WarningAmberOutlinedIcon style={{ fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--red, #b91c1c)', fontSize: 13.5 }}>
                      Arriéré détecté : {stats.nbRetard} échéance(s) en retard
                    </strong>
                    <span style={{ padding: '1px 6px', borderRadius: 4, background: 'var(--red, #dc2626)', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                      Malus fidélité actif
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-navy)' }}>
                    Reste total à régler : <strong>{fmt(stats.reste)}</strong> (dont {fmt(stats.penalites)} de pénalités). Chaque retard baisse votre score de fidélité.
                  </p>
                </div>
              </div>
              {role === 'OCCUPANT' && (
                <a href="/paiement" style={{ textDecoration: 'none' }}>
                  <Button variant="danger" size="sm">
                    💳 Régulariser mes redevances
                  </Button>
                </a>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gap: 24 }}>
            <Panel icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />} title="Echeancier des redevances" subtitle="Statut des reglements" padded={false}>
              <DataTable columns={columns} rows={echeances} empty="Aucune echeance generee (bail gratuit)." pageSize={12} dense />
            </Panel>

            <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              {role === 'OCCUPANT' && (
                <Panel icon={<HistoryEduOutlinedIcon style={{ fontSize: 20 }} />} title="Bail domanial">
                  <div style={{ display: 'grid', gap: 8 }}>
                    <MiniStat icon={<HomeOutlinedIcon style={{ fontSize: 20 }} />} label="Local attribue" value={contrat.local_reference || contrat.local} />
                    <MiniStat icon={<PersonOutlineOutlinedIcon style={{ fontSize: 20 }} />} label="Titulaire" value={contrat.demandeur_nom || '-'} tone="navy" />
                    <MiniStat icon={<EventOutlinedIcon style={{ fontSize: 20 }} />} label="Date d'effet" value={contrat.date_debut || '-'} />
                    <MiniStat icon={<HourglassEmptyOutlinedIcon style={{ fontSize: 20 }} />} label="Duree" value={`${contrat.duree_mois || 0} mois`} />
                    <MiniStat icon={<NotificationsOutlinedIcon style={{ fontSize: 20 }} />} label="Preavis" value={`${contrat.preavis_mois || 0} mois`} />
                    <MiniStat
                      icon={<TrafficOutlinedIcon style={{ fontSize: 20 }} />} label="Etat du bail"
                      value={contrat.est_actif ? 'Actif' : `Resilie ${contrat.date_resiliation || ''}`}
                      tone={contrat.est_actif ? 'green' : 'red'}
                    />
                  </div>
                  {contrat.motif_resiliation && (
                    <p style={{ fontSize: 12, color: 'var(--red)', margin: '10px 0 0' }}>Motif : {contrat.motif_resiliation}</p>
                  )}
                  <Button variant="secondary" size="sm" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => ouvrirBailPDF(contrat)}>
                    <DownloadOutlinedIcon style={{ fontSize: 16 }} /> Consulter le bail (PDF)
                  </Button>
                </Panel>
              )}

              <Panel icon={<BarChartOutlinedIcon style={{ fontSize: 20 }} />} title="Avancement des paiements">
                <ProgressRow label="Échéances payées" value={stats.nbPayees} total={echeances.length || 1} tone="green" />
                <ProgressRow label="Montant total payé" value={stats.paye} total={stats.total || 1} tone="navy" />
                {stats.penalites > 0 && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: 0 }}>
                    Penalites de retard cumulees : <strong>{fmt(stats.penalites)}</strong>
                  </p>
                )}
              </Panel>
            </div>
          </div>

          <Panel icon={<ReceiptLongOutlinedIcon style={{ fontSize: 20 }} />} title="Historique des paiements" subtitle="Quitus émis pour ce contrat" padded={false}>
            <DataTable columns={historiqueColumns} rows={historique} empty="Aucun paiement enregistré pour ce bail." pageSize={10} dense />
          </Panel>
        </>
      )}

      <QuitusFormatModal quitus={quitusAffiche} onClose={() => setQuitusAffiche(null)} />
    </div>
  );
}


