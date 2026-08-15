import HouseSidingOutlinedIcon from '@mui/icons-material/HouseSidingOutlined';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { TYPES_LOCAL_LABELS, ETATS_LOCAL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import InteractiveGpsMap from '../common/InteractiveGpsMap';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, EmptyState, LoadingState } from '../common/ui';
import toast from 'react-hot-toast';
import photoBoutique from '../../assets/local_boutique_sn.jpg';
import photoCantine from '../../assets/local_cantine_sn.jpg';
import photoDisponible from '../../assets/local_disponible_sn.jpg';
import photoOccupe from '../../assets/local_occupe_sn.jpg';

/** Photo de repli (visuels du campus, contexte senegalais) selon le type/etat du local. */
export function photoLocal(loc) {
  if (loc?.photo_url) return loc.photo_url;
  if (loc?.type_local === 'RESTAURATION') return photoCantine;
  if (loc?.type_local === 'PAPETERIE' || loc?.type_local === 'MULTISERVICES') return photoOccupe;
  if (loc?.est_libre) return photoDisponible;
  return photoBoutique;
}

/** Categorie d'occupation unifiee : DISPONIBLE / OCCUPE / AUTRE. */
export function categorieOccupation(loc) {
  const indispo = ['EN_TRAVAUX', 'DEGRADE', 'NECESSITE_RENOVATION'].includes(loc?.etat_physique);
  if (!loc?.est_libre) return 'OCCUPE';
  return indispo ? 'AUTRE' : 'DISPONIBLE';
}

const LIBELLES_ETAT = Object.fromEntries(ETATS_LOCAL.map((e) => [e.value, e.label]));

export default function CatalogLocaux() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [filtreEtat, setFiltreEtat] = useState('TOUS'); // 'TOUS', 'DISPONIBLE', 'OCCUPE', 'AUTRE'
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
      toast('Seuls les usagers candidats peuvent déposer un dossier de candidature.');
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Patrimoine & Locaux Domaniaux"
        title="Catalogue des locaux commercialisés"
        subtitle="Carte interactive et fiches détaillées des emplacements commerciaux du campus VCN — CROUS de Thiès."
      />

      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
          Pour explorer géographiquement les locaux et calculer un itinéraire piéton, 
          veuillez consulter la page <strong>Carte GPS des locaux</strong> depuis le menu.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['TOUS', 'DISPONIBLE', 'OCCUPE'].map(f => (
            <button
              key={f}
              onClick={() => setFiltreEtat(f)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: filtreEtat === f ? 'var(--navy)' : 'var(--surface-2)',
                color: filtreEtat === f ? '#fff' : 'var(--text-navy)',
                border: filtreEtat === f ? '1px solid var(--navy)' : '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
            >
              {f === 'TOUS' ? 'Tous les locaux' : f === 'DISPONIBLE' ? 'Disponibles' : 'Occupés'}
              <span style={{ marginLeft: 8, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
                {f === 'TOUS' ? locaux.length : locaux.filter((l) => categorieOccupation(l) === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Chargement des locaux…" />
      ) : locaux.length === 0 ? (
        <EmptyState
          icon={<HouseSidingOutlinedIcon style={{ fontSize: 20 }} />}
          title="Aucun local au référentiel"
          description="Le référentiel patrimoine est vide pour le moment."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {locaux.filter(l => {
            if (filtreEtat === 'TOUS') return true;
            return categorieOccupation(l) === filtreEtat;
          }).map((loc) => (
            <Card key={loc.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <img
                  src={photoLocal(loc)}
                  alt={`Local ${loc.reference}`}
                  loading="lazy"
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{loc.reference}</span>
                  <StatusBadge statut={categorieOccupation(loc)} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                  {TYPES_LOCAL_LABELS[loc.type_local] || loc.type_local} — {loc.surface_m2} m²
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>{loc.localisation}</p>
              </div>

              <Button variant="primary" size="sm" onClick={() => setSelectedLocal(loc)}>
                Découvrir les détails →
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedLocal && (
        <Modal open={!!selectedLocal} onClose={() => setSelectedLocal(null)} title={`Fiche local : ${selectedLocal.reference}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <img src={photoLocal(selectedLocal)} alt={`Local ${selectedLocal.reference}`} loading="lazy" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 14 }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-navy)', margin: '0 0 6px' }}>
                {TYPES_LOCAL_LABELS[selectedLocal.type_local] || selectedLocal.type_local} ({selectedLocal.surface_m2} m²)
              </h3>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
                <div>{selectedLocal.localisation}</div>
                <div>Capacité d'accueil : {selectedLocal.capacite_accueil ?? '—'}</div>
                <div>État : {LIBELLES_ETAT[selectedLocal.etat_physique] || selectedLocal.etat_physique}</div>
                <div>Gestionnaire : {selectedLocal.gestionnaire === 'AMICALE' ? 'Amicale' : 'CROUS-T'}</div>
                <div>{selectedLocal.est_libre ? 'Disponible à la candidature' : 'Actuellement occupé'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setSelectedLocal(null)}>Fermer</Button>
              {selectedLocal.est_libre && (
                <Button variant="amber" onClick={() => postuler(selectedLocal)}>
                  ✈ Postuler pour ce local
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}


