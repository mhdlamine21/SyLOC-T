import { useState } from 'react';
import { locauxMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal } from '../common/ui';
import InteractiveGpsMap from '../common/InteractiveGpsMap';
import toast from 'react-hot-toast';

export default function CatalogLocaux() {
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, DISPONIBLE, OCCUPE

  const filteredLocaux = locauxMock.filter(loc => {
    if (filter === 'ALL') return true;
    if (filter === 'DISPONIBLE') return loc.statut_occupation === 'DISPONIBLE';
    if (filter === 'OCCUPE') return loc.statut_occupation !== 'DISPONIBLE';
    return true;
  });

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Patrimoine & Locaux Domaniaux"
        title="Catalogue & Carte GPS des Locaux Commercialisés"
        subtitle="Carte géolocalisée interactive et liste des emplacements commerciaux sur les campus du CROUS de Thiès."
      />

      {/* Barre de Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Button variant={filter === 'ALL' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilter('ALL')}>Tous les locaux</Button>
        <Button variant={filter === 'DISPONIBLE' ? 'teal' : 'ghost'} size="sm" onClick={() => setFilter('DISPONIBLE')}>Locaux Disponibles</Button>
        <Button variant={filter === 'OCCUPE' ? 'amber' : 'ghost'} size="sm" onClick={() => setFilter('OCCUPE')}>Locaux Occupés</Button>
      </div>

      {/* Carte GPS Interactive Leaflet */}
      <div style={{ marginBottom: 24 }}>
        <InteractiveGpsMap
          height="340px"
          onLocationSelect={(loc) => {
            setSelectedLocal(loc);
            toast(`📍 Sélectionné : ${loc.name || loc.reference}`);
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {filteredLocaux.map((loc) => (
          <Card key={loc.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {loc.photo_url && (
                <img
                  src={loc.photo_url}
                  alt={loc.reference}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{loc.reference}</span>
                <StatusBadge statut={loc.statut_occupation === 'DISPONIBLE' ? 'FAVORABLE' : 'EN_ATTENTE'} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                {loc.type} - {loc.surface_m2} m²
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>
                📍 {loc.localisation}
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={() => setSelectedLocal(loc)}>
              🔍 Découvrir les détails →
            </Button>
          </Card>
        ))}
      </div>

      {selectedLocal && (
        <Modal open={!!selectedLocal} onClose={() => setSelectedLocal(null)} title={`Fiche Détaillée : ${selectedLocal.reference}`} maxWidth={700}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Colonne Gauche : Image et Carte */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selectedLocal.photo_url ? (
                <img 
                  src={selectedLocal.photo_url} 
                  alt={selectedLocal.reference} 
                  style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} 
                />
              ) : (
                <div style={{ width: '100%', height: 200, background: 'var(--surface-2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                  Aucune photo disponible
                </div>
              )}
              
              <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--navy)', fontWeight: 800 }}>📍 Localisation sur site</h4>
                <div style={{ height: 120, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {/* Simulate a mini-map view */}
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80" alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>📍</span>
                    <span style={{ background: 'var(--navy)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      {selectedLocal.reference}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                  GPS: {selectedLocal.coordonnees ? `${selectedLocal.coordonnees[0]}, ${selectedLocal.coordonnees[1]}` : 'Coordonnées non définies'}
                </p>
              </div>
            </div>

            {/* Colonne Droite : Informations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--navy)', margin: 0, lineHeight: 1.2 }}>
                    {selectedLocal.type}
                  </h3>
                  <StatusBadge statut={selectedLocal.statut_occupation === 'DISPONIBLE' ? 'FAVORABLE' : 'EN_ATTENTE'} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--slate)', margin: '0 0 4px', fontWeight: 600 }}>
                  Surface : {selectedLocal.surface_m2} m²
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  {selectedLocal.localisation}
                </p>
              </div>

              <div style={{ background: 'var(--surface-card)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--navy)', fontWeight: 800, textTransform: 'uppercase' }}>
                  🏢 Informations sur le Service
                </h4>
                <p style={{ fontSize: 12.5, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {selectedLocal.service_description || "Aucune description du service pour le moment."}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Occupant Actuel :</span>
                    <span style={{ fontWeight: 700, color: selectedLocal.occupant_nom ? 'var(--navy)' : 'var(--slate)' }}>
                      {selectedLocal.occupant_nom || "Aucun (Local Libre)"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Horaires :</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {selectedLocal.horaires || "Non défini"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Tarification Domaniale :</span>
                    <span style={{ fontWeight: 800, color: 'var(--gold-deep)', fontFamily: 'var(--font-mono)' }}>
                      15 000 FCFA / mois
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto' }}>
                <Button variant="ghost" onClick={() => setSelectedLocal(null)}>Fermer</Button>
                {selectedLocal.statut_occupation === 'DISPONIBLE' ? (
                  <Button variant="amber" onClick={() => { toast.success('Redirection vers le formulaire de demande...'); setSelectedLocal(null); }}>
                    ✈ Postuler pour ce local
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => { toast('Ce local est actuellement occupé.', { icon: 'ℹ️' }); }}>
                    Local Occupé
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
