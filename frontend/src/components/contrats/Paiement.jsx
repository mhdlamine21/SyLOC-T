import { useState } from 'react';
import { contratMock } from '../../mocks/data';
import { Card, SectionHeader, Button, Field, Select, PageWrapper, AlertBanner } from '../common/ui';
import toast from 'react-hot-toast';

export default function Paiement() {
  const [selectedEcheance, setSelectedEcheance] = useState('1');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
  const [telephone, setTelephone] = useState('771234567');
  const [refVirement, setRefVirement] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayer = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`✅ Paiement de l'échéance #${selectedEcheance} validé via ${modePaiement} ! Quitus généré.`);
    }, 800);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Guichet Caisse & Recouvrement"
        title="Paiement des Redevances & Émission du Quitus (LR-13)"
        subtitle="Règlement sécurisé par Mobile Money, virement ou espèces avec émission instantanée de quittance PDF."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            Formulaire de Règlement d'Échéance
          </h3>
          <form onSubmit={handlePayer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Sélectionner l'Échéance à Régler *" required>
              <Select value={selectedEcheance} onChange={(e) => setSelectedEcheance(e.target.value)}>
                {contratMock.echeances.map((ech) => (
                  <option key={ech.numero} value={ech.numero}>
                    Mois #{ech.numero} ({ech.date_limite}) — {ech.montant.toLocaleString()} FCFA [{ech.statut}]
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Mode de Règlement *" required>
              <Select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                <option value="MOBILE_MONEY">📱 Mobile Money (Orange Money / Wave / Free Money)</option>
                <option value="VIREMENT">🏦 Virement Bancaire (Compte CROUS-T)</option>
                <option value="ESPECES">💵 Espèces (Guichet Caisse Centrale)</option>
                <option value="CHEQUE">📝 Chèque certifié</option>
              </Select>
            </Field>

            {modePaiement === 'MOBILE_MONEY' && (
              <Field label="Numéro de Téléphone Mobile Money *" required>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="77 123 45 67"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                  required
                />
              </Field>
            )}

            {modePaiement === 'VIREMENT' && (
              <Field label="Référence du Virement Bancaire *" required>
                <input
                  type="text"
                  value={refVirement}
                  onChange={(e) => setRefVirement(e.target.value)}
                  placeholder="Ex. VIR-2026-99482"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                  required
                />
              </Field>
            )}

            <AlertBanner type="info">
              Montant total à acquitter : <strong>{contratMock.redevance_mensuelle.toLocaleString()} FCFA</strong>.<br />
              Le quitus officiel avec QR code sera téléchargeable dès validation du règlement.
            </AlertBanner>

            <Button variant="navy" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Traitement sécurisé du paiement…' : '💳 Régler & Générer le Quitus Officiel'}
            </Button>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
}
