import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrandMark } from '@/components/BrandMark';

describe('BrandMark', () => {
  it('uses unique SVG paint ids when more than one mark appears on a page', () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(BrandMark), createElement(BrandMark)));
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const reference of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(reference[1]);
  });
});
