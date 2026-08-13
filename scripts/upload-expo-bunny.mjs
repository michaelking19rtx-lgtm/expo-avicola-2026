import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as tus from 'tus-js-client';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(projectRoot, '.env');
const uploadStatePath = path.join(projectRoot, '.bunny-upload-state.json');
const tusUrlStorePath = path.join(projectRoot, '.bunny-tus-urls.json');

const collectionNames = {
  conferences: 'Expo Avícola 2026 · 01 · Conferencias',
  atmosphere: 'Expo Avícola 2026 · 02 · Recorrido y ambiente',
  interviews: 'Expo Avícola 2026 · 03 · Entrevistas',
  panel: 'Expo Avícola 2026 · 04 · Panel y clausura',
  archive: 'Expo Avícola 2026 · 99 · Archivo técnico',
};

const manifest = [
  { source: 'IMG_0432.MOV', title: '01 · Productividad en pollo y gallina — Cámara A · Parte 1', collection: 'conferences', thumbnailTime: 120000 },
  { source: 'IMG_0552.MOV', title: '01 · Productividad en pollo y gallina — Cámara B · Parte 1', collection: 'conferences', thumbnailTime: 120000 },
  { source: 'IMG_0433.MOV', title: '01 · Productividad en pollo y gallina — Cámara A · Parte 2', collection: 'conferences', thumbnailTime: 300000 },
  { source: 'IMG_0553.MOV', title: '01 · Productividad en pollo y gallina — Cámara B · Parte 2', collection: 'conferences', thumbnailTime: 300000 },
  { source: 'IMG_0434.MOV', title: '02 · Diagnóstico temprano en aves — Parte 1', collection: 'conferences', thumbnailTime: 180000 },
  { source: 'IMG_0435.MOV', title: '02 · Diagnóstico temprano en aves — Parte 2', collection: 'conferences', thumbnailTime: 35000 },
  { source: 'IMG_0436.MOV', title: '02 · Diagnóstico temprano en aves — Parte 3', collection: 'conferences', thumbnailTime: 22000 },
  { source: 'IMG_0437.MOV', title: '02 · Diagnóstico temprano en aves — Parte 4', collection: 'conferences', thumbnailTime: 20000 },
  { source: 'IMG_0438.MOV', title: '02 · Diagnóstico temprano en aves — Parte 5', collection: 'conferences', thumbnailTime: 22000 },
  { source: 'IMG_0439.MOV', title: '03 · Mortalidad en granja — M.V.Z. Miguel Ángel Castillo López', collection: 'conferences', thumbnailTime: 540000 },
  { source: 'IMG_E0554.MOV', title: 'Show especial de medio tiempo — Parte 1', collection: 'conferences', thumbnailTime: 32000 },
  { source: 'IMG_0555.MOV', title: 'Show especial de medio tiempo — Parte 2', collection: 'conferences', thumbnailTime: 12000 },
  { source: 'IMG_0556.MOV', title: 'Show especial de medio tiempo — Parte 3', collection: 'conferences', thumbnailTime: 12000 },
  { source: 'IMG_0557.MOV', title: 'Show especial de medio tiempo — Público', collection: 'conferences', thumbnailTime: 6000 },
  { source: 'IMG_0582.MOV', title: '04 · Bioseguridad inteligente — Introducción', collection: 'conferences', thumbnailTime: 14000 },
  { source: 'IMG_0440.MOV', title: '04 · Bioseguridad inteligente — Cámara A', collection: 'conferences', thumbnailTime: 720000 },
  { source: 'IMG_0583.MOV', title: '04 · Bioseguridad inteligente — Cámara B', collection: 'conferences', thumbnailTime: 660000 },
  { source: 'IMG_0595.MOV', title: '05 · Inteligencia artificial en avicultura — Ing. Ricardo Olmos Rivera', collection: 'conferences', thumbnailTime: 480000 },

  { source: 'IMG_0594.MOV', title: 'Conversación en escenario — Expo Avícola Productiva 2026', collection: 'panel', thumbnailTime: 70000 },
  { source: 'IMG_0596.MOV', title: 'Panel de preguntas y respuestas — Apertura', collection: 'panel', thumbnailTime: 9000 },
  { source: 'IMG_0599.MOV', title: 'Panel de preguntas y respuestas — Cámara vertical', collection: 'panel', thumbnailTime: 105000 },
  { source: 'IMG_0603.MOV', title: 'Panel de preguntas y respuestas — Cámara general', collection: 'panel', thumbnailTime: 480000 },
  { source: 'IMG_E0604.MOV', title: 'Clausura oficial — Expo Avícola Productiva 2026', collection: 'panel', thumbnailTime: 180000 },

  { source: 'IMG_0586.MOV', title: 'Entrevista 01 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 55000 },
  { source: 'IMG_0587.MOV', title: 'Entrevista 02 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 55000 },
  { source: 'IMG_0589.MOV', title: 'Entrevista 03 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 95000 },
  { source: 'IMG_0606.MOV', title: 'Entrevista 04 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 70000 },
  { source: 'IMG_0617.MOV', title: 'Entrevista 05 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 80000 },
  { source: 'IMG_0620.MOV', title: 'Entrevista 06 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 80000 },
  { source: 'IMG_0621.MOV', title: 'Entrevista 07 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 60000 },
  { source: 'IMG_0623.MOV', title: 'Entrevista 08 — Expo Avícola Productiva 2026', collection: 'interviews', thumbnailTime: 65000 },

  { source: 'IMG_0558.MOV', title: 'Registro y recepción — Parte 1', collection: 'atmosphere', thumbnailTime: 1500 },
  { source: 'IMG_0559.MOV', title: 'Registro y recepción — Parte 2', collection: 'atmosphere', thumbnailTime: 2000 },
  { source: 'IMG_0560.MOV', title: 'Registro y recepción — Parte 3', collection: 'atmosphere', thumbnailTime: 3500 },
  { source: 'IMG_0561.MOV', title: 'Bienvenida — Identidad de la Expo', collection: 'atmosphere', thumbnailTime: 2500 },
  { source: 'IMG_0562.MOV', title: 'Acceso al recinto', collection: 'atmosphere', thumbnailTime: 16000 },
  { source: 'IMG_0563.MOV', title: 'Recorrido por stands — Parte 1', collection: 'atmosphere', thumbnailTime: 1200 },
  { source: 'IMG_0564.MOV', title: 'Recorrido por stands — Parte 2', collection: 'atmosphere', thumbnailTime: 5000 },
  { source: 'IMG_0565.MOV', title: 'Recorrido por stands — Parte 3', collection: 'atmosphere', thumbnailTime: 7000 },
  { source: 'IMG_0566.MOV', title: 'Recorrido por stands — Parte 4', collection: 'atmosphere', thumbnailTime: 7000 },
  { source: 'IMG_0567.MOV', title: 'Recorrido por stands — Parte 5', collection: 'atmosphere', thumbnailTime: 9000 },
  { source: 'IMG_0568.MOV', title: 'Recorrido por stands — Parte 6', collection: 'atmosphere', thumbnailTime: 9000 },
  { source: 'IMG_0569.MOV', title: 'Recorrido por stands — Parte 7', collection: 'atmosphere', thumbnailTime: 7000 },
  { source: 'IMG_0570.MOV', title: 'Recorrido por stands — Parte 8', collection: 'atmosphere', thumbnailTime: 8000 },
  { source: 'IMG_0571.MOV', title: 'Ambiente y asistentes — Parte 1', collection: 'atmosphere', thumbnailTime: 6500 },
  { source: 'IMG_0572.MOV', title: 'Ambiente y asistentes — Parte 2', collection: 'atmosphere', thumbnailTime: 7000 },
  { source: 'IMG_0573.MOV', title: 'Ambiente y asistentes — Parte 3', collection: 'atmosphere', thumbnailTime: 5000 },
  { source: 'IMG_0574.MOV', title: 'Ambiente y asistentes — Parte 4', collection: 'atmosphere', thumbnailTime: 2500 },
  { source: 'IMG_0575.MOV', title: 'Ambiente y asistentes — Parte 5', collection: 'atmosphere', thumbnailTime: 11000 },
  { source: 'IMG_0576.MOV', title: 'Ambiente y asistentes — Parte 6', collection: 'atmosphere', thumbnailTime: 6000 },
  { source: 'IMG_0577.MOV', title: 'Exhibición y networking — Parte 1', collection: 'atmosphere', thumbnailTime: 15000 },
  { source: 'IMG_0578.MOV', title: 'Exhibición y networking — Parte 2', collection: 'atmosphere', thumbnailTime: 6000 },

  { source: 'IMG_0605.MOV', title: 'Archivo técnico — Prueba de cámara para entrevistas', collection: 'archive', thumbnailTime: 800 },
  { source: 'IMG_0622.MOV', title: 'Archivo técnico — Toma oscura para revisión', collection: 'archive', thumbnailTime: 8000 },
  { source: 'IMG_0628.MOV', title: 'Archivo técnico — Convivencia posterior al evento', collection: 'archive', thumbnailTime: 16000 },
];

function parseArgs(argv) {
  const args = { only: null, dryRun: false, status: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--only') args.only = argv[++index];
    else if (value === '--dry-run') args.dryRun = true;
    else if (value === '--status') args.status = true;
    else throw new Error(`Argumento no reconocido: ${value}`);
  }
  return args;
}

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

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function apiJson(url, { method = 'GET', apiKey, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      AccessKey: apiKey,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${url}: HTTP ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function listAll(apiBase, apiKey, resource) {
  const first = await apiJson(`${apiBase}/${resource}?page=1&itemsPerPage=100`, { apiKey });
  const items = [...(first.items ?? [])];
  const pages = Math.ceil((first.totalItems ?? items.length) / 100);
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiJson(`${apiBase}/${resource}?page=${page}&itemsPerPage=100`, { apiKey });
    items.push(...(next.items ?? []));
  }
  return items;
}

async function ensureCollections(apiBase, apiKey) {
  const remote = await listAll(apiBase, apiKey, 'collections');
  const ids = {};
  for (const [key, name] of Object.entries(collectionNames)) {
    const existing = remote.find((collection) => collection.name === name);
    const collection =
      existing ?? (await apiJson(`${apiBase}/collections`, { method: 'POST', apiKey, body: { name } }));
    ids[key] = collection.guid;
  }
  return ids;
}

function makeSignature(libraryId, apiKey, expirationTime, videoId) {
  return createHash('sha256')
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest('hex');
}

async function uploadWithTus({ entry, filePath, fileSize, libraryId, apiKey, videoId, collectionId }) {
  const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const signature = makeSignature(libraryId, apiKey, expirationTime, videoId);
  const urlStorage = new tus.FileUrlStorage(tusUrlStorePath);
  const stream = createReadStream(filePath);
  let lastPrintedAt = 0;

  return new Promise(async (resolve, reject) => {
    const upload = new tus.Upload(stream, {
      endpoint: 'https://video.bunnycdn.com/tusupload',
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      chunkSize: 32 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      urlStorage,
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expirationTime),
        VideoId: videoId,
        LibraryId: String(libraryId),
      },
      metadata: {
        filetype: 'video/quicktime',
        title: entry.title,
        collection: collectionId,
      },
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const now = Date.now();
        if (now - lastPrintedAt < 10000 && bytesUploaded !== bytesTotal) return;
        const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
        const uploadedMiB = (bytesUploaded / 1024 / 1024).toFixed(1);
        const totalMiB = (bytesTotal / 1024 / 1024).toFixed(1);
        console.log(`[${new Date().toISOString()}] ${entry.source}: ${percent}% (${uploadedMiB}/${totalMiB} MiB)`);
        lastPrintedAt = now;
      },
      onSuccess() {
        resolve({ uploadUrl: upload.url, fileSize });
      },
    });

    try {
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
        console.log(`[${new Date().toISOString()}] Reanudando ${entry.source}`);
      }
      upload.start();
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = parseEnv(await readFile(envPath, 'utf8'));
  const libraryId = env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = env.BUNNY_STREAM_API_KEY;
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  const sourceRoot =
    env.BUNNY_SOURCE_DIR || path.join(userHome, 'Desktop', 'VIDEOS DE LA EXPO AVI 2026');
  if (!libraryId || !apiKey) throw new Error('Faltan BUNNY_STREAM_LIBRARY_ID o BUNNY_STREAM_API_KEY en .env');

  let entries = manifest;
  if (args.only) entries = entries.filter((entry) => entry.source.toLowerCase() === args.only.toLowerCase());
  if (!entries.length) throw new Error(`No hay videos que coincidan con --only ${args.only}`);

  const files = [];
  for (const entry of entries) {
    const filePath = path.join(sourceRoot, entry.source);
    await access(filePath);
    const fileStat = await stat(filePath);
    files.push({ ...entry, filePath, fileSize: fileStat.size });
  }

  const totalGiB = files.reduce((sum, entry) => sum + entry.fileSize, 0) / 1024 ** 3;
  console.log(`Plan: ${files.length} videos, ${totalGiB.toFixed(2)} GiB, orden editorial definido.`);
  if (args.dryRun) {
    for (const entry of files) console.log(`${entry.source}\t${entry.collection}\t${entry.title}`);
    return;
  }

  const apiBase = `https://video.bunnycdn.com/library/${libraryId}`;
  const collectionIds = await ensureCollections(apiBase, apiKey);
  let remoteVideos = await listAll(apiBase, apiKey, 'videos');

  if (args.status) {
    for (const entry of files) {
      const remote = remoteVideos.find((video) => video.title === entry.title);
      console.log(`${entry.source}\t${remote ? `status=${remote.status} encode=${remote.encodeProgress}% id=${remote.guid}` : 'PENDIENTE'}`);
    }
    return;
  }

  const state = await readJson(uploadStatePath, { version: 1, items: {} });
  await writeJson(tusUrlStorePath, await readJson(tusUrlStorePath, {}));

  for (const [index, entry] of files.entries()) {
    console.log(`\n[${index + 1}/${files.length}] ${entry.source} — ${entry.title}`);
    let remote = remoteVideos.find((video) => video.title === entry.title);
    if (remote && [2, 3, 4].includes(remote.status)) {
      console.log(`Ya está cargado en Bunny: ${remote.guid} (status ${remote.status}, encode ${remote.encodeProgress}%).`);
      state.items[entry.source] = {
        title: entry.title,
        collection: entry.collection,
        videoId: remote.guid,
        uploaded: true,
        remoteStatus: remote.status,
        encodeProgress: remote.encodeProgress,
      };
      state.updatedAt = new Date().toISOString();
      await writeJson(uploadStatePath, state);
      continue;
    }

    if (!remote) {
      remote = await apiJson(`${apiBase}/videos`, {
        method: 'POST',
        apiKey,
        body: {
          title: entry.title,
          collectionId: collectionIds[entry.collection],
          thumbnailTime: entry.thumbnailTime,
        },
      });
      remoteVideos.push(remote);
      console.log(`Objeto creado: ${remote.guid}`);
    } else {
      console.log(`Reutilizando objeto incompleto: ${remote.guid}`);
    }

    state.items[entry.source] = {
      title: entry.title,
      collection: entry.collection,
      videoId: remote.guid,
      uploaded: false,
    };
    state.updatedAt = new Date().toISOString();
    await writeJson(uploadStatePath, state);

    await uploadWithTus({
      entry,
      filePath: entry.filePath,
      fileSize: entry.fileSize,
      libraryId,
      apiKey,
      videoId: remote.guid,
      collectionId: collectionIds[entry.collection],
    });

    state.items[entry.source] = {
      ...state.items[entry.source],
      uploaded: true,
      uploadedAt: new Date().toISOString(),
    };
    state.updatedAt = new Date().toISOString();
    await writeJson(uploadStatePath, state);
    console.log(`Carga terminada: ${entry.source} -> ${remote.guid}`);
  }

  console.log('\nLote terminado. Bunny continuará la codificación en segundo plano.');
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? String(error));
  process.exitCode = 1;
});
