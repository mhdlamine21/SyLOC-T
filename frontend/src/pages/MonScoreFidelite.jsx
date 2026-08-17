import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingFlatOutlinedIcon from '@mui/icons-material/TrendingFlatOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getMonScoreFidelite } from '../api/fidelite';
import { messageErreur } from '../api/utils';
import {
  PageHeader, Panel, SplitLayout, ProgressRow, Pill,
} from '../components/common/dashboard';

/* ────────────────────────────────────────────────────────────────
 * Paliers de fidélité sur 100 points max (excellence difficile à atteindre)
 * ──────────────────────────────────────────────────────────────── */
const SCORE_MAX = 100;

const PALIERS = [
  { code: 'BRONZE', seuil: 0, tone: 'gold', libelle: 'Historique en construction' },
  { code: 'ARGENT', seuil: 30, tone: 'slate', libelle: 'Bon historique de collaboration' },
  { code: 'OR', seuil: 65, tone: 'gold', libelle: 'Occupant exemplaire' },
  { code: 'PLATINE', seuil: 90, tone: 'green', libelle: 'Partenaire privilégié du site' },
];

const REGLES = [
  { text: "Règlement d'une échéance", pts: '+5', tone: 'green' },
  { text: 'Décision favorable sur dossier', pts: '+15', tone: 'green' },
  { text: 'Avis cantine positif (4-5★)', pts: '+2', tone: 'green' },
  { text: 'Avis cantine neutre (3★)', pts: '+1', tone: 'green' },
  { text: 'Avis cantine négatif (1-2★)', pts: '-2', tone: 'red' },
  { text: 'Échéance en retard / impayé', pts: '-5 à -15', tone: 'red' },
  { text: 'Avertissement', pts: '-3', tone: 'red' },
  { text: 'Convocation', pts: '-5', tone: 'red' },
];

const TONE_PRIORITE = { CRITIQUE: 'red', HAUTE: 'gold', MOYENNE: 'navy', BASSE: 'slate' };

const nombre = (v) => Math.round(Number(v ?? 0)).toString();
const dateLongue = (v) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

