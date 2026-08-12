import { useState } from 'react';
import { demandesMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import toast from 'react-hot-toast';
import { emailService } from '../../services/emailService';

export default function BureauCourrierView() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showEnregistrerModal, setShowEnregistrerModal] = useState(false);
  const [demandeurNom, setDemandeurNom] = useState('');
  const [typeDemande, setTypeDemande] = useState('VENTE_PRODUIT');
  const [localPrefere, setLocalPrefere] = useState('LOC-001');
  const [commentaire, setCommentaire] = useState('');
  const [decisionCourrier, setDecisionCourrier] = useState('TRANSMETTRE_DCUVE');

  const handleEnregistrerNouveauCourrier = (e) => {
    e.preventDefault();
    const nouvelle = {
      id: `DEM-2026-0${demandes.length + 1}`,
      demandeur_nom: demandeurNom,
      type_demande: typeDemande,
      statut: 'NOUVELLE',
      date_depot: new Date().toISOString().split('T')[0],
      local_prefere: localPrefere,
      est_etudiant: true,
    };
    setDemandes([nouvelle, ...demandes]);
    toast.success(`📬 Dossier courrier #${nouvelle.id} enregistré et récepissé avec succès !`);
    setShowEnregistrerModal(false);
    setDemandeurNom('');
  };

  const handleTraiterCourrier = async (e) => {
    e.preventDefault();
    setDemandes(prev => prev.map(d => {
      if (d.id === selectedDemande.id) {
        return {
          ...d,
          statut: decisionCourrier === 'TRANSMETTRE_DCUVE' ? 'CONTROLE_RECEVABILITE' : 'MITIGEE_COMPLEMENT',
          commentaire_courrier: commentaire,
        };
      }
      return d;
    }));

    if (decisionCourrier === 'TRANSMETTRE_DCUVE') {
      toast.success(`✅ Dossier #${selectedDemande.id} validé et transmis au Directeur DCUVE pour instruction !`);
    } else {
      await emailService.sendComplementRequest(
        selectedDemande.demandeur_email || 'usager@crous-thies.sn',
        selectedDemande.id,
        [commentaire || 'Pièces justificatives manquantes selon contrôle visuel']
      );
      toast.error(`📩 Demande de complément de pièces envoyée au candidat pour le dossier #${selectedDemande.id}.`);
    }
    setSelectedDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier & Réception"
        title="Enregistrement & Traitement du Courrier (UC13 & UC25)"
        subtitle="Réception des dossiers d'occupation, enregistrement du récepissé, vérification préliminaire et transmission à la DCUVE."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <AlertBanner type="info" style={{ flex: 1, margin: 0 }}>
          ℹ️ Le Bureau du Courrier est le point d'entrée officiel des demandes physiques et électroniques du CROUS de Thiès.
        </AlertBanner>

        <Button variant="navy" onClick={() => setShowEnregistrerModal(true)}>
          📬 Enregistrer un Nouveau Courrier d'Arrivée
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {demandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>Dossier #{d.id}</span>
                <StatusBadge statut={d.statut} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.projet_nom || d.type_demande}
              </h3>

              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Demandeur : <strong>{d.demandeur_nom}</strong> ({d.est_etudiant ? 'Étudiant' : 'Commercial Externe'})
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                <div>📅 Date Réception : {d.date_depot}</div>
                <div>📍 Local Visé : {d.local_prefere || 'Non attribué'}</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => { setSelectedDemande(d); setDecisionCourrier('TRANSMETTRE_DCUVE'); }}
              style={{ justifyContent: 'center' }}
            >
              📥 Traiter & Transmettre à la DCUVE →
            </Button>
          </Card>
        ))}
      </div>

      {/* Modal Réception Nouveau Courrier */}
      {showEnregistrerModal && (
        <Modal open={showEnregistrerModal} onClose={() => setShowEnregistrerModal(false)} title="Enregistrer une Nouvelle Arrivée de Courrier">
          <form onSubmit={handleEnregistrerNouveauCourrier} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nom complet du Demandeur *" required>
              <input
                type="text"
                value={demandeurNom}
                onChange={(e) => setDemandeurNom(e.target.value)}
                placeholder="Ex. Amadou Sall"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                required
              />
            </Field>

            <Field label="Type de Demande *" required>
              <Select value={typeDemande} onChange={(e) => setTypeDemande(e.target.value)}>
                <option value="VENTE_PRODUIT">🍎 Vente de Produits Alimentaires / Cantine</option>
                <option value="PRESTATION_SERVICE">🛒 Prestation de Services / Kiosque</option>
                <option value="CONSTRUCTION_CANDIDAT">🏗️ Construction par le Candidat</option>
                <option value="LOCAL_ARTISANAL">🧵 Local Artisanal</option>
              </Select>
            </Field>

            <Field label="Local Souhaité / Préférentiel">
              <input
                type="text"
                value={localPrefere}
                onChange={(e) => setLocalPrefere(e.target.value)}
                placeholder="Ex. LOC-002 (Campus VCN)"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setShowEnregistrerModal(false)}>Annuler</Button>
              <Button variant="navy" type="submit">Enregistrer Récepissé</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Traitement Courrier */}
      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Traitement Courrier : Dossier ${selectedDemande.id}`}>
          <form onSubmit={handleTraiterCourrier} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Demandeur">
              <input type="text" readOnly value={selectedDemande.demandeur_nom} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', fontWeight: 700 }} />
            </Field>

            <Field label="Orientation du Courrier par le Bureau du Courrier *">
              <Select value={decisionCourrier} onChange={(e) => setDecisionCourrier(e.target.value)}>
                <option value="TRANSMETTRE_DCUVE">✅ Dossier Conforme - Transmettre au Directeur DCUVE pour instruction</option>
                <option value="COMPLEMENT_REQUIS">📎 Pièces manquantes - Émettre une demande de complément à l'usager (UC25)</option>
              </Select>
            </Field>

            <Field label="Notes & Remarques du Réceptionniste">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder="Consignez les pièces physique récepissées ou manques constatés..."
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Valider l'Orientation du Courrier</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
