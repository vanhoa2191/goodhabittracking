import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.next/static/chunks');
const budget = JSON.parse(await readFile('config/performance-budget.json', 'utf8'));
const appManifest = JSON.parse(await readFile('.next/server/app-paths-manifest.json', 'utf8'));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  }))).flat();
}

const chunks = (await listFiles(root)).filter((file) => file.endsWith('.js'));
const sizes = await Promise.all(chunks.map(async (file) => ({ file, bytes: (await stat(file)).size })));
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
const largest = sizes.sort((left, right) => right.bytes - left.bytes)[0];

async function routeEntrySize({ manifestPath: appPath, route }) {
  const relativePath = appPath.replace(/^\//, '');
  const manifestPath = path.resolve('.next/server/app', `${relativePath || 'page'}_client-reference-manifest.js`);
  const source = await readFile(manifestPath, 'utf8');
  const key = `\"[project]/src/app/${relativePath || 'page'}\":[`;
  const start = source.lastIndexOf(key);
  if (start < 0) return null;
  const end = source.indexOf(']', start + key.length);
  const files = [...source.slice(start, end).matchAll(/\"(static\/chunks\/[^\"]+\.js)\"/g)].map((match) => match[1]);
  const uniqueFiles = [...new Set(files)];
  const routeBytes = await Promise.all(uniqueFiles.map(async (file) => (await stat(path.resolve('.next', file))).size));
  return { route, bytes: routeBytes.reduce((sum, bytes) => sum + bytes, 0), files: uniqueFiles.length };
}

const appRoutes = Object.keys(appManifest)
  .filter((appPath) => appPath.endsWith('/page') && !appPath.includes('/_'))
  .map((appPath) => ({ manifestPath: appPath, route: appPath.replace(/\/page$/, '') || '/' }));
const routeEntries = (await Promise.all(appRoutes.map(routeEntrySize))).filter(Boolean);
const largestRoute = routeEntries.sort((left, right) => right.bytes - left.bytes)[0];

if (largestRoute.bytes > budget.maxInitialJavaScriptBytes || largest.bytes > budget.maxSingleChunkBytes) {
  console.error(JSON.stringify({ status: 'failed', largestInitialRoute: largestRoute, allChunksBytes: total, largestChunk: largest }));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'passed', largestInitialRoute: largestRoute, allChunksBytes: total, largestChunk: largest }));