/** Jauge circulaire premium du score de fidélité sur 100. */
function JaugeHeroScore({ score, palier, percentile }) {
  const s = Math.max(0, Math.min(SCORE_MAX, Math.round(score)));
  const ratio = s / SCORE_MAX;
  const r = 78;
  const circonference = 2 * Math.PI * r;
  const couleur = score < 0 ? '#dc2626' : score >= 90 ? '#10b981' : score >= 65 ? '#c9a15c' : score >= 30 ? '#0ea5e9' : '#d97706';

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`Score de fidélité ${s} points sur 100`}>
          {/* Cercle de fond */}
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16" />
          {/* Cercle de progression */}
          <circle
            cx="100" cy="100" r={r} fill="none" stroke={couleur} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${circonference * ratio} ${circonference}`}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          {/* Texte central */}
          <text x="100" y="96" textAnchor="middle" style={{ fontSize: 44, fontWeight: 900, fill: 'currentColor', letterSpacing: '-1px' }}>
            {s}
          </text>
          <text x="100" y="122" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', fill: 'currentColor', opacity: 0.6 }}>
            / {SCORE_MAX} PTS
          </text>
        </svg>
      </div>

      <div className="mt-3 text-center">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm"
          style={{
            background: score >= 90 ? 'rgba(16,185,129,0.15)' : score >= 65 ? 'rgba(201,161,92,0.18)' : score >= 30 ? 'rgba(14,165,233,0.15)' : 'rgba(217,119,6,0.15)',
            color: couleur,
            border: `1px solid ${couleur}33`,
          }}
        >
          ★ Palier {palier?.niveau || 'BRONZE'}
        </span>
        <p className="text-xs text-muted mt-1.5 font-medium">{palier?.libelle || 'Historique en construction'}</p>
        {percentile != null && (
          <p className="text-[11px] text-muted font-mono mt-0.5 opacity-80">
            Top {100 - percentile}% du campus
          </p>
        )}
      </div>
    </div>
  );
}

/** Parcours des 4 paliers d'excellence sur 100 points. */
function ParcoursPaliers({ score }) {
  const s = Math.round(score);
  return (
    <div className="flex flex-col gap-2 mt-2">
      {PALIERS.map((p, i) => {
        const suivant = PALIERS[i + 1];
        const atteint = s >= p.seuil;
        const encours = atteint && (!suivant || s < suivant.seuil);
        return (
          <div
            key={p.code}
            className="flex items-center justify-between p-3 rounded-xl border transition-all"
            style={{
              borderColor: encours ? 'var(--gold, #c9a15c)' : 'rgba(255,255,255,0.06)',
              background: encours ? 'rgba(201,161,92,0.08)' : 'rgba(255,255,255,0.02)',
              opacity: atteint ? 1 : 0.45,
            }}
          >
            <div className="flex items-center gap-3">
              <EmojiEventsOutlinedIcon fontSize="small" style={{ color: encours ? 'var(--gold)' : 'inherit', opacity: atteint ? 1 : 0.4 }} />
              <div>
                <p className="font-display font-bold text-sm text-ink">{p.code}</p>
                <p className="text-[11px] text-muted">{p.libelle}</p>
              </div>
            </div>
            <Pill tone={encours ? 'gold' : 'slate'}>{encours ? 'Actuel' : `${p.seuil} pts`}</Pill>
          </div>
        );
      })}
    </div>
  );
}

/** Histogramme mensuel gains / pertes (6 mois). */
function CourbeMensuelle({ serie }) {
  if (!serie.length) return <p className="text-sm text-muted text-center py-8">Pas encore d'historique mensuel.</p>;
  const maxi = Math.max(1, ...serie.map((m) => Math.max(m.gains, m.pertes)));
  return (
    <div className="flex items-end justify-between gap-3 h-[180px] mt-4 px-1">
      {serie.map((m) => (
        <div key={m.mois} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          <span className="text-[10px] font-mono text-muted">{m.solde > 0 ? `+${nombre(m.solde)}` : nombre(m.solde)}</span>
          <div className="w-full flex items-end justify-center gap-1 h-full">
            <div
              title={`Gains ${nombre(m.gains)} pts`}
              className="w-3.5 rounded-t bg-green-500/80 shadow-sm"
              style={{ height: `${(m.gains / maxi) * 100}%`, minHeight: m.gains ? 4 : 0 }}
            />
            <div
              title={`Pertes ${nombre(m.pertes)} pts`}
              className="w-3.5 rounded-t bg-red-500/80 shadow-sm"
              style={{ height: `${(m.pertes / maxi) * 100}%`, minHeight: m.pertes ? 4 : 0 }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted">{m.libelle}</span>
        </div>
      ))}
    </div>
  );
}

export default function MonScoreFidelite() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('TOUS');

  useEffect(() => {
    (async () => {
      try {
        setData(await getMonScoreFidelite());
      } catch (e) {
        toast.error(messageErreur(e, 'Impossible de charger votre score de fidélité.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const d = data || {};
  const score = Math.round(Number(d.score_actuel ?? 0));
  const hist = Array.isArray(d.historique) ? d.historique : [];
  const serie = Array.isArray(d.serie_mensuelle) ? d.serie_mensuelle : [];
  const repartition = Array.isArray(d.repartition) ? d.repartition : [];
  const recommandations = Array.isArray(d.recommandations) ? d.recommandations : [];
  const tendance = d.tendance || {};
  const position = d.positionnement || {};
  const palier = d.palier || {};

  const totalGains = Math.round(d.points_gagnes ?? hist.filter((h) => h.points_modifies > 0).reduce((s, h) => s + Number(h.points_modifies), 0));
  const totalPertes = Math.round(d.points_perdus ?? hist.filter((h) => h.points_modifies < 0).reduce((s, h) => s + Math.abs(Number(h.points_modifies)), 0));

  const histFiltre = useMemo(() => {
    if (filtre === 'GAINS') return hist.filter((h) => Number(h.points_modifies) > 0);
    if (filtre === 'PERTES') return hist.filter((h) => Number(h.points_modifies) < 0);
    return hist;
  }, [hist, filtre]);

  const iconeTendance = tendance.sens === 'BAISSE'
    ? <TrendingDownOutlinedIcon style={{ fontSize: 22 }} />
    : tendance.sens === 'STABLE'
      ? <TrendingFlatOutlinedIcon style={{ fontSize: 22 }} />
      : <TrendingUpOutlinedIcon style={{ fontSize: 22 }} />;

  if (loading) {
    return <p className="text-sm text-muted p-6">Chargement de votre score de fidélité…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MilitaryTechOutlinedIcon style={{ fontSize: 22 }} />}
        title="Mon score de fidélité"
        subtitle="Votre comportement d'occupant est valorisé : ponctualité de paiement, respect du règlement et assiduité. Barème officiel sur 100 points."
      />

      {/* ── HERO BANNER : SCORE ULTRA MIS EN VALEUR ── */}
      <div className="ui-card p-6 md:p-8 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[var(--surface-card)] via-[var(--surface)] to-[var(--surface-2)] border border-white/10 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* JAUGE CENTRALE ET SCORE SUR 100 */}
          <div className="lg:col-span-4 flex justify-center border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <JaugeHeroScore score={score} palier={palier} percentile={position.percentile} />
          </div>

          {/* DÉTAILS DE PROGRESSION & INDICATEURS CLÉS */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">Progression sur 100 points</span>
                {palier.prochain_palier && (
                  <span className="text-xs font-bold text-[var(--gold)]">
                    + {Math.round(palier.points_restants || 0)} pts pour le palier {palier.prochain_palier}
                  </span>
                )}
              </div>
              <ProgressRow
                label=""
                value={score}
                total={SCORE_MAX}
                tone={score >= 65 ? 'gold' : score >= 30 ? 'teal' : 'gold'}
              />
              <p className="text-xs text-muted mt-2">
                {palier.prochain_palier
                  ? `Atteignez le palier ${palier.prochain_palier} (${PALIERS.find(p => p.code === palier.prochain_palier)?.seuil || 100} pts) pour débloquer de nouveaux avantages sur le campus.`
                  : 'Félicitations, vous avez atteint le palier maximal PLATINE !'}
              </p>
            </div>

            {/* 3 KPI CARDS SATELLITES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tendance 30j</span>
                  <span className={Number(tendance.delta_30j ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}>{iconeTendance}</span>
                </div>
                <div className={`font-display text-xl font-extrabold ${Number(tendance.delta_30j ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {Number(tendance.delta_30j ?? 0) >= 0 ? '+' : ''}{nombre(tendance.delta_30j)} pts
                </div>
                <div className="text-[11px] text-muted mt-0.5 font-mono">
                  {nombre(tendance.rythme_mensuel)} pts / mois
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Fiabilité</span>
                  <PaymentsOutlinedIcon style={{ fontSize: 18 }} className="text-green-400" />
                </div>
                <div className="font-display text-xl font-extrabold text-ink">
                  {d.fiabilite_paiement != null ? `${nombre(d.fiabilite_paiement)}%` : '100%'}
                </div>
                <div className="text-[11px] text-muted mt-0.5 font-mono">
                  {d.nb_paiements ?? 0} payé(s) · {d.nb_incidents ?? 0} retard
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Discipline</span>
                  <ShieldOutlinedIcon style={{ fontSize: 18 }} className="text-[var(--gold)]" />
                </div>
                <div className="font-display text-xl font-extrabold text-ink">
                  {nombre(d.jours_sans_incident ?? 0)} j
                </div>
                <div className="text-[11px] text-muted mt-0.5 font-mono">
                  {position.rang ? `Rang ${position.rang} / ${position.total_occupants}` : 'Sans sanction'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RANGÉE 1 : PARCOURS DES 4 PALIERS & DYNAMIQUE 6 MOIS ── */}
      <SplitLayout ratio="1fr 1.4fr">
        <Panel icon={<EmojiEventsOutlinedIcon style={{ fontSize: 20 }} />} title="Parcours des 4 paliers" subtitle="Échelle de fidélisation sur 100 points">
          <ParcoursPaliers score={score} />
        </Panel>

        <Panel icon={<QueryStatsOutlinedIcon style={{ fontSize: 20 }} />} title="Dynamique sur 6 mois" subtitle="Points gagnés (vert) et perdus (rouge) mois par mois">
          <CourbeMensuelle serie={serie} />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[11px] text-muted uppercase tracking-wider">Total gagné</p>
              <p className="font-display font-bold text-green-400">+{nombre(totalGains)} pts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[11px] text-muted uppercase tracking-wider">Total perdu</p>
              <p className="font-display font-bold text-red-400">-{nombre(totalPertes)} pts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[11px] text-muted uppercase tracking-wider">Écart moyenne site</p>
              <p className="font-display font-bold text-ink">
                {Number(position.ecart_moyenne ?? 0) >= 0 ? '+' : ''}{nombre(position.ecart_moyenne)} pts
              </p>
            </div>
          </div>
        </Panel>
      </SplitLayout>

      {/* ── RANGÉE 2 : BARÈME OFFICIEL & PLAN D'ACTION RECOMMANDÉ ── */}
      <SplitLayout ratio="1fr 1.4fr">
        <Panel icon={<InfoOutlinedIcon style={{ fontSize: 20 }} />} title="Barème officiel" subtitle="Comment votre score évolue">
          <div className="mt-1">
            {REGLES.map((rule, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                <span className="text-[13px] text-ink/90 font-medium">{rule.text}</span>
                <Pill tone={rule.tone}>{rule.pts} pts</Pill>
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel icon={<BoltOutlinedIcon style={{ fontSize: 20 }} />} title="Plan d'action recommandé" subtitle="Les gestes pour progresser vers 100 points">
            {recommandations.length === 0 ? (
              <p className="text-sm text-muted py-4">Votre dossier est exemplaire : maintenez vos règlements à l’heure.</p>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {recommandations.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div>
                      <p className="font-display font-bold text-sm text-ink">{r.titre}</p>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{(r.detail || '').replace(/(\d+)\.0/g, '$1')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Pill tone={TONE_PRIORITE[r.priorite] || 'slate'}>{r.priorite}</Pill>
                      <p className="text-[11px] font-mono text-muted mt-1.5">{(r.impact || '').replace(/(\d+)\.0/g, '$1')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel icon={<EmojiEventsOutlinedIcon style={{ fontSize: 20 }} />} title="Vos avantages" subtitle={`Palier ${palier.niveau || 'BRONZE'}`}>
            <ul className="flex flex-col gap-2 mt-2">
              {(palier.avantages?.length ? palier.avantages : ['Accès standard au dépôt de demande']).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-ink/90">
                  <span className="text-green-400 mt-0.5 font-bold">✓</span>{a}
                </li>
              ))}
            </ul>
            {palier.avantages_prochain?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2 font-bold">
                  À débloquer au palier {palier.prochain_palier}
                </p>
                <ul className="flex flex-col gap-2">
                  {palier.avantages_prochain.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-muted">
                      <span className="mt-0.5">🔒</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      </SplitLayout>

      {/* ── RANGÉE 3 : HISTORIQUE DES MOUVEMENTS & RÉPARTITION ── */}
      <SplitLayout ratio="1.6fr 1fr">
        <Panel
          icon={<ScheduleOutlinedIcon style={{ fontSize: 20 }} />}
          title="Historique des mouvements"
          subtitle="Chaque action sur votre dossier modifie votre score"
          action={
            <div className="flex gap-1.5">
              {[['TOUS', 'Tout'], ['GAINS', 'Gains'], ['PERTES', 'Pertes']].map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFiltre(code)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer"
                  style={{
                    borderColor: filtre === code ? 'var(--gold, #c9a15c)' : 'rgba(255,255,255,0.1)',
                    background: filtre === code ? 'rgba(201,161,92,0.15)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {histFiltre.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Aucun mouvement enregistré pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-3 mt-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {histFiltre.map((r, i) => {
                const p = Math.round(Number(r.points_modifies));
                const positif = p >= 0;
                return (
                  <div key={r.id || i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${positif ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {positif ? <TrendingUpOutlinedIcon fontSize="small" /> : <TrendingDownOutlinedIcon fontSize="small" />}
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm text-ink">{r.motif || '-'}</p>
                        <p className="text-[11px] text-muted font-mono mt-0.5 uppercase tracking-wider">{dateLongue(r.date_creation)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Pill tone={positif ? 'green' : 'red'}>{positif ? `+${p}` : p} pts</Pill>
                      <p className="text-[10px] text-muted font-mono mt-1.5 opacity-70">SCORE : {nombre(r.nouveau_score)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {repartition.length > 0 ? (
          <Panel icon={<QueryStatsOutlinedIcon style={{ fontSize: 20 }} />} title="D'où viennent vos points ?" subtitle="Impact net par famille d'événement">
            <div className="flex flex-col gap-3 mt-2">
              {repartition.map((b) => {
                const total = Math.max(1, b.gains + b.pertes);
                return (
                  <div key={b.code}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-medium text-ink/90">{b.libelle} <span className="text-muted text-[11px]">({b.nombre})</span></span>
                      <Pill tone={b.impact >= 0 ? 'green' : 'red'}>{b.impact >= 0 ? `+${nombre(b.impact)}` : nombre(b.impact)} pts</Pill>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06]">
                      <div className="bg-green-500/70" style={{ width: `${(b.gains / total) * 100}%` }} />
                      <div className="bg-red-500/70" style={{ width: `${(b.pertes / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        ) : <div />}
      </SplitLayout>
    </div>
  );
}
