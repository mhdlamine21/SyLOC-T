import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import { createPlainte } from '../../api/terrain';
import { getContrats } from '../../api/contrats';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SignalerProbleme() {
  const { role } = useAuth();
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('MOYENNE');
  const [photo, setPhoto] = useState(null);
  const [contrat, setContrat] = useState(null);
  const [localisation, setLocalisation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContrats().then(data => {
      if (data.length > 0) setContrat(data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contrat && !localisation.trim()) {
      toast.error('Veuillez préciser le lieu du dysfonctionnement.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('type', 'TECHNIQUE');
      formData.append('urgence', urgence);
      formData.append('description', description);
      if (contrat) {
        formData.append('local', contrat.local);
      } else {
        formData.append('localisation_libre', localisation);
      }
      if (photo) {
        formData.append('photo_preuve', photo);
      }
      
      await createPlainte(formData);
      toast.success('⚙️ Signalement d\'incident technique transmis au Service Technique du CROUS-T !');
      setDescription('');
      setLocalisation('');
      setPhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors du signalement.");
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Assistance & Service Technique"
        title="Signaler un Dysfonctionnement Technique"
        subtitle={contrat ? "Déclaration d'incident technique rattaché automatiquement à votre bail domanial actif." : "Déclaration d'incident technique sur le campus."}
      />

      <Card style={{ maxWidth: 640 }}>
        {loading ? (
          <p>Chargement...</p>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {contrat ? (
            <AlertBanner type="info">
              <strong>Rattachement Automatique au Bail :</strong> Votre signalement est automatiquement rattaché à votre contrat actif <strong>{contrat.local_reference || contrat.local}</strong>.
            </AlertBanner>
          ) : (
            <Field label="Lieu exact du dysfonctionnement *" required>
              <input 
                type="text" 
                value={localisation} 
                onChange={e => setLocalisation(e.target.value)} 
                placeholder="Ex: Bâtiment A, Toilettes 2ème étage..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}
                required 
              />
            </Field>
          )}

          {/* Champs masqués pour les étudiants (usager/occupant) pour simplifier */}
          {!(role === 'USAGER' || role === 'OCCUPANT') && (
            <Field label="Niveau d'Urgence du Signalement *" required>
              <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
                <option value="ELEVEE">Élevée (Fuite d'eau importante, coupure électrique générale)</option>
                <option value="MOYENNE">Moyenne (Serrure défectueuse, fissure murale, plomberie)</option>
                <option value="FAIBLE">ℹ️ Faible (Entretien préventif ou retouche peinture)</option>
              </Select>
            </Field>
          )}

          <Field label="Description détaillée de l'incident *" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Précisez la nature exacte du dysfonctionnement constaté dans votre local..."
              required
            />
          </Field>

          <Field label="Photo de preuve / constatation (optionnel)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </Field>

          <Button variant="navy" type="submit" style={{ justifyContent: 'center' }}>
            Soumettre le Signalement Technique
          </Button>
        </form>
        )}
      </Card>
    </PageWrapper>
  );
}

