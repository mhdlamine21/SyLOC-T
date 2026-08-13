import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { TYPES_LOCAL_LABELS, ETATS_LOCAL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import InteractiveGpsMap from '../common/InteractiveGpsMap';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, EmptyState, LoadingState } from '../common/ui';
import toast from 'react-hot-toast';

const LIBELLES_ETAT = Object.fromEntries(ETATS_LOCAL.map((e) => [e.value, e.label]));

export default function CatalogLocaux() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const data = await getLocaux();
        if (!annule) setLocaux(Array.isArray(data) ? data : (data?.results ?? []));
      } catch (error) {
        if (!annule) toast.error(messageErreur(error, 'Erreur de chargement des locaux.'));
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  // Clic sur un marqueur de la carte : ouvre la fiche du local correspondant.
  const handleLocationSelect = useCallback((local) => {
    if (local?.id && local.id !== 'GPS_CUSTOM') setSelectedLocal(local);
  }, []);

  const postuler = (local) => {
    setSelectedLocal(null);
    if (role === 'USAGER') {
      navigate('/depot', { state: { localId: local.id, localReference: local.reference } });
    } else {
      toast('Seuls les usagers candidats peuvent dÃ©poser un dossier de candidature.');
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Patrimoine & Locaux Domaniaux"
        title="Catalogue des locaux commercialisÃ©s"
        subtitle="Carte interactive et fiches dÃ©taillÃ©es des emplacements commerciaux du campus VCN â€” CROUS de ThiÃ¨s."
      />

      <div style={{ marginBottom: 24 }}>
        <InteractiveGpsMap height="380px" onLocationSelect={handleLocationSelect} />
      </div>

      {loading ? (
        <LoadingState label="Chargement des locauxâ€¦" />
      ) : locaux.length === 0 ? (
        <EmptyState
          icon="ðŸšï¸"
          title="Aucun local au rÃ©fÃ©rentiel"
          description="Le rÃ©fÃ©rentiel patrimoine est vide pour le moment."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {locaux.map((loc) => (
            <Card key={loc.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {loc.photo_url && (
                  <img
                    src={loc.photo_url}
                    alt={`Local ${loc.reference}`}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{loc.reference}</span>
                  <StatusBadge statut={loc.est_libre ? 'FAVORABLE' : 'EN_ATTENTE_DECISION'} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                  {TYPES_LOCAL_LABELS[loc.type_local] || loc.type_local} â€” {loc.surface_m2} mÂ²
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>ðŸ“ {loc.localisation}</p>
              </div>

              <Button variant="primary" size="sm" onClick={() => setSelectedLocal(loc)}>
                ðŸ” DÃ©couvrir les dÃ©tails â†’
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedLocal && (
        <Modal open={!!selectedLocal} onClose={() => setSelectedLocal(null)} title={`Fiche local : ${selectedLocal.reference}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selectedLocal.photo_url && (
              <img src={selectedLocal.photo_url} alt={`Local ${selectedLocal.reference}`} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
            )}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
                {TYPES_LOCAL_LABELS[selectedLocal.type_local] || selectedLocal.type_local} ({selectedLocal.surface_m2} mÂ²)
              </h3>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
                <div>ðŸ“ {selectedLocal.localisation}</div>
                <div>ðŸ‘¥ CapacitÃ© d'accueil : {selectedLocal.capacite_accueil ?? 'â€”'}</div>
                <div>ðŸ-ï¸ Ã‰tat : {LIBELLES_ETAT[selectedLocal.etat_physique] || selectedLocal.etat_physique}</div>
                {role !== 'USAGER' && role !== 'AMICALE' && (
                  <div>ðŸ›ï¸ Gestionnaire : {selectedLocal.gestionnaire === 'AMICALE' ? 'Amicale' : 'CROUS-T'}</div>
                )}
                <div>{selectedLocal.est_libre ? 'âœ… Disponible Ã  la candidature' : 'ðŸ‘¤ Actuellement occupÃ©'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setSelectedLocal(null)}>Fermer</Button>
              {selectedLocal.est_libre && (
                <Button variant="amber" onClick={() => postuler(selectedLocal)}>
                  âœˆ Postuler pour ce local
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}

