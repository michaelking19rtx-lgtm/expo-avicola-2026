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
import site from '../../data/site.json';

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

// El lima --accent de tokens.css es ilegible sobre blanco (1.24:1, es de uso
// exclusivo sobre fondo oscuro). --claro-accent es la variante que YA existe
// en tokens.css para superficies claras del propio sitio (Sede, Programa) —
// aquí se usa ese mismo hex, no el de fondo oscuro, por la misma razón.
const VERDE_TITULO = '#0c6047';
const VERDE_ENCABEZADO_FONDO = '#e3f0ea';
const GRIS_ALTERNO = '#f7f7f7';
const GRIS_BORDE = '#d8ddd9';
const NEGRO_TEXTO = '#111111';
const GRIS_TEXTO = '#555555';

const COL_ASISTIO = 8;

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatoFechaGeneracion = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
});

const formatoFechaEvento = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
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
  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 40;

  // --------------------------------------------------------------------
  // Encabezado del documento
  // --------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(VERDE_TITULO);
  doc.text(site.nombre, margen, 46);

  const fechaEvento = site.fecha ? formatoFechaEvento.format(new Date(`${site.fecha}T00:00:00`)) : null;
  const lineaEvento = ['Lista de asistentes', fechaEvento, site.recinto, `${site.ciudad}`, site.horario]
    .filter(Boolean)
    .join('  ·  ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(GRIS_TEXTO);
  doc.text(lineaEvento, margen, 64);

  const textoGeneracion = `Generado el ${formatoFechaGeneracion.format(new Date())}`;
  doc.setFontSize(8.5);
  doc.text(textoGeneracion, anchoPagina - margen, 46, { align: 'right' });

  doc.setDrawColor(GRIS_BORDE);
  doc.setLineWidth(0.75);
  doc.line(margen, 78, anchoPagina - margen, 78);

  // --------------------------------------------------------------------
  // Tabla
  // --------------------------------------------------------------------
  const filas = pagados.map((a, indice) => [
    String(indice + 1),
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
    startY: 92,
    head: [['#', 'Nombre', 'Teléfono', 'Empresa / granja', 'Boletos', 'Método', 'Estado', 'Fecha', 'Asistió']],
    body: filas,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: NEGRO_TEXTO,
      lineColor: GRIS_BORDE,
      lineWidth: 0.6,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: VERDE_ENCABEZADO_FONDO,
      textColor: VERDE_TITULO,
      fontStyle: 'bold',
      lineColor: GRIS_BORDE,
    },
    alternateRowStyles: {
      fillColor: GRIS_ALTERNO,
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 45, halign: 'center' },
      5: { cellWidth: 55 },
      6: { cellWidth: 60 },
      7: { cellWidth: 95 },
      [COL_ASISTIO]: { cellWidth: 78, halign: 'center' },
    },
    margin: { left: margen, right: margen },
    // La casilla de "Asistió" se dibuja a mano: un recuadro real, no un
    // espacio en blanco que en papel es indistinguible del margen de la celda.
    didDrawCell(data) {
      if (data.section !== 'body' || data.column.index !== COL_ASISTIO) return;
      const lado = 12;
      const x = data.cell.x + data.cell.width / 2 - lado / 2;
      const y = data.cell.y + data.cell.height / 2 - lado / 2;
      doc.setDrawColor(GRIS_TEXTO);
      doc.setLineWidth(0.75);
      doc.rect(x, y, lado, lado, 'S');
    },
  });

  // --------------------------------------------------------------------
  // Pie: total + firma de quien lleva el registro
  // --------------------------------------------------------------------
  const totalBoletos = pagados.reduce((total, a) => total + a.cantidad, 0);
  const finalY = doc.lastAutoTable?.finalY ?? 92;
  const alturaPagina = doc.internal.pageSize.getHeight();

  // Si el cierre no cabe en lo que queda de la página, se pasa a una nueva:
  // una firma partida entre dos hojas no sirve para nada.
  const espacioNecesario = 90;
  let y = finalY + 28;
  if (y + espacioNecesario > alturaPagina - margen) {
    doc.addPage();
    y = margen + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(VERDE_TITULO);
  doc.text(`Total de asistentes: ${totalBoletos}`, margen, y);

  const yFirma = y + 44;
  const anchoLinea = 230;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(NEGRO_TEXTO);
  doc.setDrawColor(NEGRO_TEXTO);
  doc.setLineWidth(0.6);

  doc.text('Responsable de registro:', margen, yFirma);
  doc.line(margen + 140, yFirma + 2, margen + 140 + anchoLinea, yFirma + 2);

  const xFirma = margen + 140 + anchoLinea + 50;
  doc.text('Firma:', xFirma, yFirma);
  doc.line(xFirma + 40, yFirma + 2, xFirma + 40 + anchoLinea, yFirma + 2);

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`asistentes-expo-avicola-2026-${fecha}.pdf`);
}
