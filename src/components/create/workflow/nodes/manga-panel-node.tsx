'use client';

import * as React from 'react';
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import { SOCKET_COLORS as socketColors } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PanelRect { x: number; y: number; w: number; h: number }
interface LayoutPreset { id: string; label: string; panelCount: number; panels: PanelRect[] }
interface PageFormat { id: string; label: string; ratioW: number; ratioH: number }
interface PanelTransform { offsetX: number; offsetY: number; scale: number }

type BubbleType = 'speech' | 'thought' | 'shout' | 'narration' | 'whisper';
type TailDirection = 'bottom-left' | 'bottom-right' | 'none';

interface SpeechBubble {
  id: string;
  panelIndex: number;
  type: BubbleType;
  text: string;
  position: string;
  freePosition?: { nx: number; ny: number };
  tailDirection: TailDirection;
  fontSize: number;
}

// ---------------------------------------------------------------------------
// Page formats
// ---------------------------------------------------------------------------

const PAGE_FORMATS: PageFormat[] = [
  { id: 'manga-b5', label: 'Manga B5', ratioW: 5, ratioH: 7 },
  { id: 'comic-us', label: 'US Comic', ratioW: 2, ratioH: 3 },
  { id: 'webtoon',  label: 'Webtoon',  ratioW: 1, ratioH: 2 },
  { id: 'square',   label: 'Square',   ratioW: 1, ratioH: 1 },
];

// ---------------------------------------------------------------------------
// Layout presets (portrait-oriented)
// ---------------------------------------------------------------------------

const MANGA_LAYOUTS: LayoutPreset[] = [
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
// Bubble position grid (3x3)
// ---------------------------------------------------------------------------

const BUBBLE_POS: Record<string, { nx: number; ny: number }> = {
  '0': { nx: 0.2, ny: 0.2 }, '1': { nx: 0.5, ny: 0.2 }, '2': { nx: 0.8, ny: 0.2 },
  '3': { nx: 0.2, ny: 0.5 }, '4': { nx: 0.5, ny: 0.5 }, '5': { nx: 0.8, ny: 0.5 },
  '6': { nx: 0.2, ny: 0.8 }, '7': { nx: 0.5, ny: 0.8 }, '8': { nx: 0.8, ny: 0.8 },
};

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export const mangaPanelDefinition: WorkflowNodeDefinition = {
  type: 'mangaPanel',
  label: 'Manga Panel',
  category: 'output',
  description: 'Compose manga pages with panel layouts and speech bubbles',
  icon: 'BookOpen',
  inputs: [
    { id: 'panel_1', label: 'Panel 1', type: 'image', required: true },
    { id: 'panel_2', label: 'Panel 2', type: 'image' },
    { id: 'panel_3', label: 'Panel 3', type: 'image' },
    { id: 'panel_4', label: 'Panel 4', type: 'image' },
    { id: 'panel_5', label: 'Panel 5', type: 'image' },
    { id: 'panel_6', label: 'Panel 6', type: 'image' },
  ],
  outputs: [{ id: 'image', label: 'Page', type: 'image' }],
  defaultConfig: {
    layoutPreset: '4-koma',
    pageFormat: 'manga-b5',
    gutterWidth: 8,
    borderWidth: 3,
    borderColor: '#000000',
    gutterColor: '#ffffff',
    readingOrder: 'rtl',
    bubbles: [],
    panelImages: {},
    panelTransforms: {},
    outputSize: 1024,
  },
  minWidth: 720,
};

// ---------------------------------------------------------------------------
// Canvas bubble drawing helpers
// ---------------------------------------------------------------------------

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.15 : cx + bw * 0.15;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.3 : cx + bw * 0.3;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.06, cy + bh * 0.4);
    ctx.lineTo(tipX, cy + bh * 0.7);
    ctx.lineTo(baseX + bw * 0.06, cy + bh * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, bw / 2 - 1, bh / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

function drawThoughtBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  const bumps = 10;
  const rx = bw / 2;
  const ry = bh / 2;
  const br = Math.min(rx, ry) * 0.4;
  const circles: Array<{ x: number; y: number; r: number }> = [];

  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    circles.push({ x: cx + rx * 0.75 * Math.cos(a), y: cy + ry * 0.75 * Math.sin(a), r: br });
  }

  ctx.fillStyle = '#ffffff';
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke(); }

  ctx.fillStyle = '#ffffff';
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r - 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2); ctx.fill();

  if (tail !== 'none') {
    const dx = tail === 'bottom-left' ? -1 : 1;
    const sizes = [br * 0.4, br * 0.28, br * 0.18];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + dx * (bw * 0.2 + i * bw * 0.08), cy + bh * 0.5 + i * bh * 0.1, sizes[i], 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}

function drawShoutBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  const spikes = 14;
  const outerRx = bw / 2;
  const outerRy = bh / 2;
  const innerRx = outerRx * 0.78;
  const innerRy = outerRy * 0.78;

  const drawSpiky = (shrink: number) => {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const isO = i % 2 === 0;
      const px = cx + ((isO ? outerRx : innerRx) - shrink) * Math.cos(a);
      const py = cy + ((isO ? outerRy : innerRy) - shrink) * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  drawSpiky(0);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.stroke();

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.1 : cx + bw * 0.1;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.35 : cx + bw * 0.35;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.04, cy + bh * 0.35);
    ctx.lineTo(tipX, cy + bh * 0.75);
    ctx.lineTo(baseX + bw * 0.04, cy + bh * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.stroke();
    drawSpiky(3);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

function drawNarrationBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, _tail: TailDirection): void {
  const r = Math.min(bw, bh) * 0.1;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, r);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
}

function drawWhisperBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
  ctx.setLineDash([]);

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.15 : cx + bw * 0.15;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.3 : cx + bw * 0.3;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.06, cy + bh * 0.4);
    ctx.lineTo(tipX, cy + bh * 0.7);
    ctx.lineTo(baseX + bw * 0.06, cy + bh * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, bw / 2 - 1, bh / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

const BUBBLE_DRAW: Record<BubbleType, typeof drawSpeechBubble> = {
  speech: drawSpeechBubble, thought: drawThoughtBubble, shout: drawShoutBubble,
  narration: drawNarrationBubble, whisper: drawWhisperBubble,
};

function drawBubbleOnCanvas(
  ctx: CanvasRenderingContext2D,
  bubble: SpeechBubble,
  pr: { px: number; py: number; pw: number; ph: number },
): void {
  const pos = bubble.freePosition ?? BUBBLE_POS[bubble.position] ?? { nx: 0.5, ny: 0.2 };
  const cx = pr.px + pos.nx * pr.pw;
  const cy = pr.py + pos.ny * pr.ph;
  const fs = bubble.fontSize || 16;
  const isShout = bubble.type === 'shout';
  const isWhisper = bubble.type === 'whisper';

  ctx.font = `${isShout ? 'bold ' : ''}${isWhisper ? Math.round(fs * 0.85) : fs}px "Comic Sans MS", sans-serif`;
  const maxTW = pr.pw * 0.4;
  const lines = wrapText(ctx, bubble.text || ' ', maxTW);
  const lh = fs * 1.3;
  const tbh = lines.length * lh;
  const tbw = Math.max(...lines.map((l) => ctx.measureText(l).width), fs * 2);
  const padX = fs * 1.2;
  const padY = fs * 0.8;
  const bw = tbw + padX * 2;
  const bh = tbh + padY * 2;

  BUBBLE_DRAW[bubble.type](ctx, cx, cy, bw, bh, bubble.tailDirection);

  ctx.fillStyle = '#000000';
  ctx.font = `${isShout ? 'bold ' : ''}${isWhisper ? Math.round(fs * 0.85) : fs}px "Comic Sans MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const startY = cy - tbh / 2 + lh / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, startY + i * lh);
  }
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const mangaPanelExecutor: NodeExecutor = async (inputs, config) => {
  const presetId = (config.layoutPreset as string) || '4-koma';
  const preset = MANGA_LAYOUTS.find((p) => p.id === presetId) ?? MANGA_LAYOUTS[0];
  const formatId = (config.pageFormat as string) || 'manga-b5';
  const format = PAGE_FORMATS.find((f) => f.id === formatId) ?? PAGE_FORMATS[0];

  const panelImages = (config.panelImages as Record<string, string>) ?? {};
  const srcs: (string | undefined)[] = [];
  for (let i = 0; i < preset.panelCount; i++) {
    const k = `panel_${i + 1}`;
    srcs.push((inputs[k] as string | undefined) || panelImages[k] || undefined);
  }
  if (!srcs[0]) throw new Error('Panel 1 image is required');

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src.slice(0, 50)}`));
      img.src = src;
    });

  const loaded = await Promise.all(srcs.map((s) => (s ? loadImg(s) : Promise.resolve(null))));

  const outSize = (config.outputSize as number) || 1024;
  let cW: number;
  let cH: number;
  if (format.ratioW >= format.ratioH) {
    cW = outSize;
    cH = Math.round(outSize * (format.ratioH / format.ratioW));
  } else {
    cH = outSize;
    cW = Math.round(outSize * (format.ratioW / format.ratioH));
  }

  const canvas = document.createElement('canvas');
  canvas.width = cW;
  canvas.height = cH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = (config.gutterColor as string) || '#ffffff';
  ctx.fillRect(0, 0, cW, cH);

  const gw = (config.gutterWidth as number) ?? 8;
  const bw = (config.borderWidth as number) ?? 3;
  const bc = (config.borderColor as string) || '#000000';
  const transforms = (config.panelTransforms as Record<string, PanelTransform>) ?? {};

  const rects: Array<{ px: number; py: number; pw: number; ph: number }> = [];

  for (let i = 0; i < preset.panels.length; i++) {
    const p = preset.panels[i];
    const px = Math.round(p.x * cW) + gw / 2;
    const py = Math.round(p.y * cH) + gw / 2;
    const pw = Math.round(p.w * cW) - gw;
    const ph = Math.round(p.h * cH) - gw;
    rects.push({ px, py, pw, ph });
    if (pw <= 0 || ph <= 0) continue;

    const img = loaded[i];
    if (img) {
      ctx.save();
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      const t = transforms[String(i)] ?? { offsetX: 0, offsetY: 0, scale: 1 };
      const baseScale = Math.max(pw / img.width, ph / img.height);
      const adjustedScale = baseScale * (t.scale || 1);
      const sw = pw / adjustedScale;
      const sh = ph / adjustedScale;
      const sx = (img.width - sw) / 2 - (t.offsetX || 0);
      const sy = (img.height - sh) / 2 - (t.offsetY || 0);
      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
      ctx.restore();
    }

    if (bw > 0) {
      ctx.save(); ctx.strokeStyle = bc; ctx.lineWidth = bw;
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();
    }
  }

  // Draw bubbles
  const bubbles = (config.bubbles as SpeechBubble[]) ?? [];
  for (const b of bubbles) {
    if (b.panelIndex < 0 || b.panelIndex >= rects.length || !b.text?.trim()) continue;
    const r = rects[b.panelIndex];
    if (r.pw <= 0) continue;
    drawBubbleOnCanvas(ctx, b, r);
  }

  return {
    image: canvas.toDataURL('image/jpeg', 0.92),
    _panelSources: srcs,
  };
};

