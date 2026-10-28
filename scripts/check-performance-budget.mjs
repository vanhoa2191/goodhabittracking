import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  }))).flat();
}

function validateRouteStats(routeStats) {
  if (!Array.isArray(routeStats) || routeStats.length === 0) {
    throw new Error('Next route bundle stats are missing or empty.');
  }
  for (const entry of routeStats) {
    if (
      typeof entry?.route !== 'string'
      || !Number.isFinite(entry.firstLoadUncompressedJsBytes)
      || !Array.isArray(entry.firstLoadChunkPaths)
      || entry.firstLoadChunkPaths.some((file) => typeof file !== 'string')
    ) {
      throw new Error('Next route bundle stats contain an invalid entry.');
    }
  }
}

/** Compare Next's structured first-load route stats and emitted chunk sizes with the configured budget. */
export function evaluatePerformanceBudget({ routeStats, chunkSizes, budget }) {
  validateRouteStats(routeStats);
  if (!Array.isArray(chunkSizes) || chunkSizes.length === 0) {
    throw new Error('No JavaScript chunks were found for the performance budget.');
  }

  const largestRouteStat = [...routeStats].sort(
    (left, right) => right.firstLoadUncompressedJsBytes - left.firstLoadUncompressedJsBytes,
  )[0];
  const largestInitialRoute = {
    route: largestRouteStat.route,
    bytes: largestRouteStat.firstLoadUncompressedJsBytes,
    files: new Set(largestRouteStat.firstLoadChunkPaths).size,
  };
  const largestChunk = [...chunkSizes].sort((left, right) => right.bytes - left.bytes)[0];
  const allChunksBytes = chunkSizes.reduce((sum, item) => sum + item.bytes, 0);
  const status = largestInitialRoute.bytes > budget.maxInitialJavaScriptBytes
    || largestChunk.bytes > budget.maxSingleChunkBytes
    ? 'failed'
    : 'passed';

  return { status, largestInitialRoute, allChunksBytes, largestChunk };
}

async function main() {
  const chunksRoot = path.resolve('.next/static/chunks');
  const budget = JSON.parse(await readFile('config/performance-budget.json', 'utf8'));
  const routeStats = JSON.parse(await readFile('.next/diagnostics/route-bundle-stats.json', 'utf8'));
  const chunks = (await listFiles(chunksRoot)).filter((file) => file.endsWith('.js'));
  const chunkSizes = await Promise.all(chunks.map(async (file) => ({ file, bytes: (await stat(file)).size })));
  const result = evaluatePerformanceBudget({ routeStats, chunkSizes, budget });

  const output = JSON.stringify(result);
  if (result.status === 'failed') {
    console.error(output);
    process.exit(1);
  }
  console.log(output);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
