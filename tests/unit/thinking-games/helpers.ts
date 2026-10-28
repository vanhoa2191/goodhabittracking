import { readFileSync } from 'node:fs';

export function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

export function readText(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

export function loadPilot(): unknown {
  return readJson('../../../content/thinking-games/pilot/pilot-manifest-v1.json');
}

export function loadRelease(): unknown {
  return readJson('../../../content/thinking-games/manifests/release-365-v1.json');
}

export function loadReleasePlaceholder(): unknown {
  return {
    ...(loadRelease() as Record<string, unknown>),
    items: [],
    editorialApproval: null,
    status: 'not_ready',
  };
}

export function loadEditorialCsv(): string {
  return readText('../../../docs/research/2026-10-17-daily-thinking-games-365.csv');
}

export function loadSyntheticReleaseFixture(): unknown {
  return readJson('../../../content/thinking-games/fixtures/synthetic-release-manifest-v1.json');
}

export function loadApprovedRelease(): unknown {
  return readJson('../../../content/thinking-games/manifests/synthetic-release-fixture-v1.approved.json');
}
