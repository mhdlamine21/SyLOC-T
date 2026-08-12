import { useState } from 'react';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

const INITIAL_CONTRAT = {
  id_contrat: 'CT-2026-001',
  date_debut: '2026-01-01',
  date_fin: '2027-12-31',
  redevance_mensuelle: 15000,
  gratuit_etudiant: false,
  local: { reference: 'LOC-004', type: 'Cantine A', localisation: 'Campus VCN - Restauration' },
  echeances: [
    { numero: 1, date_limite: '2026-01-05', montant: 15000, statut: 'PAYEE', quitus_ref: 'QT-2026-001' },
    { numero: 2, date_limite: '2026-02-05', montant: 15000, statut: 'PAYEE', quitus_ref: 'QT-2026-002' },
    { numero: 3, date_limite: '2026-03-05', montant: 15000, statut: 'EXIGIBLE', quitus_ref: null },
    { numero: 4, date_limite: '2026-04-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 5, date_limite: '2026-05-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 6, date_limite: '2026-06-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 7, date_limite: '2026-07-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 8, date_limite: '2026-08-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 9, date_limite: '2026-09-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 10, date_limite: '2026-10-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 11, date_limite: '2026-11-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
    { numero: 12, date_limite: '2026-12-05', montant: 15000, statut: 'EN_ATTENTE', quitus_ref: null },
  ]
};

export default function EspaceOccupant() {
  const [contrat, setContrat] = useState(INITIAL_CONTRAT);
  const [payingNum, setPayingNum] = useState(null);

  const handlePayEcheance = (numero) => {
    setPayingNum(numero);
    setTimeout(() => {
      setContrat(prev => ({
        ...prev,
        echeances: prev.echeances.map(e => e.numero === numero ? { ...e, statut: 'PAYEE', quitus_ref: `QT-2026-${String(numero).padStart(3, '0')}` } : e)
      }));
      setPayingNum(null);
      toast.success(`💳 Redevance du mois #${numero} réglée avec succès ! Quitus émis.`);
    }, 700);
  };

  const handleDownloadQuitus = (quitusRef) => {
    toast.success(`📄 Téléchargement du Quitus Officiel ${quitusRef} (Format PDF)...`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Occupant Titulaire"
        title="Mon Contrat & Baux Domaniaux"
        subtitle="Consultation de votre bail domanial, échéancier des redevances mensuelles et quittance des loyers."
      />

      {/* Banner Double-Scoring & Éligibilité Occupant */}
      <Card style={{ marginBottom: 20, background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⭐ Mon Score d'Occupant Domanial & Double-Scoring CROUS-T
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Score Hygiène & QHSE</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>★ 4.6 / 5.0</div>
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>✓ Conforme aux normes</span>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Score Règlements Loyers</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>💳 100 % à jour</div>
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>0 retard constaté</span>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Statut Renouvellement</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>EXCELLENT</div>
            <span style={{ fontSize: 11, color: 'var(--slate)' }}>Reconduite tacite éligible</span>
          </div>
        </div>
      </Card>

      {/* Carte Résumé du Contrat */}
      <Card style={{ marginBottom: 24, borderTop: '4px solid var(--gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                Bail Domanial #{contrat.id_contrat}
              </h2>
              {contrat.gratuit_etudiant && (
                <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  ✓ Exonération Étudiante (Bail Gratuit)
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Local attribué : <strong>{contrat.local.reference} ({contrat.local.type})</strong> - {contrat.local.localisation}
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
              <span>📅 Date d'effet : {contrat.date_debut}</span>
              <span>📅 Échéance bail : {contrat.date_fin}</span>
              <span>💰 Redevance : {contrat.redevance_mensuelle.toLocaleString()} FCFA / mois</span>
            </div>
          </div>

          <Button variant="primary" onClick={() => toast.success('📄 Téléchargement du contrat officiel PDF en cours...')}>
            📄 Télécharger mon contrat PDF
          </Button>
        </div>
      </Card>

      {/* Échéancier */}
      <SectionHeader title="Échéancier des 12 Redevances Mensuelles" subtitle="Statut des règlements et émission des quitus de caisse." />

      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Échéance #</th>
              <th style={{ padding: '12px 16px' }}>Date Limite</th>
              <th style={{ padding: '12px 16px' }}>Montant</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
              <th style={{ padding: '12px 16px' }}>Action & Quitus</th>
            </tr>
          </thead>
          <tbody>
            {contrat.echeances.map((ech) => (
              <tr key={ech.numero} style={{ borderTop: '1px solid var(--border)', fontSize: 13 }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Mois #{ech.numero}</td>
                <td style={{ padding: '12px 16px' }}>{ech.date_limite}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--navy)' }}>{ech.montant.toLocaleString()} FCFA</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge statut={ech.statut} /></td>
                <td style={{ padding: '12px 16px' }}>
                  {ech.statut === 'PAYEE' ? (
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadQuitus(ech.quitus_ref)}>
                      📄 Quitus PDF ({ech.quitus_ref})
                    </Button>
                  ) : (
                    <Button
                      variant="amber"
                      size="sm"
                      disabled={payingNum === ech.numero}
                      onClick={() => handlePayEcheance(ech.numero)}
                    >
                      {payingNum === ech.numero ? 'Paiement...' : '💳 Régler ma redevance'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
