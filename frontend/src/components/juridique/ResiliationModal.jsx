import { useState } from 'react';
import { Modal, Button, Field, Textarea, Input } from '../common/ui';

/** Modale de rupture / résiliation d'un contrat (UC42). */
export default function ResiliationModal({ open, onClose, contrat, onConfirm, saving }) {
  const [motif, setMotif] = useState('');
  const [dateEffet, setDateEffet] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ motif, date_effet: dateEffet || undefined });
  };

  const handleClose = () => {
    setMotif('');
    setDateEffet('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={contrat ? `Résiliation du bail ${contrat.reference}` : 'Résiliation'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Motif de la résiliation" required>
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Impayé persistant, manquement QHSE, résiliation amiable…"
            required
          />
        </Field>
        <Field label="Date d'effet" hint="Optionnelle - aujourd'hui par défaut">
          <Input type="date" value={dateEffet} onChange={(e) => setDateEffet(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <Button variant="ghost" type="button" onClick={handleClose}>Annuler</Button>
          <Button variant="danger" type="submit" disabled={saving}>
            {saving ? 'Résiliation…' : '⚖ Émettre l\'acte de résiliation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

