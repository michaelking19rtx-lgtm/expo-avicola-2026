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
  const textoPredeterminado =
    'Su presencia y compromiso contribuyeron al intercambio de conocimientos y al fortalecimiento del sector avícola.';
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

function textoAjustado(doc, texto, anchoMaximo, tamanoInicial, tamanoMinimo) {
  let tamano = tamanoInicial;
  doc.setFontSize(tamano);
  while (doc.getTextWidth(texto) > anchoMaximo && tamano > tamanoMinimo) {
    tamano -= 0.5;
    doc.setFontSize(tamano);
  }
}

function textoCentradoEspaciado(doc, texto, x, y, charSpace, opciones = {}) {
  const correccion = ((texto.length - 1) * charSpace) / 2;
  doc.text(texto, x - correccion, y, {
    ...opciones,
    align: 'center',
    charSpace,
  });
}

function dibujarSello(doc, colores, sello) {
  const x = 38;
  const y = 179.5;
  if (sello) {
    doc.addImage(sello, 'PNG', 17, 159, 42, 42, undefined, 'FAST');
  } else {
    doc.setFillColor(...colores.doradoClaro);
    doc.circle(x, y, 20.5, 'F');
    doc.setFillColor(...colores.verdeProfundo);
    doc.circle(x, y, 17.6, 'F');
    doc.setTextColor(...colores.doradoClaro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    textoCentradoEspaciado(doc, 'EXCELENCIA', x, y - 6.1, 0.18);
    doc.setFontSize(4);
    textoCentradoEspaciado(doc, 'CONOCIMIENTO', x, y - 1.5, 0.08);
    doc.setFontSize(3.75);
    textoCentradoEspaciado(doc, 'Y COMPROMISO', x, y + 2.8, 0.06);
  }
}

function dibujarPagina(doc, persona, colores, config, recursos) {
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

  if (recursos.logo) doc.addImage(recursos.logo, 'PNG', centro - 38.5, 3.8, 77, 39, undefined, 'FAST');

  doc.setTextColor(...colores.verdeProfundo);
  doc.setFont('times', 'normal');
  doc.setFontSize(40);
  textoCentradoEspaciado(doc, 'CERTIFICADO', centro, 61.5, 2);
  doc.setTextColor(...colores.dorado);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  textoCentradoEspaciado(doc, 'DE RECONOCIMIENTO', centro, 73.5, 1.6);
  doc.setLineWidth(0.45);
  doc.line(66, 70.8, 101, 70.8);
  doc.line(196, 70.8, 231, 70.8);
  doc.line(117, 79, 142.5, 79);
  doc.line(154.5, 79, 180, 79);
  doc.setFillColor(...colores.dorado);
  doc.rect(146.7, 77.2, 3.6, 3.6, 'F');

  doc.setTextColor(...colores.tintaSuave);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Otorgado a:', centro, 87, { align: 'center' });

  doc.setTextColor(...colores.verde);
  doc.setFont('times', 'bolditalic');
  textoAjustado(doc, persona.nombre, 205, 31, 18);
  doc.text(persona.nombre, centro, 104, { align: 'center' });

  doc.setDrawColor(...colores.dorado);
  doc.setLineWidth(0.45);
  doc.line(62, 112, 235, 112);
  doc.setFillColor(...colores.dorado);
  doc.rect(146.4, 109.9, 4.2, 4.2, 'F');

  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Por su valiosa participación como asistente en la:', centro, 122, { align: 'center' });
  doc.setTextColor(...colores.verdeProfundo);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(site.nombre.toLocaleUpperCase('es-MX'), centro, 132, { align: 'center' });

  doc.setTextColor(...colores.tinta);
  doc.setFont('helvetica', 'normal');
  let tamanoTexto = 9.3;
  doc.setFontSize(tamanoTexto);
  let lineas = doc.splitTextToSize(config.texto, 165);
  while (lineas.length > 3 && tamanoTexto > 7.5) {
    tamanoTexto -= 0.4;
    doc.setFontSize(tamanoTexto);
    lineas = doc.splitTextToSize(config.texto, 165);
  }
  doc.text(lineas.slice(0, 3), centro, 143, { align: 'center', lineHeightFactor: 1.35 });

  doc.setTextColor(...colores.verde);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  textoCentradoEspaciado(doc, config.fecha.toLocaleUpperCase('es-MX'), centro, 157, 0.35, {
    maxWidth: 190,
  });

  dibujarSello(doc, colores, recursos.sello);
  if (recursos.firmas) doc.addImage(recursos.firmas, 'PNG', 71.5, 172.5, 154, 31, undefined, 'FAST');
  if (recursos.emblema) doc.addImage(recursos.emblema, 'PNG', 263, 173, 20, 29.2, undefined, 'FAST');
}

async function crearDocumento(personas, opciones = {}) {
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
    dibujarPagina(doc, persona, colores, config, recursos);
  });
  return doc;
}

export async function descargarReconocimiento(persona, _indice = 0, config = {}) {
  const doc = await crearDocumento([persona], config);
  doc.save(`reconocimiento-${slugArchivo(persona.nombre) || 'participante'}.pdf`);
}

export async function descargarReconocimientos(personas, config = {}) {
  const doc = await crearDocumento(personas, config);
  doc.save('reconocimientos-expo-avicola-productiva-2026.pdf');
}
