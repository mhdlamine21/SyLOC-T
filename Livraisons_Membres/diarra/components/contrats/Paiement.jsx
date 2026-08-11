import { useState } from 'react';
import { contratMock } from '../../../frontend/src/mocks/data';
import { Card, SectionHeader, Button, Field, Select, PageWrapper, AlertBanner } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function Paiement() {
  const [selectedEcheance, setSelectedEcheance] = useState('1');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
  const [loading, setLoading] = useState(false);

  const handlePayer = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`✅ Paiement enregistré avec succès via ${modePaiement} ! Quitus émis.`);
    }, 700);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Guichet Caisse & Recouvrement"
        title="Paiement des Redevances & Quitus Officiel (LR-13)"
        subtitle="Règlement sécurisé des échéances domaniales et génération instantanée du quitus."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            Effectuer un Règlement
          </h3>
          <form onSubmit={handlePayer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Sélectionner l'Échéance à payer *" required>
              <Select value={selectedEcheance} onChange={(e) => setSelectedEcheance(e.target.value)}>
                {contratMock.echeances.map((ech) => (
                  <option key={ech.numero} value={ech.numero}>
                    Échéance #{ech.numero} ({ech.date_limite}) — {ech.montant.toLocaleString()} FCFA [{ech.statut}]
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Mode de Règlement *" required>
              <Select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                <option value="MOBILE_MONEY">📱 Mobile Money (Orange Money / Wave)</option>
                <option value="VIREMENT">🏦 Virement Bancaire</option>
                <option value="ESPECES">💵 Espèces (Guichet Caisse)</option>
                <option value="CHEQUE">📝 Chèque certifié</option>
              </Select>
            </Field>

            <AlertBanner type="info">
              Montant à régler : <strong>{contratMock.redevance_mensuelle.toLocaleString()} FCFA</strong>. Un quitus de paiement vous sera émis à la validation.
            </AlertBanner>

            <Button variant="navy" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Traitement du paiement…' : '💳 Valider et Émettre le Quitus'}
            </Button>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
}
