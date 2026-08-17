import HouseSidingOutlinedIcon from '@mui/icons-material/HouseSidingOutlined';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, EmptyState, LoadingState, Input } from '../common/ui';
import toast from 'react-hot-toast';
import {
  photoLocal, categorieOccupation, estCandidatable, phraseDisponibilite,
  formatSurface, libelleType, libelleEtat, libelleGestionnaire, correspondRecherche,
  formatLoyerMensuel,
} from '../../utils/locaux';

// Reexports historiques : ces regles vivent desormais dans utils/locaux.js
export { photoLocal, categorieOccupation };

const FILTRES = [
  { value: 'TOUS', label: 'Tous les locaux' },
  { value: 'DISPONIBLE', label: 'Disponibles' },
  { value: 'OCCUPE', label: 'Occupés' },
];

export default function CatalogLocaux() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [filtreEtat, setFiltreEtat] = useState('TOUS'); // 'TOUS' | 'DISPONIBLE' | 'OCCUPE'
  const [recherche, setRecherche] = useState('');
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

  const resultats = useMemo(
    () => locaux.filter((l) => correspondRecherche(l, recherche)),
    [locaux, recherche],
  );
  const affiches = useMemo(
    () => resultats.filter((l) => filtreEtat === 'TOUS' || categorieOccupation(l) === filtreEtat),
    [resultats, filtreEtat],
  );

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
        subtitle="Carte interactive et fiches détaillées des emplacements commerciaux du campus VCN - CROUS de Thiès."
      />

      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
          Pour explorer géographiquement les locaux et calculer un itinéraire piéton,
          veuillez consulter la page <strong>Carte GPS des locaux</strong> depuis le menu.
        </p>
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un local (référence, type, localisation, gestionnaire)…"
          style={{ marginBottom: 16, maxWidth: 460 }}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {FILTRES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltreEtat(value)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: filtreEtat === value ? 'var(--navy)' : 'var(--surface-2)',
                color: filtreEtat === value ? 'var(--text-on-navy)' : 'var(--text-navy)',
                border: filtreEtat === value ? '1px solid var(--navy)' : '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
            >
              {label}
              <span style={{ marginLeft: 8, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
                {value === 'TOUS' ? resultats.length : resultats.filter((l) => categorieOccupation(l) === value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Chargement des locaux…" />
      ) : affiches.length === 0 ? (
        <EmptyState
          icon={<HouseSidingOutlinedIcon style={{ fontSize: 20 }} />}
          title={locaux.length === 0 ? 'Aucun local au référentiel' : 'Aucun local ne correspond'}
          description={locaux.length === 0
            ? 'Le référentiel patrimoine est vide pour le moment.'
            : 'Affinez votre recherche ou changez de filtre de disponibilité.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {affiches.map((loc) => (
            <Card key={loc.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <img
                  src={photoLocal(loc)}
                  alt={`Local ${loc.reference}`}
                  loading="lazy"
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{loc.reference}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--gold-deep)',
                      backgroundColor: 'rgba(201, 161, 92, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 6,
                    }}>
                      💰 {formatLoyerMensuel(loc)}
                    </span>
                    <StatusBadge statut={categorieOccupation(loc)} />
                  </div>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                  {libelleType(loc)} - {formatSurface(loc.surface_m2)}
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>{loc.localisation}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
                  Gestionnaire : {libelleGestionnaire(loc)}
                </p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>
                  {libelleType(selectedLocal)} ({formatSurface(selectedLocal.surface_m2)})
                </h3>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--gold-deep)',
                  backgroundColor: 'rgba(201, 161, 92, 0.15)',
                  padding: '4px 10px',
                  borderRadius: 8,
                }}>
                  💰 Loyer : {formatLoyerMensuel(selectedLocal)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
                <div>{selectedLocal.localisation}</div>
                <div>Surface : {formatSurface(selectedLocal.surface_m2)}</div>
                <div>État : {libelleEtat(selectedLocal)}</div>
                <div>Gestionnaire : {libelleGestionnaire(selectedLocal)}</div>
                <div>{phraseDisponibilite(selectedLocal)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setSelectedLocal(null)}>Fermer</Button>
              {estCandidatable(selectedLocal) && (
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


