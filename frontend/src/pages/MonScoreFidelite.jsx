import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMonScoreFidelite, getClassementFidelite } from '../api/fidelite';
import { messageErreur } from '../api/utils';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, SplitLayout, ProgressRow, Pill, RankList,
} from '../components/common/dashboard';

/**
 * Score de fidelite de l'usager : indicateur global + historique detaille
 * des points gagnes/perdus (paiements, avis, sanctions).
 */
export default function MonScoreFidelite() {
  const [data, setData] = useState({ score_actuel: 0, historique: [] });
  const [topOccupants, setTopOccupants] = useState([]);
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
    
    getClassementFidelite(10).then(d => setTopOccupants(Array.isArray(d) ? d : [])).catch(() => null);
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MilitaryTechOutlinedIcon style={{ fontSize: 20 }} />}
        title="Mon score de fidelite"
        subtitle="Votre comportement d'occupant est valorise : paiements a l'heure, avis deposes, absence de sanction."
      />

      <StatGrid cols={3}>
        <KpiCard icon={<MilitaryTechOutlinedIcon style={{ fontSize: 20 }} />} label="Score actuel" value={data.score_actuel.toFixed(1)} sub={niveau.label} tone={niveau.tone} />
        <KpiCard icon={<TrendingUpOutlinedIcon style={{ fontSize: 20 }} />} label="Points gagnes" value={`+${totalGains.toFixed(0)}`} sub={`${gains.length} evenement(s)`} tone="green" />
        <KpiCard icon={<TrendingDownOutlinedIcon style={{ fontSize: 20 }} />} label="Points perdus" value={`-${totalPertes.toFixed(0)}`} sub={`${pertes.length} sanction(s)`} tone="red" />
      </StatGrid>

      <SplitLayout ratio="1.6fr 1fr">
        <div className="flex flex-col gap-6">
          <Panel icon={<ScheduleOutlinedIcon style={{ fontSize: 20 }} />} title="Historique des mouvements" subtitle="Chaque action sur votre dossier modifie votre score">
            {hist.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Aucun mouvement enregistré pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-3 mt-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {hist.map((r, i) => {
                  const p = Number(r.points_modifies);
                  const isPositive = p >= 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {isPositive ? <TrendingUpOutlinedIcon fontSize="small" /> : <TrendingDownOutlinedIcon fontSize="small" />}
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-ink">{r.motif || '—'}</p>
                          <p className="text-[11px] text-muted font-mono mt-0.5 uppercase tracking-wider">
                            {r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Pill tone={isPositive ? 'green' : 'red'}>{isPositive ? `+${p}` : p}</Pill>
                        <p className="text-[10px] text-muted font-mono mt-1.5 opacity-70">SCORE : {Number(r.nouveau_score ?? 0).toFixed(1)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel icon={<MilitaryTechOutlinedIcon style={{ fontSize: 20 }} />} title="Classement (Top 10)" subtitle="Les occupants les plus exemplaires">
            <RankList
              items={topOccupants.map((o) => ({
                key: o.demandeur_id,
                title: o.nom,
                subtitle: `Niveau ${o.palier}`,
                value: o.score != null ? `${Number(o.score).toFixed(0)} pts` : '—',
              }))}
              empty="Aucun occupant classé."
            />
          </Panel>
        </div>

        <Panel icon={<InfoOutlinedIcon style={{ fontSize: 20 }} />} title="Comment gagner des points ?">
          <ProgressRow label="Progression vers le niveau exemplaire (100 pts)" value={Math.max(0, data.score_actuel)} total={100} tone="green" />
          
          <div className="mt-6 space-y-1">
            {[
              { text: "Règlement d'une échéance", pts: "+5", tone: "green" },
              { text: "Échéance en retard / Impayé", pts: "-5 à -15", tone: "red" },
              { text: "Avis cantine positif (4-5★)", pts: "+2", tone: "green" },
              { text: "Avis cantine neutre (3★)", pts: "+1", tone: "green" },
              { text: "Avis cantine négatif (1-2★)", pts: "-2", tone: "red" },
              { text: "Signalement de problème", pts: "-5", tone: "red" },
              { text: "Avertissement", pts: "-10", tone: "red" },
              { text: "Rappel à l'ordre", pts: "-15", tone: "red" },
              { text: "Convocation", pts: "-20", tone: "red" },
              { text: "Expulsion", pts: "-50", tone: "red" },
            ].map((rule, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                <span className="text-[13px] text-ink/90 font-medium">{rule.text}</span>
                <Pill tone={rule.tone}>{rule.pts} pts</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </SplitLayout>
    </div>
  );
}

