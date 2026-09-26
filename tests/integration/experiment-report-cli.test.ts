import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Safe versus Evolve report CLI', () => {
  it('emits an aggregate report without participant identifiers', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kidhabit-experiment-'));
    const input = join(directory, 'observations.json');
    writeFileSync(input, JSON.stringify([
      { participantKey: 'opaque-participant-01', arm: 'safe', exposed: true, sessions: [{ durationSeconds: 180, completedTasks: 2 }] },
      { participantKey: 'opaque-participant-02', arm: 'evolve', exposed: true, sessions: [{ durationSeconds: 240, completedTasks: 3 }] },
    ]));

    const output = execFileSync('npm', ['run', '--silent', 'report:experiment', '--', input], { encoding: 'utf8' });
    const report: unknown = JSON.parse(output);

    expect(report).toMatchObject({
      status: 'continue_observation',
      sample: { total: 2, safe: 1, evolve: 1 },
      northStar: { tasksPerSession: { safe: 2, evolve: 3 } },
    });
    expect(output).not.toContain('opaque-participant');
  });
});
