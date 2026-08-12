import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import toast from 'react-hot-toast';

export default function LaisserAvis() {
  const [cantine, setCantine] = useState('Cantine A');
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Règle 2 : 20 caractères minimum
    if (commentaire.trim().length < 20) {
      toast.error('🚫 Règle anti-fraude : Votre avis doit faire au moins 20 caractères.');
      return;
    }

    // Règle 3 : Délai obligatoire de 17 jours entre deux avis sur la même cantine
    const lastSubmissionsKey = `last_review_${cantine}`;
    const lastSubmissionTimestamp = localStorage.getItem(lastSubmissionsKey);

    if (lastSubmissionTimestamp) {
      const daysDiff = (Date.now() - parseInt(lastSubmissionTimestamp, 10)) / (1000 * 60 * 60 * 24);
      if (daysDiff < 17) {
        const daysRemaining = Math.ceil(17 - daysDiff);
        toast.error(`⏳ Règle d'intégrité anti-fraude : Vous avez déjà évalué cette cantine. Veuillez attendre ${daysRemaining} jour(s) de plus (délai obligatoire de 17 jours).`);
        return;
      }
    }

    // Enregistrer le timestamp du dépôt
    localStorage.setItem(lastSubmissionsKey, Date.now().toString());

    toast.success(`⭐ Votre avis a été soumis avec succès pour la ${cantine} (Note : ${note}/5) ! Prochain avis autorisé dans 17 jours.`);
    setCommentaire('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Vie Étudiante & Restauration"
        title="Évaluer une Cantine ou Restauration (LR-18)"
        subtitle="Dépôt d'un avis vérifié soumis aux 4 règles d'intégrité anti-fraude du CROUS-T."
      />

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card style={{ flex: 1 }}>
          <AlertBanner type="info">
            🛡️ <strong>4 Règles Anti-Fraude d'Évaluation (CROUS-T) :</strong><br />
            1. Réservé aux étudiants avec carte validée.<br />
            2. Commentaire de 20 caractères minimum.<br />
            3. <strong>Délai obligatoire de 17 jours</strong> entre deux avis sur la même cantine.<br />
            4. Modération préalable des termes inappropriés.
          </AlertBanner>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <Field label="Cantine / Restauration / Amicale évaluée *" required>
              <Select value={cantine} onChange={(e) => setCantine(e.target.value)}>
                <option value="Cantine A">Cantine A (Mamadou Lô)</option>
                <option value="Cantine B">Cantine B (Complexe Central)</option>
                <option value="Kiosque Amphi 2">Kiosque Amphi 2</option>
                <option value="Amicale UFR SES">Amicale UFR SES (Local Kiosque)</option>
              </Select>
            </Field>

          <Field label="Note globale (sur 5 étoiles) *" required>
            <Select value={note} onChange={(e) => setNote(Number(e.target.value))}>
              <option value={5}>⭐⭐⭐⭐⭐ (5/5 - Excellent)</option>
              <option value={4}>⭐⭐⭐⭐☆ (4/5 - Très bien)</option>
              <option value={3}>⭐⭐⭐☆☆ (3/5 - Moyen)</option>
              <option value={2}>⭐⭐☆☆☆ (2/5 - Médiocre)</option>
              <option value={1}>⭐☆☆☆☆ (1/5 - Inacceptable)</option>
            </Select>
          </Field>

          <Field label="Votre commentaire détaillé (20 caractères min.) *" required>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              placeholder="Ex. Qualité des repas très satisfaisante, temps d'attente raisonnable au guichet..."
              required
            />
          </Field>

            <Button variant="amber" type="submit" style={{ justifyContent: 'center' }}>
              ⭐ Publier mon Avis Vérifié
            </Button>
          </form>
        </Card>

        {/* Panneau de droite : Photo & Description */}
        <Card style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <SectionHeader 
            eyebrow="Local Sélectionné" 
            title={cantine} 
            subtitle="Vérifiez qu'il s'agit bien de la structure que vous souhaitez évaluer."
            className="mb-4"
          />
          <div style={{ width: '100%', height: 200, backgroundColor: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40, marginBottom: 16, backgroundImage: cantine.includes('Cantine') ? 'linear-gradient(45deg, var(--teal), var(--navy))' : 'linear-gradient(45deg, var(--gold-deep), var(--amber))' }}>
            {cantine.includes('Amicale') ? '🏛️' : '🍽️'}
          </div>
          <div className="space-y-3 text-sm text-ink">
            <p>
              <strong>Description : </strong> 
              {cantine === 'Cantine A' ? "Cantine principale située à l'entrée du campus, gérée par Mamadou Lô. Spécialités locales et fast-food." :
               cantine === 'Cantine B' ? "Complexe central offrant des repas complets et diététiques." :
               cantine === 'Amicale UFR SES' ? "Kiosque géré par l'Amicale des Étudiants de l'UFR SES proposant reprographie et petite restauration." :
               "Kiosque de proximité situé près des amphithéâtres pour la pause café."}
            </p>
            <p><strong>Gérant / Bénéficiaire : </strong> {cantine.includes('Amicale') ? cantine : 'Gérant CROUS-T'}</p>
            <p><strong>Dernière inspection QHSE : </strong> {cantine === 'Cantine A' ? '12 Mai 2026' : '30 Avril 2026'}</p>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
