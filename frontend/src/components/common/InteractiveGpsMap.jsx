import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getLocaux } from '../../api/patrimoine';
import { TYPES_LOCAL_LABELS } from '../../utils/constants';
import { messageErreur } from '../../api/utils';

// Centre du campus VCN — CROUS de Thies (repli quand aucun local n'est geolocalise).
const CAMPUS_THIES_CENTER = [14.7912, -16.9254];

/**
 * Carte OpenStreetMap des locaux domaniaux.
 * Les marqueurs proviennent du referentiel patrimoine (API), pas de donnees en dur :
 * seuls les locaux dont la latitude/longitude est renseignee sont positionnes.
 *
 * Leaflet est charge via le CDN declare dans index.html (window.L).
 */
export default function InteractiveGpsMap({
  height = '380px',
  onLocationSelect = null,
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // 1. Referentiel des locaux
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const data = await getLocaux();
        if (!annule) setLocaux(Array.isArray(data) ? data : (data?.results ?? []));
      } catch (err) {
        if (!annule) toast.error(messageErreur(err, 'Impossible de charger la carte des locaux.'));
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  const geolocalises = useMemo(
    () => locaux.filter((l) => l.latitude != null && l.longitude != null),
    [locaux],
  );

  const filtres = useMemo(() => {
    const terme = searchQuery.trim().toLowerCase();
    if (!terme) return geolocalises;
    return geolocalises.filter((l) =>
      [l.reference, l.localisation, TYPES_LOCAL_LABELS[l.type_local] || l.type_local]
        .filter(Boolean)
        .some((champ) => String(champ).toLowerCase().includes(terme)),
    );
  }, [geolocalises, searchQuery]);

  // 2. Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapContainerRef.current).setView(CAMPUS_THIES_CENTER, 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap — CROUS de Thiès (Campus VCN)',
    }).addTo(map);
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 3. Marqueurs : re-dessines a chaque changement de referentiel ou de recherche
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = window.L;
    if (!map || !L) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    filtres.forEach((local) => {
      const libelleType = TYPES_LOCAL_LABELS[local.type_local] || local.type_local || 'Local';
      const marker = L.marker([local.latitude, local.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
            <strong style="color:#0f1b3d; font-size:14px;">${local.reference}</strong><br/>
            <span style="font-size:12px; color:#64748b; font-weight:600;">${libelleType} — ${local.surface_m2 ?? '?'} m²</span><br/>
            <span style="font-size:11px; color:#64748b; font-style:italic; display:block; margin-top:4px;">${local.localisation ?? ''}</span>
            <div style="margin-top:8px; font-size:11px; font-weight:bold; color:${local.est_libre ? '#16a34a' : '#2563eb'};">
              ${local.est_libre ? '✅ Disponible' : '👤 Occupé'}
            </div>
          </div>
        `);

      if (onLocationSelect) marker.on('click', () => onLocationSelect(local));
      markersRef.current.push(marker);
    });

    if (filtres.length > 0) {
      map.fitBounds(filtres.map((l) => [l.latitude, l.longitude]), {
        padding: [40, 40],
        maxZoom: 18,
      });
    }
  }, [filtres, onLocationSelect]);

  const handleGeolocateUser = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const map = leafletMapRef.current;
        if (map && window.L) {
          map.setView([latitude, longitude], 18);
          window.L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup('📍 <strong>Votre position actuelle</strong>')
            .openPopup();
        }
        toast.success(`📍 Position capturée : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        onLocationSelect?.({ id: 'GPS_CUSTOM', latitude, longitude, reference: 'Position GPS' });
      },
      () => {
        setIsLocating(false);
        leafletMapRef.current?.setView(CAMPUS_THIES_CENTER, 17);
        toast('📍 Position indisponible — recentrage sur le campus VCN.');
      },
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height, background: 'var(--surface-2)' }} />

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, width: 320, maxWidth: '70%' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un local (référence, type, bloc…)"
          aria-label="Rechercher un local sur la carte"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#0f1b3d', boxShadow: '0 2px 10px rgba(0,0,0,.15)', fontSize: 13 }}
        />
      </div>

      <button
        type="button"
        onClick={handleGeolocateUser}
        disabled={isLocating}
        style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 500, padding: '10px 14px', borderRadius: 8, border: 'none', background: 'var(--navy, #0f1b3d)', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,.25)' }}
      >
        {isLocating ? 'Localisation…' : '📍 Ma position'}
      </button>

      {(loading || geolocalises.length === 0) && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.75)', zIndex: 400, pointerEvents: 'none', fontSize: 13, color: '#475569', fontWeight: 600, textAlign: 'center', padding: 20 }}>
          {loading
            ? 'Chargement de la carte des locaux…'
            : "Aucun local géolocalisé. Renseignez la latitude et la longitude dans le référentiel des locaux pour les afficher ici."}
        </div>
      )}
    </div>
  );
}
