import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import OutlinedFlagOutlinedIcon from '@mui/icons-material/OutlinedFlagOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, BarChart, DoughnutChart } from '../charts';
import { PageWrapper, SectionHeader, StatCard, Card, Button } from '../common/ui';
import OrdreMissionModal from '../terrain/OrdreMissionModal';
import { getDashboardStats } from '../../api/dashboard';
import { getTopOccupants } from '../../api/rapports';
import { messageErreur } from '../../api/utils';
import { STATUTS_DEMANDE_LABELS, TYPES_LOCAL_LABELS } from '../../utils/constants';

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-SN')}`;

export default function DashboardDirection() {
  const [stats, setStats] = useState(null);
  const [topOccupants, setTopOccupants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [missionPour, setMissionPour] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [s, top] = await Promise.all([getDashboardStats(), getTopOccupants(10)]);
      setStats(s);
      setTopOccupants(top || []);
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
    name: TYPES_LOCAL_LABELS[r.type_local] || r.type_local,
    value: r.total,
  }));
  const repartitionStatuts = (stats?.repartition_statuts || []).map((r) => ({
    name: STATUTS_DEMANDE_LABELS[r.statut] || r.statut,
    total: r.total,
  }));

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
                <h2 className="font-display font-bold text-lg text-ink">Classement & double scoring des occupants titulaires</h2>
                <p className="text-xs text-muted">Score conformité QHSE (inspections) et score avis étudiants</p>
              </div>
              <Button size="sm" variant="secondary" onClick={charger}>Actualiser</Button>
            </div>

            {topOccupants.length === 0 ? (
              <p className="text-sm text-muted">Aucun contrat actif à évaluer pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {topOccupants.map((occ, index) => {
                  const alerte = occ.note_avis !== null && occ.note_avis < 3;
                  return (
                    <div
                      key={occ.contrat_id}
                      className={`p-4 border rounded flex flex-wrap items-center justify-between gap-4 ${
                        alerte ? 'border-stamp bg-stamp-pale/40' : 'border-ink/10 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full font-mono font-bold flex items-center justify-center text-sm ${
                          index === 0 ? 'bg-amber text-ink' : 'bg-paper2 text-muted'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-ink">{occ.occupant}</p>
                          <p className="text-xs text-muted font-mono">{occ.local_reference}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs">
                        <div className="text-center">
                          <p className="text-[10px] text-muted uppercase">Note QHSE</p>
                          <p className="font-bold text-ok text-sm">
                            {occ.note_qhse !== null ? `★ ${occ.note_qhse} / 20` : '—'}
                          </p>
                          <p className="text-[10px] text-muted">
                            {occ.taux_conformite !== null ? `${occ.taux_conformite}% conforme` : 'aucune inspection'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted uppercase">Avis étudiants</p>
                          <p className={`font-bold text-sm ${alerte ? 'text-stamp' : 'text-amber'}`}>
                            {occ.note_avis !== null ? `★ ${occ.note_avis} / 5` : '—'}
                          </p>
                          <p className="text-[10px] text-muted">{occ.nombre_avis} avis</p>
                        </div>
                      </div>

                      <div>
                        {alerte ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-stamp bg-stamp-pale px-2 py-1 rounded">
                              Satisfaction &lt; 3.0
                            </span>
                            <Button size="sm" variant="stamp" onClick={() => setMissionPour(occ)}>
                              ⚡ Dépêcher mission terrain
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setMissionPour(occ)}>
                            Ordonner une inspection
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

      <OrdreMissionModal
        open={!!missionPour}
        onClose={() => setMissionPour(null)}
        localInitial={missionPour?.local_id || ''}
        onCree={() => {
          setMissionPour(null);
          charger();
        }}
      />
    </PageWrapper>
  );
}

