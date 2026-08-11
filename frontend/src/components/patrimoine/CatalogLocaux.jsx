import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, SectionHeader, Card, Button, Modal } from '../common/ui';
import { locauxMock, TYPE_LOCAL_INFO } from '../../mocks/data';

import { useAuth } from '../../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';

export default function CatalogLocaux() {
  const { role } = useAuth();
  const isUsager = role === 'USAGER' || !role;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('catalog'); // 'catalog' ou 'map'
  const [filtreType, setFiltreType] = useState('');
  const [filtreLibre, setFiltreLibre] = useState('');
  const [selectedLocal, setSelectedLocal] = useState(null);

  const affichés = locauxMock.filter(
    (l) =>
      (!filtreType || l.type === filtreType) &&
      (filtreLibre === '' || l.est_libre.toString() === filtreLibre)
  );

  const postulerForLocal = (local) => {
    navigate('/depot', { state: { local_id: local.id, local_ref: local.reference } });
  };

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow="Patrimoine CROUS-T"
          title="Carte interactive & Catalogue des locaux"
          subtitle="Explorez le parc immobilier commercial du campus, visualisez les photos et candidater."
        />
        <div className="flex gap-2 bg-paper2 p-1 border border-ink/15" style={{ borderRadius: 'var(--radius)' }}>
          <button
            onClick={() => setViewMode('catalog')}
            className={`px-4 py-1.5 text-xs font-semibold font-mono transition-colors ${
              viewMode === 'catalog' ? 'bg-teal text-paper shadow-sm' : 'text-muted hover:text-ink'
            }`}
            style={{ borderRadius: 'var(--radius)' }}
          >
            📋 Vue Grille
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 text-xs font-semibold font-mono transition-colors ${
              viewMode === 'map' ? 'bg-teal text-paper shadow-sm' : 'text-muted hover:text-ink'
            }`}
            style={{ borderRadius: 'var(--radius)' }}
          >
            🗺️ Carte Campus VCN
          </button>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 border border-ink/10" style={{ borderRadius: 'var(--radius)' }}>
        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
          className="border border-ink/20 bg-paper/60 px-3 py-2 text-sm text-ink focus:outline-none"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="">Tous les types d'activités</option>
          {Object.entries(TYPE_LOCAL_INFO).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>

        <select
          value={filtreLibre}
          onChange={(e) => setFiltreLibre(e.target.value)}
          className="border border-ink/20 bg-paper/60 px-3 py-2 text-sm text-ink focus:outline-none"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="">Tous les statuts</option>
          <option value="true">🟢 Disponibles à la candidature</option>
          <option value="false">🔴 Locaux actuellement occupés</option>
        </select>

        <span className="text-xs font-mono text-muted self-center ml-auto">
          {affichés.length} local(aux) trouvé(s)
        </span>
      </div>

      {/* Vue CARTE INTERACTIVE SCHÉMATIQUE */}
      {viewMode === 'map' ? (
        <Card className="p-0 overflow-hidden mb-6 border-2 border-teal/30">
          <div className="bg-teal-deep text-paper px-6 py-3 flex justify-between items-center text-xs">
            <span className="font-mono uppercase font-bold">📍 Carte schématique Campus VCN & Pédagogique</span>
            <div className="flex items-center gap-4 font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-ok" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-stamp" /> Occupé</span>
            </div>
          </div>

          <div className="relative min-h-[420px] bg-[#e6dfd1] p-8 border-b border-ink/10 flex flex-col justify-between" style={{ backgroundImage: 'radial-gradient(var(--ink) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px', opacity: 0.95 }}>
            <div className="grid grid-cols-3 gap-6">
              {/* Zone VCN Social */}
              <div className="col-span-2 border-2 border-dashed border-teal/40 bg-white/70 p-4 rounded relative">
                <span className="font-mono text-[10px] uppercase font-bold text-teal bg-teal-pale px-2 py-0.5 rounded">Zone Campus Social (VCN)</span>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {affichés.filter((l) => l.zone === 'VCN-Social').map((local) => (
                    <button
                      key={local.id}
                      onClick={() => setSelectedLocal(local)}
                      className={`p-3 border text-left transition-all hover:scale-105 shadow-sm rounded ${
                        local.est_libre ? 'bg-ok-soft border-ok text-ok font-bold' : 'bg-stamp-pale border-stamp text-stamp'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px]">{local.reference}</span>
                        <span className="text-xs">{TYPE_LOCAL_INFO[local.type]?.emoji}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 truncate">{local.localisation}</p>
                      <p className="text-[10px] font-mono opacity-80">{local.surface_m2} m²</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Pédagogique */}
              <div className="border-2 border-dashed border-amber/40 bg-white/70 p-4 rounded relative">
                <span className="font-mono text-[10px] uppercase font-bold text-amber-deep bg-amber-pale px-2 py-0.5 rounded">Zone Campus Pédagogique</span>
                <div className="space-y-3 mt-4">
                  {affichés.filter((l) => l.zone === 'Pédagogique').map((local) => (
                    <button
                      key={local.id}
                      onClick={() => setSelectedLocal(local)}
                      className={`w-full p-3 border text-left transition-all hover:scale-105 shadow-sm rounded ${
                        local.est_libre ? 'bg-ok-soft border-ok text-ok font-bold' : 'bg-stamp-pale border-stamp text-stamp'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px]">{local.reference}</span>
                        <span className="text-xs">{TYPE_LOCAL_INFO[local.type]?.emoji}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 truncate">{local.localisation}</p>
                      <p className="text-[10px] font-mono opacity-80">{local.surface_m2} m²</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted font-mono bg-paper/80 p-2 rounded">
              💡 Cliquez sur un local sur la carte ci-dessus pour afficher sa fiche complète, sa photo et faire acte de candidature.
            </div>
          </div>
        </Card>
      ) : (
        /* Vue CATALOGUE GRILLE */
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {affichés.map((local) => (
            <div
              key={local.id}
              onClick={() => setSelectedLocal(local)}
              className="bg-white border border-ink/15 hover:border-teal hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <div className="relative h-48 bg-paper2 overflow-hidden">
                <img
                  src={local.photo_url || DEFAULT_IMAGE}
                  alt={local.localisation}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="bg-ink/80 text-paper text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    {local.reference}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${local.est_libre ? 'bg-ok text-paper' : 'bg-stamp text-paper'}`}>
                    {local.est_libre ? '🟢 DISPONIBLE' : '🔴 OCCUPÉ'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-display font-bold text-base text-ink line-clamp-1">{local.localisation}</p>
                  <p className="text-xs text-muted mt-1">
                    {TYPE_LOCAL_INFO[local.type]?.emoji} {TYPE_LOCAL_INFO[local.type]?.label} • {local.surface_m2} m² • Capacité {local.capacite_accueil} pers.
                  </p>
                  <p className="text-xs text-muted mt-2 line-clamp-2 italic font-mono">📍 Zone : {local.zone}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <span className="font-mono text-xs text-teal font-bold group-hover:underline">Fiche & Photo →</span>
                  {local.est_libre && isUsager && (
                    <Button
                      size="sm"
                      variant="amber"
                      onClick={(e) => { e.stopPropagation(); postulerForLocal(local); }}
                    >
                      📝 Postuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Fiche Détail Local pour Candidats & Visiteurs */}
      <Modal open={!!selectedLocal} onClose={() => setSelectedLocal(null)} title={selectedLocal ? `Fiche Local — ${selectedLocal.reference}` : ''} size="lg">
        {selectedLocal && (
          <div className="space-y-5">
            <div className="relative h-64 bg-paper2 overflow-hidden rounded border border-ink/10">
              <img
                src={selectedLocal.photo_url || DEFAULT_IMAGE}
                alt={selectedLocal.localisation}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 right-3 text-xs font-mono font-bold px-3 py-1 rounded shadow ${selectedLocal.est_libre ? 'bg-ok text-paper' : 'bg-stamp text-paper'}`}>
                {selectedLocal.est_libre ? '🟢 DISPONIBLE À LA CANDIDATURE' : '🔴 LOCAL OCCUPÉ'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-paper2 p-4 rounded">
              {[
                ['Référence', selectedLocal.reference],
                ['Emplacement', selectedLocal.localisation],
                ['Activité autorisée', TYPE_LOCAL_INFO[selectedLocal.type]?.label],
                ['Superficie', `${selectedLocal.surface_m2} m²`],
                ['Capacité d\'accueil', `${selectedLocal.capacite_accueil} personnes`],
                ['Zone Campus', selectedLocal.zone],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-xs text-muted uppercase">{k}</p>
                  <p className="font-semibold text-ink mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {selectedLocal.description && (
              <div>
                <p className="font-mono text-xs text-muted uppercase mb-1">Description du bien & Équipements</p>
                <p className="text-sm text-ink bg-paper/60 p-3 border border-ink/10 rounded">{selectedLocal.description}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="ghost" onClick={() => setSelectedLocal(null)}>
                Fermer
              </Button>
              {selectedLocal.est_libre ? (
                isUsager ? (
                  <Button variant="primary" onClick={() => postulerForLocal(selectedLocal)}>
                    📝 Déposer une candidature pour ce local
                  </Button>
                ) : (
                  <span className="text-xs text-muted font-mono self-center">Local disponible (candidature réservée aux usagers).</span>
                )
              ) : (
                <span className="text-xs text-muted font-mono self-center">Ce local sous contrat n'est pas disponible.</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
