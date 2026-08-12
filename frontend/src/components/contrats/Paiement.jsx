import { useState } from 'react';
import { Card, SectionHeader, Button, Select, PageWrapper, AlertBanner, StatusBadge, Modal, Field, Input } from '../common/ui';
import toast from 'react-hot-toast';
import { emailService } from '../../services/emailService';
import { genererQuitusPDF, exporterCSV } from '../../utils/pdfGenerator';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REVENUS_MENSUELS = [
  { mois: 'Jan', total: 200000, amicales: 50000 },
  { mois: 'Fév', total: 350000, amicales: 80000 },
  { mois: 'Mar', total: 425000, amicales: 150000 },
  { mois: 'Avr', total: 500000, amicales: 120000 },
  { mois: 'Mai', total: 480000, amicales: 90000 },
  { mois: 'Juin', total: 550000, amicales: 180000 },
];

const LIVRE_CAISSE_INITIAL = [
  { id: 'TRX-001', date: '2026-08-01', type: 'ENTREE', libelle: 'Encaissement QT-2026-002', montant: 15000 },
  { id: 'TRX-002', date: '2026-08-02', type: 'SORTIE', libelle: 'Achat fournitures de bureau', montant: 25000 },
  { id: 'TRX-003', date: '2026-08-10', type: 'ENTREE', libelle: 'Encaissement QT-2026-003', montant: 25000 },
];

const NOUVEAUX_CONTRATS = [
  { id: 'CTR-2026-042', occupant: 'Aïssatou Fall', local: 'LOC-012', redevance: 25000, date_signature: '2026-08-10' },
  { id: 'CTR-2026-045', occupant: 'Amicale UFR SAT', local: 'LOC-003', redevance: 50000, date_signature: '2026-08-11' },
];

const OCCUPANTS_PORTEFEUILLE = [
  { id: 'OC-001', nom: 'Fatou Ndiaye', local: 'LOC-004 (Cantine A)', montant_du: 0, statut_compte: 'A_JOUR', dernier_quitus: 'QT-2026-002', beneficiaire: 'CROUS-T' },
  { id: 'OC-002', nom: 'Babacar Diop', local: 'LOC-001 (Kiosque Bloc A)', montant_du: 15000, statut_compte: 'EXIGIBLE', dernier_quitus: 'QT-2026-001', beneficiaire: 'CROUS-T' },
  { id: 'OC-003', nom: 'Mamadou Ba', local: 'LOC-005 (Boutique B)', montant_du: 45000, statut_compte: 'EN_RETARD', dernier_quitus: 'QT-2025-011', beneficiaire: 'AMICALE' },
];

const HISTORIQUE_PAIEMENTS = [
  { quitus: 'QT-2026-002', date: '2026-08-01', occupant: 'Fatou Ndiaye', local: 'LOC-004', montant: 15000, mode: 'MOBILE_MONEY' },
  { quitus: 'QT-2026-001', date: '2026-07-05', occupant: 'Babacar Diop', local: 'LOC-001', montant: 15000, mode: 'ESPECES' },
  { quitus: 'QT-2025-011', date: '2025-12-10', occupant: 'Mamadou Ba', local: 'LOC-005', montant: 45000, mode: 'VIREMENT' },
];

const HISTORIQUE_PASSATIONS = [
  { id: 'PASS-001', amicale: 'Amicale UFR SI', montant: 450000, date: '2026-02-28', statut: 'EFFECTUEE' },
  { id: 'PASS-002', amicale: 'Amicale UFR SES', montant: 200000, date: '2026-02-28', statut: 'EFFECTUEE' },
];