// ---------------------------------------------------------------------------
// Component helpers
// ---------------------------------------------------------------------------

function dispatchConfig(nodeId: string, config: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('workflow-node-config', { detail: { nodeId, config } }));
}

function computeReadingOrder(panels: PanelRect[], dir: string): number[] {
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

const BUBBLE_TYPES: Array<{ type: BubbleType; label: string }> = [
  { type: 'speech', label: 'Speech' },
  { type: 'thought', label: 'Thought' },
  { type: 'shout', label: 'Shout' },
  { type: 'narration', label: 'Narrate' },
  { type: 'whisper', label: 'Whisper' },
];

/** Group layouts by panel count for cleaner display */
const LAYOUT_GROUPS = (() => {
  const groups: Array<{ count: number; layouts: LayoutPreset[] }> = [];
  for (const layout of MANGA_LAYOUTS) {
    const existing = groups.find((g) => g.count === layout.panelCount);
    if (existing) existing.layouts.push(layout);
    else groups.push({ count: layout.panelCount, layouts: [layout] });
  }
  return groups;
})();

// ---------------------------------------------------------------------------
// Status border/dot maps for dark shell
// ---------------------------------------------------------------------------

const STATUS_BORDER: Record<string, string> = {
  idle: 'border-zinc-800',
  queued: 'border-yellow-500/50',
  running: 'border-blue-500/50',
  success: 'border-emerald-500/50',
  error: 'border-red-500/50',
  skipped: 'border-zinc-800 opacity-60',
};

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-zinc-600',
  queued: 'bg-yellow-400 animate-pulse',
  running: 'bg-blue-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  skipped: 'bg-zinc-600/50',
};

// ---------------------------------------------------------------------------
// BubbleCard sub-component (dark theme)
// ---------------------------------------------------------------------------

interface BubbleCardProps {
  bubble: SpeechBubble;
  maxPanel: number;
  onUpdate: (b: SpeechBubble) => void;
  onDelete: () => void;
}

