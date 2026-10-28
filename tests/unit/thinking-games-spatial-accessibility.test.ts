import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SpatialRotationGame } from '@/components/thinking-games/SpatialRotationGame';
import { SpatialSilhouetteGame } from '@/components/thinking-games/SpatialSilhouetteGame';
import { describeCellGrid } from '@/components/thinking-games/game-utils';

const shape = [{ x: 0, y: 0 }, { x: 0, y: 1 }];
const options = [
  { id: 'a', cells: shape },
  { id: 'b', cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }] },
];
describe('spatial puzzle accessible representations', () => {
  it('describes grid dimensions, coordinate origin, and each filled cell', () => {
    expect(describeCellGrid([...shape].reverse(), 4, 5)).toBe('Lưới 5 hàng, 4 cột, tính từ góc trên bên trái. Ô tô đậm: hàng 1 cột 1; hàng 2 cột 1.');
  });

  it.each(['rotation', 'silhouette'])('exposes original and distinct option content for %s', (mechanic) => {
    const props = { ageTrack: 'age_6_8' as const, onSubmit: () => undefined };
    const html = mechanic === 'rotation'
      ? renderToStaticMarkup(createElement(SpatialRotationGame, { ...props, board: { kind: 'spatial-rotation', shape, turn: 'quarter', options } }))
      : renderToStaticMarkup(createElement(SpatialSilhouetteGame, { ...props, board: { kind: 'spatial-silhouette', target: shape, options } }));
    expect(html.match(/role="img"/g)).toHaveLength(3);
    expect(html).toContain(`aria-label="${describeCellGrid(shape, 4, 4)}"`);
    expect(html).toContain(`aria-label="Lựa chọn 1: ${describeCellGrid(shape, 4, 4)}"`);
    expect(html).toContain(`aria-label="Lựa chọn 2: ${describeCellGrid(options[1].cells, 4, 4)}"`);
  });
});
