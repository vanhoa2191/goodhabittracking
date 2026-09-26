import { readFileSync } from 'node:fs';
import { buildSafeEvolveReport, parseExperimentObservations } from '../src/lib/experiment-report.ts';

const inputPath = process.argv[2];

if (!inputPath) {
  process.stderr.write('Usage: npm run report:experiment -- <anonymized-observations.json>\n');
  process.exitCode = 1;
} else {
  try {
    const input = JSON.parse(readFileSync(inputPath, 'utf8'));
    const report = buildSafeEvolveReport(parseExperimentObservations(input));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) { // no-excuse-ok: catch -- CLI boundary converts all failures to a non-zero exit.
    process.stderr.write(`${error instanceof Error ? error.message : 'Experiment report failed.'}\n`);
    process.exitCode = 1;
  }
}
