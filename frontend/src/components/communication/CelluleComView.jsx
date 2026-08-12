import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import toast from 'react-hot-toast';

export default function CelluleComView() {
  const [showAppelModal, setShowAppelModal] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');

  const handlePublierAppel = (e) => {
    e.preventDefault();
    toast.success(`📢 Nouvel appel à candidature "${titre}" publié sur l'accueil !`);
    setShowAppelModal(false);
    setTitre('');
    setDescription('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication & Information"
        title="Gestion des Annonces & Appels à Candidature (UC07)"
        subtitle="Publication et modération des affiches officielles et opportunités d'occupation commercial."
      />

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="navy" onClick={() => setShowAppelModal(true)}>
          📢 Lancer un Nouvel Appel à Candidature
        </Button>
      </div>

      <Card style={{ borderLeft: '4px solid var(--gold)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 800 }}>
          Panneau des Annonces Actives
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
          3 annonces officielles et 1 appel à candidature sont actuellement épinglés sur la page d'accueil de la plateforme SyLOC.
        </p>
        <Button variant="secondary" onClick={() => toast.success('Affiche d\'annonce mise à jour sur l\'accueil.')}>
          📌 Gérer les affiches épinglées
        </Button>
      </Card>

      {showAppelModal && (
        <Modal open={showAppelModal} onClose={() => setShowAppelModal(false)} title="Lancer un Appel à Candidature">
          <form onSubmit={handlePublierAppel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Titre de l'Appel à Candidature *" required>
              <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Appel d'offres : Kiosque Bloc D..." required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>
            <Field label="Description & Critères de Sélection *" required>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Précisez la surface, la localisation et les conditions de dépôt..." required />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setShowAppelModal(false)}>Annuler</Button>
              <Button variant="amber" type="submit">Publier sur l'Accueil</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
