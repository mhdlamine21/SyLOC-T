import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/dashboard';
import { getAnnonces } from '../api/annonces';
import { getMesDemandes } from '../api/demandes';
import { getNotificationsNonLues } from '../api/notifications';
import { messageErreur } from '../api/utils';
import { ROLES_LABELS } from '../utils/constants';
import { getNavigationItems } from '../utils/navigation';
import { Button } from '../components/common/ui';
import {
  WelcomeBanner, StatGrid, KpiCard, MiniStat, Panel, SplitLayout,
  ProgressRow, RankList, Pill, CardGrid, SectionLabel,
} from '../components/common/dashboard';

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const num = (n) => Number(n || 0).toLocaleString('fr-FR');

/* ─── Histogramme simple (activite mensuelle) ───────────────────────── */
function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.soumises || 0));
  if (!data.length) return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune donnee disponible.</p>;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 190, paddingTop: 8 }}>
      {data.map((d) => (
        <div key={d.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 800, color: 'var(--navy)' }}>{d.soumises}</span>
          <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 130 }}>
            <div title={`${d.soumises} soumises`} style={{ flex: 1, height: `${((d.soumises || 0) / max) * 100}%`, minHeight: 3, background: 'var(--navy)', borderRadius: '5px 5px 0 0' }} />
            <div title={`${d.favorables} favorables`} style={{ flex: 1, height: `${((d.favorables || 0) / max) * 100}%`, minHeight: 3, background: 'var(--green, #16a34a)', borderRadius: '5px 5px 0 0' }} />
            <div title={`${d.defavorables} defavorables`} style={{ flex: 1, height: `${((d.defavorables || 0) / max) * 100}%`, minHeight: 3, background: 'var(--red, #dc2626)', borderRadius: '5px 5px 0 0' }} />
          </div>
          <span style={{ fontSize: 9.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d.mois}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Tableau de bord adaptatif ─────────────────────────────────────── */
export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [mesDemandes, setMesDemandes] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(true);

  const estUsager = role === 'USAGER' || role === 'OCCUPANT';

  useEffect(() => {
    (async () => {
      const taches = [
        getDashboardStats().then(setStats).catch(() => null),
        getAnnonces().then((a) => setAnnonces((a || []).slice(0, 5))).catch(() => null),
        getNotificationsNonLues()
          .then((d) => setNonLues(Array.isArray(d) ? d.length : (d?.count ?? d?.results?.length ?? 0)))
          .catch(() => null),
      ];
      if (estUsager) taches.push(getMesDemandes().then(setMesDemandes).catch(() => null));
      try {
        await Promise.all(taches);
      } catch (e) {
        toast.error(messageErreur(e, 'Chargement partiel du tableau de bord.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [estUsager]);

  const raccourcis = useMemo(
    () => getNavigationItems(user, role)
      .filter((g) => g.group !== '_')
      .flatMap((g) => g.items)
      .slice(0, 8),
    [user, role],
  );

  const s = stats || {};
  const repartitionStatuts = (s.repartition_statuts || []).slice(0, 6);
  const totalDemandes = s.demandes_total || 1;

  /* KPI principaux selon le profil */
  const kpis = useMemo(() => {
    if (estUsager) {
      const enCours = mesDemandes.filter((d) => !['FAVORABLE', 'DEFAVORABLE', 'CONTRAT_REFUSE'].includes(d.statut)).length;
      const favorables = mesDemandes.filter((d) => d.statut === 'FAVORABLE' || d.statut === 'CONTRAT_ACCEPTE_RDV_FIXE').length;
      return [
        { icon: '📁', label: 'Mes candidatures', value: mesDemandes.length, sub: `${enCours} en cours`, tone: 'navy' },
        { icon: '✅', label: 'Dossiers acceptés', value: favorables, sub: 'Candidatures retenues', tone: 'green' },
        { icon: '🔔', label: 'Notifications', value: nonLues, sub: 'Non lues', tone: 'gold' },
      ];
    }
    if (role === 'SERVICE_COMPTABLE') {
      return [
        { icon: '💵', label: 'Recettes du mois', value: fmt(s.recettes_mois), sub: 'Encaissements valides', tone: 'green' },
        { icon: '⚠️', label: 'Impayes', value: fmt(s.impayes_montant), sub: `${num(s.impayes_nombre)} echeance(s)`, tone: 'red' },
        { icon: '📄', label: 'Contrats actifs', value: num(s.contrats_actifs), sub: `${num(s.contrats_a_echeance)} a echeance`, tone: 'navy' },
        { icon: '🏢', label: 'Locaux occupes', value: num(s.locaux_occupes), sub: `${num(s.locaux_libres)} libres`, tone: 'gold' },
      ];
    }
    if (role === 'AGENT_TERRAIN' || role === 'AGENT_QHSE' || role === 'SERVICE_TECHNIQUE') {
      return [
        { icon: '🚨', label: 'Signalements ouverts', value: num(s.signalements_ouverts), sub: `${num(s.signalements_total)} au total`, tone: 'red' },
        { icon: '🔬', label: 'Inspections du mois', value: num(s.inspections_mois), sub: 'Controles realises', tone: 'navy' },
        { icon: '⭐', label: 'Score QHSE moyen', value: s.score_qhse_moyen ?? 0, sub: `${num(s.avis_publies)} avis collectes`, tone: 'gold' },
        { icon: '🏢', label: 'Locaux suivis', value: num(s.locaux_total), sub: `${num(s.locaux_occupes)} occupes`, tone: 'slate' },
      ];
    }
    return [
      { icon: '📁', label: 'Demandes traitees', value: num(s.demandes_total), sub: `${num(s.demandes_en_cours)} en cours`, tone: 'navy' },
      { icon: '✅', label: 'Taux favorable', value: `${s.taux_favorable ?? 0}%`, sub: `${num(s.demandes_favorables)} accords`, tone: 'green' },
      { icon: '💰', label: 'Recettes du mois', value: fmt(s.recettes_mois), sub: `${fmt(s.impayes_montant)} d'impayes`, tone: 'gold' },
      { icon: '🏢', label: 'Patrimoine', value: num(s.locaux_total), sub: `${num(s.locaux_libres)} locaux libres`, tone: 'slate' },
    ];
  }, [estUsager, role, mesDemandes, nonLues, s]);

  return (
    <div>
      <WelcomeBanner
        title={`Bonjour ${user?.nom_complet?.split(' ')[0] || ''}`}
        subtitle={`Espace ${ROLES_LABELS?.[role] || (role || '').replace(/_/g, ' ')} — voici la situation en temps reel du parc domanial du CROUS-T.`}
        meta={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={nonLues > 0 ? <Pill tone="gold">🔔 {nonLues} notification(s) non lue(s)</Pill> : null}
      />

      <StatGrid cols={4}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </StatGrid>

      {/* Indicateurs secondaires (pilotage) */}
      {!estUsager && (
        <>
          <SectionLabel icon="📌">Etat du reseau</SectionLabel>
          <StatGrid cols={5}>
            <MiniStat icon="🆕" label="Nouvelles demandes" value={num(s.demandes_nouvelles)} tone="gold" />
            <MiniStat icon="📄" label="Contrats actifs" value={num(s.contrats_actifs)} tone="navy" />
            <MiniStat icon="⏰" label="Contrats a echeance" value={num(s.contrats_a_echeance)} tone="red" />
            <MiniStat icon="👥" label="Utilisateurs actifs" value={num(s.utilisateurs_total)} tone="slate" />
            <MiniStat icon="🚨" label="Signalements ouverts" value={num(s.signalements_ouverts)} tone="red" />
          </StatGrid>
        </>
      )}

      <SplitLayout ratio="1.6fr 1fr">
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {!estUsager && (
            <Panel
              icon="📊"
              title="Activite des 6 derniers mois"
              subtitle="Demandes soumises, avis favorables et defavorables"
              action={(
                <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>
                  <span>■ Soumises</span>
                  <span style={{ color: 'var(--green, #16a34a)' }}>■ Favorables</span>
                  <span style={{ color: 'var(--red, #dc2626)' }}>■ Defavorables</span>
                </div>
              )}
            >
              {loading ? <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>Chargement…</p> : <BarChart data={s.evolution_mensuelle || []} />}
            </Panel>
          )}

          {estUsager ? (
            <Panel icon="📁" title="Mes dernieres candidatures" action={<Link to="/suivi"><Button variant="ghost" size="sm">Tout voir</Button></Link>}>
              <RankList
                items={mesDemandes.slice(0, 5).map((d) => ({
                  key: d.id,
                  title: (d.type_demande || '').replace(/_/g, ' '),
                  subtitle: `${d.reference_anonyme || ''} · depose le ${d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '—'}`,
                  value: (d.statut || '').replace(/_/g, ' '),
                }))}
                empty="Vous n'avez encore depose aucun dossier."
              />
            </Panel>
          ) : (
            <Panel icon="🧭" title="Repartition des dossiers par statut">
              {repartitionStatuts.length === 0
                ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucun dossier enregistre.</p>
                : repartitionStatuts.map((r) => (
                  <ProgressRow
                    key={r.statut}
                    label={`${(r.statut || '').replace(/_/g, ' ')} — ${r.total}`}
                    value={r.total}
                    total={totalDemandes}
                    tone={r.statut === 'FAVORABLE' ? 'green' : r.statut === 'DEFAVORABLE' ? 'red' : 'navy'}
                  />
                ))}
            </Panel>
          )}
        </div>

        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel icon="⚡" title="Acces rapides">
            <CardGrid min={130}>
              {raccourcis.map((r) => (
                <Link
                  key={r.path + r.label}
                  to={r.path}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 11px',
                    border: '1px solid var(--border)', borderRadius: 11, textDecoration: 'none',
                    background: 'var(--surface-2)', color: 'var(--navy)',
                  }}
                >
                  <span style={{ fontSize: 17 }}>{r.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.25 }}>{r.label}</span>
                </Link>
              ))}
            </CardGrid>
          </Panel>

          {!estUsager && (
            <Panel icon="🏢" title="Types de locaux">
              {(s.repartition_types_locaux || []).length === 0
                ? <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Patrimoine non renseigne.</p>
                : (s.repartition_types_locaux || []).map((t) => (
                  <ProgressRow key={t.type_local} label={`${(t.type_local || '').replace(/_/g, ' ')} — ${t.total}`} value={t.total} total={s.locaux_total || 1} tone="gold" />
                ))}
            </Panel>
          )}

          <Panel icon="📢" title="Annonces officielles" action={<Link to="/locaux-catalogue"><Button variant="ghost" size="sm">Catalogue</Button></Link>}>
            <RankList
              items={annonces.map((a) => ({
                key: a.id,
                title: a.titre,
                subtitle: a.date_publication ? new Date(a.date_publication).toLocaleDateString('fr-FR') : '',
              }))}
              empty="Aucune annonce publiee."
            />
          </Panel>
        </div>
      </SplitLayout>
    </div>
  );
}
