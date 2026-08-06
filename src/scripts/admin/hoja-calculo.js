import { strFromU8, unzipSync } from 'fflate';

const ENCABEZADOS_NOMBRE = [
  'nombre',
  'nombre completo',
  'nombre del alumno',
  'alumno',
  'alumna',
  'asistente',
  'participante',
];

const PALABRAS_PARTICULA = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
const PATRON_EMPRESA = /\b(empresa|grupo|group|solutions|soluciones|crops|s\.?\s*a\.?|sociedad)\b/i;
const PATRON_RESERVA = /\bcupo\s*\d+\b/i;
const PATRON_CAMEL = /[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]/;

function normalizarComparacion(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es-MX');
}

function limpiarNombre(valor) {
  const limpio = String(valor ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:]+$/, '');

  if (!limpio) return '';

  if (PATRON_CAMEL.test(limpio)) {
    return limpio.charAt(0).toLocaleUpperCase('es-MX') + limpio.slice(1);
  }

  return limpio
    .toLocaleLowerCase('es-MX')
    .split(' ')
    .map((palabra, indice) => {
      if (indice > 0 && PALABRAS_PARTICULA.has(palabra)) return palabra;
      return palabra.charAt(0).toLocaleUpperCase('es-MX') + palabra.slice(1);
    })
    .join(' ');
}

function motivoRevision(nombre) {
  if (PATRON_RESERVA.test(nombre)) return 'Sustituye el cupo por el nombre real';
  if (PATRON_EMPRESA.test(nombre)) return 'Parece una empresa, no una persona';
  if (PATRON_CAMEL.test(nombre)) return 'Revisa la separación entre nombres o apellidos';
  if (!nombre.includes(' ')) return 'Revisa si falta algún apellido';
  return null;
}

function columnaDesdeReferencia(referencia) {
  const letras = String(referencia ?? '').match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? '';
  let numero = 0;
  for (const letra of letras) numero = numero * 26 + letra.charCodeAt(0) - 64;
  return numero - 1;
}

function elementos(xml, nombre) {
  return Array.from(xml.getElementsByTagNameNS('*', nombre));
}

