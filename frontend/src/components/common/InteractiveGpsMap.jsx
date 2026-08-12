import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function InteractiveGpsMap({
  height = '380px',
  interactive = true,
  onLocationSelect = null,
  selectedLocId = null
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Coordonnées Réelles du Campus VCN - CROUS de Thiès
  const CAMPUS_THIES_CENTER = [14.7912, -16.9254];

  const [searchQuery, setSearchQuery] = useState('');

  // Liste des Locaux Domaniaux avec Coordonnées GPS Réelles du Campus et Descriptions Enrichies
  const locauxDomaniaux = [
    { id: 'LOC-004', name: 'Cantine A (Mamadou Lô)', type: 'Restauration', coords: [14.7915, -16.9258], statut: 'OCCUPE', occupant: 'Mamadou Lô', description: 'Restaurant, fast-food, repas chauds, alimentation', tarif: 150000 },
    { id: 'LOC-001', name: 'Kiosque Bloc A (Aïssatou Ndiaye)', type: 'Vente Produits', coords: [14.7908, -16.9251], statut: 'OCCUPE', occupant: 'Aïssatou Ndiaye', description: 'Boutique, alimentation, divers, produits de première nécessité', tarif: 50000 },
    { id: 'LOC-002', name: 'Multiservices (Ousmane Traoré)', type: 'Services', coords: [14.7921, -16.9261], statut: 'OCCUPE', occupant: 'Ousmane Traoré', description: "Impression, photocopie, transfert d'argent, Orange Money, Wave", tarif: 40000 },
    { id: 'LOC-003', name: 'Espace Commercial Bloc C', type: 'Artisanat', coords: [14.7918, -16.9248], statut: 'DISPONIBLE', occupant: 'Disponible', description: 'Idéal pour coiffeur, tailleur, artisanat, beauté, salon', tarif: 60000 },
    { id: 'LOC-005', name: 'Papeterie Universitaire', type: 'Papeterie', coords: [14.7905, -16.9259], statut: 'DISPONIBLE', occupant: 'Disponible', description: 'Fournitures scolaires, livres, stylos, cahiers', tarif: 45000 },
  ];

  const filteredLocaux = locauxDomaniaux.filter(loc => {
    const term = searchQuery.toLowerCase();
    return loc.name.toLowerCase().includes(term) || 
           loc.type.toLowerCase().includes(term) || 
           loc.description.toLowerCase().includes(term);
  });

  // 1. Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (window.L && !leafletMapRef.current) {
      const L = window.L;
      const map = L.map(mapContainerRef.current).setView(CAMPUS_THIES_CENTER, 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap - CROUS de Thiès (Campus VCN)',
      }).addTo(map);
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 2. Mise à jour des marqueurs selon la recherche
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const map = leafletMapRef.current;
    const L = window.L;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Ajouter les marqueurs filtrés
    filteredLocaux.forEach((loc) => {
      const marker = L.marker(loc.coords)
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
            <strong style="color: #172554; font-size: 14px;">${loc.name}</strong><br/>
            <span style="font-size: 12px; color: #64748b; font-weight: 600;">Type: ${loc.type}</span><br/>
            ${loc.statut === 'DISPONIBLE' && loc.tarif ? `<span style="font-size: 12px; color: #16a34a; font-weight: bold;">Loyer indicatif : ${loc.tarif} FCFA</span><br/>` : ''}
            <span style="font-size: 11px; color: #64748b; font-style: italic; display: block; margin-top: 4px;">${loc.description}</span>
            <div style="margin-top: 8px; font-size: 11px; font-weight: bold; color: ${loc.statut === 'DISPONIBLE' ? '#16a34a' : '#2563eb'};">
              ${loc.statut === 'DISPONIBLE' ? '✅ Disponible' : '👤 Occupant : ' + loc.occupant}
            </div>
          </div>
        `);

      if (interactive && onLocationSelect) {
        marker.on('click', () => onLocationSelect(loc));
      }
      markersRef.current.push(marker);
    });
  }, [searchQuery]);

  const handleGeolocateUser = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          setIsLocating(false);

          if (leafletMapRef.current && window.L) {
            const L = window.L;
            leafletMapRef.current.setView([lat, lng], 18);
            L.marker([lat, lng])
              .addTo(leafletMapRef.current)
              .bindPopup('📍 <strong>Votre position GPS actuelle</strong>')
              .openPopup();
          }

          toast.success(`📍 Position GPS capturée : ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          if (onLocationSelect) {
            onLocationSelect({ id: 'GPS_CUSTOM', lat, lng, reference: 'Position GPS Agent' });
          }
        },
        () => {
          setIsLocating(false);
          const fallback = { lat: 14.7912, lng: -16.9254 };
          setUserLocation(fallback);
          toast('📍 Position par défaut du Campus VCN appliquée.');
        }
      );
    } else {
      setIsLocating(false);
      toast.error('Géolocalisation GPS non supportée par votre navigateur.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: height, background: 'var(--surface-2)' }} />

      {/* Barre de recherche dynamique sur la carte */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: '320px', maxWidth: '80%' }}>
        <input 
          type="text" 
          placeholder="Rechercher (ex: coiffeur, restaurant, boutique...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 8 }}>
        <button
          onClick={handleGeolocateUser}
          disabled={isLocating}
          style={{
            background: 'var(--navy)',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          📍 {isLocating ? 'Géolocalisation...' : 'Ma Position GPS en direct'}
        </button>
      </div>

      {userLocation && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'rgba(23, 37, 84, 0.9)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          Lat: {userLocation.lat.toFixed(5)} | Lng: {userLocation.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
