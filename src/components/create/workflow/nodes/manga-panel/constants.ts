import type { PanelRect, PageFormat, LayoutPreset } from './canvas-renderer';

// ---------------------------------------------------------------------------
// Page formats
// ---------------------------------------------------------------------------

export const PAGE_FORMATS: PageFormat[] = [
  { id: 'manga-b5', label: 'Manga B5', ratioW: 5, ratioH: 7 },
  { id: 'comic-us', label: 'US Comic', ratioW: 2, ratioH: 3 },
  { id: 'webtoon',  label: 'Webtoon',  ratioW: 1, ratioH: 2 },
  { id: 'square',   label: 'Square',   ratioW: 1, ratioH: 1 },
];

// ---------------------------------------------------------------------------
// Layout presets (portrait-oriented)
// ---------------------------------------------------------------------------

export const MANGA_LAYOUTS: LayoutPreset[] = [
  // 2-panel
  { id: '2-vert', label: '2 Vert', panelCount: 2, panels: [
    { x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 },
  ]},
  { id: '2-horiz', label: '2 Horiz', panelCount: 2, panels: [
    { x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 },
  ]},
  // 3-panel
  { id: '3-row', label: '3 Row', panelCount: 3, panels: [
    { x: 0, y: 0, w: 1, h: 0.333 }, { x: 0, y: 0.333, w: 1, h: 0.334 }, { x: 0, y: 0.667, w: 1, h: 0.333 },
  ]},
  { id: '3-t', label: 'T Shape', panelCount: 3, panels: [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ]},
  { id: '3-inv-t', label: 'Inv T', panelCount: 3, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 },
  ]},
  // 4-panel
  { id: '4-koma', label: '4 Koma', panelCount: 4, panels: [
    { x: 0, y: 0, w: 1, h: 0.25 }, { x: 0, y: 0.25, w: 1, h: 0.25 },
    { x: 0, y: 0.5, w: 1, h: 0.25 }, { x: 0, y: 0.75, w: 1, h: 0.25 },
  ]},
  { id: '4-l', label: 'L Shape', panelCount: 4, panels: [
    { x: 0, y: 0, w: 0.6, h: 1 },
    { x: 0.6, y: 0, w: 0.4, h: 0.333 }, { x: 0.6, y: 0.333, w: 0.4, h: 0.334 }, { x: 0.6, y: 0.667, w: 0.4, h: 0.333 },
  ]},
  { id: '4-std', label: 'Standard', panelCount: 4, panels: [
    { x: 0, y: 0, w: 0.55, h: 0.45 }, { x: 0.55, y: 0, w: 0.45, h: 0.45 },
    { x: 0, y: 0.45, w: 0.4, h: 0.55 }, { x: 0.4, y: 0.45, w: 0.6, h: 0.55 },
  ]},
  // 5-panel
  { id: '5-action', label: 'Action', panelCount: 5, panels: [
    { x: 0, y: 0, w: 0.65, h: 0.6 },
    { x: 0.65, y: 0, w: 0.35, h: 0.3 }, { x: 0.65, y: 0.3, w: 0.35, h: 0.3 },
    { x: 0, y: 0.6, w: 0.5, h: 0.4 }, { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
  ]},
  { id: '5-3row', label: '3 Row Mix', panelCount: 5, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.3 }, { x: 0.5, y: 0, w: 0.5, h: 0.3 },
    { x: 0, y: 0.3, w: 1, h: 0.4 },
    { x: 0, y: 0.7, w: 0.5, h: 0.3 }, { x: 0.5, y: 0.7, w: 0.5, h: 0.3 },
  ]},
  // 6-panel
  { id: '6-splash', label: 'Splash', panelCount: 6, panels: [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.333, h: 0.25 }, { x: 0.333, y: 0.5, w: 0.334, h: 0.25 }, { x: 0.667, y: 0.5, w: 0.333, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 }, { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
  ]},
  { id: '6-grid', label: '6 Grid', panelCount: 6, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.333 }, { x: 0.5, y: 0, w: 0.5, h: 0.333 },
    { x: 0, y: 0.333, w: 0.5, h: 0.334 }, { x: 0.5, y: 0.333, w: 0.5, h: 0.334 },
    { x: 0, y: 0.667, w: 0.5, h: 0.333 }, { x: 0.5, y: 0.667, w: 0.5, h: 0.333 },
  ]},
];

// ---------------------------------------------------------------------------
// Layout groups (grouped by panel count for display)
// ---------------------------------------------------------------------------

/** Group layouts by panel count for cleaner display */
export const LAYOUT_GROUPS = (() => {
  const groups: Array<{ count: number; layouts: LayoutPreset[] }> = [];
  for (const layout of MANGA_LAYOUTS) {
    const existing = groups.find((g) => g.count === layout.panelCount);
    if (existing) existing.layouts.push(layout);
    else groups.push({ count: layout.panelCount, layouts: [layout] });
  }
  return groups;
})();

// ---------------------------------------------------------------------------
// Reading order computation
// ---------------------------------------------------------------------------

export function computeReadingOrder(panels: PanelRect[], dir: string): number[] {
  const indexed = panels.map((p, i) => ({ ...p, i }));
  indexed.sort((a, b) => {
    const rowDiff = a.y - b.y;
    if (Math.abs(rowDiff) > 0.05) return rowDiff;
    return dir === 'rtl' ? b.x - a.x : a.x - b.x;
  });
  const order = new Array<number>(panels.length);
  indexed.forEach((p, sortedIdx) => { order[p.i] = sortedIdx; });
  return order;
}

// ---------------------------------------------------------------------------
// Status border/dot maps for dark shell
// ---------------------------------------------------------------------------

export const STATUS_BORDER: Record<string, string> = {
  idle: 'border-zinc-800',
  queued: 'border-yellow-500/50',
  running: 'border-blue-500/50',
  success: 'border-emerald-500/50',
  error: 'border-red-500/50',
  skipped: 'border-zinc-800 opacity-60',
};

export const STATUS_DOT: Record<string, string> = {
  idle: 'bg-zinc-600',
  queued: 'bg-yellow-400 animate-pulse',
  running: 'bg-blue-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  skipped: 'bg-zinc-600/50',
};
