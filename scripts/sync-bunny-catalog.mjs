import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(projectRoot, '.env');
const outputPath = path.join(projectRoot, 'src', 'data', 'videos-expo.json');
const expectedTotal = 55;

const categoryOrder = [
  ['Expo Avícola 2026 · 01 · Conferencias', 'conferencias', 'Conferencias'],
  ['Expo Avícola 2026 · 04 · Panel y clausura', 'panel', 'Panel y clausura'],
  ['Expo Avícola 2026 · 03 · Entrevistas', 'entrevistas', 'Entrevistas'],
  ['Expo Avícola 2026 · 02 · Recorrido y ambiente', 'recorrido', 'Recorrido y ambiente'],
  ['Expo Avícola 2026 · 99 · Archivo técnico', 'archivo', 'Archivo técnico'],
];

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2'),
        ];
      }),
  );
}

async function apiJson(url, apiKey) {
  const response = await fetch(url, {
    headers: { AccessKey: apiKey, Accept: 'application/json' },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${url}: HTTP ${response.status} ${text}`);
  return JSON.parse(text);
}

async function listAll(apiBase, apiKey, resource) {
  const first = await apiJson(`${apiBase}/${resource}?page=1&itemsPerPage=100`, apiKey);
  const items = [...(first.items ?? [])];
  const pages = Math.ceil((first.totalItems ?? items.length) / 100);
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiJson(`${apiBase}/${resource}?page=${page}&itemsPerPage=100`, apiKey);
    items.push(...(next.items ?? []));
  }
  return items;
}

const env = parseEnv(await readFile(envPath, 'utf8'));
const libraryId = env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = env.BUNNY_STREAM_API_KEY;
const cdnHostname = env.BUNNY_STREAM_CDN_HOSTNAME;
if (!libraryId || !apiKey || !cdnHostname) {
  throw new Error('Falta la configuración BUNNY_STREAM_* en .env');
}

const apiBase = `https://video.bunnycdn.com/library/${libraryId}`;
const [collections, allVideos] = await Promise.all([
  listAll(apiBase, apiKey, 'collections'),
  listAll(apiBase, apiKey, 'videos'),
]);
const collectionById = new Map(collections.map((collection) => [collection.guid, collection.name]));
const categoryByCollection = new Map(
  categoryOrder.map(([name, slug, label], index) => [name, { slug, label, index }]),
);

const videos = allVideos
  .filter((video) => video.status === 4 && categoryByCollection.has(collectionById.get(video.collectionId)))
  .map((video) => {
    const collectionName = collectionById.get(video.collectionId);
    const category = categoryByCollection.get(collectionName);
    const portrait = [90, 270].includes(video.rotation) || video.height > video.width;
    const thumbnailFileName = video.thumbnailFileName || 'thumbnail.jpg';
    return {
      id: video.guid,
      title: video.title,
      category: category.slug,
      categoryLabel: category.label,
      categoryOrder: category.index,
      duration: video.length,
      width: video.width,
      height: video.height,
      rotation: video.rotation,
      orientation: portrait ? 'vertical' : 'horizontal',
      uploadedAt: video.dateUploaded,
      thumbnailUrl: `https://${cdnHostname}/${video.guid}/${thumbnailFileName}`,
      previewUrl: `https://${cdnHostname}/${video.guid}/preview.webp`,
      embedUrl: `https://player.mediadelivery.net/embed/${libraryId}/${video.guid}`,
    };
  })
  .sort((left, right) => {
    if (left.categoryOrder !== right.categoryOrder) return left.categoryOrder - right.categoryOrder;
    return new Date(left.uploadedAt) - new Date(right.uploadedAt);
  })
  .map(({ categoryOrder, ...video }) => video);

const catalog = {
  generatedAt: new Date().toISOString(),
  libraryId: Number(libraryId),
  expectedTotal,
  publishedTotal: videos.length,
  videos,
};

await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Catálogo actualizado: ${videos.length}/${expectedTotal} videos publicados.`);
