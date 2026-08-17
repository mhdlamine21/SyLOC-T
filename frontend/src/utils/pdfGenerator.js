import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmtMontant = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

/**
 * Normalise les deux formes possibles de payload quitus :
 *  - le payload brut renvoye par le backend (`Paiement.editer_quitus`)
 *  - l'ancienne forme aplatie {quitusId, date, occupant, local, montant, modePaiement, echeance}
 *    encore utilisee par certains ecrans historiques.
 */
const normaliserQuitus = (data = {}) => {
  // Deja au format backend (presence d'un champ caracteristique).
  if (data.reference_quitus !== undefined || data.montant_regle !== undefined) {
    return {
      reference: data.reference_quitus || data.paiement_id || '-',
      referenceTransaction: data.reference_transaction || '',
      date: data.date_paiement ? new Date(data.date_paiement).toLocaleDateString('fr-FR') : '-',
      dateHeure: data.date_paiement ? new Date(data.date_paiement).toLocaleString('fr-FR') : '-',
      occupant: data.occupant_nom || '-',
      occupantContact: data.occupant_contact || '',
      local: data.local_reference || '-',
      localLocalisation: data.local_localisation || '',
      contratReference: data.contrat_reference || '',
      echeance: data.date_exigibilite
        ? `Échéance du ${new Date(data.date_exigibilite).toLocaleDateString('fr-FR')}`
        : '-',
      montantDu: Number(data.montant_du || 0),
      montantPenalite: Number(data.montant_penalite || 0),
      montantRegle: Number(data.montant_regle || 0),
      resteAPayer: Number(data.reste_a_payer || 0),
      statutEcheance: data.statut_echeance || '',
      mode: data.mode_libelle || data.mode || '-',
      organisme: data.organisme || 'CROUS DE THIES',
      serviceEmetteur: data.service_emetteur || 'Service Comptable',
    };
  }

  // Forme aplatie historique.
  return {
    reference: data.quitusId || '-',
    referenceTransaction: '',
    date: data.date || '-',
    dateHeure: data.date || '-',
    occupant: data.occupant || '-',
    occupantContact: '',
    local: data.local || '-',
    localLocalisation: '',
    contratReference: '',
    echeance: data.echeance || '-',
    montantDu: Number(data.montant || 0),
    montantPenalite: 0,
    montantRegle: Number(data.montant || 0),
    resteAPayer: 0,
    statutEcheance: '',
    mode: data.modePaiement || '-',
    organisme: 'CROUS DE THIES',
    serviceEmetteur: 'Service Comptable',
  };
};

/** Ticket de caisse thermique (80mm), compact. */
const genererTicket = (q) => {
  const lignes = [
    ['Organisme', q.organisme],
    ['Service', q.serviceEmetteur],
    ['N° Quitus', q.reference],
    ['Date', q.dateHeure],
    ['Occupant', q.occupant],
    ['Local', q.local],
    ['Échéance', q.echeance],
    ['Montant dû', fmtMontant(q.montantDu)],
    ...(q.montantPenalite > 0 ? [['Pénalité', fmtMontant(q.montantPenalite)]] : []),
    ['Montant réglé', fmtMontant(q.montantRegle)],
    ['Reste à payer', fmtMontant(q.resteAPayer)],
    ['Mode', q.mode],
    ...(q.referenceTransaction ? [['Réf. transaction', q.referenceTransaction]] : []),
  ];

  // Hauteur dynamique en fonction du nombre de lignes.
  const hauteur = 58 + lignes.length * 6.4;
  const doc = new jsPDF({ unit: 'mm', format: [80, hauteur] });
  const cx = 40;
  let y = 8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('CROUS DE THIES', cx, y, { align: 'center' });
  y += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('SyLOC-T - Gestion du patrimoine', cx, y, { align: 'center' });
  y += 5;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, 76, y);
  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('REÇU OFFICIEL DE PAIEMENT', cx, y, { align: 'center' });
  y += 6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  lignes.forEach(([label, value]) => {
    doc.setFont('courier', 'bold');
    doc.text(`${label} :`, 4, y);
    doc.setFont('courier', 'normal');
    const texte = doc.splitTextToSize(String(value ?? '-'), 40);
    doc.text(texte, 76, y, { align: 'right' });
    y += 6.4 * texte.length;
  });

  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, 76, y);
  y += 6;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('Reçu officiel - Merci', cx, y, { align: 'center' });

  doc.save(`Ticket_${q.reference}.pdf`);
};

