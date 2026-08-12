import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMonScoreFidelite } from '../api/fidelite';
import { messageErreur } from '../api/utils';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, SplitLayout, ProgressRow, Pill,
} from '../components/common/dashboard';

/**
 * Score de fidelite de l'usager : indicateur global + historique detaille
 * des points gagnes/perdus (paiements, avis, sanctions).
 */
export default function MonScoreFidelite() {
  const [data, setData] = useState({ score_actuel: 0, historique: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMonScoreFidelite();
        setData({
          score_actuel: Number(res?.score_actuel ?? 0),
          historique: Array.isArray(res?.historique) ? res.historique : [],
        });
      } catch (e) {
        toast.error(messageErreur(e, 'Impossible de charger votre score de fidelite.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hist = data.historique;
  const gains = hist.filter((h) => Number(h.points_modifies) > 0);
  const pertes = hist.filter((h) => Number(h.points_modifies) < 0);
  const totalGains = gains.reduce((s, h) => s + Number(h.points_modifies), 0);
  const totalPertes = pertes.reduce((s, h) => s + Math.abs(Number(h.points_modifies)), 0);

  const niveau =
    data.score_actuel >= 100 ? { label: 'Occupant exemplaire', tone: 'green' }
      : data.score_actuel >= 50 ? { label: 'Bon dossier', tone: 'navy' }
        : data.score_actuel >= 0 ? { label: 'Dossier standard', tone: 'gold' }
          : { label: 'Dossier a risque', tone: 'red' };

  const columns = [
    {
      key: 'date_creation',
      label: 'Date',
      render: (r) => (r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }) : '—'),
    },
    { key: 'motif', label: 'Motif', render: (r) => r.motif || '—' },
    {
      key: 'points_modifies',
      label: 'Points',
      align: 'right',
      render: (r) => {
        const p = Number(r.points_modifies);
        return <Pill tone={p >= 0 ? 'green' : 'red'}>{p >= 0 ? `+${p}` : p}</Pill>;
      },
    },
    {
      key: 'nouveau_score',
      label: 'Score apres',
      align: 'right',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
          {Number(r.nouveau_score ?? 0).toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="🏅"
        title="Mon score de fidelite"
        subtitle="Votre comportement d'occupant est valorise : paiements a l'heure, avis deposes, absence de sanction."
      />

      <StatGrid cols={4}>
        <KpiCard icon="🏅" label="Score actuel" value={data.score_actuel.toFixed(1)} sub={niveau.label} tone={niveau.tone} />
        <KpiCard icon="📈" label="Points gagnes" value={`+${totalGains.toFixed(0)}`} sub={`${gains.length} evenement(s)`} tone="green" />
        <KpiCard icon="📉" label="Points perdus" value={`-${totalPertes.toFixed(0)}`} sub={`${pertes.length} sanction(s)`} tone="red" />
        <KpiCard icon="🧾" label="Mouvements" value={hist.length} sub="Historique complet" tone="slate" />
      </StatGrid>

      <SplitLayout ratio="1.6fr 1fr">
        <Panel icon="🕑" title="Historique des mouvements" subtitle="Chaque action sur votre dossier modifie votre score">
          <DataTable
            columns={columns}
            rows={hist}
            loading={loading}
            empty="Aucun mouvement enregistre pour le moment."
            pageSize={10}
            dense
          />
        </Panel>

        <Panel icon="ℹ️" title="Comment gagner des points ?">
          <ProgressRow label="Progression vers le niveau exemplaire (100 pts)" value={Math.max(0, data.score_actuel)} total={100} tone="green" />
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12.4, color: 'var(--text)', lineHeight: 1.85 }}>
            <li>Reglement d&apos;une echeance : <strong>+5 pts</strong></li>
            <li>Depot d&apos;un avis cantine : <strong>+2 pts</strong></li>
            <li>Avertissement : <strong>-10 pts</strong></li>
            <li>Rappel a l&apos;ordre : <strong>-15 pts</strong></li>
            <li>Convocation : <strong>-20 pts</strong></li>
            <li>Expulsion : <strong>-50 pts</strong></li>
          </ul>
        </Panel>
      </SplitLayout>
    </div>
  );
}
