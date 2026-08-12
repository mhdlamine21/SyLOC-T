import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getContrats } from '../../api/contrats';
import { messageErreur } from '../../api/utils';
import { Button, Select } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, Pill, SplitLayout,
  ProgressRow, MiniStat, RowActions, IconButton,
} from '../common/dashboard';

const STATUT_TONE = { PAYEE: 'green', EXIGIBLE: 'gold', EN_RETARD: 'red', NON_ECHUE: 'slate' };
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

/**
 * Espace occupant : bail domanial, echeancier complet et indicateurs de
 * regularite (utilise aussi par le service comptable pour consulter les baux).
 */
export default function EspaceOccupant() {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getContrats()
      .then((d) => {
        setContrats(d);
        if (d?.length) setSelId(d[0].id);
      })
      .catch((e) => toast.error(messageErreur(e, 'Erreur de chargement des contrats.')))
      .finally(() => setLoading(false));
  }, []);

  const contrat = useMemo(
    () => contrats.find((c) => c.id === selId) || contrats[0] || null,
    [contrats, selId],
  );

  const echeances = contrat?.echeances || [];
  const stats = useMemo(() => {
    const total = echeances.reduce((s, e) => s + Number(e.montant_du || 0), 0);
    const payees = echeances.filter((e) => e.statut === 'PAYEE');
    const paye = payees.reduce((s, e) => s + Number(e.montant_du || 0), 0);
    const retard = echeances.filter((e) => e.statut === 'EN_RETARD');
    const prochaine = echeances
      .filter((e) => e.statut !== 'PAYEE')
      .sort((a, b) => new Date(a.date_exigibilite) - new Date(b.date_exigibilite))[0];
    return {
      total, paye, reste: total - paye,
      nbPayees: payees.length,
      nbRetard: retard.length,
      penalites: echeances.reduce((s, e) => s + Number(e.montant_penalite || 0), 0),
      prochaine,
    };
  }, [echeances]);

  const columns = [
    {
      key: 'idx',
      label: 'Echeance',
      render: (r) => {
        const i = echeances.indexOf(r);
        return <strong style={{ fontFamily: 'var(--font-mono)' }}>Mois #{i + 1}</strong>;
      },
    },
    { key: 'date_exigibilite', label: 'Date limite', render: (r) => (r.date_exigibilite ? new Date(r.date_exigibilite).toLocaleDateString('fr-FR') : '—') },
    { key: 'montant_du', label: 'Montant', align: 'right', render: (r) => fmt(r.montant_du) },
    {
      key: 'montant_penalite',
      label: 'Penalite',
      align: 'right',
      render: (r) => (Number(r.montant_penalite) > 0 ? <span style={{ color: 'var(--red)' }}>{fmt(r.montant_penalite)}</span> : '—'),
    },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (r) => (
        <RowActions>
          {r.statut === 'PAYEE'
            ? <IconButton title="Quitus disponible au guichet" tone="green" onClick={() => navigate('/paiement')}>🧾</IconButton>
            : <IconButton title="Regler cette echeance" tone="gold" onClick={() => navigate('/paiement')}>💳</IconButton>}
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="🏢"
        title="Mon contrat & echeancier"
        subtitle="Consultation de votre bail domanial, de l'echeancier des redevances et de vos quitus."
        actions={contrats.length > 1 ? (
          <Select value={selId} onChange={(e) => setSelId(e.target.value)} style={{ minWidth: 220 }}>
            {contrats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.local_reference || 'Bail'} — {c.demandeur_nom || ''}
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
          <StatGrid cols={4}>
            <KpiCard
              icon="💰" label="Redevance mensuelle"
              value={contrat.est_gratuit ? 'Gratuit' : fmt(contrat.redevance_mensuelle)}
              sub={contrat.est_gratuit ? 'Exoneration etudiante' : `Caution : ${fmt(contrat.montant_caution)}`}
              tone={contrat.est_gratuit ? 'green' : 'navy'}
            />
            <KpiCard icon="✅" label="Echeances reglees" value={`${stats.nbPayees}/${echeances.length}`} sub={fmt(stats.paye)} tone="green" />
            <KpiCard icon="⚠️" label="Restant du" value={fmt(stats.reste)} sub={`${stats.nbRetard} en retard`} tone={stats.nbRetard ? 'red' : 'gold'} />
            <KpiCard
              icon="📅" label="Prochaine echeance"
              value={stats.prochaine?.date_exigibilite ? new Date(stats.prochaine.date_exigibilite).toLocaleDateString('fr-FR') : '—'}
              sub={stats.prochaine ? fmt(stats.prochaine.montant_du) : 'Echeancier solde'}
              tone="gold"
            />
          </StatGrid>

          <SplitLayout ratio="1.7fr 1fr">
            <Panel icon="📋" title="Echeancier des redevances" subtitle="Statut des reglements et emission des quitus" padded={false}>
              <DataTable columns={columns} rows={echeances} empty="Aucune echeance generee (bail gratuit)." pageSize={12} dense />
            </Panel>

            <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <Panel icon="📜" title="Bail domanial">
                <div style={{ display: 'grid', gap: 8 }}>
                  <MiniStat icon="🏠" label="Local attribue" value={contrat.local_reference || contrat.local} />
                  <MiniStat icon="👤" label="Titulaire" value={contrat.demandeur_nom || '—'} tone="navy" />
                  <MiniStat icon="📅" label="Date d'effet" value={contrat.date_debut || '—'} />
                  <MiniStat icon="⏳" label="Duree" value={`${contrat.duree_mois || 0} mois`} />
                  <MiniStat icon="🔔" label="Preavis" value={`${contrat.preavis_mois || 0} mois`} />
                  <MiniStat
                    icon="🚦" label="Etat du bail"
                    value={contrat.est_actif ? 'Actif' : `Resilie ${contrat.date_resiliation || ''}`}
                    tone={contrat.est_actif ? 'green' : 'red'}
                  />
                </div>
                {contrat.motif_resiliation && (
                  <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 10 }}>Motif : {contrat.motif_resiliation}</p>
                )}
                <Button variant="secondary" size="sm" style={{ marginTop: 12 }} onClick={() => window.print()}>
                  🖨️ Imprimer le bail
                </Button>
              </Panel>

              <Panel icon="📊" title="Regularite de paiement">
                <ProgressRow label="Echeances reglees" value={stats.nbPayees} total={echeances.length || 1} tone="green" />
                <ProgressRow label="Montant recouvre" value={stats.paye} total={stats.total || 1} tone="navy" />
                {stats.penalites > 0 && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: 0 }}>
                    Penalites de retard cumulees : <strong>{fmt(stats.penalites)}</strong>
                  </p>
                )}
              </Panel>
            </div>
          </SplitLayout>
        </>
      )}
    </div>
  );
}