function parsearXml(texto, archivo) {
  const xml = new DOMParser().parseFromString(texto, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error(`No se pudo leer ${archivo} dentro del Excel.`);
  return xml;
}

function textoZip(archivos, ruta) {
  const bytes = archivos[ruta];
  if (!bytes) throw new Error(`El Excel no contiene ${ruta}.`);
  return strFromU8(bytes);
}

function rutaHoja(archivos) {
  const workbook = parsearXml(textoZip(archivos, 'xl/workbook.xml'), 'workbook.xml');
  const relaciones = parsearXml(
    textoZip(archivos, 'xl/_rels/workbook.xml.rels'),
    'workbook.xml.rels'
  );
  const primeraHoja = elementos(workbook, 'sheet')[0];
  if (!primeraHoja) throw new Error('El archivo no contiene hojas de cálculo.');

  const relacionId =
    primeraHoja.getAttribute('r:id') ??
    primeraHoja.getAttributeNS(
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'id'
    );
  const relacion = elementos(relaciones, 'Relationship').find(
    (item) => item.getAttribute('Id') === relacionId
  );
  const destino = relacion?.getAttribute('Target');
  if (!destino) throw new Error('No se encontró la primera hoja del Excel.');
  return destino.startsWith('/') ? destino.slice(1) : `xl/${destino.replace(/^\.\//, '')}`;
}

function matrizDesdeXlsx(buffer) {
  const archivos = unzipSync(new Uint8Array(buffer));
  const compartidos = archivos['xl/sharedStrings.xml']
    ? elementos(
        parsearXml(textoZip(archivos, 'xl/sharedStrings.xml'), 'sharedStrings.xml'),
        'si'
      ).map((item) => item.textContent ?? '')
    : [];

  const hoja = parsearXml(textoZip(archivos, rutaHoja(archivos)), 'la hoja de cálculo');
  return elementos(hoja, 'row').map((fila) => {
    const salida = [];
    for (const celda of elementos(fila, 'c')) {
      const indice = columnaDesdeReferencia(celda.getAttribute('r'));
      const tipo = celda.getAttribute('t');
      const valor = elementos(celda, 'v')[0]?.textContent ?? '';
      if (tipo === 's') salida[indice] = compartidos[Number(valor)] ?? '';
      else if (tipo === 'inlineStr') salida[indice] = elementos(celda, 'is')[0]?.textContent ?? '';
      else salida[indice] = valor;
    }
    return salida;
  });
}

function matrizDesdeCsv(texto) {
  const primeraLinea = texto.split(/\r?\n/, 1)[0] ?? '';
  const candidatos = [',', ';', '\t'];
  const separador = candidatos.sort(
    (a, b) => primeraLinea.split(b).length - primeraLinea.split(a).length
  )[0];

  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;

  for (let indice = 0; indice <= texto.length; indice += 1) {
    const caracter = texto[indice] ?? '\n';
    const siguiente = texto[indice + 1];
    if (caracter === '"') {
      if (entreComillas && siguiente === '"') {
        campo += '"';
        indice += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === separador && !entreComillas) {
      fila.push(campo);
      campo = '';
    } else if ((caracter === '\n' || caracter === '\r') && !entreComillas) {
      if (caracter === '\r' && siguiente === '\n') indice += 1;
      fila.push(campo);
      if (fila.some((valor) => String(valor).trim())) filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += caracter;
    }
  }
  return filas;
}

function encontrarColumnaNombre(matriz) {
  const limite = Math.min(matriz.length, 30);
  for (let fila = 0; fila < limite; fila += 1) {
    for (let columna = 0; columna < (matriz[fila]?.length ?? 0); columna += 1) {
      const valor = normalizarComparacion(matriz[fila][columna]);
      if (ENCABEZADOS_NOMBRE.includes(valor)) return { fila, columna };
    }
  }

  const primera = matriz.findIndex((fila) => fila.some((valor) => String(valor ?? '').trim()));
  if (primera < 0) throw new Error('El archivo está vacío.');
  const columna = matriz[primera].findIndex((valor) => String(valor ?? '').trim());
  return { fila: primera - 1, columna };
}

function construirPersonas(matriz) {
  const { fila, columna } = encontrarColumnaNombre(matriz);
  const crudos = matriz
    .slice(fila + 1)
    .map((item) => limpiarNombre(item[columna]))
    .filter(Boolean);

  const vistos = new Set();
  const personas = [];
  let duplicadosOmitidos = 0;

  for (const nombre of crudos) {
    const clave = normalizarComparacion(nombre);
    if (vistos.has(clave)) {
      duplicadosOmitidos += 1;
      continue;
    }
    vistos.add(clave);
    personas.push({
      id: `persona-${personas.length + 1}`,
      nombre,
      revision: motivoRevision(nombre),
    });
  }

  if (!personas.length) throw new Error('No se encontraron nombres debajo del encabezado.');
  return { personas, totalOrigen: crudos.length, duplicadosOmitidos };
}

/**
 * Lee un XLSX o CSV en el navegador. El archivo nunca sale del dispositivo.
 * @param {File} archivo
 */
export async function leerLista(archivo) {
  const extension = archivo.name.split('.').pop()?.toLocaleLowerCase('es-MX');
  let matriz;
  if (extension === 'xlsx') matriz = matrizDesdeXlsx(await archivo.arrayBuffer());
  else if (extension === 'csv') matriz = matrizDesdeCsv(await archivo.text());
  else throw new Error('Usa un archivo .xlsx o .csv.');

  return construirPersonas(matriz);
}

export function revisarNombre(nombre) {
  return motivoRevision(limpiarNombre(nombre));
}

export function prepararNombre(nombre) {
  return limpiarNombre(nombre);
}
