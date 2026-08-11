import { useState } from 'react';
import { locauxMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal } from '../common/ui';
import toast from 'react-hot-toast';

export default function CatalogLocaux() {
  const [selectedLocal, setSelectedLocal] = useState(null);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Patrimoine & Locaux Domaniaux"
        title="Catalogue des Locaux Commercialisés"
        subtitle="Carte et liste des emplacements commerciaux sur les campus du CROUS de Thiès."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {locauxMock.map((loc) => (
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
                {loc.type} — {loc.surface_m2} m²
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
        <Modal open={!!selectedLocal} onClose={() => setSelectedLocal(null)} title={`Fiche Local : ${selectedLocal.reference}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selectedLocal.photo_url && (
              <img src={selectedLocal.photo_url} alt={selectedLocal.reference} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
            )}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
                {selectedLocal.type} ({selectedLocal.surface_m2} m²)
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>📍 Localisation : {selectedLocal.localisation}</p>
              <p style={{ fontSize: 13, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>💰 Tarification domaniale : 15 000 FCFA / mois</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setSelectedLocal(null)}>Fermer</Button>
              <Button variant="amber" onClick={() => { toast.success('Redirection vers le formulaire de demande...'); setSelectedLocal(null); }}>
                ✈ Postuler pour ce local
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
