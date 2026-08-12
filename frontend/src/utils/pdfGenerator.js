import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genere et telecharge le Quitus de paiement officiel (PDF).
 *
 * @param {Object} data
 * @param {string} data.quitusId      Numero de quitus renvoye par l'API
 * @param {string} data.date          Date d'emission (deja formatee)
 * @param {string} data.occupant      Nom de l'occupant / beneficiaire
 * @param {string} data.local         Reference du local concerne
 * @param {number} data.montant       Montant encaisse (FCFA)
 * @param {string} data.modePaiement  Mode de reglement
 * @param {string} data.echeance      Periode / echeance payee
 */
export const genererQuitusPDF = (data) => {
  const doc = new jsPDF();

  // En-tete institutionnel
  doc.setFontSize(22);
  doc.setTextColor(15, 27, 61);
  doc.text('CROUS DE THIES', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('SyLOC-T — Gestion du patrimoine domanial', 105, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(180, 136, 17);
  doc.text('QUITUS DE PAIEMENT', 105, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Quitus : ${data.quitusId}`, 20, 60);
  doc.text(`Date d'émission : ${data.date}`, 140, 60);

  autoTable(doc, {
    startY: 70,
    head: [['Désignation', 'Détails']],
    body: [
      ['Occupant / Bénéficiaire', data.occupant || '—'],
      ['Local domanial', data.local || '—'],
      ['Échéance payée', data.echeance || '—'],
      ['Mode de règlement', data.modePaiement || '—'],
      ['Montant total encaissé', `${Number(data.montant || 0).toLocaleString('fr-FR')} FCFA`],
    ],
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
  doc.text('Le Service Comptable', 20, finalY + 40);
  doc.text("Signature de l'occupant", 140, finalY + 40);

  doc.line(20, finalY + 58, 80, finalY + 58);
  doc.line(140, finalY + 58, 190, finalY + 58);

  doc.save(`Quitus_${data.quitusId}.pdf`);
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
