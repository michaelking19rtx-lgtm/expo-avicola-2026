/**
 * Exportación a PDF de la lista de asistentes — Fase 8.
 *
 * jsPDF + jspdf-autotable, importados de forma DINÁMICA desde admin.astro
 * (misma convención que firebase.js y animations.js): juntos pesan varios
 * cientos de KB y solo hacen falta al pulsar «Descargar PDF», nunca en la
 * carga inicial de /admin ni, por supuesto, en la landing pública.
 *
 * Por qué jsPDF y no `window.print()` con una hoja de estilos @media print:
 * el encargo pide un documento con una columna en blanco para marcar
 * «Asistió» a mano y un total al final — eso es table layout con paginación,
 * que jsPDF-autotable ya resuelve (saltos de página, anchos de columna,
 * repetición del encabezado). Reimplementarlo a mano sobre CSS de impresión
 * sería reconstruir, con más código, lo que la librería ya hace bien.
 */

const ETIQUETAS_ESTADO = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  pendiente_oxxo: 'Pendiente OXXO',
  fallido: 'Fallido',
};

const ETIQUETAS_METODO = {
  card: 'Tarjeta',
  // Stripe Link es un autocompletado de tarjeta guardada, no un método
  // distinto — ver el mismo diccionario en admin.astro.
  link: 'Tarjeta',
  oxxo: 'OXXO',
};

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatoFechaGeneracion = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/**
 * @param {any[]} lista Misma lista que pinta la tabla en pantalla (sin filtrar por el buscador).
 */
export async function descargarPdf(lista) {
  // El PDF es para el registro en puerta: solo entra quien ya pagó. Un OXXO
  // "pendiente" sigue visible en la tabla del panel (para dar seguimiento),
  // pero no debe imprimirse como si fuera un asistente confirmado.
  const pagados = lista.filter((a) => a.estado === 'pagado');

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  doc.setTextColor('#111111');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Expo Avícola Productiva 2026', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#444444');
  doc.text('Lista de asistentes', 40, 62);
  doc.text(`Generado el ${formatoFechaGeneracion.format(new Date())}`, 40, 78);

  const filas = pagados.map((a) => [
    a.nombre,
    a.telefono ?? '—',
    a.empresa ?? '—',
    String(a.cantidad),
    a.metodo ? (ETIQUETAS_METODO[a.metodo] ?? a.metodo) : '—',
    ETIQUETAS_ESTADO[a.estado] ?? a.estado,
    a.fecha ? formatoFecha.format(a.fecha) : '—',
    '',
  ]);

  autoTable(doc, {
    startY: 96,
    head: [['Nombre', 'Teléfono', 'Empresa / granja', 'Boletos', 'Método', 'Estado', 'Fecha', 'Asistió']],
    body: filas,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: '#111111',
      lineColor: '#cccccc',
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: '#111111',
      textColor: '#ffffff',
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: '#f4f4f4',
    },
    columnStyles: {
      7: { cellWidth: 60, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  const totalBoletos = pagados.reduce((total, a) => total + a.cantidad, 0);
  const finalY = doc.lastAutoTable?.finalY ?? 96;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#111111');
  doc.text(`Total de asistentes: ${totalBoletos}`, 40, finalY + 24);

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`asistentes-expo-avicola-2026-${fecha}.pdf`);
}
