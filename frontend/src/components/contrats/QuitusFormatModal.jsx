import { Modal, Button } from '../common/ui';
import { genererQuitusPDF } from '../../utils/pdfGenerator';

/**
 * Modale de choix du format d'impression d'un quitus : Ticket de caisse
 * (thermique 80mm) ou Facture institutionnelle A4.
 */
export default function QuitusFormatModal({ quitus, onClose }) {
  const imprimer = (format) => {
    if (!quitus) return;
    genererQuitusPDF(quitus, { format });
    onClose?.();
  };

  return (
    <Modal open={!!quitus} onClose={onClose} title="Ã‰dition du quitus" size="sm">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
        Choisissez le format d&apos;impression du reÃ§u de paiement.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        <Button variant="secondary" onClick={() => imprimer('TICKET')} style={{ width: '100%', justifyContent: 'center' }}>
          Ticket de caisse (80mm)
        </Button>
        <Button onClick={() => imprimer('A4')} style={{ width: '100%', justifyContent: 'center' }}>
          Facture A4
        </Button>
      </div>
    </Modal>
  );
}

