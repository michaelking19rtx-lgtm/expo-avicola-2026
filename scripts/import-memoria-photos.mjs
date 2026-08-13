import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceDir = process.argv[2];
if (!sourceDir) {
  throw new Error('Uso: node scripts/import-memoria-photos.mjs <carpeta-de-originales>');
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'public', 'img', 'memoria', 'fotos');
const dataPath = path.join(projectRoot, 'src', 'data', 'fotos-expo.json');

const selection = [
  {
    source: 'DSC00343.JPG', slug: 'conocimiento-en-accion', label: 'Conocimiento en acción',
    caption: 'Conferencias técnicas con una sala llena de preguntas, experiencias y nuevas ideas.',
    alt: 'Conferencia ante una sala llena de asistentes de la Expo Avícola Productiva 2026.', featured: true,
  },
  {
    source: 'DSC00361.JPG', slug: 'ritmo-del-encuentro', label: 'También hubo ritmo',
    caption: 'La música abrió un respiro para convivir y disfrutar el encuentro.',
    alt: 'Saxofonista y DJ durante un momento musical de la Expo.', featured: true,
  },
  {
    source: 'DSC00403.JPG', slug: 'avicultura-de-cerca', label: 'La avicultura de cerca',
    caption: 'La curiosidad del público convirtió cada demostración en una experiencia compartida.',
    alt: 'Asistentes observando y fotografiando pollitos durante una demostración.', featured: true,
  },
  {
    source: 'DSC00275.JPG', slug: 'comunidad-avicola', label: 'La comunidad',
    caption: 'Productores, especialistas y empresas se reunieron para comenzar una jornada de aprendizaje.',
    alt: 'Grupo de asistentes reunido frente al escenario al inicio de la Expo.', featured: true,
  },
  {
    source: 'DSC00283.JPG', slug: 'ideas-que-transforman', label: 'Ideas que transforman',
    caption: 'Experiencia de campo convertida en decisiones más productivas.',
    alt: 'Ponente compartiendo conclusiones técnicas frente a la pantalla principal.', featured: true,
  },
  {
    source: 'DSC00379.JPG', slug: 'conexiones-que-continuan', label: 'Conexiones que continúan',
    caption: 'El intercambio entre productores y proveedores siguió más allá del escenario.',
    alt: 'Asistentes conversando y conociendo soluciones en la zona de exposición.', featured: true,
  },
  {
    source: 'DSC00348.JPG', slug: 'equipo-del-encuentro', label: 'Detrás del encuentro',
    caption: 'El equipo que recibió a cada asistente y puso la jornada en marcha.',
    alt: 'Integrantes del equipo de registro trabajando junto a una computadora.', featured: true,
  },
  {
    source: 'DSC00291.JPG', slug: 'sala-conectada', label: 'Una sala conectada',
    caption: 'El sector escuchó, preguntó y compartió los retos que enfrenta todos los días.',
    alt: 'Vista vertical de la audiencia siguiendo una conferencia.', featured: false,
  },
  {
    source: 'DSC00313.JPG', slug: 'quienes-hacen-industria', label: 'Quienes hacen industria',
    caption: 'Empresas avícolas presentaron soluciones nacidas de la experiencia diaria.',
    alt: 'Dos expositoras sonríen frente a productos y material de su empresa.', featured: false,
  },
  {
    source: 'DSC00353.JPG', slug: 'experiencia-tecnica', label: 'Experiencia técnica',
    caption: 'Diagnóstico, prevención y productividad explicados desde la práctica.',
    alt: 'Especialista explica causas de mortalidad avícola junto a una pantalla.', featured: false,
  },
  {
    source: 'DSC00356.JPG', slug: 'soluciones-cara-a-cara', label: 'Soluciones cara a cara',
    caption: 'Conversaciones directas entre proveedores, especialistas y productores.',
    alt: 'Expositores conversan con visitantes frente a una mesa de productos.', featured: false,
  },
  {
    source: 'DSC00367.JPG', slug: 'tecnologia-en-vivo', label: 'Tecnología en vivo',
    caption: 'Demostraciones que permitieron ver, preguntar y comparar en el momento.',
    alt: 'Expositor realiza una demostración de equipo ante varios asistentes.', featured: false,
  },
  {
    source: 'DSC00415.JPG', slug: 'somos-comunidad', label: 'Somos comunidad',
    caption: 'Cada asistente fue parte de la identidad y la energía de esta primera edición.',
    alt: 'Dos asistentes sonríen junto al muro de identidad y patrocinadores de la Expo.', featured: false,
  },
  {
    source: 'DSC00431.JPG', slug: 'aprender-para-prevenir', label: 'Aprender para prevenir',
    caption: 'Información útil para tomar mejores decisiones y proteger la producción.',
    alt: 'Vista general de una ponencia sobre prevención ante la audiencia.', featured: false,
  },
  {
    source: 'DSC00447.JPG', slug: 'futuro-en-las-manos', label: 'El futuro en nuestras manos',
    caption: 'Un momento que resume la cercanía, el oficio y el propósito de la Expo.',
    alt: 'Expositor y asistente sostienen pollitos mientras miran a la cámara.', featured: false,
  },
];

await mkdir(outputDir, { recursive: true });

const photos = [];
for (const [index, photo] of selection.entries()) {
  const source = path.join(sourceDir, photo.source);
  const smallName = `${photo.slug}-960.webp`;
  const fullName = `${photo.slug}-1800.webp`;

  const small = await sharp(source, { failOn: 'error' })
    .autoOrient()
    .resize({ width: 960, height: 1200, fit: 'inside', withoutEnlargement: true })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(path.join(outputDir, smallName));

  await sharp(source, { failOn: 'error' })
    .autoOrient()
    .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(path.join(outputDir, fullName));

  photos.push({
    id: index + 1,
    src: `/img/memoria/fotos/${smallName}`,
    full: `/img/memoria/fotos/${fullName}`,
    width: small.width,
    height: small.height,
    label: photo.label,
    caption: photo.caption,
    alt: photo.alt,
    featured: photo.featured,
  });
}

await writeFile(dataPath, `${JSON.stringify({ photos }, null, 2)}\n`, 'utf8');
console.log(`${photos.length} fotografías optimizadas para Memoria.`);
