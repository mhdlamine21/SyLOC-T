import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLocaux } from '../../api/patrimoine';
import { getPublicLocaux } from '../../api/public';
import { TYPES_LOCAL_LABELS } from '../../utils/constants';
import { messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import { formatSurface, libelleType, libelleEtat, libelleGestionnaire, estCandidatable, phraseDisponibilite } from '../../utils/locaux';

// Centre du campus VCN - CROUS de Thies (repli quand aucun local n'est geolocalise).
const CAMPUS_THIES_CENTER = [14.7912, -16.9254];

// Service de calcul d'itineraire OpenStreetMap (OSRM, demo publique).
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

const formatDistance = (metres) =>
  metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`;

const formatDuree = (secondes) => {
  const minutes = Math.round(secondes / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
};

/**
 * Carte GPS des locaux domaniaux (Phase 2).
 *
 * - Marqueurs issus du referentiel patrimoine (API), jamais de donnees en dur
 * - Recherche plein texte + filtres (type de local, disponibilite)
 * - Geolocalisation de l'utilisateur
 * - Itineraire pieton vers un local : distance, duree et etapes (OSRM)
 * - Fiche locale laterale (selection d'un marqueur)
 *
 * Leaflet est charge via le CDN declare dans index.html (window.L).
 */
export default function InteractiveGpsMap({
  height = '380px',
  onLocationSelect = null,
  withPanel = true,
  publique = false,
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const positionMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const { isAuthenticated, role } = useAuth();

  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFiltre, setTypeFiltre] = useState('');
  const [dispoFiltre, setDispoFiltre] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [position, setPosition] = useState(null);
  const [selection, setSelection] = useState(null);
  const [itineraire, setItineraire] = useState(null);
  const [calculItineraire, setCalculItineraire] = useState(false);

  // 1. Referentiel des locaux -----------------------------------------------
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const data = publique ? await getPublicLocaux() : await getLocaux();
        if (!annule) setLocaux(Array.isArray(data) ? data : (data?.results ?? []));
      } catch (err) {
        if (!annule) toast.error(messageErreur(err, 'Impossible de charger la carte des locaux.'));
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, [publique]);

  const geolocalises = useMemo(
    () => locaux.filter((l) => l.latitude != null && l.longitude != null),
    [locaux],
  );

  const typesDisponibles = useMemo(
    () => [...new Set(locaux.map((l) => l.type_local).filter(Boolean))],
    [locaux],
  );

  const filtres = useMemo(() => {
    const terme = searchQuery.trim().toLowerCase();
    return geolocalises.filter((l) => {
      if (typeFiltre && l.type_local !== typeFiltre) return false;
      if (dispoFiltre === 'LIBRE' && !l.est_libre) return false;
      if (dispoFiltre === 'OCCUPE' && l.est_libre) return false;
      if (!terme) return true;
      return [l.reference, l.localisation, l.zone_cartographie,
        TYPES_LOCAL_LABELS[l.type_local] || l.type_local]
        .filter(Boolean)
        .some((champ) => String(champ).toLowerCase().includes(terme));
    });
  }, [geolocalises, searchQuery, typeFiltre, dispoFiltre]);

  // 2. Initialisation de la carte -------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return undefined;
    const L = window.L;
    if (!L) return undefined;

    const map = L.map(mapContainerRef.current).setView(CAMPUS_THIES_CENTER, 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap - CROUS de Thiès (Campus VCN)',
    }).addTo(map);
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  const selectionner = useCallback((local) => {
    setSelection(local);
    setItineraire(null);
    onLocationSelect?.(local);
  }, [onLocationSelect]);

  // 3. Marqueurs -------------------------------------------------------------
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = window.L;
    if (!map || !L) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    filtres.forEach((local) => {
      const libelleTypeLocal = libelleType(local);
        const fallbackImg = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80';
        const marker = L.marker([local.latitude, local.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px; margin: -14px -20px -14px -20px; border-radius: 12px; overflow: hidden;">
            <img src="${local.photo_url || fallbackImg}" alt="${local.reference}" style="width: 100%; height: 110px; object-fit: cover; display: block;" />
            <div style="padding: 12px;">
              <strong style="color:#0f1b3d; font-size:14px; display:block; margin-bottom:2px;">${local.reference}</strong>
              <span style="font-size:12px; color:#64748b; font-weight:600;">${libelleTypeLocal} - ${formatSurface(local.surface_m2)}</span>
              <span style="font-size:11px; color:#64748b; font-style:italic; display:block; margin-top:6px;">📍 ${local.localisation ?? 'Campus VCN'}</span>
              
              <div style="margin-top:10px; display: flex; align-items: center; justify-content: space-between; font-size:11px; font-weight:bold;">
                <span style="padding: 3px 8px; border-radius: 6px; background: ${local.est_libre ? 'rgba(22, 163, 74, 0.1)' : 'rgba(37, 99, 235, 0.1)'}; color:${local.est_libre ? '#16a34a' : '#2563eb'};">
                  ${local.est_libre ? 'Disponible' : 'Occupé'}
                </span>
                <span style="color: #c9a15c;">📐 ${formatSurface(local.surface_m2)}</span>
              </div>
            </div>
          </div>
        `, { maxWidth: 240, minWidth: 200, className: 'custom-leaflet-popup' });

      marker.on('click', () => selectionner(local));
      markersRef.current.push(marker);
    });

    if (filtres.length > 0) {
      map.fitBounds(filtres.map((l) => [l.latitude, l.longitude]), {
        padding: [40, 40],
        maxZoom: 18,
      });
    }
  }, [filtres, selectionner]);

  // 4. Geolocalisation -------------------------------------------------------
  const localiser = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur.');
      resolve(null);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setPosition(coords);
        const map = leafletMapRef.current;
        const L = window.L;
        if (map && L) {
          if (positionMarkerRef.current) map.removeLayer(positionMarkerRef.current);
          positionMarkerRef.current = L.circleMarker([coords.latitude, coords.longitude], {
            radius: 9, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.7,
          }).addTo(map).bindPopup('<strong>Votre position actuelle</strong>');
          map.setView([coords.latitude, coords.longitude], 18);
        }
        toast.success(`Position : ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        resolve(coords);
      },
      () => {
        setIsLocating(false);
        leafletMapRef.current?.setView(CAMPUS_THIES_CENTER, 17);
        toast('Position indisponible - recentrage sur le campus VCN.');
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  // 5. Itineraire ------------------------------------------------------------
  const tracerItineraire = async (local) => {
    if (!local?.latitude || !local?.longitude) return;
    const depart = position || (await localiser());
    if (!depart) return;

    setCalculItineraire(true);
    try {
      const url = `${OSRM_BASE}/foot/${depart.longitude},${depart.latitude};`
        + `${local.longitude},${local.latitude}?overview=full&geometries=geojson&steps=true`;
      const reponse = await fetch(url);
      const data = await reponse.json();
      const route = data?.routes?.[0];
      if (!route) throw new Error('Aucun itinéraire trouvé.');

      const etapes = (route.legs?.[0]?.steps || []).map((s) => ({
        instruction: `${s.maneuver?.type || 'continuer'}${s.name ? ` sur ${s.name}` : ''}`,
        distance: s.distance,
      }));

      setItineraire({
        distance: route.distance,
        duree: route.duration,
        etapes,
        vers: local.reference,
      });

      const map = leafletMapRef.current;
      const L = window.L;
      if (map && L) {
        if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = L.geoJSON(route.geometry, {
          style: { color: '#c9a15c', weight: 5, opacity: 0.9 },
        }).addTo(map);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
      }
    } catch (err) {
      toast.error(err.message || "Le calcul d'itinéraire a échoué.");
    } finally {
      setCalculItineraire(false);
    }
  };

  const effacerItineraire = () => {
    const map = leafletMapRef.current;
    if (map && routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    routeLayerRef.current = null;
    setItineraire(null);
  };

  const champ = {
    padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border)',
    background: '#fff', color: '#0f1b3d', fontSize: 12.5,
  };

  const carte = (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height, background: 'var(--surface-2)' }} />

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, width: 340, maxWidth: '75%', display: 'grid', gap: 8 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un local (référence, type, bloc…)"
          aria-label="Rechercher un local sur la carte"
          style={{ ...champ, width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)} aria-label="Filtrer par type" style={{ ...champ, flex: 1 }}>
            <option value="">Tous les types</option>
            {typesDisponibles.map((t) => (
              <option key={t} value={t}>{TYPES_LOCAL_LABELS[t] || t}</option>
            ))}
          </select>
          <select value={dispoFiltre} onChange={(e) => setDispoFiltre(e.target.value)} aria-label="Filtrer par disponibilité" style={{ ...champ, flex: 1 }}>
            <option value="">Tous les statuts</option>
            <option value="LIBRE">Disponibles</option>
            <option value="OCCUPE">Occupés</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={localiser}
        disabled={isLocating}
        style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 500, padding: '10px 14px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'var(--text-on-navy)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,.25)' }}
      >
        {isLocating ? 'Localisation…' : 'Ma position'}
      </button>

      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 500, background: 'rgba(255,255,255,.92)', padding: '6px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, color: '#0f1b3d' }}>
        {filtres.length} local(aux) affiché(s) / {geolocalises.length} géolocalisé(s)
      </div>

      {(loading || geolocalises.length === 0) && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.75)', zIndex: 400, pointerEvents: 'none', fontSize: 13, color: '#475569', fontWeight: 600, textAlign: 'center', padding: 20 }}>
          {loading
            ? 'Chargement de la carte des locaux…'
            : "Aucun local géolocalisé. Renseignez la latitude et la longitude dans le référentiel des locaux pour les afficher ici."}
        </div>
      )}
    </div>
  );

  if (!withPanel) return carte;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
      {carte}

      {/* ── Fiche locale latérale ─────────────────────────── */}
      <aside style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minHeight: 200 }}>
        {!selection ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-navy)', display: 'block', marginBottom: 6 }}>Fiche locale</strong>
            Sélectionnez un marqueur sur la carte pour afficher les caractéristiques du local
            et calculer un itinéraire depuis votre position.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-navy)' }}>{selection.reference}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {TYPES_LOCAL_LABELS[selection.type_local] || selection.type_local}
              </div>
            </div>

            {selection.photo_url && (
              <img src={selection.photo_url} alt={selection.reference}
                style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />
            )}

            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: 0, fontSize: 12.5 }}>
              <div><dt style={{ color: 'var(--muted)' }}>Surface</dt><dd style={{ margin: 0, fontWeight: 700 }}>{formatSurface(selection.surface_m2)}</dd></div>
              <div><dt style={{ color: 'var(--muted)' }}>Type</dt><dd style={{ margin: 0, fontWeight: 700 }}>{libelleType(selection)}</dd></div>
              <div><dt style={{ color: 'var(--muted)' }}>État</dt><dd style={{ margin: 0, fontWeight: 700 }}>{libelleEtat(selection)}</dd></div>
              <div><dt style={{ color: 'var(--muted)' }}>Gestionnaire</dt><dd style={{ margin: 0, fontWeight: 700 }}>{libelleGestionnaire(selection)}</dd></div>
              <div style={{ gridColumn: '1 / -1' }}><dt style={{ color: 'var(--muted)' }}>Localisation</dt><dd style={{ margin: 0, fontWeight: 700 }}>{selection.localisation || '-'}</dd></div>
            </dl>

            <div style={{ fontSize: 12, fontWeight: 800, color: estCandidatable(selection) ? '#16a34a' : '#2563eb' }}>
              {phraseDisponibilite(selection)}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selection.est_libre && (
                <Link to="/depot" state={{ local: selection }}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                  Candidater
                </Link>
              )}
              {!selection.est_libre && isAuthenticated && role === 'OCCUPANT' && (
                <Link to="/signaler" state={{ localId: selection.id }}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                  Signaler une panne
                </Link>
              )}
              {selection.type_local === 'RESTAURATION' && isAuthenticated && role === 'USAGER' && (
                <Link to="/avis" state={{ localId: selection.id }}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, background: '#c9a15c', color: 'var(--text-on-gold)', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                  Laisser un avis
                </Link>
              )}
              <button type="button" onClick={() => tracerItineraire(selection)} disabled={calculItineraire}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'var(--text-on-navy)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                {calculItineraire ? 'Calcul…' : 'Itinéraire'}
              </button>
              {itineraire && (
                <button type="button" onClick={effacerItineraire}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-navy)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  Effacer
                </button>
              )}
            </div>

            {itineraire && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 14, fontSize: 13, fontWeight: 800, color: 'var(--text-navy)' }}>
                  <span>{formatDistance(itineraire.distance)}</span>
                  <span>⏱ {formatDuree(itineraire.duree)}</span>
                </div>
                <ol style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--muted)', maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 4 }}>
                  {itineraire.etapes.map((etape, i) => (
                    <li key={`${etape.instruction}-${i}`}>
                      {etape.instruction} - {formatDistance(etape.distance)}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}


