import { useRef, useState, useEffect } from 'react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import { PageWrapper, SectionHeader, Button } from '../common/ui';
import InteractiveGpsMap from '../common/InteractiveGpsMap';

export default function CarteLocaux() {
  const conteneurRef = useRef(null);
  const [pleinEcran, setPleinEcran] = useState(false);

  useEffect(() => {
    const onChange = () => setPleinEcran(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const basculerPleinEcran = async () => {
    try {
      if (!document.fullscreenElement) {
        await conteneurRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Ignorer si non supporté
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Patrimoine domanial · Campus VCN"
        title="Carte GPS des locaux"
        subtitle="Localisez les cantines, boutiques et espaces artisanaux du CROUS-T, filtrez par type ou disponibilité, puis calculez votre itinéraire depuis votre position."
        action={(
          <Button
            variant="secondary"
            onClick={basculerPleinEcran}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {pleinEcran ? <FullscreenExitIcon style={{ fontSize: 18 }} /> : <FullscreenIcon style={{ fontSize: 18 }} />}
            {pleinEcran ? 'Quitter le plein écran' : 'Plein écran'}
          </Button>
        )}
      />

      <div
        ref={conteneurRef}
        style={{
          position: 'relative',
          background: pleinEcran ? 'var(--surface-1, #fff)' : 'transparent',
          padding: pleinEcran ? 16 : 0,
        }}
      >
        {/* Barre d'outils et légende modernisée */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          {/* Légende */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-navy)',
          }}>
            <span style={{
              fontWeight: 800,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              fontSize: 10.5,
              letterSpacing: '0.6px',
              fontFamily: 'var(--font-mono)',
            }}>
              Légende
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 2px rgba(22,163,74,0.2)' }} />
              Local disponible
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block', boxShadow: '0 0 0 2px rgba(37,99,235,0.2)' }} />
              Local occupé
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9a15c', display: 'inline-block', boxShadow: '0 0 0 2px rgba(201,161,92,0.2)' }} />
              Votre position
            </span>
          </div>

          {/* Badge mode piéton OpenStreetMap */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            <DirectionsWalkOutlinedIcon style={{ fontSize: 16, color: 'var(--gold)' }} />
            <span>Itinéraires piétons OpenStreetMap</span>
          </div>
        </div>

        <div style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <InteractiveGpsMap height={pleinEcran ? 'calc(100vh - 150px)' : '620px'} withPanel />
        </div>
      </div>
    </PageWrapper>
  );
}