export default function Paiement() {
  const [activeTab, setActiveTab] = useState('portefeuille');
  
  // États Portefeuille
  const [portefeuille, setPortefeuille] = useState(OCCUPANTS_PORTEFEUILLE);
  const [filterOccupant, setFilterOccupant] = useState('ALL');
  
  // États Nouveaux Contrats
  const [contrats, setContrats] = useState(NOUVEAUX_CONTRATS);

  // Historique & Passations
  const [historique, setHistorique] = useState(HISTORIQUE_PAIEMENTS);
  const [passations, setPassations] = useState(HISTORIQUE_PASSATIONS);
  const [moisFiltre, setMoisFiltre] = useState('ALL');

  // Modal Reversement
  const [isReversementOpen, setIsReversementOpen] = useState(false);
  const [revAmicale, setRevAmicale] = useState('Amicale UFR SAT');
  const [revMontant, setRevMontant] = useState('');

  // Trésorerie
  const [soldeCaisse, setSoldeCaisse] = useState(1250000);
  const [livreCaisse, setLivreCaisse] = useState(LIVRE_CAISSE_INITIAL);
  const [isDepenseOpen, setIsDepenseOpen] = useState(false);
  const [depenseMotif, setDepenseMotif] = useState('');
  const [depenseMontant, setDepenseMontant] = useState('');

  const handleCreerEcheancier = (contratId) => {
    setContrats(prev => prev.filter(c => c.id !== contratId));
    toast.success(`📅 Échéancier créé pour le contrat ${contratId}. L'occupant est désormais dans le portefeuille actif !`);
  };

  const handleEncaissementGuichet = (occ) => {
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const quitusId = `QT-2026-${randomId}`;
    const montant = occ.montant_du;

    // Mise à jour du portefeuille
    setPortefeuille(prev => prev.map(o => o.id === occ.id ? { ...o, montant_du: 0, statut_compte: 'A_JOUR', dernier_quitus: quitusId } : o));
    
    // Ajout à l'historique et Trésorerie
    const dateJour = new Date().toISOString().split('T')[0];
    setHistorique([{ quitus: quitusId, date: dateJour, occupant: occ.nom, local: occ.local, montant: montant, mode: 'ESPECES' }, ...historique]);
    setSoldeCaisse(prev => prev + montant);
    setLivreCaisse([{ id: `TRX-${Math.floor(Math.random() * 1000)}`, date: dateJour, type: 'ENTREE', libelle: `Encaissement ${quitusId}`, montant: montant }, ...livreCaisse]);

    toast.success(`💵 Redevance encaissée pour ${occ.nom}. Génération du Quitus en cours...`);
    
    // Générer et télécharger le vrai PDF
    genererQuitusPDF({
      quitusId: quitusId,
      date: new Date().toLocaleDateString('fr-FR'),
      occupant: occ.nom,
      local: occ.local,
      montant: montant,
      modePaiement: 'Espèces',
      echeance: 'Mois en cours'
    });
  };

  const handleRelance = async (occ) => {
    await emailService.sendEmail({
      to: 'occupant@crous-thies.sn',
      subject: `[CROUS-T] Rappel de Paiement - Impayés`,
      body: `Bonjour ${occ.nom},\n\nVotre compte présente un retard de paiement. Merci de régulariser la situation dans les plus brefs délais sous peine de pénalités.\n\nLe Service Comptable`,
      templateType: 'RAPPEL_PAIEMENT'
    });
    toast.error(`📩 Relance SMS/Email envoyée à ${occ.nom} !`);
  };

  const handleExportCSV = () => {
    exporterCSV(historique, `Historique_Paiements_${new Date().toISOString().split('T')[0]}`);
    toast.success("📊 Export CSV généré avec succès !");
  };

  const handleValiderReversement = (e) => {
    e.preventDefault();
    if (!revMontant) return;
    const montantNum = parseInt(revMontant);
    const dateJour = new Date().toISOString().split('T')[0];
    
    setPassations([
      { id: `PASS-00${passations.length + 1}`, amicale: revAmicale, montant: montantNum, date: dateJour, statut: 'EFFECTUEE' },
      ...passations
    ]);
    
    setSoldeCaisse(prev => prev - montantNum);
    setLivreCaisse([{ id: `TRX-${Math.floor(Math.random() * 1000)}`, date: dateJour, type: 'SORTIE', libelle: `Reversement ${revAmicale}`, montant: montantNum }, ...livreCaisse]);

    setIsReversementOpen(false);
    setRevMontant('');
    toast.success(`🏛 Reversement de ${revMontant} FCFA enregistré pour ${revAmicale} !`);
  };

  const handleValiderDepense = (e) => {
    e.preventDefault();
    if (!depenseMontant || !depenseMotif) return;
    const montantNum = parseInt(depenseMontant);
    const dateJour = new Date().toISOString().split('T')[0];

    setSoldeCaisse(prev => prev - montantNum);
    setLivreCaisse([{ id: `TRX-${Math.floor(Math.random() * 1000)}`, date: dateJour, type: 'SORTIE', libelle: depenseMotif, montant: montantNum }, ...livreCaisse]);

    setIsDepenseOpen(false);
    setDepenseMotif('');
    setDepenseMontant('');
    toast.success(`💸 Dépense de ${montantNum} FCFA enregistrée !`);
  };

  const filteredPortefeuille = portefeuille.filter(o => filterOccupant === 'ALL' || o.id === filterOccupant);
  const filteredHistorique = historique.filter(h => moisFiltre === 'ALL' || h.date.startsWith(moisFiltre));

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Département Comptabilité & Recouvrement"
        title="Dashboard Financier (LR-13)"
        subtitle="Gestion des échéanciers, encaissement au guichet, éditions des quitus et historique des versements."
      />

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        <button 
          onClick={() => setActiveTab('contrats')}
          style={{ padding: '8px 16px', background: activeTab === 'contrats' ? 'var(--navy)' : 'transparent', color: activeTab === 'contrats' ? '#fff' : 'var(--slate)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          1. Nouveaux Contrats
        </button>
        <button 
          onClick={() => setActiveTab('portefeuille')}
          style={{ padding: '8px 16px', background: activeTab === 'portefeuille' ? 'var(--navy)' : 'transparent', color: activeTab === 'portefeuille' ? '#fff' : 'var(--slate)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          2. Guichet & Portefeuille
        </button>
        <button 
          onClick={() => setActiveTab('historique')}
          style={{ padding: '8px 16px', background: activeTab === 'historique' ? 'var(--navy)' : 'transparent', color: activeTab === 'historique' ? '#fff' : 'var(--slate)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          3. Historique & Exports
        </button>
        <button 
          onClick={() => setActiveTab('tresorerie')}
          style={{ padding: '8px 16px', background: activeTab === 'tresorerie' ? 'var(--navy)' : 'transparent', color: activeTab === 'tresorerie' ? '#fff' : 'var(--slate)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          4. Trésorerie & Caisse
        </button>
      </div>

      {/* ONGLET 1 : CONTRATS & ECHEANCIERS */}
      {activeTab === 'contrats' && (
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
            📝 Création d'Échéanciers (Nouveaux Occupants)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Voici les contrats récemment signés par le Directeur. Créez un échéancier pour lier l'occupant à sa redevance et l'ajouter au portefeuille actif.
          </p>

          {contrats.length === 0 ? (
            <AlertBanner type="ok">✅ Tous les contrats ont un échéancier actif.</AlertBanner>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contrats.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-2)', borderLeft: '4px solid var(--amber)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.occupant} <span style={{ fontWeight: 400, color: 'var(--slate)' }}>- {c.local}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Contrat {c.id} | Signé le {c.date_signature}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy)' }}>{c.redevance.toLocaleString()} FCFA / mois</div>
                    <Button variant="amber" size="sm" onClick={() => handleCreerEcheancier(c.id)}>
                      📅 Générer Échéancier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ONGLET 2 : PORTEFEUILLE & GUICHET */}
      {activeTab === 'portefeuille' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Statistiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <Card style={{ background: 'var(--surface-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Taux d'Encaissement Mensuel</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>87.5 %</div>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>+4.2 % ce mois</span>
            </Card>
            <Card style={{ background: 'var(--surface-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Total Encaissé en Caisse</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>425 000 FCFA</div>
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>Année 2026</span>
            </Card>
            <Card style={{ background: 'var(--surface-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Impayés Cumulés</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--red)', fontFamily: 'var(--font-display)' }}>60 000 FCFA</div>
            </Card>
          </div>

          {/* Portefeuille Occupants */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: 0, fontWeight: 800 }}>
                📂 Portefeuille & Encaissement Guichet
              </h3>
              <Select value={filterOccupant} onChange={(e) => setFilterOccupant(e.target.value)} style={{ width: 180, padding: 6, fontSize: 12 }}>
                <option value="ALL">Tous les occupants</option>
                {portefeuille.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
              </Select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPortefeuille.map(occ => (
                <div key={occ.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: occ.montant_du > 0 ? (occ.statut_compte === 'EN_RETARD' ? '4px solid var(--red)' : '4px solid var(--gold)') : '4px solid var(--green)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{occ.nom} <span style={{ fontWeight: 400, color: 'var(--slate)' }}>- {occ.local}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Dernier quitus: {occ.dernier_quitus} | <strong style={{ color: occ.beneficiaire === 'AMICALE' ? 'var(--blue)' : 'var(--slate)' }}>Bénéficiaire: {occ.beneficiaire}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: occ.montant_du > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {occ.montant_du > 0 ? `${occ.montant_du.toLocaleString()} FCFA` : 'À Jour'}
                      </div>
                    </div>
                    {occ.montant_du > 0 ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="amber" size="sm" onClick={() => handleEncaissementGuichet(occ)}>
                          💵 Encaisser & PDF
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRelance(occ)}>
                          📩 Relancer
                        </Button>
                      </div>
                    ) : (
                      <Button variant="stamp" size="sm" disabled>✅ Soldé</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ONGLET 3 : HISTORIQUE & RAPPORTS */}
      {activeTab === 'historique' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* GRAPHIQUE D'EVOLUTION */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
              📈 Évolution des Encaissements vs Reversements
            </h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUS_MENSUELS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAmicale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mois" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="Revenus Globaux" stroke="var(--green)" fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="amicales" name="Part Amicales" stroke="var(--blue)" fillOpacity={1} fill="url(#colorAmicale)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 4px', fontWeight: 800 }}>
                  📊 Historique des Paiements & Exports
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Filtrez par mois et exportez les données sur Excel ou PDF.</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Select value={moisFiltre} onChange={(e) => setMoisFiltre(e.target.value)} style={{ padding: '6px 12px' }}>
                  <option value="ALL">Tous les mois</option>
                  <option value="2026-08">Août 2026</option>
                  <option value="2026-07">Juillet 2026</option>
                </Select>
                <Button variant="navy" onClick={handleExportCSV}>
                  📥 Exporter Excel (CSV)
                </Button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Quitus</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Date</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Occupant</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Local</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Mode</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistorique.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--navy)' }}>{h.quitus}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--slate)' }}>{h.date}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{h.occupant}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--slate)' }}>{h.local}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11 }}>{h.mode}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--green)' }}>
                      {h.montant.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* SECTION PASSATIONS AMICALES DANS L'HISTORIQUE */}
          <Card style={{ borderTop: '4px solid var(--blue)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
              🏛 Reversements aux Amicales (Passations)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>
              Historique des reversements des loyers collectés par le CROUS-T pour le compte des amicales étudiantes.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {passations.map(passation => (
                <div key={passation.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--navy)' }}>{passation.amicale}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Date de reversement : {passation.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>{passation.montant.toLocaleString()} FCFA</span>
                    <StatusBadge statut="VALIDE" />
                  </div>
                </div>
              ))}
              <Button variant="navy" onClick={() => setIsReversementOpen(true)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                ➕ Enregistrer un nouveau reversement
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ONGLET 4 : TRESORERIE & CAISSE */}
      {activeTab === 'tresorerie' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Solde de Caisse */}
          <Card style={{ background: 'var(--navy)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>
                Solde Actuel de la Caisse
              </p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, margin: 0, fontWeight: 900 }}>
                {soldeCaisse.toLocaleString()} <span style={{ fontSize: 20, fontWeight: 500 }}>FCFA</span>
              </h2>
            </div>
            <Button onClick={() => setIsDepenseOpen(true)} style={{ background: '#fff', color: 'var(--navy)', border: 'none' }}>
              💸 Enregistrer une Dépense
            </Button>
          </Card>

          {/* Grand Livre de Caisse */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 14px', fontWeight: 800 }}>
              📖 Grand Livre de Caisse (Entrées & Sorties)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>
              Traçabilité chronologique de tous les flux financiers (encaissements de loyers, reversements, dépenses de fonctionnement).
            </p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>ID Réf</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Date</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Type</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>Libellé / Motif</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {livreCaisse.map((trx, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: trx.type === 'ENTREE' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--navy)' }}>{trx.id}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--slate)' }}>{trx.date}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 4, background: trx.type === 'ENTREE' ? 'var(--green)' : 'var(--red)', color: '#fff' }}>
                        {trx.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{trx.libelle}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: trx.type === 'ENTREE' ? 'var(--green)' : 'var(--red)' }}>
                      {trx.type === 'ENTREE' ? '+' : '-'}{trx.montant.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* MODAL REVERSEMENT */}
      <Modal open={isReversementOpen} onClose={() => setIsReversementOpen(false)} title="🏛 Enregistrer un Reversement">
        <form onSubmit={handleValiderReversement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Amicale Bénéficiaire *" required>
            <Select value={revAmicale} onChange={(e) => setRevAmicale(e.target.value)}>
              <option value="Amicale UFR SAT">Amicale UFR SAT</option>
              <option value="Amicale UFR SI">Amicale UFR SI</option>
              <option value="Amicale UFR SES">Amicale UFR SES</option>
              <option value="Amicale Santé">Amicale UFR Santé</option>
            </Select>
          </Field>
          <Field label="Montant à Reverser (FCFA) *" required>
            <Input 
              type="number" 
              value={revMontant} 
              onChange={(e) => setRevMontant(e.target.value)} 
              placeholder="Ex: 150000" 
              required 
            />
          </Field>
          <AlertBanner type="info">
            Ce reversement sera enregistré dans l'historique comptable et déduit des fonds en attente de passation.
          </AlertBanner>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="ghost" onClick={() => setIsReversementOpen(false)}>Annuler</Button>
            <Button variant="blue" type="submit">Valider le Reversement</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DEPENSE */}
      <Modal open={isDepenseOpen} onClose={() => setIsDepenseOpen(false)} title="💸 Enregistrer une Dépense (Sortie de Caisse)">
        <form onSubmit={handleValiderDepense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Motif de la dépense *" required>
            <Input 
              type="text" 
              value={depenseMotif} 
              onChange={(e) => setDepenseMotif(e.target.value)} 
              placeholder="Ex: Achat fournitures bureau, Réparation serrure..." 
              required 
            />
          </Field>
          <Field label="Montant décaissé (FCFA) *" required>
            <Input 
              type="number" 
              value={depenseMontant} 
              onChange={(e) => setDepenseMontant(e.target.value)} 
              placeholder="Ex: 50000" 
              required 
            />
          </Field>
          <AlertBanner type="warn">
            Attention : Cette action déduira immédiatement le montant du solde de caisse et l'inscrira au grand livre.
          </AlertBanner>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="ghost" type="button" onClick={() => setIsDepenseOpen(false)}>Annuler</Button>
            <Button variant="stamp" type="submit">Valider le Décaissement</Button>
          </div>
        </form>
      </Modal>

    </PageWrapper>
  );
}
