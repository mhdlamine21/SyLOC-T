import { useState } from 'react';
import { contratMock } from '../../../frontend/src/mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function EspaceOccupant() {
  const [contrat] = useState(contratMock);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Occupant Titulaire"
        title="Mon Contrat & Baux Domaniaux (LR-11 & LR-12)"
        subtitle="Consultation de votre contrat d'occupation, échéancier des 12 redevances mensuelles et statut des paiements."
      />

      <Card style={{ marginBottom: 24, borderTop: '4px solid var(--gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                Contrat #{contrat.id_contrat}
              </h2>
              {contrat.gratuit_etudiant && (
                <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  ✓ Exonération Étudiante (Gratuit)
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Local : <strong>{contrat.local.reference} ({contrat.local.type})</strong> — {contrat.local.localisation}
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>
              <span>📅 Début : {contrat.date_debut}</span>
              <span>📅 Fin : {contrat.date_fin}</span>
              <span>💰 Redevance : {contrat.redevance_mensuelle.toLocaleString()} FCFA / mois</span>
            </div>
          </div>

          <Button variant="primary" onClick={() => toast.success('Téléchargement du contrat officiel PDF en cours...')}>
            📄 Télécharger mon contrat PDF
          </Button>
        </div>
      </Card>

      <SectionHeader title="Échéancier des Redevances (12 Mois)" subtitle="Statut des échéances et suivi des règlements." />

      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Échéance #</th>
              <th style={{ padding: '12px 16px' }}>Date Limite</th>
              <th style={{ padding: '12px 16px' }}>Montant</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
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
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 12 }}>✓ Quitus disponible</span>
                  ) : (
                    <Button variant="amber" size="sm" onClick={() => toast('Redirection vers le guichet de paiement...')}>
                      💳 Payer
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
