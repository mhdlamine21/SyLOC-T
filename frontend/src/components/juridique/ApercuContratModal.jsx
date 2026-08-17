import { Modal, Button } from '../common/ui';
import { ouvrirBailPDF } from '../../utils/pdfGenerator';

/** Modale d'aperçu (et impression / export PDF) du texte figé/rendu d'un acte. */
export default function ApercuContratModal({ open, onClose, apercu, loading }) {
  const handleOuvrirPDF = () => {
    if (!apercu) return;
    ouvrirBailPDF({
      reference: apercu.reference,
      demandeur_nom: apercu.occupant,
      demandeur_contact: apercu.occupant_contact,
      local_reference: apercu.local,
      local_localisation: apercu.local_localisation,
      date_debut: apercu.date_debut,
      date_fin: apercu.date_fin,
      duree_mois: apercu.duree_mois,
      preavis_mois: apercu.preavis_mois,
      texte_contrat: apercu.texte,
      est_actif: apercu.statut === 'ACTIF' || apercu.statut === 'EN_ATTENTE_SIGNATURE' || true,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={apercu ? `Aperçu - ${apercu.reference}` : 'Aperçu du contrat'} size="lg">
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Chargement de l'acte…</p>
      ) : apercu ? (
        <div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            <span>Occupant : <strong style={{ color: 'var(--text-navy)' }}>{apercu.occupant}</strong></span>
            <span>Local : <strong style={{ color: 'var(--text-navy)' }}>{apercu.local}</strong></span>
          </div>
          <div
            id="apercu-contrat-imprimable"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 20,
              maxHeight: '55vh',
              overflowY: 'auto',
            }}
          >
            {apercu.texte}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button variant="ghost" onClick={onClose}>Fermer</Button>
            <Button variant="amber" onClick={handleOuvrirPDF}>Ouvrir en PDF</Button>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Aucun aperçu disponible.</p>
      )}
    </Modal>
  );
}

