import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Button, Modal } from '../common/ui';

const extensionOf = (url = '') => {
  const clean = url.split('?')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

/**
 * Visionneuse premium des pieces jointes (PDF / images) avec telechargement direct.
 * Reutilisable partout ou une demande expose une liste de documents.
 */
export default function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null;
  const ext = extensionOf(doc.fichier || '');
  const isImage = IMAGE_EXT.includes(ext);
  const isPdf = ext === 'pdf';
  const label = doc.type_label || doc.type_document || 'Document';
  const nomFichier = doc.libelle || (doc.fichier || '').split('/').pop();

  return (
    <Modal open={!!doc} onClose={onClose} title={label} size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{nomFichier}</div>

        <div
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
            minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}
        >
          {isImage ? (
            <img src={doc.fichier} alt={label} style={{ maxWidth: '100%', maxHeight: 560, objectFit: 'contain' }} />
          ) : isPdf ? (
            <iframe title={label} src={doc.fichier} style={{ width: '100%', height: 560, border: 'none' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 40, color: 'var(--muted)' }}>
              <InsertDriveFileOutlinedIcon style={{ fontSize: 48 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Aperçu indisponible pour ce format ({ext || 'inconnu'}).</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <a href={doc.fichier} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" type="button">
              <OpenInNewOutlinedIcon style={{ fontSize: 16, marginRight: 6 }} /> Ouvrir dans un nouvel onglet
            </Button>
          </a>
          <a href={doc.fichier} download style={{ textDecoration: 'none' }}>
            <Button variant="navy" type="button">
              <DownloadOutlinedIcon style={{ fontSize: 16, marginRight: 6 }} /> Télécharger
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
}
