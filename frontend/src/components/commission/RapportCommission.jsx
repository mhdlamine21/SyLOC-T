import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getDemandes, getVotes } from '../../api/demandes';
import { getMembresCommission } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, IdentityCell, Pill, RankList, SplitLayout,
} from '../common/dashboard';
import { Timeline } from '../common/ui';

/**
 * Rapport consolidé destiné au Directeur CROUS-T : ce que la Commission a
 * décidé (votes, décisions), participation des membres et chronologie.
 */
export default function RapportCommission() {
  const [votes, setVotes] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    setLoading(true);
    try {
      const [v, d, m] = await Promise.all([
        getVotes().catch(() => []),
        getDemandes().catch(() => []),
        getMembresCommission().catch(() => []),
      ]);
      setVotes(Array.isArray(v) ? v : []);
      setDemandes(Array.isArray(d) ? d : []);
      setMembres(Array.isArray(m) ? m : []);
    } catch (e) {
      toast.error(messageErreur(e, "Impossible de charger le rapport de la Commission."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const stats = useMemo(() => {
    const favorables = votes.filter((v) => v.avis === 'FAVORABLE').length;
    const defavorables = votes.filter((v) => v.avis === 'DEFAVORABLE').length;
    const abstentions = votes.filter((v) => v.avis === 'ABSTENTION').length;
    const dossiersTraites = new Set(votes.map((v) => v.demande)).size;
    return { favorables, defavorables, abstentions, dossiersTraites, total: votes.length };
  }, [votes]);

  const participation = useMemo(() => {
    const parMembre = new Map();
    votes.forEach((v) => {
      const cle = v.membre_nom || v.membre || 'Membre';
      parMembre.set(cle, (parMembre.get(cle) || 0) + 1);
    });
    const actifs = membres.filter((m) => m.actif).length || membres.length;
    return {
      actifs,
      liste: Array.from(parMembre.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [votes, membres]);

  const allocationsParLocal = useMemo(() => {
    const mapLocaux = new Map();

    demandes.forEach((d) => {
      if (!d.local && !d.local_reference) return;
      const localKey = d.local_reference || String(d.local);
      if (!mapLocaux.has(localKey)) {
        mapLocaux.set(localKey, {
          local_reference: localKey,
          type_local: (d.type_demande || '').replace(/_/g, ' '),
          demandes: [],
        });
      }
      mapLocaux.get(localKey).demandes.push(d);
    });

    const resultats = [];

    mapLocaux.forEach((groupe, localKey) => {
      const demandesAvecVotes = groupe.demandes.map((d) => {
        const votesDossier = votes.filter((v) => String(v.demande) === String(d.id));
        const favorables = votesDossier.filter((v) => v.avis === 'FAVORABLE').length;
        const defavorables = votesDossier.filter((v) => v.avis === 'DEFAVORABLE').length;
        const notes = votesDossier
          .map((v) => v.note_moyenne ?? (v.note_formelle && v.note_technique ? (v.note_formelle + v.note_technique) / 2 : null))
          .filter((n) => typeof n === 'number' && !isNaN(n));
        const noteMoyenne = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
        const estValide = ['FAVORABLE', 'EN_ATTENTE_SIGNATURE', 'CONTRAT_ACCEPTE_RDV_FIXE', 'CONTRAT_SIGNE'].includes(d.statut);

        return {
          ...d,
          total_votes: votesDossier.length,
          votes_favorables: favorables,
          votes_defavorables: defavorables,
          note_moyenne: noteMoyenne,
          est_valide: estValide,
        };
      });

      const hasActivity = demandesAvecVotes.some(
        (d) => d.total_votes > 0 || d.est_valide || d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE'
      );
      if (!hasActivity) return;

      demandesAvecVotes.sort((a, b) => {
        if (a.est_valide && !b.est_valide) return -1;
        if (!a.est_valide && b.est_valide) return 1;
        if (b.votes_favorables !== a.votes_favorables) return b.votes_favorables - a.votes_favorables;
        return (b.note_moyenne || 0) - (a.note_moyenne || 0);
      });

      const laureat = demandesAvecVotes[0];
      const nbConcurrents = demandesAvecVotes.length;

      let statutAttribution = 'EN_DELIBERATION';
      if (laureat.est_valide || laureat.statut === 'FAVORABLE') {
        statutAttribution = 'ALLOUE';
      } else if (laureat.votes_favorables > 0) {
        statutAttribution = 'EN_TETE';
      } else if (demandesAvecVotes.every((d) => d.statut === 'DEFAVORABLE' || d.votes_defavorables > 0)) {
        statutAttribution = 'REJETE';
      }

      resultats.push({
        id: localKey,
        local_reference: localKey,
        type_local: groupe.type_local,
        nb_concurrents: nbConcurrents,
        laureat: {
          nom: laureat.demandeur_nom || `Candidat (${laureat.reference_anonyme || `#${laureat.id}`})`,
          reference: laureat.reference_anonyme || `#${laureat.id}`,
          votes_favorables: laureat.votes_favorables,
          total_votes: laureat.total_votes,
          note_moyenne: laureat.note_moyenne,
          statut: laureat.statut,
        },
        statut_attribution: statutAttribution,
      });
    });

    return resultats;
  }, [demandes, votes]);

  const colonnesResultats = [
    {
      key: 'local',
      label: 'Local & Activité',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-navy)', fontSize: 13 }}>
            {r.local_reference}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {r.type_local} · {r.nb_concurrents} candidature{r.nb_concurrents > 1 ? 's' : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'laureat',
      label: 'Candidat Retenu (Majorité des votes)',
      render: (r) => (
        <IdentityCell
          title={r.laureat.nom}
          subtitle={`${r.laureat.reference}${r.laureat.votes_favorables > 0 ? ` · ${r.laureat.votes_favorables} vote(s) favorable(s)` : ''}`}
          initials="👑"
          tone={r.statut_attribution === 'ALLOUE' ? 'green' : r.statut_attribution === 'EN_TETE' ? 'gold' : 'red'}
        />
      ),
    },
    {
      key: 'decision',
      label: 'Résultat Attribution',
      render: (r) => {
        if (r.statut_attribution === 'ALLOUE') {
          return <Pill tone="green">✓ Alloué à {r.laureat.nom}</Pill>;
        }
        if (r.statut_attribution === 'EN_TETE') {
          return <Pill tone="gold">⭐ En tête ({r.laureat.votes_favorables} votes)</Pill>;
        }
        return <Pill tone="red">Sans attribution</Pill>;
      },
    },
  ];

  const timeline = useMemo(() => (
    [...votes]
      .sort((a, b) => new Date(b.date_creation || b.created_at || 0) - new Date(a.date_creation || a.created_at || 0))
      .slice(0, 12)
      .map((v) => ({
        date: v.date_creation ? new Date(v.date_creation).toLocaleString('fr-FR') : '-',
        titre: `${v.membre_nom || 'Membre'} - dossier #${v.demande}`,
        commentaire: v.commentaire,
        statut: v.avis,
      }))
  ), [votes]);

  return (
    <div>
      <PageHeader
        icon={<AssessmentOutlinedIcon style={{ fontSize: 20 }} />}
        title="Rapport de la Commission d'évaluation"
        subtitle="Vue consolidée pour la Direction : votes exprimés, décisions rendues, participation des membres et chronologie des délibérations."
        actions={<Pill tone="navy">↻ Actualisé automatiquement</Pill>}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<GroupsOutlinedIcon style={{ fontSize: 20 }} />} label="Membres actifs" value={participation.actifs} sub={`${membres.length} nommé(s) au total`} tone="navy" />
        <KpiCard icon={<HowToVoteOutlinedIcon style={{ fontSize: 20 }} />} label="Votes exprimés" value={stats.total} sub={`${stats.dossiersTraites} dossier(s) délibéré(s)`} tone="gold" />
        <KpiCard icon={<BalanceOutlinedIcon style={{ fontSize: 20 }} />} label="Avis favorables" value={stats.favorables} sub={`${stats.defavorables} défavorable(s)`} tone="green" />
        <KpiCard icon={<TimelineOutlinedIcon style={{ fontSize: 20 }} />} label="Abstentions" value={stats.abstentions} sub="Votes neutres archivés" tone="slate" />
      </StatGrid>

      <div style={{ marginBottom: 28 }}>
        <Panel icon={<BalanceOutlinedIcon style={{ fontSize: 20 }} />} title="Résultat final de la Commission : Attribution des locaux" padded={false}>
          <DataTable columns={colonnesResultats} rows={allocationsParLocal} loading={loading} empty="Aucune délibération d'attribution pour l'instant." pageSize={8} dense />
        </Panel>
      </div>

      <div style={{ marginBottom: 28 }}>
        <Panel icon={<GroupsOutlinedIcon style={{ fontSize: 20 }} />} title="Participation par membre">
          <RankList
            items={participation.liste.map(([nom, n], i) => ({ key: i, title: nom, subtitle: 'Votes enregistrés', value: n }))}
            empty="Aucun vote enregistré."
          />
        </Panel>
      </div>

      <Panel icon={<TimelineOutlinedIcon style={{ fontSize: 20 }} />} title="Chronologie des dernières délibérations">
        {timeline.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune activité récente à afficher.</p>
        ) : (
          <Timeline items={timeline} />
        )}
      </Panel>
    </div>
  );
}
