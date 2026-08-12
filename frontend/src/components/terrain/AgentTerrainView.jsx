import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper, StatusBadge, Field, Textarea, Select } from '../common/ui';
import toast from 'react-hot-toast';

const INITIAL_MISSIONS = [
  { id: 'ORD-2026-08', titre: 'Inspection Urgente - Dénonciation Occupation Illégale', local_ref: 'LOC-003 (Bloc C)', initiateur: 'Directeur DCUVE', statut: 'DISPONIBLE_POUR_TOUS', priorite: 'HAUTE' },
  { id: 'ORD-2026-09', titre: 'Contrôle Routine Sécurité & Salubrité Cantine A', local_ref: 'LOC-004 (Restauration)', initiateur: 'Bureau QHSE', statut: 'DISPONIBLE_POUR_TOUS', priorite: 'NORMALE' },
];

const INITIAL_HISTORIQUE = [
  { id: 'VIS-2026-014', date: '2026-02-10 09:30', local_ref: 'LOC-001 (Kiosque Bloc A)', agent: 'Ibrahima Ba', resultat: 'Local conforme, propreté optimale.' },
];

export default function AgentTerrainView() {
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [historique, setHistorique] = useState(INITIAL_HISTORIQUE);
  const [selectedLocal, setSelectedLocal] = useState('LOC-001');
  const [rapportVisite, setRapportVisite] = useState('');
  const [constatType, setConstatType] = useState('ROUTINE');

  const handleAccepterMission = (missionId) => {
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, statut: 'ACCEPTEE_PAR_MOI' } : m));
    toast.success(`🎯 Ordre de mission ${missionId} accepté et verrouillé à votre nom !`);
  };

  const handleSoumettreRapport = (e) => {
    e.preventDefault();
    if (!rapportVisite.trim()) {
      toast.error('Veuillez remplir le rapport de constat terrain.');
      return;
    }

    const newVisite = {
      id: `VIS-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleString('fr-FR'),
      local_ref: selectedLocal,
      agent: 'Ibrahima Ba (Brigade Terrain)',
      resultat: rapportVisite,
    };

    setHistorique(prev => [newVisite, ...prev]);
    setRapportVisite('');
    toast.success(`📝 Visite terrain enregistrée avec succès dans l'historique officiel !`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Contrôle & Agent Terrain"
        title="Ordres de Mission Dépêchés & Visites de Routine"
        subtitle="Acceptation des ordres de mission terrain et enregistrement de l'historique quotidien des contrôles."
      />

      {/* Ordres de mission dépêchés */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', marginBottom: 14, fontWeight: 800 }}>
        📢 Ordres de Mission Dépêchés (Dépêche Générale aux Agents)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 30 }}>
        {missions.map((m) => (
          <Card key={m.id} style={{ borderLeft: m.priorite === 'HAUTE' ? '4px solid var(--red)' : '4px solid var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{m.id}</span>
              <span style={{ background: m.priorite === 'HAUTE' ? 'var(--red-soft)' : 'var(--gold-soft)', color: m.priorite === 'HAUTE' ? 'var(--red)' : 'var(--gold-deep)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                {m.priorite === 'HAUTE' ? '🚨 URGENT' : '📋 ROUTINE'}
              </span>
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
              {m.titre}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
              Local : <strong>{m.local_ref}</strong> | Dépêché par : <strong>{m.initiateur}</strong>
            </p>

            {m.statut === 'DISPONIBLE_POUR_TOUS' ? (
              <Button variant="navy" size="sm" onClick={() => handleAccepterMission(m.id)}>
                🎯 Accepter & Effectuer la mission
              </Button>
            ) : (
              <span style={{ fontSize: 11, background: 'var(--green-soft)', color: 'var(--green)', padding: '4px 10px', borderRadius: 6, fontWeight: 800 }}>
                ✓ Mission acceptée & en cours
              </span>
            )}
          </Card>
        ))}
      </div>

      {/* Formulaire de rapport de visite quotidienne */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            📝 Rapport de Visite Quotidienne de Routine
          </h3>
          <form onSubmit={handleSoumettreRapport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Local Visité *" required>
              <Select value={selectedLocal} onChange={(e) => setSelectedLocal(e.target.value)}>
                <option value="LOC-001">LOC-001 (Kiosque Bloc A)</option>
                <option value="LOC-003">LOC-003 (Espace Artisanal Bloc C)</option>
                <option value="LOC-004">LOC-004 (Cantine Principale A)</option>
              </Select>
            </Field>

            <Field label="Type de Constat *" required>
              <Select value={constatType} onChange={(e) => setConstatType(e.target.value)}>
                <option value="ROUTINE">📋 Inspection de routine quotidienne</option>
                <option value="ILLEGAL">🚨 Dénonciation d'occupation sans titre</option>
                <option value="HYGIENE">🧹 Manquement aux règles d'hygiène</option>
              </Select>
            </Field>

            <Field label="Constats & Observations Terrain *" required>
              <Textarea
                value={rapportVisite}
                onChange={(e) => setRapportVisite(e.target.value)}
                placeholder="Décrivez les observations constatées sur le local (propreté, conformité de l'activité, présence de l'occupant titulaire...)"
                rows={4}
              />
            </Field>

            <Button variant="primary" type="submit">
              📌 Enregistrer la visite dans l'Historique
            </Button>
          </form>
        </Card>

        {/* Historique des visites */}
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            📜 Historique Tracé des Contrôles Terrain
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {historique.map(h => (
              <div key={h.id} style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>{h.local_ref}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{h.date}</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--slate)', margin: '0 0 4px' }}>{h.resultat}</p>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-deep)' }}>Agent : {h.agent}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
