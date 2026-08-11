// Données de démonstration — reflètent les champs du diagramme de classe final (v6).
// À remplacer progressivement par de vrais appels API (voir services/*.js), ticket SYL-18.

export const TYPE_INFO = {
  RESTAURATION: { label: 'Restauration', desc: "Vente alimentaire, soumise à un contrôle sanitaire préalable et à des inspections QHSE régulières." },
  MULTISERVICES: { label: 'Multiservices', desc: "Papeterie et prestations diverses destinées à la vie quotidienne des étudiants." },
  ARTISANAT: { label: 'Artisanat', desc: "Locaux dédiés à l'artisanat, avec gratuité applicable aux étudiants sans local propre." },
  AUTRE: { label: 'Autre', desc: "Autres usages non couverts par les catégories précédentes." },
};

export const TYPE_DEMANDE_OPTIONS = [
  { value: 'VENTE_PRODUIT', label: 'Vente de produits' },
  { value: 'PRESTATION_SERVICE', label: 'Prestation de service' },
  { value: 'LOCAL_ARTISANAL', label: 'Local artisanal' },
  { value: 'RENOVATION', label: "Rénovation d'un local existant" },
  { value: 'CONSTRUCTION_CANDIDAT', label: 'Construction financée par le candidat' },
  { value: 'CONSTRUCTION_CROUST', label: 'Construction financée par le CROUS-T' },
];

export const STATUT_STYLES = {
  EN_ATTENTE: { label: 'En attente', bg: 'bg-soft', fg: 'text-muted' },
  MITIGEE_COMPLEMENT: { label: 'Complément requis', bg: 'bg-danger-soft', fg: 'text-danger' },
  FAVORABLE: { label: 'Favorable', bg: 'bg-ok-soft', fg: 'text-ok' },
  DEFAVORABLE: { label: 'Défavorable', bg: 'bg-soft', fg: 'text-muted' },
};

export const appelsMock = [
  { id: 'AP-2026-014', titre: 'Boutique multiservices — Bloc C', campus: 'Social (VCN)', type: 'MULTISERVICES', cloture: '2026-08-28' },
  { id: 'AP-2026-015', titre: 'Emplacement vente alimentaire — Bloc A', campus: 'Social (VCN)', type: 'RESTAURATION', cloture: '2026-09-02' },
  { id: 'AP-2026-016', titre: 'Atelier couture / artisanat', campus: 'Social (VCN)', type: 'ARTISANAT', cloture: '2026-09-10' },
  { id: 'AP-2026-017', titre: 'Stand restauration rapide — Amphi 2', campus: 'Pédagogique', type: 'RESTAURATION', cloture: '2026-09-18' },
];

export const demandesMock = [
  {
    id_demande: 'DM-2026-00842', type: 'VENTE_PRODUIT', statut: 'MITIGEE_COMPLEMENT',
    date_depot: '2026-07-03', etape: 'Instruction — Agent DCUVE',
  },
  {
    id_demande: 'DM-2026-00799', type: 'MULTISERVICES', statut: 'FAVORABLE',
    date_depot: '2026-06-21', etape: 'Décision rendue',
  },
];

export const contratMock = {
  id_contrat: 'CT-2026-00312', local: 'LOC-004 — Cantine A', est_gratuit: false,
  redevance_mensuelle: 45000,
  echeances: [
    { id: 1, date_exigibilite: '2026-02-01', montant_du: 45000, statut: 'PAYEE' },
    { id: 2, date_exigibilite: '2026-03-01', montant_du: 45000, statut: 'EXIGIBLE' },
    { id: 3, date_exigibilite: '2026-04-01', montant_du: 45000, statut: 'NON_ECHUE' },
  ],
};
