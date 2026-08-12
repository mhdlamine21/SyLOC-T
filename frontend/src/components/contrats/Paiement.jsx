import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Field, Select, PageWrapper, AlertBanner, EmptyState, LoadingState } from '../common/ui';
import { getEcheances, reglerPaiement } from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import { genererQuitusPDF } from '../../utils/pdfGenerator';
import { MODES_PAIEMENT } from '../../utils/constants';
import toast from 'react-hot-toast';

const LIBELLES_MODE = Object.fromEntries(MODES_PAIEMENT.map((m) => [m.value, m.label]));

export default function Paiement() {
  const [echeances, setEcheances] = useState([]);
  const [selectedEcheance, setSelectedEcheance] = useState('');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dernierQuitus, setDernierQuitus] = useState(null);

  const fetchEcheances = async () => {
    try {
      const data = await getEcheances();
      const impayees = data.filter((e) => e.statut !== 'PAYEE');
      setEcheances(impayees);
      setSelectedEcheance(impayees.length > 0 ? impayees[0].id : '');
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement des échéances.'));
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchEcheances();
  }, []);

  const echeanceCourante = echeances.find(
    (e) => String(e.id) === String(selectedEcheance),
  );

  /** Construit les données du quitus à partir de la réponse API et de l'échéance réglée. */
  const construireQuitus = (paiement, echeance) => ({
    quitusId: paiement?.reference_quitus || String(paiement?.id || '').slice(0, 8).toUpperCase(),
    date: new Date(paiement?.date_paiement || Date.now()).toLocaleDateString('fr-FR'),
    occupant: paiement?.occupant_nom || echeance?.occupant_nom || '—',
    local: paiement?.local_reference || echeance?.local_reference || '—',
    montant: paiement?.montant_regle ?? echeance?.montant_du ?? 0,
    modePaiement: LIBELLES_MODE[paiement?.mode || modePaiement] || modePaiement,
    echeance: echeance?.date_exigibilite
      ? `Échéance du ${new Date(echeance.date_exigibilite).toLocaleDateString('fr-FR')}`
      : '—',
  });

  const handlePayer = async (e) => {
    e.preventDefault();
    if (!echeanceCourante) return;
    setLoading(true);

    try {
      const paiement = await reglerPaiement(
        echeanceCourante.id,
        echeanceCourante.montant_du,
        modePaiement,
        modePaiement === 'MOBILE_MONEY' ? telephone : '',
      );

      const quitus = construireQuitus(paiement, echeanceCourante);
      setDernierQuitus(quitus);
      genererQuitusPDF(quitus);

      toast.success(`✅ Paiement validé. Quitus ${quitus.quitusId} téléchargé.`);
      setTelephone('');
      await fetchEcheances();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du paiement.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Guichet Caisse & Recouvrement"
        title="Paiement des redevances & émission du quitus"
        subtitle="Règlement par Mobile Money ou en espèces, avec émission immédiate de la quittance PDF officielle."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            Règlement d'une échéance
          </h3>

          {initialLoading ? (
            <LoadingState label="Chargement de l'échéancier…" />
          ) : echeances.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Aucune échéance en attente"
              description="Toutes les redevances exigibles ont été réglées."
            />
          ) : (
            <form onSubmit={handlePayer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Échéance à régler *" required>
                <Select value={selectedEcheance} onChange={(e) => setSelectedEcheance(e.target.value)}>
                  {echeances.map((ech) => (
                    <option key={ech.id} value={ech.id}>
                      {ech.local_reference ? `${ech.local_reference} — ` : ''}
                      Échéance du {new Date(ech.date_exigibilite).toLocaleDateString('fr-FR')} —{' '}
                      {Number(ech.montant_du).toLocaleString('fr-FR')} FCFA [{ech.statut}]
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Mode de règlement *" required>
                <Select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                  <option value="MOBILE_MONEY">📱 Mobile Money (Orange Money / Wave / Free Money)</option>
                  <option value="ESPECES">💵 Espèces (guichet caisse centrale)</option>
                </Select>
              </Field>

              {modePaiement === 'MOBILE_MONEY' && (
                <Field label="Numéro Mobile Money *" required>
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

              <AlertBanner type="info">
                Montant à acquitter :{' '}
                <strong>{Number(echeanceCourante?.montant_du || 0).toLocaleString('fr-FR')} FCFA</strong>.
                <br />
                Le quitus PDF est généré et téléchargé automatiquement dès validation.
              </AlertBanner>

              <Button variant="navy" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Traitement du paiement…' : '💳 Régler & générer le quitus'}
              </Button>
            </form>
          )}
        </Card>

        {dernierQuitus && (
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
              Dernier quitus émis
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.9, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>
              <div>N° : <strong>{dernierQuitus.quitusId}</strong></div>
              <div>Date : {dernierQuitus.date}</div>
              <div>Occupant : {dernierQuitus.occupant}</div>
              <div>Local : {dernierQuitus.local}</div>
              <div>Montant : {Number(dernierQuitus.montant).toLocaleString('fr-FR')} FCFA</div>
              <div>Mode : {dernierQuitus.modePaiement}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => genererQuitusPDF(dernierQuitus)}
              style={{ marginTop: 14 }}
            >
              ⬇ Retélécharger le quitus PDF
            </Button>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
