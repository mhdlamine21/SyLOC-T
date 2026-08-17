import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, SectionHeader, Card, Button, EmptyState, LoadingState } from '../components/common/ui';
import { getAppelsOuverts } from '../api/demandes';

const dateLocale = (v) => (v ? new Date(v).toLocaleDateString('fr-SN') : '-');
const joursRestants = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));

/** Vitrine des appels a candidature ouverts, cote Usager/Candidat. */
export default function AppelsCandidature() {
  const navigate = useNavigate();
  const [appels, setAppels] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    getAppelsOuverts()
      .then(setAppels)
      .catch(() => toast.error('Impossible de charger les appels à candidature.'))
      .finally(() => setChargement(false));
  }, []);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Candidat / Opportunités"
        title="Appels à candidature ouverts"
        subtitle="Publiés par la Cellule Communication et l’Amicale. Postulez avant la date de clôture."
      />

      {chargement ? (
        <LoadingState label="Chargement des appels…" />
      ) : appels.length === 0 ? (
        <EmptyState
          icon={<CampaignOutlinedIcon style={{ fontSize: 20 }} />}
          title="Aucun appel ouvert actuellement"
          description="Les nouvelles opportunités d'attribution seront publiées ici et sur la page d'accueil."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {appels.map((ap) => (
            <Card key={ap.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--teal)' }}>
                  CLÔTURE DANS {joursRestants(ap.date_cloture)} JOUR(S)
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: '6px 0' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-navy)' }}>
                    {ap.titre}
                  </h3>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 9px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(201, 161, 92, 0.15)',
                    color: 'var(--gold-deep)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}>
                    💰 {Number(ap.loyer_mensuel || 0) === 0 ? 'Gratuit (Subvention Étudiante)' : `${Number(ap.loyer_mensuel).toLocaleString('fr-SN')} FCFA / mois`}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>{ap.description}</p>
                <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Du {dateLocale(ap.date_lancement)} au {dateLocale(ap.date_cloture)}
                  {ap.local_reference ? ` · Local ${ap.local_reference}` : ''} · {ap.nombre_candidatures ?? 0} candidature(s)
                </p>

                {(ap.criteres || []).length > 0 && (
                  <div style={{ marginTop: 12, background: 'var(--surface-2)', borderRadius: 8, padding: 10 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>
                      Critères de sélection
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--muted)' }}>
                      {ap.criteres.map((c) => (
                        <li key={c.id}>
                          {String(c.type_critere).replace(/_/g, ' ')} : <strong>{c.valeur_cible}</strong> (poids {c.poids})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                style={{ justifyContent: 'center', marginTop: 14 }}
                onClick={() => navigate('/depot', { state: { appelId: ap.id, localId: ap.local || '' } })}
              >
                Postuler à cet appel
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

