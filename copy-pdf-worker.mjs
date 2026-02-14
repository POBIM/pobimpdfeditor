import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);

const workerCandidates = [
  path.join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(
    rootDir,
    'node_modules',
    'react-pdf',
    'node_modules',
    'pdfjs-dist',
    'build',
    'pdf.worker.min.mjs'
  ),
  path.join(
    rootDir,
    'node_modules',
    'react-pdf',
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.min.mjs'
  ),
];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyPdfWorker() {
  let sourceWorkerPath = null;

  for (const candidate of workerCandidates) {
    if (await fileExists(candidate)) {
      sourceWorkerPath = candidate;
      break;
    }
  }

  if (!sourceWorkerPath) {
    throw new Error('Unable to locate pdf.worker.min.mjs in node_modules.');
  }

  const publicDir = path.join(rootDir, 'public');
  const destination = path.join(publicDir, 'pdf.worker.min.mjs');

  await mkdir(publicDir, { recursive: true });
  await copyFile(sourceWorkerPath, destination);

  const relativeSource = path.relative(rootDir, sourceWorkerPath);
  console.log(`[pdf-worker] Copied ${relativeSource} -> public/pdf.worker.min.mjs`);
}

await copyPdfWorker();
