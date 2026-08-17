import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import OutlinedFlagOutlinedIcon from '@mui/icons-material/OutlinedFlagOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, BarChart, DoughnutChart } from '../charts';
import { PageWrapper, SectionHeader, StatCard, Card, Button } from '../common/ui';
import { RankList } from '../common/dashboard';
import { getDashboardStats } from '../../api/dashboard';
import { getClassementFidelite } from '../../api/fidelite';
import { getTopOccupants } from '../../api/rapports';
import { messageErreur } from '../../api/utils';
import { STATUTS_DEMANDE_LABELS, TYPES_LOCAL_LABELS } from '../../utils/constants';

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-SN')}`;

export default function DashboardDirection() {
  const [stats, setStats] = useState(null);
  const [topOccupants, setTopOccupants] = useState([]);
  const [nbTopOccupantsAffiches, setNbTopOccupantsAffiches] = useState(10);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [s, top] = await Promise.all([
        getDashboardStats(),
        getClassementFidelite(100).catch(() => getTopOccupants(10)),
      ]);
      setStats(s);
      setTopOccupants(Array.isArray(top) ? top : []);
    } catch (error) {
      toast.error(messageErreur(error, 'Chargement du pilotage impossible.'));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const evolution = stats?.evolution_mensuelle || [];
  const repartitionTypes = (stats?.repartition_types_locaux || []).map((r) => ({
    label: TYPES_LOCAL_LABELS[r.type_local] || (r.type_local || '').replace(/_/g, ' '),
    value: r.total,
  }));

  const repartitionStatuts = useMemo(() => {
    const map = new Map();
    (stats?.repartition_statuts || []).forEach((r) => {
      let label = STATUTS_DEMANDE_LABELS[r.statut] || (r.statut || '').replace(/_/g, ' ');
      if (r.statut === 'EN_ATTENTE_SIGNATURE' || r.statut === 'EN_ATTENTE_DECISION') {
        label = 'En attente de validation finale';
      }
      map.set(label, (map.get(label) || 0) + (r.total || 0));
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [stats?.repartition_statuts]);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction Générale CROUS-T & DCUVE"
        title="Tableau de bord de pilotage & analytique des occupants"
        subtitle={`Données consolidées au ${new Date().toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
      />

      {chargement && <p style={{ color: 'var(--muted)' }}>Chargement des indicateurs…</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Demandes en cours" value={stats.demandes_en_cours} color="amber" icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />} sub="En cours d'instruction" />
            <StatCard label="Taux d'attribution favorable" value={`${stats.taux_favorable}%`} color="ok" icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} sub={`${stats.demandes_favorables} dossiers favorables`} />
            <StatCard label="Signalements ouverts" value={stats.signalements_ouverts} color="stamp" icon={<OutlinedFlagOutlinedIcon style={{ fontSize: 20 }} />} sub={`${stats.signalements_total} au total`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Contrats actifs" value={stats.contrats_actifs} color="teal" icon={<HistoryEduOutlinedIcon style={{ fontSize: 20 }} />} sub="En cours de validité" />
            <StatCard label="Taux d'occupation" value={`${stats.locaux_total ? Math.round((stats.locaux_occupes / stats.locaux_total) * 100) : 0}%`} color="ok" icon={<ApartmentOutlinedIcon style={{ fontSize: 20 }} />} sub={`${stats.locaux_libres} locaux libres`} />
            <StatCard label="Inspections du mois" value={stats.inspections_mois} color="slate" icon={<BiotechOutlinedIcon style={{ fontSize: 20 }} />} sub={`${stats.avis_publies} avis publiés`} />
          </div>

          <Card className="mb-8 border-t-4 border-t-teal">
            <div className="flex flex-wrap justify-between items-center mb-4 pb-2 border-b border-ink/10">
              <div>
                <h2 className="font-display font-bold text-lg text-ink">Classement des occupants</h2>
                <p className="text-xs text-muted">Classement par score de fidélité & exemplarité</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {topOccupants.length > 0 && (
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700 }}>
                    {Math.min(nbTopOccupantsAffiches, topOccupants.length)} / {topOccupants.length}
                  </span>
                )}
                <Button size="sm" variant="secondary" onClick={charger}>Actualiser</Button>
              </div>
            </div>

            {topOccupants.length === 0 ? (
              <p className="text-sm text-muted">Aucun occupant noté pour le moment.</p>
            ) : (
              <div>
                <RankList
                  items={topOccupants.slice(0, nbTopOccupantsAffiches).map((o) => ({
                    key: o.demandeur_id || o.nom,
                    title: o.nom,
                    subtitle: `Niveau ${o.palier || 'BRONZE'}${o.est_etudiant ? ' · Étudiant' : ''}`,
                    value: o.score != null ? `${Number(o.score).toFixed(0)} pts` : '-',
                  }))}
                  empty="Aucun occupant noté."
                />
                {topOccupants.length > nbTopOccupantsAffiches && (
                  <div style={{ marginTop: 14, textAlign: 'center' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setNbTopOccupantsAffiches((prev) => prev + 10)}
                      style={{ width: '100%', fontWeight: 700 }}
                    >
                      Voir plus ({topOccupants.length - nbTopOccupantsAffiches} restants) ↓
                    </Button>
                  </div>
                )}
                {nbTopOccupantsAffiches > 10 && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNbTopOccupantsAffiches(10)}
                      style={{ fontSize: 11.5, color: 'var(--muted)' }}
                    >
                      Réduire l'affichage (10 premiers) ↑
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <p className="font-display font-semibold text-base text-ink mb-4">Évolution mensuelle des demandes & attributions</p>
              {evolution.length === 0 ? (
                <p className="text-sm text-muted">Pas encore d'historique sur les 6 derniers mois.</p>
              ) : (
                <LineChart
                  height={260}
                  labels={evolution.map((e) => e.mois)}
                  series={[
                    { label: 'Soumises', data: evolution.map((e) => e.soumises), color: '#c9a15c' },
                    { label: 'Favorables', data: evolution.map((e) => e.favorables), color: '#172554' },
                  ]}
                />
              )}
            </Card>

            <Card>
              <p className="font-display font-semibold text-base text-ink mb-4">Répartition du patrimoine par type de local</p>
              {repartitionTypes.length === 0 ? (
                <p className="text-sm text-muted">Aucun local enregistré.</p>
              ) : (
                <DoughnutChart height={260} data={repartitionTypes} />
              )}
            </Card>
          </div>

          <Card>
            <p className="font-display font-semibold text-base text-ink mb-4">Répartition des demandes par statut</p>
            {repartitionStatuts.length === 0 ? (
              <p className="text-sm text-muted">Aucune demande enregistrée.</p>
            ) : (
              <BarChart
                height={300}
                labels={repartitionStatuts.map((r) => r.name)}
                series={[{ label: 'Demandes', data: repartitionStatuts.map((r) => r.total), color: '#172554' }]}
              />
            )}
          </Card>
        </>
      )}
    </PageWrapper>
  );
}

