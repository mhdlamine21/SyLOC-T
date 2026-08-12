import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Génère et télécharge un Quitus PDF
 * @param {Object} data Données du paiement
 * @param {string} data.quitusId Numéro du quitus
 * @param {string} data.date Date du paiement
 * @param {string} data.occupant Nom de l'occupant
 * @param {string} data.local Local concerné
 * @param {number} data.montant Montant payé
 * @param {string} data.modePaiement Mode de paiement (Espèces, Virement, Mobile Money)
 * @param {string} data.echeance Période/Échéance payée
 */
export const genererQuitusPDF = (data) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(22);
  doc.setTextColor(15, 27, 61); // var(--navy)
  doc.text('CROUS DE THIES', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // var(--slate)
  doc.text('SyLOC-T - Système de Gestion du Patrimoine Domanial', 105, 28, { align: 'center' });

  // Titre du document
  doc.setFontSize(16);
  doc.setTextColor(180, 136, 17); // var(--gold-deep)
  doc.text('QUITUS DE PAIEMENT', 105, 45, { align: 'center' });

  // Informations générales
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Quitus : ${data.quitusId}`, 20, 60);
  doc.text(`Date d'émission : ${data.date}`, 140, 60);

  // Tableau des détails
  doc.autoTable({
    startY: 70,
    head: [['Désignation', 'Détails']],
    body: [
      ['Occupant / Bénéficiaire', data.occupant],
      ['Local Domanial', data.local],
      ['Échéance Payée', data.echeance],
      ['Mode de Règlement', data.modePaiement],
      ['Montant Total Encaissé', `${data.montant.toLocaleString()} FCFA`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 27, 61] },
    styles: { fontSize: 11, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } }
  });

  // Bas de page (Signatures)
  const finalY = doc.lastAutoTable.finalY || 130;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Pour valoir et servir ce que de droit.', 20, finalY + 20);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Le Service Comptable', 20, finalY + 40);
  doc.text("Signature de l'Occupant", 140, finalY + 40);

  // Ligne de signature
  doc.line(20, finalY + 60, 70, finalY + 60);
  doc.line(140, finalY + 60, 190, finalY + 60);

  // Sauvegarde automatique du fichier
  doc.save(`Quitus_${data.quitusId}.pdf`);
};

/**
 * Exporte un tableau de données en fichier CSV
 * @param {Array} data Tableau d'objets (données)
 * @param {string} filename Nom du fichier sans extension
 */
export const exporterCSV = (data, filename) => {
  if (!data || !data.length) return;
  
  // Extraire les en-têtes (clés du premier objet)
  const headers = Object.keys(data[0]);
  
  // Créer les lignes CSV
  const csvRows = [];
  csvRows.push(headers.join(';')); // Ligne d'en-tête (séparateur point-virgule pour Excel fr)
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] !== null && row[header] !== undefined ? row[header] : '';
      // Échapper les guillemets et encapsuler les chaînes avec des virgules/points-virgules
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(';'));
  }
  
  // Créer un blob et le télécharger
  const csvString = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // BOM pour l'UTF-8 dans Excel
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
