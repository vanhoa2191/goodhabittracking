import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.next/static/chunks');
const budget = JSON.parse(await readFile('config/performance-budget.json', 'utf8'));

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

if (total > budget.maxTotalJavaScriptBytes || largest.bytes > budget.maxSingleChunkBytes) {
  console.error(JSON.stringify({ status: 'failed', totalBytes: total, largest }));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'passed', totalBytes: total, largest }));
