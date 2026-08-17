import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { useState, useEffect, useMemo } from 'react';
import { Card, SectionHeader, Button, Field, Select, Input, PageWrapper, AlertBanner, EmptyState, LoadingState } from '../common/ui';
import { getEcheances, reglerPaiement, getConfigMobileMoney } from '../../api/paiements';
import { messageErreur } from '../../api/utils';
import QuitusFormatModal from './QuitusFormatModal';
import { MODES_PAIEMENT } from '../../utils/constants';
import toast from 'react-hot-toast';

const LIBELLES_MODE = Object.fromEntries(MODES_PAIEMENT.map((m) => [m.value, m.label]));

/** Numéro officiel de la caisse centrale pour les dépôts Mobile Money (repli si non configuré côté back-office). */
const NUMERO_CAISSE_DEFAUT = '77 000 00 00';

/** Format sénégalais des numéros mobiles : 70/75/76/77/78 suivi de 7 chiffres. */
const REGEX_TEL_SN = /^(70|75|76|77|78)\d{7}$/;

const normaliserTel = (v) => (v || '').replace(/\D/g, '').replace(/^221/, '');

const formaterTel = (v) => {
  const d = normaliserTel(v);
  return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

export default function Paiement() {
  const [echeances, setEcheances] = useState([]);
  const [selectedEcheance, setSelectedEcheance] = useState('');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
  const [telephone, setTelephone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dernierPaiement, setDernierPaiement] = useState(null);
  const [quitusAffiche, setQuitusAffiche] = useState(null);
  const [numeroCaisse, setNumeroCaisse] = useState(NUMERO_CAISSE_DEFAUT);
  const [numeroWave, setNumeroWave] = useState('');
  const [telError, setTelError] = useState('');

  const totalDu = (ech) => Number(ech?.montant_du || 0) + Number(ech?.montant_penalite || 0);

  const fetchEcheances = async () => {
    try {
      const data = await getEcheances();
      const impayees = data.filter((e) => e.statut !== 'PAYEE');
      setEcheances(impayees);
      const premiere = impayees.length > 0 ? impayees[0] : null;
      setSelectedEcheance(premiere ? premiere.id : '');
      if (premiere) setMontant(String(totalDu(premiere)));
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement des échéances.'));
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchEcheances();
    // Numeros officiels de depot : endpoint ouvert a tout utilisateur connecte.
    // (L'ancien appel visait /admin/parametres/, interdit a l'occupant -> 403.)
    getConfigMobileMoney()
      .then((cfg) => {
        if (cfg?.orange_money) setNumeroCaisse(cfg.orange_money);
        if (cfg?.wave) setNumeroWave(cfg.wave);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const echeanceCourante = echeances.find(
    (e) => String(e.id) === String(selectedEcheance),
  );

  const changerEcheance = (id) => {
    setSelectedEcheance(id);
    const ech = echeances.find((e) => String(e.id) === String(id));
    if (ech) setMontant(String(totalDu(ech)));
  };

  const resteAPayer = echeanceCourante ? Math.max(totalDu(echeanceCourante) - Number(montant || 0), 0) : 0;

  const handleTelChange = (v) => {
    const digits = normaliserTel(v).slice(0, 9);
    setTelephone(digits);
    if (digits.length === 0) setTelError('');
    else if (!REGEX_TEL_SN.test(digits)) setTelError('Numéro sénégalais invalide (ex. 77 123 45 67).');
    else setTelError('');
  };

  const telephoneValide = REGEX_TEL_SN.test(normaliserTel(telephone));

  const handlePayer = async (e) => {
    e.preventDefault();
    if (!echeanceCourante) return;
    const montantNum = Number(montant);
    if (!montantNum || montantNum <= 0) return toast.error('Montant invalide.');
    if (modePaiement === 'MOBILE_MONEY' && !telephoneValide) {
      setTelError('Veuillez saisir le numéro sénégalais utilisé pour le dépôt (ex. 77 123 45 67).');
      return toast.error('Numéro de téléphone invalide.');
    }
    if (modePaiement === 'MOBILE_MONEY' && !transactionId.trim()) {
      return toast.error("Veuillez indiquer l'identifiant de la transaction Mobile Money.");
    }
    setLoading(true);

    try {
      const paiement = await reglerPaiement(
        echeanceCourante.id,
        montantNum,
        modePaiement,
        modePaiement === 'MOBILE_MONEY'
          ? `TXN: ${transactionId} | NUMERO_CAISSE: ${numeroCaisse}`
          : '',
        modePaiement === 'MOBILE_MONEY' ? normaliserTel(telephone) : '',
      );

      setDernierPaiement(paiement);

      toast.success(
        modePaiement === 'ESPECES'
          ? "Déclaration enregistrée. Présentez-vous au Service Comptable pour remettre le montant."
          : "Dépôt déclaré. Le Service Comptable va le confirmer.",
      );
      setMontant('');
      setTelephone('');
      setTransactionId('');
      setTelError('');
      setModePaiement('MOBILE_MONEY');
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
        subtitle="Mobile Money ou espèces, règlement partiel autorisé. Le quitus est émis par le Service Comptable après contrôle."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(280px, 1fr)', gap: 24, alignItems: 'start' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '20px 26px',
              background: 'linear-gradient(135deg, var(--navy) 0%, #142a5c 100%)',
              color: 'var(--text-on-navy)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <PaymentsOutlinedIcon style={{ fontSize: 26, color: 'var(--gold)' }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, fontWeight: 800 }}>
                Règlement d'une échéance
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, opacity: 0.85 }}>Sélectionnez l'échéance, le mode et validez.</p>
            </div>
          </div>

          <div style={{ padding: 26 }}>
            {initialLoading ? (
              <LoadingState label="Chargement de l'échéancier…" />
            ) : echeances.length === 0 ? (
              <EmptyState
                icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />}
                title="Aucune échéance en attente"
                description="Toutes les redevances exigibles ont été réglées."
              />
            ) : (
              <form onSubmit={handlePayer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Échéance à régler *" required>
                  <Select value={selectedEcheance} onChange={(e) => changerEcheance(e.target.value)}>
                    {echeances.map((ech) => (
                      <option key={ech.id} value={ech.id}>
                        {ech.local_reference ? `${ech.local_reference} - ` : ''}
                        Échéance du {new Date(ech.date_exigibilite).toLocaleDateString('fr-FR')} -{' '}
                        {Number(totalDu(ech)).toLocaleString('fr-FR')} FCFA [{ech.statut}]
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Montant réglé *" hint="Règlement partiel autorisé" required>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Mode de règlement *" required>
                  <Select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                    <option value="MOBILE_MONEY">Mobile Money (Orange Money / Wave / Free Money)</option>
                    <option value="ESPECES">Espèces (guichet caisse centrale)</option>
                  </Select>
                </Field>

                {modePaiement === 'MOBILE_MONEY' && (
                  <div
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 16,
                      padding: 18, borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--gold-tint, #fdf3df) 0%, rgba(201,161,92,.10) 100%)',
                      border: '1px solid var(--gold, #c9a15c)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: 'var(--navy)', color: 'var(--gold)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        <AccountBalanceWalletOutlinedIcon style={{ fontSize: 22 }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--slate)', fontWeight: 700 }}>
                          Numéro officiel de dépôt (caisse centrale CROUS-T)
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-navy)', letterSpacing: '.5px' }}>
                          {numeroCaisse}
                        </p>
                        {numeroWave && (
                          <p style={{ margin: '2px 0 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>
                            Wave : <strong style={{ color: 'var(--text-navy)' }}>{numeroWave}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    <AlertBanner type="warn">
                      Effectuez d'abord votre dépôt Orange Money / Wave vers ce numéro, puis renseignez ci-dessous
                      le numéro utilisé et la référence de la transaction reçue par SMS.
                    </AlertBanner>

                    <Field
                      label="Votre numéro de téléphone (utilisé pour le dépôt) *"
                      required
                      error={telError}
                      hint="Format sénégalais : 70/75/76/77/78 suivi de 7 chiffres."
                    >
                      <div style={{ position: 'relative' }}>
                        <PhoneIphoneOutlinedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--slate)' }} />
                        <input
                          type="tel"
                          value={formaterTel(telephone)}
                          onChange={(e) => handleTelChange(e.target.value)}
                          placeholder="77 123 45 67"
                          style={{
                            width: '100%', padding: '12px 14px 12px 38px', borderRadius: 10,
                            border: `1px solid ${telError ? 'var(--red)' : 'var(--border)'}`,
                            background: 'var(--surface)', fontSize: 14, fontFamily: 'var(--font-mono)',
                          }}
                          required
                        />
                        {telephoneValide && (
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontSize: 16 }}>✓</span>
                        )}
                      </div>
                    </Field>

                    <Field label="Numéro de transaction (ID) reçu du fournisseur *" required>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Ex: PP12345678 (Orange Money, Wave, etc.)"
                        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14 }}
                        required
                      />
                    </Field>
                  </div>
                )}

                <AlertBanner type={modePaiement === 'ESPECES' ? 'warn' : 'info'}>
                  Montant total dû : <strong>{Number(totalDu(echeanceCourante) || 0).toLocaleString('fr-FR')} FCFA</strong>.
                  {resteAPayer > 0 && (
                    <>
                      {' '}Reste à payer après ce règlement :{' '}
                      <strong>{resteAPayer.toLocaleString('fr-FR')} FCFA</strong>.
                    </>
                  )}
                  <br /><br />
                  {modePaiement === 'ESPECES' ? (
                    <>
                      Vous devez <strong>vous rendre physiquement au Service Comptable</strong> (guichet de la
                      caisse centrale) pour remettre le montant. Le comptable encaisse, valide,
                      et <strong>c'est seulement à ce moment que votre quitus apparaît</strong> dans votre espace.
                    </>
                  ) : (
                    <>
                      Aucun déplacement nécessaire : le Service Comptable <strong>confirme simplement</strong> votre
                      dépôt, puis <strong>votre quitus devient disponible</strong> dans votre espace occupant.
                    </>
                  )}
                </AlertBanner>

                <Button variant="navy" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Traitement en cours…' : modePaiement === 'ESPECES' ? "Déclarer le paiement en espèces" : 'Déclarer mon dépôt Mobile Money'}
                </Button>
              </form>
            )}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 20 }}>
          {echeanceCourante && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <EventAvailableOutlinedIcon style={{ fontSize: 20, color: 'var(--gold-deep, var(--gold))' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-navy)', margin: 0, fontWeight: 800 }}>
                  Échéance sélectionnée
                </h3>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: 'var(--slate)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Local</span>
                  <strong style={{ color: 'var(--text-navy)' }}>{echeanceCourante.local_reference || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date limite</span>
                  <strong style={{ color: 'var(--text-navy)' }}>{new Date(echeanceCourante.date_exigibilite).toLocaleDateString('fr-FR')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Montant total dû</span>
                  <strong style={{ color: 'var(--text-navy)' }}>{Number(totalDu(echeanceCourante)).toLocaleString('fr-FR')} FCFA</strong>
                </div>
              </div>
            </Card>
          )}

          {dernierPaiement && (
            <Card style={{ borderLeft: '4px solid var(--gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <ReceiptLongOutlinedIcon style={{ fontSize: 20, color: 'var(--gold-deep, var(--gold))' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-navy)', margin: 0, fontWeight: 800 }}>
                  Déclaration enregistrée
                </h3>
              </div>

              <div style={{ fontSize: 13, lineHeight: 1.9, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>
                <div>Mode : <strong style={{ color: 'var(--text-navy)' }}>{LIBELLES_MODE[dernierPaiement.mode] || dernierPaiement.mode_libelle || dernierPaiement.mode}</strong></div>
                <div>Montant : <strong style={{ color: 'var(--text-navy)' }}>{Number(dernierPaiement.montant_regle || 0).toLocaleString('fr-FR')} FCFA</strong></div>
                <div>Déclaré le : {dernierPaiement.date_paiement ? new Date(dernierPaiement.date_paiement).toLocaleString('fr-FR') : '-'}</div>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {[
                  { t: 'Déclaration transmise', fait: true },
                  {
                    t: dernierPaiement.mode === 'ESPECES'
                      ? 'Remise du montant au Service Comptable (sur place)'
                      : 'Confirmation du dépôt par le Service Comptable',
                    fait: false,
                  },
                  { t: 'Émission de votre quitus', fait: false },
                ].map((etape, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: '50%',
                      display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
                      background: etape.fait ? 'var(--green)' : 'var(--gold-tint)',
                      color: etape.fait ? '#fff' : 'var(--gold-deep)',
                      border: etape.fait ? 'none' : '1px solid var(--gold)',
                    }}>{etape.fait ? '✓' : i + 1}</span>
                    <span style={{ fontSize: 12.5, color: etape.fait ? 'var(--text-navy)' : 'var(--slate)', fontWeight: etape.fait ? 700 : 500 }}>
                      {etape.t}
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: 14, marginBottom: 0, fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.6 }}>
                {dernierPaiement.instruction
                  || "Votre quitus sera consultable dans « Mes quitus » dès la validation du Service Comptable."}
              </p>
            </Card>
          )}
        </div>
      </div>

      <QuitusFormatModal quitus={quitusAffiche} onClose={() => setQuitusAffiche(null)} />
    </PageWrapper>
  );
}
