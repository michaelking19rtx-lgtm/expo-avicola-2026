import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadScript = path.join(projectRoot, 'scripts', 'upload-expo-bunny.mjs');
const syncScript = path.join(projectRoot, 'scripts', 'sync-bunny-catalog.mjs');
const uploadLogPath = path.join(projectRoot, '.bunny-upload.log');
const uploadErrorPath = path.join(projectRoot, '.bunny-upload-error.log');
const catalogPath = path.join(projectRoot, 'src', 'data', 'videos-expo.json');
const supervisorLogPath = path.join(projectRoot, '.bunny-supervisor.log');
const initialPid = Number(process.argv[2]);
const maxRestarts = 12;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitMinutes(minutes) {
  for (let elapsed = 0; elapsed < minutes; elapsed += 1) await wait(60_000);
}

async function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);
}

function isRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function uploadFinished() {
  try {
    return (await readFile(uploadLogPath, 'utf8')).includes('Lote terminado.');
  } catch {
    return false;
  }
}

async function run(command, args, { appendUploadLogs = false } = {}) {
  const stdoutPath = appendUploadLogs ? uploadLogPath : supervisorLogPath;
  const stderrPath = appendUploadLogs ? uploadErrorPath : supervisorLogPath;
  const stdout = createWriteStream(stdoutPath, { flags: 'a' });
  const stderr = createWriteStream(stderrPath, { flags: 'a' });

  // En Windows con Node 24, spawn rechaza un WriteStream cuyo descriptor aún
  // no terminó de abrirse (`fd: null`). Esperar el evento `open` evita que el
  // supervisor falle justo al lanzar la sincronización final del catálogo.
  await Promise.all([
    typeof stdout.fd === 'number' ? Promise.resolve() : once(stdout, 'open'),
    typeof stderr.fd === 'number' ? Promise.resolve() : once(stderr, 'open'),
  ]);

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      windowsHide: true,
      stdio: ['ignore', stdout, stderr],
    });
    child.once('error', () => resolve(1));
    child.once('close', (code) => {
      stdout.end();
      stderr.end();
      resolve(code ?? 1);
    });
  });
}

async function monitorPid(pid) {
  while (isRunning(pid)) await wait(60_000);
  await wait(2_000);
}

async function ensureUploadCompletes() {
  if (isRunning(initialPid)) {
    await log(`Supervisando el cargador inicial PID ${initialPid}.`);
    await monitorPid(initialPid);
  }

  for (let attempt = 0; attempt <= maxRestarts; attempt += 1) {
    if (await uploadFinished()) return;
    if (attempt === maxRestarts) {
      throw new Error(`La carga no terminó después de ${maxRestarts} reintentos.`);
    }
    await log(`Carga interrumpida; reanudando automáticamente (${attempt + 1}/${maxRestarts}).`);
    await waitMinutes(2);
    await run(process.execPath, [uploadScript], { appendUploadLogs: true });
  }
}

async function syncUntilEncoded() {
  for (let attempt = 1; attempt <= 288; attempt += 1) {
    await run(process.execPath, [syncScript]);
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    await log(`Codificación Bunny: ${catalog.publishedTotal}/${catalog.expectedTotal} videos listos.`);
    if (catalog.publishedTotal >= catalog.expectedTotal) return;
    await waitMinutes(5);
  }
  throw new Error('Bunny no terminó de codificar el catálogo dentro de 24 horas.');
}

await ensureUploadCompletes();
await log('Las 55 fuentes terminaron de subir; esperando la codificación final de Bunny.');
await syncUntilEncoded();

const npmCommand = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
const npmArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'];
const buildCode = await run(npmCommand, npmArgs);
if (buildCode !== 0) throw new Error(`La compilación final terminó con código ${buildCode}.`);
await log('COMPLETADO: 55 videos codificados, catálogo actualizado y sitio compilado.');
