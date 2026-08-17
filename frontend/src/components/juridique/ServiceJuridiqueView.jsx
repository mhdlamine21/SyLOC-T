import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageWrapper, SectionHeader, Button } from '../common/ui';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BauxARediger from './BauxARediger';
import PortefeuilleContrats from './PortefeuilleContrats';
import ModelesContrats from './ModelesContrats';

const TABS = [
  { key: 'baux', label: 'Baux à rédiger' },
  { key: 'portefeuille', label: 'Portefeuille contractuel' },
  { key: 'modeles', label: "Modèles d'actes" },
];

export default function ServiceJuridiqueView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : 'baux'
  );

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Rédaction des Contrats & Baux Domaniaux (UC42)"
        subtitle="Émission des actes d'attribution, gestion du portefeuille contractuel et des modèles, résiliation et suivi statistique."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            style={{ gap: 6, fontWeight: 700 }}
          >
            <ArrowBackOutlinedIcon style={{ fontSize: 16 }} />
            Retour au tableau de bord
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'ghost'}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'baux' && <BauxARediger />}
      {activeTab === 'portefeuille' && <PortefeuilleContrats />}
      {activeTab === 'modeles' && <ModelesContrats />}
    </PageWrapper>
  );
}

