// Validation script for batch-05 items
// Run with: node validate.js
/* eslint-disable @typescript-eslint/no-require-imports */

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'ES2020',
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    moduleResolution: 'node',
  },
});

const { validatePuzzle, solvePuzzle, checkAnswer } = require('./src/lib/thinking-games/checkers.ts');

const data = JSON.parse(require('fs').readFileSync('./content/thinking-games/candidates/365-v2/batch-05-days-274-365.json', 'utf8'));
const items = data.items.filter(item => item.ageTrack === 'age_6_8' || item.ageTrack === 'age_9_12');

console.log(`Validating ${items.length} in-scope items...`);

const results = [];

for (const item of items) {
  const validation = validatePuzzle(item);
  const solved = solvePuzzle(item);
  const checked = checkAnswer(item, item.solution);
  
  results.push({
    id: item.id,
    dayIndex: item.dayIndex,
    slotType: item.slotType,
    ageTrack: item.ageTrack,
    gameTypeId: item.gameTypeId,
    ruleVariantId: item.ruleVariantId,
    validation: validation,
    solved: solved,
    checked: checked,
    solution: item.solution,
  });
  
  if (!validation.ok) {
    console.log(`FAIL ${item.id}: ${validation.details?.join('; ')}`);
  } else if (!checked.correct) {
    console.log(`SOLUTION MISMATCH ${item.id}: solution doesn't pass checker`);
  } else if (solved.ok && JSON.stringify(solved.solution) !== JSON.stringify(item.solution)) {
    console.log(`SOLUTION DIFFERS ${item.id}: solver gives ${JSON.stringify(solved.solution)}, item has ${JSON.stringify(item.solution)}`);
  }
}

const failed = results.filter(r => !r.validation.ok);
const solutionMismatch = results.filter(r => r.validation.ok && !r.checked.correct);
const solutionDiffers = results.filter(r => r.solved.ok && JSON.stringify(r.solved.solution) !== JSON.stringify(r.solution));

console.log(`\nSummary:`);
console.log(`  Total: ${results.length}`);
console.log(`  Validation failed: ${failed.length}`);
console.log(`  Solution mismatch (checker): ${solutionMismatch.length}`);
console.log(`  Solution differs from solver: ${solutionDiffers.length}`);

require('fs').writeFileSync('./validation-results.json', JSON.stringify(results, null, 2));
console.log('\nResults written to ./validation-results.json');