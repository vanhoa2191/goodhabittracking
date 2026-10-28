import { describe, expect, it } from 'vitest';
import { evaluatePerformanceBudget } from '../../scripts/check-performance-budget.mjs';

describe('performance budget', () => {
  it('fails when Next route stats include enough parent layout JavaScript to exceed the initial budget', () => {
    const result = evaluatePerformanceBudget({
      routeStats: [{
        route: '/',
        firstLoadUncompressedJsBytes: 1_900_000,
        firstLoadChunkPaths: [
          '.next/static/chunks/page.js',
          '.next/static/chunks/root-layout.js',
          '.next/static/chunks/nested-layout.js',
        ],
      }],
      chunkSizes: [
        { file: '.next/static/chunks/page.js', bytes: 100_000 },
        { file: '.next/static/chunks/root-layout.js', bytes: 900_000 },
        { file: '.next/static/chunks/nested-layout.js', bytes: 900_000 },
      ],
      budget: { maxInitialJavaScriptBytes: 1_700_000, maxSingleChunkBytes: 1_000_000 },
    });

    expect(result).toMatchObject({
      status: 'failed',
      largestInitialRoute: { route: '/', bytes: 1_900_000, files: 3 },
      allChunksBytes: 1_900_000,
      largestChunk: { bytes: 900_000 },
    });
  });

  it('deduplicates the chunk paths reported for a route', () => {
    const result = evaluatePerformanceBudget({
      routeStats: [{
        route: '/settings',
        firstLoadUncompressedJsBytes: 200,
        firstLoadChunkPaths: ['.next/static/chunks/shared.js', '.next/static/chunks/shared.js'],
      }],
      chunkSizes: [{ file: '.next/static/chunks/shared.js', bytes: 200 }],
      budget: { maxInitialJavaScriptBytes: 300, maxSingleChunkBytes: 300 },
    });

    expect(result.largestInitialRoute).toEqual({ route: '/settings', bytes: 200, files: 1 });
  });
});
