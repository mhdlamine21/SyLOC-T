import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  WelcomeBanner,
  StatGrid,
  KpiCard,
  MiniStat,
  Panel,
  Pill,
  IdentityCell,
  ProgressRow,
  DataTable,
  SplitLayout,
} from '../common/dashboard';
import { Button, LoadingState, EmptyState } from '../common/ui';
import { getStatistiquesContrats } from '../../api/contrats';
import { messageErreur } from '../../api/utils';
import { STATUT_STYLES } from '../../utils/statutStyles';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import toast from 'react-hot-toast';

const fmtMontant = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-');

export default function StatistiquesJuridique() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getStatistiquesContrats();
        setStats(data);
      } catch (err) {
        toast.error(messageErreur(err, 'Erreur lors du chargement des statistiques juridiques.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <LoadingState label="Chargement du tableau de bord juridique..." />;
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<GavelOutlinedIcon style={{ fontSize: 24 }} />}
        title="Statistiques juridiques indisponibles"
      />
    );
  }

  const echeanceColumns = [
    {
      key: 'occupant',
      label: 'Occupant & Local',
      render: (r) => (
        <IdentityCell
          primary={r.occupant || 'Bénéficiaire'}
          secondary={r.local ? `Local ${r.local}${r.local_localisation ? ` (${r.local_localisation})` : ''}` : '-'}
          tone="navy"
        />
      ),
    },
    {
      key: 'reference',
      label: 'Contrat',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)' }}>
          {r.reference}
        </span>
      ),
    },
    {
      key: 'date_fin',
      label: 'Échéance',
      render: (r) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>
            {fmtDate(r.date_fin)}
          </div>
          <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase' }}>
            Renouvellement
          </span>
        </div>
      ),
    },
  ];

  const total = stats.total || 1;
  const nbActifs = stats.nb_actifs || 0;
  const pctActifs = Math.round((nbActifs / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── BANDEAU PRINCIPAL & RACCOURCIS JURIDIQUES ────────────────────── */}
      <WelcomeBanner
        title="Pôle Juridique & Gestion Contractuelle"
        subtitle="Supervision du portefeuille domanial, instruction des baux validés par la Direction et veille des échéances."
        meta="Système d'attribution & sécurité juridique SyLOC-T"
        action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/juridique/redaction" style={{ textDecoration: 'none' }}>
              <Button
                variant="amber"
                size="md"
                style={{
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <EditNoteOutlinedIcon style={{ fontSize: 18 }} />
                Rédiger un Bail {stats.nb_baux_a_rediger > 0 ? `(${stats.nb_baux_a_rediger})` : ''}
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── ALERTE DOSSIERS EN ATTENTE DE RÉDACTION ───────────────────────── */}
      {stats.nb_baux_a_rediger > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '14px 20px',
            borderRadius: 12,
            background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.04) 100%)',
            border: '1px solid var(--gold-tint-2, rgba(217, 119, 6, 0.3))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--gold)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <NotificationImportantOutlinedIcon style={{ fontSize: 20 }} />
            </div>
            <div>
              <strong style={{ fontSize: 13.5, color: 'var(--text-navy)' }}>
                {stats.nb_baux_a_rediger} dossier(s) validé(s) par la Direction en attente de formalisation contractuelle.
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                Les accords de principe ont été prononcés et nécessitent l'émission du bail domanial.
              </p>
            </div>
          </div>
          <Link to="/juridique/redaction" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Button variant="ghost" size="sm" style={{ fontWeight: 800, gap: 5, color: 'var(--gold-deep)' }}>
              Accéder aux baux à rédiger <ArrowForwardOutlinedIcon style={{ fontSize: 15 }} />
            </Button>
          </Link>
        </div>
      )}

      {/* ── INDICATEURS CLÉS (KPIS) ────────────────────────────────────────── */}
      <StatGrid cols={4}>
        <KpiCard
          icon={<EditNoteOutlinedIcon />}
          label="Baux à rédiger"
          value={stats.nb_baux_a_rediger ?? 0}
          tone="gold"
          pill={stats.nb_baux_a_rediger > 0 ? { label: 'Prioritaire', tone: 'gold' } : undefined}
        />
        <KpiCard
          icon={<TaskAltOutlinedIcon />}
          label="Baux actifs"
          value={nbActifs}
          tone="green"
          pill={{ label: 'En vigueur', tone: 'green' }}
        />
        <KpiCard
          icon={<DrawOutlinedIcon />}
          label="En attente de signature"
          value={stats.nb_en_attente_signature ?? 0}
          tone="blue"
        />
        <KpiCard
          icon={<PaidOutlinedIcon />}
          label="Redevance mensuelle"
          value={fmtMontant(stats.redevance_mensuelle_totale)}
          tone="navy"
        />
      </StatGrid>

      {/* ── DEUXIÈME LIGNE DE STATS LÉGÈRES ────────────────────────────────── */}
      <StatGrid cols={3}>
        <MiniStat
          icon={<FolderOutlinedIcon fontSize="small" />}
          label="Total contrats enregistrés"
          value={stats.total ?? 0}
          tone="navy"
        />
        <MiniStat
          icon={<GavelOutlinedIcon fontSize="small" />}
          label="Baux résiliés / clôturés"
          value={stats.nb_resilies ?? 0}
          tone="red"
        />
        <MiniStat
          icon={<DescriptionOutlinedIcon fontSize="small" />}
          label="Modèles types d'actes"
          value={stats.nb_modeles_actifs ?? 3}
          tone="slate"
        />
      </StatGrid>

      {/* ── DISPOSITION 2 COLONNES STRUCTURÉE ──────────────────────────────── */}
      <SplitLayout ratio="1.2fr 1fr">
        {/* Colonne gauche : Répartition par statut & Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Panel
            icon={<FolderOutlinedIcon style={{ fontSize: 20 }} />}
            title="Structure & Répartition du Portefeuille"
            subtitle="État contractuel de l'ensemble des locaux domaniaux gérés"
          >
            <div style={{ marginBottom: 20 }}>
              <ProgressRow
                label="Taux de contractualisation en vigueur"
                value={nbActifs}
                total={total}
                tone="green"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {Object.entries(stats.par_statut || {}).map(([statut, count]) => {
                const sStyle = STATUT_STYLES[statut] || { label: statut, tone: 'slate' };
                return (
                  <div
                    key={statut}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Pill tone={sStyle.tone}>{sStyle.label || statut}</Pill>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-navy)' }}>
                        {count}
                      </strong>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                      {Math.round((count / total) * 100)}% du portefeuille
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel
            icon={<GavelOutlinedIcon style={{ fontSize: 20 }} />}
            title="Cadre Juridique & Modèles Types"
            subtitle="Conventions et baux types conformes aux arrêtés du CROUS-T"
            action={
              <Link to="/juridique?tab=modeles" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">Gérer les modèles</Button>
              </Link>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>Bail Commercial Domanial Standard</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Durée 24 mois • Préavis 3 mois • Loyer mensuel révisable</div>
                </div>
                <Pill tone="green">✓ En vigueur</Pill>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>Convention d'Occupation Précaire</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Durée 12 mois • Résiliation sans indemnité • Espaces provisoires</div>
                </div>
                <Pill tone="green">✓ En vigueur</Pill>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>Convention Étudiante Solidaire</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Gratuité sous condition d'inscription valide • Espaces étudiants</div>
                </div>
                <Pill tone="blue">✓ Spécial Étudiant</Pill>
              </div>
            </div>
          </Panel>
        </div>

        {/* Colonne droite : Échéances à venir & Veille */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Panel
            icon={<CalendarMonthOutlinedIcon style={{ fontSize: 20 }} />}
            title="Baux à échéance sous 120 jours"
            subtitle="Veille contractuelle pour renouvellement ou libération"
            badge={
              stats.echeance_proche?.length > 0
                ? { label: `${stats.echeance_proche.length} alerte(s)`, tone: 'gold' }
                : undefined
            }
          >
            <DataTable
              columns={echeanceColumns}
              rows={(stats.echeance_proche || []).map((r) => ({ ...r, key: r.id }))}
              empty="Aucun bail n'arrive à échéance dans les 120 prochains jours."
              emptyIcon={<CalendarMonthOutlinedIcon style={{ fontSize: 28, color: 'var(--muted)' }} />}
              dense={true}
            />
          </Panel>
        </div>
      </SplitLayout>
    </div>
  );
}
