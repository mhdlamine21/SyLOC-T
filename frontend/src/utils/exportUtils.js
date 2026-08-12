import toast from 'react-hot-toast';

/**
 * Exporte un tableau d'objets au format CSV / Excel
 * @param {Array<Object>} data - Liste des données à exporter
 * @param {string} filename - Nom du fichier généré (sans extension)
 * @param {Array<{key: string, label: string}>} columns - Colonnes à inclure
 */
export function exportToCSV(data, filename = 'export_syloct', columns = []) {
  if (!data || !data.length) {
    toast.error('Aucune donnée à exporter.');
    return;
  }

  // Déterminer les clés et les entêtes
  const keys = columns.length ? columns.map((c) => c.key) : Object.keys(data[0]);
  const headers = columns.length ? columns.map((c) => c.label) : keys;

  const csvRows = [];
  // Ligne d'en-tête
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(';'));

  // Lignes de données
  data.forEach((row) => {
    const values = keys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(';'));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success(`Fichier Excel CSV "${filename}.csv" téléchargé avec succès !`);
}

/**
 * Imprime ou génère un rapport officiel au format PDF
 * @param {string} title - Titre du rapport
 * @param {string} subtitle - Sous-titre ou période
 * @param {Array<Object>} data - Données du tableau
 * @param {Array<{key: string, label: string}>} columns - Colonnes du tableau
 */
export function exportToPDF(title, subtitle, data = [], columns = []) {
  if (!data || !data.length) {
    toast.error('Aucune donnée à imprimer en PDF.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Veuillez autoriser les fenêtres surgissantes pour l\'impression PDF.');
    return;
  }

  const headersHtml = columns.map((c) => `<th style="border: 1px solid #ddd; padding: 8px; background: #1f4b3f; color: #fff; font-family: monospace;">${c.label}</th>`).join('');
  
  const rowsHtml = data.map((row) => {
    const cells = columns.map((col) => {
      const val = row[col.key];
      return `<td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; font-family: sans-serif;">${val !== undefined && val !== null ? val : '—'}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} — SyLOC-T PDF</title>
        <style>
          body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 30px; color: #201c14; }
          .header { text-align: center; border-bottom: 2px solid #1f4b3f; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #1f4b3f; font-size: 20px; }
          .header p { margin: 5px 0 0; color: #666; font-size: 13px; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .footer { margin-top: 30px; text-align: justify; font-size: 10px; color: #888; font-family: monospace; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CROUS DE THIÈS — SITE VCN</h1>
          <p>${title} | ${subtitle}</p>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Document officiel extrait du Système SyLOC-T. Validé par la Direction des Cités Universitaires et de la Vie Étudiante.
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  toast.success(`Impression PDF lancée pour "${title}".`);
}
