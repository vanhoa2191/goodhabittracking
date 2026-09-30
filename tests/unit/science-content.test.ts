import { describe, expect, it } from 'vitest';
import { SCIENCE_PRINCIPLES, SCIENCE_SOURCES, SCIENCE_UNKNOWNS } from '@/lib/science-content';

const banned = /đảm bảo|chắc chắn|cam kết|chứng minh (?:được )?rằng|100%|hiệu quả tuyệt đối|khỏi bệnh|chữa/i;

describe('the public science page content', () => {
  it('states for every principle what the evidence says, what a parent can do and where the evidence stops', () => {
    expect(SCIENCE_PRINCIPLES.length).toBeGreaterThanOrEqual(5);
    for (const principle of SCIENCE_PRINCIPLES) {
      expect(principle.evidence.length, principle.id).toBeGreaterThan(40);
      expect(principle.action.length, principle.id).toBeGreaterThan(20);
      expect(principle.limit.length, principle.id).toBeGreaterThan(20);
      expect(principle.sourceIds.length, principle.id).toBeGreaterThan(0);
      for (const sourceId of principle.sourceIds) expect(SCIENCE_SOURCES.some((source) => source.id === sourceId), `${principle.id} ${sourceId}`).toBe(true);
    }
  });

  it('never promises a result for a child', () => {
    const text = [
      ...SCIENCE_PRINCIPLES.flatMap((principle) => [principle.title, principle.evidence, principle.action, principle.limit]),
      ...SCIENCE_UNKNOWNS,
    ].join('\n');
    expect(text).not.toMatch(banned);
  });

  it('admits what is not known yet, and keeps every source citable', () => {
    expect(SCIENCE_UNKNOWNS.length).toBeGreaterThanOrEqual(3);
    for (const source of SCIENCE_SOURCES) {
      expect(source.citation, source.id).toMatch(/\d{4}/);
      expect(source.doi ?? '', source.id).toMatch(/^(10\.\d{4,9}\/\S+)?$/);
    }
    expect(new Set(SCIENCE_SOURCES.map((source) => source.id)).size).toBe(SCIENCE_SOURCES.length);
  });
});