/** Facture / quitus institutionnel au format A4. */
const genererA4 = (q) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(15, 27, 61);
  doc.text('CROUS DE THIES', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('SyLOC-T - Gestion du patrimoine domanial', 105, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(180, 136, 17);
  doc.text('QUITUS DE PAIEMENT', 105, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Quitus : ${q.reference}`, 20, 60);
  doc.text(`Date d'émission : ${q.date}`, 140, 60);

  const corps = [
    ['Occupant / Bénéficiaire', q.occupant],
    ['Local domanial', `${q.local}${q.localLocalisation ? ` - ${q.localLocalisation}` : ''}`],
    ...(q.contratReference ? [['Contrat', q.contratReference]] : []),
    ['Échéance payée', q.echeance],
    ['Mode de règlement', q.mode],
    ...(q.referenceTransaction ? [['Référence transaction', q.referenceTransaction]] : []),
    ['Montant dû', fmtMontant(q.montantDu)],
    ...(q.montantPenalite > 0 ? [['Pénalité de retard', fmtMontant(q.montantPenalite)]] : []),
    ['Montant total encaissé', fmtMontant(q.montantRegle)],
    ['Reste à payer', q.resteAPayer > 0 ? fmtMontant(q.resteAPayer) : 'Soldé'],
  ];

  autoTable(doc, {
    startY: 70,
    head: [['Désignation', 'Détails']],
    body: corps,
    theme: 'grid',
    headStyles: { fillColor: [15, 27, 61] },
    styles: { fontSize: 11, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
  });

  const finalY = doc.lastAutoTable?.finalY || 130;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Pour valoir et servir ce que de droit.', 20, finalY + 20);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(q.serviceEmetteur || 'Le Service Comptable', 20, finalY + 40);
  doc.text("Signature de l'occupant", 140, finalY + 40);

  doc.line(20, finalY + 58, 80, finalY + 58);
  doc.line(140, finalY + 58, 190, finalY + 58);

  doc.save(`Quitus_${q.reference}.pdf`);
};

/**
 * Genere et telecharge le quitus de paiement, au format Ticket (80mm) ou A4.
 *
 * @param {Object} data Payload brut du backend (`editer_quitus`) ou ancienne forme aplatie.
 * @param {Object} [options]
 * @param {'A4'|'TICKET'} [options.format='A4']
 */
export const genererQuitusPDF = (data, options = {}) => {
  const { format = 'A4' } = options;
  const q = normaliserQuitus(data);
  if (format === 'TICKET') {
    genererTicket(q);
  } else {
    genererA4(q);
  }
};

/**
 * Génère le bail domanial officiel et l'ouvre directement en PDF dans un nouvel onglet du navigateur.
 * @param {Object} contrat Données du contrat/bail.
 */
export const ouvrirBailPDF = (contrat) => {
  if (!contrat) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header Institutionnel
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES DE THIÈS', pageWidth / 2, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(201, 161, 92);
  doc.text('SyLOC-T - Gestion du Patrimoine et Baux Domaniaux', pageWidth / 2, 19, { align: 'center' });

  // Titre du document
  let y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 27, 61);
  doc.text("CONTRAT D'OCCUPATION DOMANIALE", pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`RÉFÉRENCE : ${contrat.reference || contrat.id}`, pageWidth / 2, y, { align: 'center' });

  y += 8;

  // Tableau récapitulatif
  const lignesRecap = [
    ['Occupant titulaire', contrat.demandeur_nom || '-'],
    ['Contact occupant', contrat.demandeur_contact || '-'],
    ['Local attribué', `${contrat.local_reference || '-'}${contrat.local_localisation ? ` (${contrat.local_localisation})` : ''}`],
    ['Date d\'effet', contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '-'],
    ['Date de fin', contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : '-'],
    ['Durée du bail', `${contrat.duree_mois || 0} mois`],
    ['Délai de préavis', `${contrat.preavis_mois || 0} mois`],
    ['Statut de l\'acte', contrat.est_actif ? 'ACTIF (En cours)' : `RÉSILIÉ ${contrat.date_resiliation || ''}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Élément', 'Détails du bail']],
    body: lignesRecap,
    theme: 'grid',
    headStyles: { fillColor: [15, 27, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: margin, right: margin },
  });

  y = (doc.lastAutoTable?.finalY || 120) + 10;

  // Clauses et texte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 27, 61);
  doc.text("CLAUSES ET CONDITIONS D'OCCUPATION :", margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const texteCorps = contrat.texte_contrat || `ARTICLE 1 - OBJET
Le concédant (CROUS-T) met à disposition de l'occupant désigné ci-dessus le local ${contrat.local_reference || ''} pour l'exercice de son activité autorisée.

ARTICLE 2 - OBLIGATIONS DE L'OCCUPANT
L'occupant s'engage à exploiter les lieux en bon père de famille, à respecter scrupuleusement les normes d'hygiène, de sécurité et d'environnement (QHSE), et à s'acquitter des redevances aux échéances convenues.

ARTICLE 3 - RÉSILIATION ET PRÉAVIS
Le présent acte est conclu pour une durée de ${contrat.duree_mois || 0} mois. Tout congé anticipé doit respecter le préavis statutaire de ${contrat.preavis_mois || 0} mois.

ARTICLE 4 - DISPOSITIONS PARTICULIÈRES
${contrat.clauses_particulieres || 'Néant.'}`;

  const lignesTexte = doc.splitTextToSize(texteCorps, contentWidth);
  doc.text(lignesTexte, margin, y);

  const ySign = Math.min(pageHeight - 30, y + lignesTexte.length * 4.2 + 12);
  if (ySign > pageHeight - 25) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 27, 61);
    doc.text('Pour le CROUS-T', margin + 10, 30);
    doc.text("L'Occupant", pageWidth - margin - 40, 30);
    doc.line(margin + 5, 45, margin + 55, 45);
    doc.line(pageWidth - margin - 45, 45, pageWidth - margin + 5, 45);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 27, 61);
    doc.text('Pour le CROUS-T', margin + 10, ySign);
    doc.text("L'Occupant", pageWidth - margin - 40, ySign);
    doc.line(margin + 5, ySign + 15, margin + 55, ySign + 15);
    doc.line(pageWidth - margin - 45, ySign + 15, pageWidth - margin + 5, ySign + 15);
  }

  // Ouvrir dans le navigateur
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
};

/**
 * Exporte un tableau d'objets en CSV (separateur ";" pour Excel francophone).
 * @param {Array<Object>} data
 * @param {string} filename Nom du fichier, sans extension
 */
export const exporterCSV = (data, filename) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const lignes = [headers.join(';')];

  for (const row of data) {
    lignes.push(
      headers
        .map((header) => {
          const val = row[header] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(';'),
    );
  }

  // BOM UTF-8 : sans lui Excel casse les accents.
  const blob = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
