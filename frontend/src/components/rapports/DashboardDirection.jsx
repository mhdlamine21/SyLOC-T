import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PageWrapper, SectionHeader, StatCard, Card, Button, StatusBadge, Modal, Field, Select, Textarea } from '../common/ui';
import { kpisMock, evolutionDemandesMock, repartitionTypesMock, topOccupantsMock } from '../../mocks/data';

const COLORS = ['#1f4b3f', '#c98a2c', '#a6362b', '#2f7d4f'];

export default function DashboardDirection() {
  const [topOccupants, setTopOccupants] = useState(topOccupantsMock);
  const [showMissionModal, setShowMissionModal] = useState(null);
  const [missionDescription, setMissionDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const depecherMission = async () => {
    if (!missionDescription.trim()) { toast.error('Veuillez décrire l\'ordre de mission.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success(`Mission terrain dépêchée à la Brigade de Contrôle pour l'occupant ${showMissionModal.nom} !`);
    setShowMissionModal(null);
    setMissionDescription('');
    setLoading(false);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction Général CROUS-T & DCUVE"
        title="Tableau de bord de pilotage & Analytique des occupants"
        subtitle={`Données de supervision arrêtées au ${new Date().toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Demandes en cours" value={kpisMock.demandes_en_cours} color="amber" icon="📋" sub={`dont ${kpisMock.demandes_en_attente} en attente`} />
        <StatCard label="Taux d'attribution favorable" value={`${kpisMock.taux_favorable}%`} color="ok" icon="✅" sub="ce trimestre" />
        <StatCard label="Redevances en impayé" value={`${(kpisMock.impayés_montant / 1000).toFixed(0)}k`} color="danger" icon="💸" sub="FCFA en retard" />
        <StatCard label="Signalements ouverts" value={kpisMock.signalements_ouverts} color="stamp" icon="🚩" sub="action requise" />
      </div>

      {/* CLASSEMENT & TOP OCCUPANTS (DOUBLE SCORING QHSE VS AVIS ÉTUDIANTS) */}
      <Card className="mb-8 border-t-4 border-t-teal">
        <div className="flex flex-wrap justify-between items-center mb-4 pb-2 border-b border-ink/10">
          <div>
            <h2 className="font-display font-bold text-lg text-ink">Classement & Double Scoring des Occupants Titulaires</h2>
            <p className="text-xs text-muted">Évaluation combinée : Score Conformité QHSE & Score Avis Étudiants</p>
          </div>
          <span className="font-mono text-xs font-bold text-teal bg-teal-pale px-3 py-1 rounded">
            Analyse Qualité CROUS-T
          </span>
        </div>

        <div className="space-y-3">
          {topOccupants.map((occ) => (
            <div key={occ.rank} className={`p-4 border rounded flex flex-wrap items-center justify-between gap-4 transition-all ${
              occ.score_avis < 3.0 ? 'border-stamp bg-stamp-pale/40' : 'border-ink/10 bg-white hover:border-teal'
            }`}>
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-full font-mono font-bold flex items-center justify-center text-sm ${
                  occ.rank === 1 ? 'bg-amber text-ink' : 'bg-paper2 text-muted'
                }`}>
                  #{occ.rank}
                </span>
                <img src={occ.photo} alt={occ.nom} className="w-11 h-11 rounded-full object-cover border border-ink/10" />
                <div>
                  <p className="font-bold text-sm text-ink">{occ.nom}</p>
                  <p className="text-xs text-muted font-mono">{occ.local}</p>
                </div>
              </div>

              {/* Double Score */}
              <div className="flex items-center gap-6 font-mono text-xs">
                <div className="text-center">
                  <p className="text-[10px] text-muted uppercase">Score QHSE</p>
                  <p className="font-bold text-ok text-sm">★ {occ.score_qhse} / 5</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted uppercase">Avis Étudiants</p>
                  <p className={`font-bold text-sm ${occ.score_avis < 3.0 ? 'text-stamp' : 'text-amber'}`}>
                    ★ {occ.score_avis} / 5
                  </p>
                </div>
              </div>

              {/* Alerte & Action d'inspection */}
              <div>
                {occ.score_avis < 3.0 || occ.alerte_mission ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stamp bg-stamp-pale px-2 py-1 rounded">
                      ⚠️ Note en baisse (&lt; 3.0)
                    </span>
                    <Button size="sm" variant="stamp" onClick={() => setShowMissionModal(occ)}>
                      ⚡ Dépêcher mission terrain
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-ok font-semibold">Conforme & Apprécié</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* GRAPHIQUES AVANCÉS (Courbes & Histogrammes) */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Graphique 1 : Évolution des demandes */}
        <Card>
          <p className="font-display font-semibold text-base text-ink mb-4">Évolution mensuelle des demandes & Attributions</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolutionDemandesMock}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,28,20,0.08)" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="soumises" name="Soumises" stroke="#c98a2c" fill="#fcf4e4" strokeWidth={2} />
              <Area type="monotone" dataKey="favorables" name="Favorables" stroke="#1f4b3f" fill="#e8f3ef" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Graphique 2 : Répartition par type de local */}
        <Card>
          <p className="font-display font-semibold text-base text-ink mb-4">Répartition du patrimoine par type d'usage</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={repartitionTypesMock}
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {repartitionTypesMock.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Modal Dépêcher une mission terrain */}
      <Modal open={!!showMissionModal} onClose={() => setShowMissionModal(null)} title={showMissionModal ? `Mission d'inspection terrain — ${showMissionModal.nom}` : ''}>
        {showMissionModal && (
          <div className="space-y-4">
            <AlertBanner type="warn">
              <strong>Déclenchement d'Ordre de Mission :</strong> La note globale des étudiants pour ce local a chuté sous le seuil minimal de 3.0 / 5. Transmettez un ordre de contrôle à la Brigade Terrain.
            </AlertBanner>

            <Field label="Description & Directives de la mission *" required>
              <Textarea
                value={missionDescription}
                onChange={(e) => setMissionDescription(e.target.value)}
                placeholder="Ex. Contrôler immédiatement l'hygiène de la cuisine, la propreté de la salle et la conformité des prix affichés."
                rows={4}
              />
            </Field>

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="ghost" onClick={() => setShowMissionModal(null)}>Annuler</Button>
              <Button variant="stamp" onClick={depecherMission} disabled={loading}>
                {loading ? 'Ordre en cours…' : '⚡ Transmettre l\'Ordre de Mission aux Agents Terrain'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
