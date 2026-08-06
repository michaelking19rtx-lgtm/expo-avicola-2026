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

async function cargarImagen(url) {
  if (!url) return null;
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`No se pudo cargar el recurso visual ${url}.`);
  const blob = await respuesta.blob();
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.addEventListener('load', () => resolve(lector.result));
    lector.addEventListener('error', () => reject(new Error(`No se pudo leer el recurso visual ${url}.`)));
    lector.readAsDataURL(blob);
  });
}

function normalizarConfig(config = {}) {
  const textoPredeterminado = `Por su valiosa participación como asistente en la ${site.nombre} y por su compromiso con la formación, la innovación y el fortalecimiento del sector avícola.`;
  const texto = (valor, respaldo = '') => (typeof valor === 'string' ? valor.trim() : respaldo);
  return {
    texto: texto(config.texto, textoPredeterminado),
    fecha: texto(config.fecha, '7 de agosto de 2026 · Tehuacán, Puebla, México'),
    fondoUrl: texto(config.fondoUrl),
    logoUrl: texto(config.logoUrl),
    emblemaUrl: texto(config.emblemaUrl),
    firmasUrl: texto(config.firmasUrl),
    selloUrl: texto(config.selloUrl),
  };
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

function dibujarSello(doc, colores, sello) {
  const x = 38;
  const y = 174;
  if (sello) {
    doc.addImage(sello, 'PNG', 20, 156.2, 36, 35.6, undefined, 'FAST');
  } else {
    doc.setFillColor(...colores.doradoClaro);
    doc.circle(x, y, 18, 'F');
    doc.setFillColor(...colores.verdeProfundo);
    doc.circle(x, y, 15.3, 'F');
  }
  doc.setTextColor(...colores.doradoClaro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.text('EXCELENCIA', x, y - 5.4, { align: 'center', charSpace: 0.18 });
  doc.setFontSize(3.55);
  doc.text('CONOCIMIENTO', x, y - 1.4, { align: 'center', charSpace: 0.08 });
  doc.setFontSize(3.35);
  doc.text('Y COMPROMISO', x, y + 2.2, { align: 'center', charSpace: 0.06 });
}

function dibujarPagina(doc, persona, indice, colores, config, recursos) {
  const centro = 148.5;
  if (recursos.fondo) {
    doc.addImage(recursos.fondo, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  } else {
    doc.setFillColor(...colores.papel);
    doc.rect(0, 0, 297, 210, 'F');
    doc.setDrawColor(...colores.dorado);
    doc.setLineWidth(0.45);
    doc.rect(5, 5, 287, 200, 'S');
  }

  if (recursos.logo) doc.addImage(recursos.logo, 'PNG', centro - 32.5, 4.7, 65, 33, undefined, 'FAST');

  doc.setTextColor(...colores.verdeProfundo);
  doc.setFont('times', 'normal');
  doc.setFontSize(28);
  doc.text('RECONOCIMIENTO', centro, 47, { align: 'center', charSpace: 1.25 });
  doc.setTextColor(...colores.dorado);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text('DE PARTICIPACIÓN', centro, 58, { align: 'center', charSpace: 2.1 });
  doc.setLineWidth(0.45);
  doc.line(94, 55.2, 119, 55.2);
  doc.line(178, 55.2, 203, 55.2);

  doc.setTextColor(...colores.tintaSuave);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Se otorga a', centro, 69, { align: 'center' });

  doc.setTextColor(...colores.verde);
  doc.setFont('times', 'bolditalic');
  textoAjustado(doc, persona.nombre, 205, 29, 17);
  doc.text(persona.nombre, centro, 88.5, { align: 'center' });

  doc.setDrawColor(...colores.dorado);
  doc.setLineWidth(0.45);
  doc.line(63, 98.5, 234, 98.5);
  doc.setFillColor(...colores.dorado);
  doc.rect(146.4, 96.4, 4.2, 4.2, 'F');

  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'normal');
  let tamanoTexto = 9.1;
  doc.setFontSize(tamanoTexto);
  let lineas = doc.splitTextToSize(config.texto, 169);
  while (lineas.length > 5 && tamanoTexto > 7) {
    tamanoTexto -= 0.4;
    doc.setFontSize(tamanoTexto);
    lineas = doc.splitTextToSize(config.texto, 169);
  }
  doc.text(lineas.slice(0, 5), centro, 111, { align: 'center', lineHeightFactor: 1.35 });

  doc.setTextColor(...colores.verde);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.7);
  doc.text(config.fecha.toLocaleUpperCase('es-MX'), centro, 149, {
    align: 'center',
    charSpace: 0.35,
    maxWidth: 190,
  });

  dibujarSello(doc, colores, recursos.sello);
  if (recursos.firmas) doc.addImage(recursos.firmas, 'PNG', 73, 162, 151, 30.5, undefined, 'FAST');
  if (recursos.emblema) doc.addImage(recursos.emblema, 'PNG', 263, 162, 20, 29.2, undefined, 'FAST');

  doc.setTextColor(...colores.tintaSuave);
  doc.setFontSize(6.2);
  doc.text(`Folio interno: ${folio(indice)}`, centro, 201, { align: 'center' });
}

async function crearDocumento(personas, indices = personas.map((_, indice) => indice), opciones = {}) {
  const { jsPDF } = await import('jspdf');
  const colores = paleta();
  const config = normalizarConfig(opciones);
  const [fondo, logo, emblema, firmas, sello] = await Promise.all([
    cargarImagen(config.fondoUrl),
    cargarImagen(config.logoUrl),
    cargarImagen(config.emblemaUrl),
    cargarImagen(config.firmasUrl),
    cargarImagen(config.selloUrl),
  ]);
  const recursos = { fondo, logo, emblema, firmas, sello };
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Reconocimientos — ${site.nombre}`,
    subject: 'Reconocimientos de participación',
    author: site.nombre,
  });

  personas.forEach((persona, indice) => {
    if (indice > 0) doc.addPage('a4', 'landscape');
    dibujarPagina(doc, persona, indices[indice] ?? indice, colores, config, recursos);
  });
  return doc;
}

export async function descargarReconocimiento(persona, indice = 0, config = {}) {
  const doc = await crearDocumento([persona], [indice], config);
  doc.save(`reconocimiento-${slugArchivo(persona.nombre) || 'participante'}.pdf`);
}

export async function descargarReconocimientos(personas, config = {}) {
  const doc = await crearDocumento(personas, undefined, config);
  doc.save('reconocimientos-expo-avicola-productiva-2026.pdf');
}
