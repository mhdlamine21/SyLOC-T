import { useState } from 'react';
import { PageWrapper, SectionHeader, Button } from '../common/ui';
import BauxARediger from './BauxARediger';
import PortefeuilleContrats from './PortefeuilleContrats';
import ModelesContrats from './ModelesContrats';

const TABS = [
  { key: 'baux', label: 'Baux à rédiger' },
  { key: 'portefeuille', label: 'Portefeuille contractuel' },
  { key: 'modeles', label: "Modèles d'actes" },
];

export default function ServiceJuridiqueView() {
  const [activeTab, setActiveTab] = useState('baux');

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Rédaction des Contrats & Baux Domaniaux (UC42)"
        subtitle="Émission des actes d'attribution, gestion du portefeuille contractuel et des modèles, résiliation et suivi statistique."
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab.key)}
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

