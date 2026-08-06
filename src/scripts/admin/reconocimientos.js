import site from '../../data/site.json';

const PROPIEDADES_COLOR = {
  papel: '--reco-papel',
  papelSombra: '--reco-papel-sombra',
  verde: '--reco-verde',
  verdeProfundo: '--reco-verde-profundo',
  dorado: '--reco-dorado',
  doradoClaro: '--reco-dorado-claro',
  tinta: '--reco-tinta',
  tintaSuave: '--reco-tinta-suave',
};

function rgbDesdeCss(valor) {
  const temporal = document.createElement('span');
  temporal.style.color = valor;
  temporal.style.position = 'fixed';
  temporal.style.opacity = '0';
  document.body.append(temporal);
  const resuelto = getComputedStyle(temporal).color;
  temporal.remove();
  const numeros = resuelto.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!numeros || numeros.length !== 3) throw new Error(`No se pudo resolver el color ${valor}.`);
  return numeros;
}

function paleta() {
  const estilos = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(PROPIEDADES_COLOR).map(([nombre, propiedad]) => [
      nombre,
      rgbDesdeCss(estilos.getPropertyValue(propiedad).trim()),
    ])
  );
}

function slugArchivo(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

function folio(indice) {
  return `EAP-2026-${String(indice + 1).padStart(3, '0')}`;
}

function textoAjustado(doc, texto, anchoMaximo, tamanoInicial, tamanoMinimo) {
  let tamano = tamanoInicial;
  doc.setFontSize(tamano);
  while (doc.getTextWidth(texto) > anchoMaximo && tamano > tamanoMinimo) {
    tamano -= 0.5;
    doc.setFontSize(tamano);
  }
}

function dibujarEsquina(doc, colores) {
  doc.setFillColor(...colores.verde);
  doc.triangle(0, 0, 86, 0, 0, 59, 'F');
  doc.setFillColor(...colores.verdeProfundo);
  doc.triangle(0, 0, 63, 0, 0, 42, 'F');
  doc.setDrawColor(...colores.doradoClaro);
  doc.setLineWidth(2.1);
  doc.line(0, 62, 90, 0);

  doc.setFillColor(...colores.verde);
  doc.triangle(297, 210, 211, 210, 297, 151, 'F');
  doc.setFillColor(...colores.verdeProfundo);
  doc.triangle(297, 210, 234, 210, 297, 168, 'F');
  doc.setDrawColor(...colores.doradoClaro);
  doc.line(207, 210, 297, 148);
}

function dibujarSello(doc, colores) {
  const x = 38;
  const y = 166;
  doc.setFillColor(...colores.doradoClaro);
  doc.circle(x, y, 18, 'F');
  doc.setFillColor(...colores.verdeProfundo);
  doc.circle(x, y, 15.3, 'F');
  doc.setDrawColor(...colores.dorado);
  doc.setLineWidth(0.6);
  doc.circle(x, y, 12.7, 'S');
  doc.setTextColor(...colores.doradoClaro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('PARTICIPACIÓN', x, y - 4, { align: 'center', charSpace: 0.35 });
  doc.setFontSize(13);
  doc.text('2026', x, y + 2, { align: 'center' });
  doc.setFontSize(5.7);
  doc.text('COMPROMISO', x, y + 7, { align: 'center', charSpace: 0.5 });
}

function dibujarPagina(doc, persona, indice, colores) {
  const centro = 148.5;
  doc.setFillColor(...colores.papel);
  doc.rect(0, 0, 297, 210, 'F');
  dibujarEsquina(doc, colores);

  doc.setDrawColor(...colores.dorado);
  doc.setLineWidth(0.45);
  doc.rect(5, 5, 287, 200, 'S');
  doc.setLineWidth(0.18);
  doc.rect(7, 7, 283, 196, 'S');

  doc.setFillColor(...colores.verdeProfundo);
  doc.circle(centro - 28, 17, 6.2, 'F');
  doc.setDrawColor(...colores.doradoClaro);
  doc.setLineWidth(0.65);
  doc.circle(centro - 28, 17, 6.2, 'S');
  doc.setTextColor(...colores.doradoClaro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('2026', centro - 28, 19, { align: 'center' });

  doc.setTextColor(...colores.verde);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text('EXPO AVÍCOLA', centro + 3, 16.2, { align: 'center', charSpace: 0.7 });
  doc.setTextColor(...colores.dorado);
  doc.setFontSize(7.2);
  doc.text('PRODUCTIVA 2026', centro + 3, 22.2, { align: 'center', charSpace: 1.35 });

  doc.setTextColor(...colores.verdeProfundo);
  doc.setFont('times', 'normal');
  doc.setFontSize(28);
  doc.text('RECONOCIMIENTO', centro, 49, { align: 'center', charSpace: 1.25 });
  doc.setTextColor(...colores.dorado);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text('DE PARTICIPACIÓN', centro, 60, { align: 'center', charSpace: 2.1 });
  doc.setLineWidth(0.45);
  doc.line(94, 57.2, 119, 57.2);
  doc.line(178, 57.2, 203, 57.2);

  doc.setTextColor(...colores.tintaSuave);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Se otorga a', centro, 72, { align: 'center' });

  doc.setTextColor(...colores.verde);
  doc.setFont('times', 'bolditalic');
  textoAjustado(doc, persona.nombre, 205, 29, 17);
  doc.text(persona.nombre, centro, 91, { align: 'center' });

  doc.setDrawColor(...colores.dorado);
  doc.setLineWidth(0.45);
  doc.line(63, 101, 234, 101);
  doc.setFillColor(...colores.dorado);
  doc.rect(146.4, 98.9, 4.2, 4.2, 'F');

  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.text('Por su valiosa participación como asistente en la', centro, 114, { align: 'center' });
  doc.setTextColor(...colores.verdeProfundo);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text(site.nombre.toLocaleUpperCase('es-MX'), centro, 125.5, { align: 'center' });
  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.7);
  doc.text('y por su compromiso con la formación, la innovación y el', centro, 136.5, { align: 'center' });
  doc.text('fortalecimiento del sector avícola.', centro, 142.5, { align: 'center' });

  doc.setTextColor(...colores.verde);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.7);
  doc.text('7 DE AGOSTO DE 2026  ·  TEHUACÁN, PUEBLA, MÉXICO', centro, 154, {
    align: 'center',
    charSpace: 0.35,
  });

  dibujarSello(doc, colores);

  doc.setDrawColor(...colores.tintaSuave);
  doc.setLineWidth(0.35);
  doc.line(185, 171, 254, 171);
  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.text('COMITÉ ORGANIZADOR', 219.5, 177, { align: 'center', charSpace: 0.55 });
  doc.setTextColor(...colores.tintaSuave);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.text(site.nombre, 219.5, 182, { align: 'center' });

  doc.setTextColor(...colores.tintaSuave);
  doc.setFontSize(6.2);
  doc.text(`Folio interno: ${folio(indice)}`, 283, 198, { align: 'right' });
}

async function crearDocumento(personas, indices = personas.map((_, indice) => indice)) {
  const { jsPDF } = await import('jspdf');
  const colores = paleta();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Reconocimientos — ${site.nombre}`,
    subject: 'Reconocimientos de participación',
    author: site.nombre,
  });

  personas.forEach((persona, indice) => {
    if (indice > 0) doc.addPage('a4', 'landscape');
    dibujarPagina(doc, persona, indices[indice] ?? indice, colores);
  });
  return doc;
}

export async function descargarReconocimiento(persona, indice = 0) {
  const doc = await crearDocumento([persona], [indice]);
  doc.save(`reconocimiento-${slugArchivo(persona.nombre) || 'participante'}.pdf`);
}

export async function descargarReconocimientos(personas) {
  const doc = await crearDocumento(personas);
  doc.save('reconocimientos-expo-avicola-productiva-2026.pdf');
}
