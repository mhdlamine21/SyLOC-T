import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useEffect, useState } from 'react';
import { getDelegationCommission, toggleDelegationCommission } from '../../api/demandes';
import { Button } from '../common/ui';

/**
 * Carte d'alerte réutilisable pour l'Administration SI : à intégrer dans
 * ParametresSysteme lorsque le Directeur DCUVE est absent depuis longtemps,
 * pour permettre à l'administrateur d'activer la délégation à la Commission.
 */
export default function DelegationDcuveAlert() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDelegationCommission().then((d) => setActive(!!d?.active)).catch(() => {});
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      const r = await toggleDelegationCommission(!active);
      setActive(!!r?.active);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      padding: '16px 20px', borderRadius: 14, flexWrap: 'wrap',
      background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.3)',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <WarningAmberOutlinedIcon style={{ color: 'var(--red)', fontSize: 22 }} />
        <div style={{ fontSize: 13, color: 'var(--text-navy)' }}>
          <strong>Absence prolongée du Directeur DCUVE ?</strong><br />
          En tant qu'Administrateur SI, vous pouvez activer la délégation à la Commission d'évaluation pour éviter tout blocage des dossiers.
        </div>
      </div>
      <Button variant={active ? 'danger' : 'amber'} onClick={toggle} disabled={loading}>
        {active ? 'Désactiver la délégation' : 'Activer la délégation (absence DCUVE)'}
      </Button>
    </div>
  );
}
