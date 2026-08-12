import { useState } from 'react';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import toast from 'react-hot-toast';

const INITIAL_BAUX_ATTENTE = [
  { id: 'DM-2026-9481', demandeur_nom: 'Fatou Diop', projet_nom: 'Cantine Restauration Rapide A', local_ref: 'LOC-004', redevance: 15000, date_commission: '2026-02-01' },
  { id: 'DM-2026-8812', demandeur_nom: 'Moussa Ndiaye', projet_nom: 'Kiosque Reprographie & Service', local_ref: 'LOC-001', redevance: 12000, date_commission: '2026-02-05' },
];

const INITIAL_RESILIATIONS = [
  {
    id: 'RES-2026-01',
    contrat_id: 'CT-2026-004',
    occupant_nom: 'Sidy Sow (Boutique B)',
    demandeur_rupture: 'Directeur CROUS-T',
    motif: 'Défaut de paiement répétitif (> 3 mois d\'impayés)',
    preavis_jours: 60,
    statut: 'EN_COURS',
    date_demande: '2026-01-15',
  },
  {
    id: 'RES-2026-02',
    contrat_id: 'CT-2026-008',
    occupant_nom: 'Awa Cissé (Pressing Artisanal)',
    demandeur_rupture: 'Occupant (Demande d\'abandon volontaire)',
    motif: 'Cessation d\'activité professionnelle',
    preavis_jours: 60,
    statut: 'VALIDEE',
    date_demande: '2025-12-10',
  }
];

export default function ServiceJuridiqueView() {
  const [activeTab, setActiveTab] = useState('baux');
  const [baux, setBaux] = useState(INITIAL_BAUX_ATTENTE);
  const [resiliations, setResiliations] = useState(INITIAL_RESILIATIONS);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [formContrat, setFormContrat] = useState({
    notes_additionnelles: '',
    regles_specifiques: '',
  });

  const handleGenererBail = (e) => {
    e.preventDefault();
    setBaux(prev => prev.filter(b => b.id !== selectedDemande.id));
    toast.success(`📜 Projet de contrat #${selectedDemande.id} rédigé et envoyé au candidat avec le tarif et les règles associées !`);
    setSelectedDemande(null);
    setFormContrat({ notes_additionnelles: '', regles_specifiques: '' });
  };

  const handleValiderResiliation = (resId) => {
    setResiliations(prev => prev.map(r => r.id === resId ? { ...r, statut: 'VALIDEE' } : r));
    toast.success(`⚖ Acte de résiliation ${resId} validé avec respect du préavis de 2 mois (60 jours) ! Notification transmise.`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Rédaction des Contrats & Baux Domaniaux"
        subtitle="Émission des baux commerciaux, contentieux et validation juridique des procédures de résiliation (Préavis de 2 mois)."
      />

      {/* Statistiques Juridiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <Card style={{ background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Baux Actifs en Cours</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>14</div>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>100 % conformes aux textes</span>
        </Card>

        <Card style={{ background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Baux en Attente de Rédaction</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold-deep)', fontFamily: 'var(--font-display)' }}>{baux.length}</div>
          <span style={{ fontSize: 11, color: 'var(--slate)' }}>Issus de la commission</span>
        </Card>

        <Card style={{ background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Procédures de Résiliation</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--red)', fontFamily: 'var(--font-display)' }}>{resiliations.length}</div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Préavis légal de 60 jours</span>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Button variant={activeTab === 'baux' ? 'navy' : 'ghost'} onClick={() => setActiveTab('baux')}>
          📜 Baux à Rédiger ({baux.length})
        </Button>
        <Button variant={activeTab === 'ruptures' ? 'stamp' : 'ghost'} onClick={() => setActiveTab('ruptures')}>
          ⚖ Procédures de Rupture & Résiliation ({resiliations.length})
        </Button>
      </div>

      {activeTab === 'baux' ? (
        baux.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {baux.map((d) => (
              <Card key={d.id} style={{ borderTop: '3px solid var(--navy)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.id}</span>
                  <StatusBadge statut="FAVORABLE" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                  {d.projet_nom}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 6px' }}>
                  Attributaire : <strong>{d.demandeur_nom}</strong>
                </p>
                <p style={{ fontSize: 12, color: 'var(--slate)', margin: '0 0 12px' }}>
                  Local : {d.local_ref} - Redevance : {d.redevance.toLocaleString()} FCFA/mois
                </p>
                <Button variant="amber" size="sm" onClick={() => setSelectedDemande(d)}>
                  📜 Rédiger le Bail Domanial →
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
            ✓ Tous les baux issus de la commission consultative ont été rédigés et émis.
          </Card>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {resiliations.map((res) => (
            <Card key={res.id} style={{ borderLeft: '4px solid var(--red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--navy)', margin: 0, fontWeight: 800 }}>
                      Procédure de Résiliation #{res.id} ({res.contrat_id})
                    </h3>
                    <StatusBadge statut={res.statut} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 6px' }}>
                    Occupant : <strong>{res.occupant_nom}</strong> | Initiateur : <strong>{res.demandeur_rupture}</strong>
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--slate)', margin: '0 0 8px' }}>
                    Motif officiel : <em>"{res.motif}"</em>
                  </p>
                  <span style={{ fontSize: 11, background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: 'var(--red)' }}>
                    ⏱ Préavis réglementaire : {res.preavis_jours} jours (2 mois)
                  </span>
                </div>

                {res.statut !== 'VALIDEE' && (
                  <Button variant="stamp" size="sm" onClick={() => handleValiderResiliation(res.id)}>
                    ⚖ Valider & Notifier l'Acte de Résiliation
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Rédaction du Bail Domanial : Dossier ${selectedDemande.id}`}>
          <form onSubmit={handleGenererBail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Attributaire du bail">
              <input type="text" readOnly value={selectedDemande.demandeur_nom} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>

            <Field label="Local domanial attribué">
              <input type="text" readOnly value={`${selectedDemande.local_ref} (${selectedDemande.redevance.toLocaleString()} FCFA/mois)`} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>

            <Field label="Notes Additionnelles sur le Contrat">
              <Textarea 
                value={formContrat.notes_additionnelles} 
                onChange={(e) => setFormContrat(f => ({...f, notes_additionnelles: e.target.value}))} 
                placeholder="Ex. Modalités de paiement, pénalités de retard..." 
                rows={3} 
              />
            </Field>

            <Field label="Règles Spécifiques d'Occupation">
              <Textarea 
                value={formContrat.regles_specifiques} 
                onChange={(e) => setFormContrat(f => ({...f, regles_specifiques: e.target.value}))} 
                placeholder="Ex. Horaires d'ouverture, gestion des déchets, interdiction de sous-location..." 
                rows={3} 
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Transmettre au Candidat</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