function BubbleCard({ bubble, maxPanel, onUpdate, onDelete }: BubbleCardProps) {
  const set = <K extends keyof SpeechBubble>(k: K, v: SpeechBubble[K]) =>
    onUpdate({ ...bubble, [k]: v });

  const setGridPosition = (pos: string) => {
    onUpdate({ ...bubble, position: pos, freePosition: undefined });
  };

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-2 space-y-1.5">
      {/* Panel selector + delete */}
      <div className="flex items-center justify-between">
        <select
          value={bubble.panelIndex}
          onChange={(e) => set('panelIndex', Number(e.target.value))}
          className="text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-200 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label="Panel"
        >
          {Array.from({ length: maxPanel + 1 }, (_, i) => (
            <option key={i} value={i}>Panel {i + 1}</option>
          ))}
        </select>
        <button type="button" onClick={onDelete} className="text-[10px] text-zinc-500 hover:text-red-400 px-1 rounded hover:bg-red-500/10 transition-colors" aria-label="Delete bubble">
          Remove
        </button>
      </div>

      {/* Bubble type */}
      <div className="flex gap-0.5">
        {BUBBLE_TYPES.map((bt) => (
          <button
            key={bt.type}
            type="button"
            onClick={() => set('type', bt.type)}
            className={cn(
              'flex-1 px-1 py-0.5 rounded text-[9px] transition-colors text-center',
              bubble.type === bt.type ? 'bg-violet-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700',
            )}
            aria-label={`Bubble type: ${bt.label}`}
            aria-pressed={bubble.type === bt.type}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={bubble.text}
        onChange={(e) => set('text', e.target.value)}
        rows={2}
        placeholder="Type dialogue..."
        className="w-full text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 px-1.5 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        aria-label="Bubble text"
      />

      {/* Position grid + tail + font size */}
      <div className="flex items-start gap-3">
        {/* 3x3 position grid */}
        <div>
          <span className="text-[9px] text-zinc-500 block mb-0.5">Position</span>
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGridPosition(String(i))}
                className={cn(
                  'size-3.5 rounded-full transition-colors',
                  !bubble.freePosition && bubble.position === String(i) ? 'bg-violet-500' : 'bg-zinc-600/40 hover:bg-zinc-500/50',
                )}
                aria-label={`Position ${i}`}
                aria-pressed={!bubble.freePosition && bubble.position === String(i)}
              />
            ))}
          </div>
          {bubble.freePosition && (
            <span className="text-[8px] text-violet-400 mt-0.5 block">Custom</span>
          )}
        </div>

        {/* Tail + font size stacked */}
        <div className="flex-1 space-y-1.5">
          <div>
            <span className="text-[9px] text-zinc-500 block mb-0.5" title="Tail Direction">Tail</span>
            <div className="flex gap-0.5">
              {([
                { dir: 'bottom-left' as const, icon: '\u2199', label: 'Left' },
                { dir: 'bottom-right' as const, icon: '\u2198', label: 'Right' },
                { dir: 'none' as const, icon: '\u2014', label: 'None' },
              ]).map((td) => (
                <button
                  key={td.dir}
                  type="button"
                  onClick={() => set('tailDirection', td.dir)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] transition-colors',
                    bubble.tailDirection === td.dir ? 'bg-violet-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700',
                  )}
                  aria-label={`Tail: ${td.label}`}
                  aria-pressed={bubble.tailDirection === td.dir}
                >
                  {td.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">Size</span>
            <input
              type="range" min={12} max={32} value={bubble.fontSize}
              onChange={(e) => set('fontSize', Number(e.target.value))}
              className="flex-1 h-1 accent-violet-500" aria-label="Font size"
            />
            <span className="text-[9px] text-zinc-400 w-6 text-right font-mono">{bubble.fontSize}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive Panel Preview (draggable images + bubbles after execution)
// ---------------------------------------------------------------------------

interface InteractivePanelProps {
  panelIndex: number;
  panel: PanelRect;
  panelSource?: string;
  transform: PanelTransform;
  bubbles: SpeechBubble[];
  gutterWidth: number;
  borderWidth: number;
  borderColor: string;
  readingOrder: string;
  readOrderNum: number;
  onTransformChange: (t: PanelTransform) => void;
  onBubbleDrag: (bubbleId: string, nx: number, ny: number) => void;
}

function InteractivePanel({
  panelIndex, panel, panelSource, transform, bubbles, gutterWidth,
  borderWidth, borderColor, readingOrder, readOrderNum,
  onTransformChange, onBubbleDrag,
}: InteractivePanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<{ type: 'image' | 'bubble'; bubbleId?: string; startX: number; startY: number; startOx: number; startOy: number } | null>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent, type: 'image' | 'bubble', bubbleId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startOx = type === 'image' ? transform.offsetX : 0;
    const startOy = type === 'image' ? transform.offsetY : 0;
    setDragging({ type, bubbleId, startX: e.clientX, startY: e.clientY, startOx, startOy });
  }, [transform.offsetX, transform.offsetY]);

  React.useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      if (dragging.type === 'image') {
        onTransformChange({ ...transform, offsetX: dragging.startOx + dx * 0.5, offsetY: dragging.startOy + dy * 0.5 });
      } else if (dragging.type === 'bubble' && dragging.bubbleId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const nx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
        const ny = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
        onBubbleDrag(dragging.bubbleId, nx, ny);
      }
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, transform, onTransformChange, onBubbleDrag]);

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(3, (transform.scale || 1) + delta));
    onTransformChange({ ...transform, scale: newScale });
  }, [transform, onTransformChange]);

  return (
    <div
      ref={containerRef}
      className="absolute overflow-hidden"
      style={{
        left: `${panel.x * 100}%`, top: `${panel.y * 100}%`,
        width: `${panel.w * 100}%`, height: `${panel.h * 100}%`,
        padding: `${Math.max(gutterWidth / 4, 1)}px`,
      }}
    >
      <div
        className={cn('w-full h-full relative overflow-hidden', panelSource && 'cursor-grab', dragging?.type === 'image' && 'cursor-grabbing')}
        style={{ border: `${Math.max(borderWidth / 4, 1)}px solid ${borderColor}` }}
        onMouseDown={panelSource ? (e) => handleMouseDown(e, 'image') : undefined}
        onWheel={panelSource ? handleWheel : undefined}
      >
        {panelSource ? (
          <img
            src={panelSource}
            alt={`Panel ${panelIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{
              transform: `translate(${(transform.offsetX || 0) * 0.1}%, ${(transform.offsetY || 0) * 0.1}%) scale(${transform.scale || 1})`,
              transformOrigin: 'center',
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800/40">
            <span className="text-[10px] text-zinc-500 font-mono">{panelIndex + 1}</span>
          </div>
        )}

        {/* Reading order badge */}
        <span
          className="absolute text-[7px] font-bold text-violet-400/70 z-10"
          style={{ [readingOrder === 'rtl' ? 'right' : 'left']: '2px', top: '1px' }}
        >
          {readOrderNum + 1}
        </span>

        {/* Draggable bubble dots */}
        {bubbles.map((b) => {
          const pos = b.freePosition ?? BUBBLE_POS[b.position] ?? { nx: 0.5, ny: 0.2 };
          return (
            <div
              key={b.id}
              className="absolute size-3 rounded-full bg-white/90 border-2 border-violet-500 cursor-move z-20 hover:scale-125 transition-transform"
              style={{ left: `${pos.nx * 100}%`, top: `${pos.ny * 100}%`, transform: 'translate(-50%,-50%)' }}
              onMouseDown={(e) => handleMouseDown(e, 'bubble', b.id)}
              title={`${b.type}: "${b.text.slice(0, 20)}${b.text.length > 20 ? '...' : ''}"`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MangaPanelNodeProps { data: WorkflowNodeData; id: string; selected?: boolean }

export function MangaPanelNode({ data, id, selected }: MangaPanelNodeProps) {
  const config = data.config;
  const status = data.status ?? 'idle';
  const outputImage = data.outputValues?.image as string | undefined;
  const panelSources = data.outputValues?._panelSources as (string | undefined)[] | undefined;

  const layoutPreset = (config.layoutPreset as string) || '4-koma';
  const pageFormat = (config.pageFormat as string) || 'manga-b5';
  const gutterWidth = (config.gutterWidth as number) ?? 8;
  const borderWidth = (config.borderWidth as number) ?? 3;
  const borderColor = (config.borderColor as string) || '#000000';
  const gutterColor = (config.gutterColor as string) || '#ffffff';
  const readingOrder = (config.readingOrder as string) || 'rtl';
  const bubbles = (config.bubbles as SpeechBubble[]) ?? [];
  const outputSize = (config.outputSize as number) || 1024;
  const panelTransforms = (config.panelTransforms as Record<string, PanelTransform>) ?? {};

  const activePreset = MANGA_LAYOUTS.find((p) => p.id === layoutPreset) ?? MANGA_LAYOUTS[0];
  const activeFormat = PAGE_FORMATS.find((f) => f.id === pageFormat) ?? PAGE_FORMATS[0];
  const readOrder = computeReadingOrder(activePreset.panels, readingOrder);

  const update = (key: string, value: unknown) => dispatchConfig(id, { ...config, [key]: value });

  const addBubble = () => {
    const b: SpeechBubble = {
      id: crypto.randomUUID(), panelIndex: 0, type: 'speech', text: '',
      position: '1', tailDirection: 'bottom-left', fontSize: 16,
    };
    update('bubbles', [...bubbles, b]);
  };
  const updateBubble = (updated: SpeechBubble) =>
    update('bubbles', bubbles.map((b) => (b.id === updated.id ? updated : b)));
  const deleteBubble = (bid: string) =>
    update('bubbles', bubbles.filter((b) => b.id !== bid));

  const handlePanelTransformChange = (panelIdx: number, t: PanelTransform) => {
    update('panelTransforms', { ...panelTransforms, [String(panelIdx)]: t });
  };

  const handleBubbleDrag = (bubbleId: string, nx: number, ny: number) => {
    update('bubbles', bubbles.map((b) =>
      b.id === bubbleId ? { ...b, freePosition: { nx, ny } } : b
    ));
  };

  const handleRecompose = () => {
    window.dispatchEvent(new CustomEvent('workflow-recompose-node', { detail: { nodeId: id } }));
  };

  const hasEditablePreview = status === 'success' && panelSources && panelSources.some(Boolean);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'relative rounded-xl bg-zinc-950 shadow-2xl border-2 overflow-hidden transition-all',
          STATUS_BORDER[status] || 'border-zinc-800',
          selected && status === 'idle' && 'border-violet-500 ring-2 ring-violet-500/20',
        )}
        style={{ width: 720, maxWidth: 800 }}
        role="application"
        aria-label="Manga Editor"
      >
        {/* Input handles — distributed along left edge with visible labels */}
        {mangaPanelDefinition.inputs.map((socket, index) => {
          const topOffset = 60 + index * 28;
          return (
            <Tooltip key={`in-${socket.id}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute flex items-center gap-1.5"
                  style={{ left: 8, top: topOffset }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: socketColors[socket.type] }}
                  >
                    {socket.label}
                    {socket.required && <span className="text-red-400 ml-0.5">*</span>}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {socket.label} ({socket.type})
              </TooltipContent>
              <Handle
                type="target"
                position={Position.Left}
                id={`in-${socket.id}`}
                className="!w-3 !h-3 !rounded-full !border-2 !border-zinc-950 transition-colors"
                style={{
                  backgroundColor: socketColors[socket.type],
                  top: topOffset + 4,
                  left: -6,
                }}
              />
            </Tooltip>
          );
        })}

        {/* Output handle — right edge with visible label */}
        {mangaPanelDefinition.outputs.map((socket, index) => {
          const topOffset = 60 + index * 28;
          return (
            <Tooltip key={`out-${socket.id}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute flex items-center gap-1.5"
                  style={{ right: 8, top: topOffset }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: socketColors[socket.type] }}
                  >
                    {socket.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {socket.label} ({socket.type})
              </TooltipContent>
              <Handle
                type="source"
                position={Position.Right}
                id={`out-${socket.id}`}
                className="!w-3 !h-3 !rounded-full !border-2 !border-zinc-950 transition-colors"
                style={{
                  backgroundColor: socketColors[socket.type],
                  top: topOffset + 4,
                  right: -6,
                }}
              />
            </Tooltip>
          );
        })}

        {/* ── Titlebar ── */}
        <div className="flex items-center gap-2.5 px-3 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="size-2.5 rounded-full bg-red-500/70" />
            <div className="size-2.5 rounded-full bg-yellow-500/70" />
            <div className="size-2.5 rounded-full bg-green-500/70" />
          </div>
          <Separator orientation="vertical" className="!h-3.5 !bg-zinc-700" />
          <BookOpen className="size-3.5 text-zinc-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-zinc-200 tracking-wide truncate flex-1">
            Manga Editor
          </span>
          {/* Status text */}
          {status !== 'idle' && (
            <span className="text-[9px] text-zinc-500 mr-1">
              {status === 'running' && 'Compositing\u2026'}
              {status === 'queued' && 'Queued\u2026'}
              {status === 'success' && 'Ready'}
              {status === 'skipped' && 'Skipped'}
            </span>
          )}
          <div
            className={cn('size-2 rounded-full flex-shrink-0', STATUS_DOT[status] || 'bg-zinc-600')}
            aria-label={`Status: ${status}`}
          />
        </div>

        {/* ── Horizontal body: Preview | Controls ── */}
        <div
          className="flex nodrag nowheel"
          style={{ minHeight: 280, marginTop: mangaPanelDefinition.inputs.length * 28 }}
        >
          {/* ── Left: Preview Canvas ── */}
          <div className="flex-1 min-w-0 p-2.5 flex flex-col border-r border-zinc-800">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              {hasEditablePreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="relative rounded-lg border border-zinc-700/50 overflow-hidden bg-zinc-900 w-full"
                    style={{ aspectRatio: `${activeFormat.ratioW}/${activeFormat.ratioH}`, maxHeight: '100%', backgroundColor: gutterColor }}
                  >
                    {activePreset.panels.map((panel, i) => (
                      <InteractivePanel
                        key={i}
                        panelIndex={i}
                        panel={panel}
                        panelSource={panelSources?.[i]}
                        transform={panelTransforms[String(i)] ?? { offsetX: 0, offsetY: 0, scale: 1 }}
                        bubbles={bubbles.filter((b) => b.panelIndex === i)}
                        gutterWidth={gutterWidth}
                        borderWidth={borderWidth}
                        borderColor={borderColor}
                        readingOrder={readingOrder}
                        readOrderNum={readOrder[i]}
                        onTransformChange={(t) => handlePanelTransformChange(i, t)}
                        onBubbleDrag={handleBubbleDrag}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleRecompose}
                    className="absolute bottom-1 right-1 flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600/80 hover:bg-violet-600 text-white text-[9px] font-medium backdrop-blur-sm transition-colors"
                    aria-label="Recompose with adjusted transforms"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    Recompose
                  </button>
                </div>
              ) : status === 'success' && outputImage ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900 w-full">
                  <img src={outputImage} alt="Manga page preview" className="w-full object-contain" draggable={false} />
                </div>
              ) : (
                <div
                  className="relative rounded-lg border border-zinc-700/50 overflow-hidden bg-zinc-900 w-full"
                  style={{ aspectRatio: `${activeFormat.ratioW}/${activeFormat.ratioH}`, backgroundColor: gutterColor }}
                >
                  {activePreset.panels.map((panel, i) => (
                    <div key={i} className="absolute overflow-hidden flex items-center justify-center"
                      style={{ left: `${panel.x * 100}%`, top: `${panel.y * 100}%`, width: `${panel.w * 100}%`, height: `${panel.h * 100}%`, padding: `${Math.max(gutterWidth / 4, 1)}px` }}
                    >
                      <div className="w-full h-full relative flex items-center justify-center bg-zinc-800/40"
                        style={{ border: `${Math.max(borderWidth / 4, 1)}px solid ${borderColor}` }}
                      >
                        <span className="text-[10px] text-zinc-500 font-mono">{i + 1}</span>
                        <span
                          className="absolute text-[7px] font-bold text-violet-400/70"
                          style={{ [readingOrder === 'rtl' ? 'right' : 'left']: '2px', top: '1px' }}
                        >
                          {readOrder[i] + 1}
                        </span>
                        {bubbles.filter((b) => b.panelIndex === i).map((b) => {
                          const pos = b.freePosition ?? BUBBLE_POS[b.position] ?? { nx: 0.5, ny: 0.2 };
                          return (
                            <div key={b.id} className="absolute size-2 rounded-full bg-white/80 border border-zinc-500"
                              style={{ left: `${pos.nx * 100}%`, top: `${pos.ny * 100}%`, transform: 'translate(-50%,-50%)' }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Layout strip — sits below preview */}
            <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1">
              {LAYOUT_GROUPS.map((group) => (
                <div key={group.count} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 w-3 text-right flex-shrink-0 font-mono">{group.count}</span>
                  <div className="flex gap-1 flex-wrap">
                    {group.layouts.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => update('layoutPreset', preset.id)}
                        className={cn(
                          'w-6 h-8 rounded border transition-all flex-shrink-0 relative overflow-hidden',
                          layoutPreset === preset.id
                            ? 'border-violet-500 ring-1 ring-violet-500/30 bg-violet-500/10'
                            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50',
                        )}
                        title={preset.label}
                        aria-label={`Layout: ${preset.label}`}
                      >
                        <svg viewBox="0 0 5 7" className="w-full h-full" preserveAspectRatio="none">
                          {preset.panels.map((p, i) => (
                            <rect key={i} x={p.x * 5 + 0.15} y={p.y * 7 + 0.15} width={p.w * 5 - 0.3} height={p.h * 7 - 0.3}
                              className={layoutPreset === preset.id ? 'fill-violet-500/40' : 'fill-zinc-500/30'} rx={0.2}
                            />
                          ))}
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Controls panel ── */}
          <div className="w-[280px] flex-shrink-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2.5">
                <Tabs defaultValue="style" className="w-full">
                  <TabsList className="w-full h-7 bg-zinc-800/60 rounded-lg p-0.5">
                    <TabsTrigger
                      value="style"
                      className="flex-1 h-6 text-[10px] font-medium rounded-md data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 data-[state=active]:shadow-none data-[state=inactive]:text-zinc-400 data-[state=inactive]:bg-transparent"
                    >
                      Style
                    </TabsTrigger>
                    <TabsTrigger
                      value="bubbles"
                      className="flex-1 h-6 text-[10px] font-medium rounded-md data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 data-[state=active]:shadow-none data-[state=inactive]:text-zinc-400 data-[state=inactive]:bg-transparent"
                    >
                      Bubbles{bubbles.length > 0 ? ` (${bubbles.length})` : ''}
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Style Tab ── */}
                  <TabsContent value="style" className="mt-2 space-y-2.5">
                    {/* Format */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Format</span>
                      <div className="grid grid-cols-2 gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
                        {PAGE_FORMATS.map((f) => (
                          <button
                            key={f.id} type="button"
                            onClick={() => update('pageFormat', f.id)}
                            className={cn(
                              'px-1.5 py-1 rounded-md text-[9px] font-medium transition-colors text-center',
                              pageFormat === f.id ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-300',
                            )}
                            aria-label={`Format: ${f.label}`}
                            aria-pressed={pageFormat === f.id}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gutter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Gutter</span>
                        <span className="text-[9px] text-zinc-400 font-mono">{gutterWidth}px</span>
                      </div>
                      <input type="range" min={0} max={20} value={gutterWidth}
                        onChange={(e) => update('gutterWidth', Number(e.target.value))}
                        className="w-full h-1 accent-violet-500" aria-label="Gutter width" />
                    </div>

                    {/* Border */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Border</span>
                        <span className="text-[9px] text-zinc-400 font-mono">{borderWidth}px</span>
                      </div>
                      <input type="range" min={0} max={10} value={borderWidth}
                        onChange={(e) => update('borderWidth', Number(e.target.value))}
                        className="w-full h-1 accent-violet-500" aria-label="Border width" />
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                        <input type="color" value={borderColor} onChange={(e) => update('borderColor', e.target.value)}
                          className="size-5 rounded border border-zinc-700 cursor-pointer bg-transparent" aria-label="Border color" />
                        Border
                      </label>
                      <label className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                        <input type="color" value={gutterColor} onChange={(e) => update('gutterColor', e.target.value)}
                          className="size-5 rounded border border-zinc-700 cursor-pointer bg-transparent" aria-label="Gutter color" />
                        Gutter
                      </label>
                    </div>

                    {/* Direction */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Direction</span>
                      <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
                        {([
                          { value: 'rtl', label: 'RTL', title: 'Right-to-Left (manga)' },
                          { value: 'ltr', label: 'LTR', title: 'Left-to-Right (western)' },
                        ] as const).map((d) => (
                          <button key={d.value} type="button" onClick={() => update('readingOrder', d.value)}
                            className={cn(
                              'flex-1 px-2 py-1 rounded-md text-[9px] font-medium transition-colors',
                              readingOrder === d.value ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-300',
                            )}
                            aria-label={d.title} aria-pressed={readingOrder === d.value} title={d.title}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Output size */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Output</span>
                      <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
                        {([1024, 2048] as const).map((s) => (
                          <button key={s} type="button" onClick={() => update('outputSize', s)}
                            className={cn(
                              'flex-1 px-2 py-1 rounded-md text-[9px] font-medium transition-colors',
                              outputSize === s ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-300',
                            )}
                            aria-label={`Output: ${s}px`} aria-pressed={outputSize === s}
                          >
                            {s}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Bubbles Tab ── */}
                  <TabsContent value="bubbles" className="mt-2">
                    <div className="flex justify-end mb-1.5">
                      <button
                        type="button" onClick={addBubble}
                        className="px-2.5 py-1 rounded-md text-[9px] font-medium bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors"
                        aria-label="Add speech bubble"
                      >
                        + Add Bubble
                      </button>
                    </div>
                    {bubbles.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 text-center py-4">
                        No bubbles yet. Add one to place dialogue in your panels.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bubbles.map((b) => (
                          <BubbleCard key={b.id} bubble={b} maxPanel={activePreset.panelCount - 1}
                            onUpdate={updateBubble} onDelete={() => deleteBubble(b.id)} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* ── Error Footer ── */}
        {status === 'error' && data.error && (
          <div className="flex items-start gap-1.5 px-3 py-2 border-t border-red-500/30 bg-red-950/30">
            <AlertCircle className="size-3.5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-red-300 line-clamp-2">{data.error}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
