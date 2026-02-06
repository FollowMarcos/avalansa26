'use client';

import * as React from 'react';
import { Combine } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Layout presets
// ---------------------------------------------------------------------------

interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutPreset {
  id: string;
  label: string;
  panelCount: number;
  panels: PanelRect[];
}

const LAYOUT_PRESETS: LayoutPreset[] = [
  // 2-panel
  { id: '2-side-by-side', label: '2 Side', panelCount: 2, panels: [
    { x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 },
  ]},
  { id: '2-stacked', label: '2 Stack', panelCount: 2, panels: [
    { x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 },
  ]},
  // 3-panel
  { id: '3-featured-left', label: '3 Feat L', panelCount: 3, panels: [
    { x: 0, y: 0, w: 0.6, h: 1 },
    { x: 0.6, y: 0, w: 0.4, h: 0.5 }, { x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
  ]},
  { id: '3-row', label: '3 Row', panelCount: 3, panels: [
    { x: 0, y: 0, w: 0.333, h: 1 }, { x: 0.333, y: 0, w: 0.334, h: 1 }, { x: 0.667, y: 0, w: 0.333, h: 1 },
  ]},
  // 4-panel
  { id: '4-grid', label: '4 Grid', panelCount: 4, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ]},
  { id: '4-featured-top', label: '4 Feat T', panelCount: 4, panels: [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.333, h: 0.5 }, { x: 0.333, y: 0.5, w: 0.334, h: 0.5 }, { x: 0.667, y: 0.5, w: 0.333, h: 0.5 },
  ]},
  // 5-panel
  { id: '5-mosaic', label: '5 Mosaic', panelCount: 5, panels: [
    { x: 0, y: 0, w: 0.6, h: 0.6 },
    { x: 0.6, y: 0, w: 0.4, h: 0.3 }, { x: 0.6, y: 0.3, w: 0.4, h: 0.3 },
    { x: 0, y: 0.6, w: 0.3, h: 0.4 }, { x: 0.3, y: 0.6, w: 0.7, h: 0.4 },
  ]},
  // 6-panel
  { id: '6-grid', label: '6 Grid', panelCount: 6, panels: [
    { x: 0, y: 0, w: 0.333, h: 0.5 }, { x: 0.333, y: 0, w: 0.334, h: 0.5 }, { x: 0.667, y: 0, w: 0.333, h: 0.5 },
    { x: 0, y: 0.5, w: 0.333, h: 0.5 }, { x: 0.333, y: 0.5, w: 0.334, h: 0.5 }, { x: 0.667, y: 0.5, w: 0.333, h: 0.5 },
  ]},
  // 7-panel
  { id: '7-mosaic', label: '7 Mosaic', panelCount: 7, panels: [
    { x: 0, y: 0, w: 0.5, h: 0.333 }, { x: 0.5, y: 0, w: 0.5, h: 0.333 },
    { x: 0, y: 0.333, w: 0.333, h: 0.334 }, { x: 0.333, y: 0.333, w: 0.334, h: 0.334 }, { x: 0.667, y: 0.333, w: 0.333, h: 0.334 },
    { x: 0, y: 0.667, w: 0.5, h: 0.333 }, { x: 0.5, y: 0.667, w: 0.5, h: 0.333 },
  ]},
  // 8-panel
  { id: '8-grid', label: '8 Grid', panelCount: 8, panels: [
    { x: 0, y: 0, w: 0.25, h: 0.5 }, { x: 0.25, y: 0, w: 0.25, h: 0.5 }, { x: 0.5, y: 0, w: 0.25, h: 0.5 }, { x: 0.75, y: 0, w: 0.25, h: 0.5 },
    { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
  ]},
  // 9-panel
  { id: '9-grid', label: '9 Grid', panelCount: 9, panels: [
    { x: 0, y: 0, w: 0.333, h: 0.333 }, { x: 0.333, y: 0, w: 0.334, h: 0.333 }, { x: 0.667, y: 0, w: 0.333, h: 0.333 },
    { x: 0, y: 0.333, w: 0.333, h: 0.334 }, { x: 0.333, y: 0.333, w: 0.334, h: 0.334 }, { x: 0.667, y: 0.333, w: 0.333, h: 0.334 },
    { x: 0, y: 0.667, w: 0.333, h: 0.333 }, { x: 0.333, y: 0.667, w: 0.334, h: 0.333 }, { x: 0.667, y: 0.667, w: 0.333, h: 0.333 },
  ]},
];

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'] as const;

function parseAspectRatio(ratio: string): [number, number] {
  const parts = ratio.split(':').map(Number);
  return [parts[0] || 1, parts[1] || 1];
}

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export const collageComposerDefinition: WorkflowNodeDefinition = {
  type: 'collageComposer',
  label: 'Collage Composer',
  category: 'output',
  description: 'Compose up to 9 images into a custom collage layout',
  icon: 'Combine',
  inputs: [
    { id: 'panel_1', label: 'Panel 1', type: 'image', required: true },
    { id: 'panel_2', label: 'Panel 2', type: 'image' },
    { id: 'panel_3', label: 'Panel 3', type: 'image' },
    { id: 'panel_4', label: 'Panel 4', type: 'image' },
    { id: 'panel_5', label: 'Panel 5', type: 'image' },
    { id: 'panel_6', label: 'Panel 6', type: 'image' },
    { id: 'panel_7', label: 'Panel 7', type: 'image' },
    { id: 'panel_8', label: 'Panel 8', type: 'image' },
    { id: 'panel_9', label: 'Panel 9', type: 'image' },
  ],
  outputs: [{ id: 'image', label: 'Collage', type: 'image' }],
  defaultConfig: {
    layoutPreset: '2-side-by-side',
    aspectRatio: '1:1',
    borderWidth: 0,
    borderColor: '#000000',
    borderStyle: 'solid',
    borderRadius: 0,
    backgroundColor: '#000000',
    panelImages: {},
    outputSize: 1024,
  },
  minWidth: 280,
};

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const collageComposerExecutor: NodeExecutor = async (inputs, config) => {
  const presetId = (config.layoutPreset as string) || '2-side-by-side';
  const preset = LAYOUT_PRESETS.find((p) => p.id === presetId) ?? LAYOUT_PRESETS[0];

  const panelImages = (config.panelImages as Record<string, string>) ?? {};
  const imageSources: (string | undefined)[] = [];
  for (let i = 0; i < preset.panelCount; i++) {
    const key = `panel_${i + 1}`;
    imageSources.push((inputs[key] as string | undefined) || panelImages[key] || undefined);
  }

  if (!imageSources[0]) throw new Error('Panel 1 image is required');

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src.slice(0, 50)}`));
      img.src = src;
    });

  const loaded = await Promise.all(
    imageSources.map((src) => (src ? loadImage(src) : Promise.resolve(null))),
  );

  const outputSize = (config.outputSize as number) || 1024;
  const [arW, arH] = parseAspectRatio((config.aspectRatio as string) || '1:1');
  let canvasW: number;
  let canvasH: number;
  if (arW >= arH) {
    canvasW = outputSize;
    canvasH = Math.round(outputSize * (arH / arW));
  } else {
    canvasH = outputSize;
    canvasW = Math.round(outputSize * (arW / arH));
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = (config.backgroundColor as string) || '#000000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const bw = (config.borderWidth as number) ?? 0;
  const br = (config.borderRadius as number) ?? 0;
  const bColor = (config.borderColor as string) || '#000000';
  const bStyle = (config.borderStyle as string) || 'solid';

  for (let i = 0; i < preset.panels.length; i++) {
    const img = loaded[i];
    if (!img) continue;

    const p = preset.panels[i];
    const px = Math.round(p.x * canvasW) + bw / 2;
    const py = Math.round(p.y * canvasH) + bw / 2;
    const pw = Math.round(p.w * canvasW) - bw;
    const ph = Math.round(p.h * canvasH) - bw;
    if (pw <= 0 || ph <= 0) continue;

    ctx.save();
    ctx.beginPath();
    if (br > 0) {
      ctx.roundRect(px, py, pw, ph, br);
    } else {
      ctx.rect(px, py, pw, ph);
    }
    ctx.clip();

    // Cover-fit
    const scale = Math.max(pw / img.width, ph / img.height);
    const sw = pw / scale;
    const sh = ph / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
    ctx.restore();

    // Border
    if (bw > 0 && bStyle !== 'none') {
      ctx.save();
      ctx.strokeStyle = bColor;
      ctx.lineWidth = bw;
      if (bStyle === 'dashed') ctx.setLineDash([bw * 3, bw * 2]);
      if (bStyle === 'dotted') ctx.setLineDash([bw, bw]);
      ctx.beginPath();
      if (br > 0) {
        ctx.roundRect(px, py, pw, ph, br);
      } else {
        ctx.rect(px, py, pw, ph);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  return { image: canvas.toDataURL('image/jpeg', 0.92) };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', { detail: { nodeId, config } }),
  );
}

interface CollageComposerNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function CollageComposerNode({ data, id, selected }: CollageComposerNodeProps) {
  const config = data.config;
  const status = data.status ?? 'idle';
  const outputImage = data.outputValues?.image as string | undefined;

  const layoutPreset = (config.layoutPreset as string) || '2-side-by-side';
  const aspectRatio = (config.aspectRatio as string) || '1:1';
  const borderWidth = (config.borderWidth as number) ?? 0;
  const borderColor = (config.borderColor as string) || '#000000';
  const borderStyle = (config.borderStyle as string) || 'solid';
  const borderRadius = (config.borderRadius as number) ?? 0;
  const backgroundColor = (config.backgroundColor as string) || '#000000';
  const outputSize = (config.outputSize as number) || 1024;

  const activePreset = LAYOUT_PRESETS.find((p) => p.id === layoutPreset) ?? LAYOUT_PRESETS[0];
  const [arW, arH] = parseAspectRatio(aspectRatio);

  const update = (key: string, value: unknown) => {
    dispatchConfig(id, { ...config, [key]: value });
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={collageComposerDefinition.label}
      icon={<Combine className="size-4" />}
      inputs={collageComposerDefinition.inputs}
      outputs={collageComposerDefinition.outputs}
      minWidth={collageComposerDefinition.minWidth}
    >
      <div className="space-y-2 nodrag nowheel">
        {/* Layout preset selector */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Layout</label>
          <div className="flex flex-wrap gap-1">
            {LAYOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => update('layoutPreset', preset.id)}
                className={cn(
                  'size-7 rounded border transition-all flex-shrink-0 relative overflow-hidden',
                  layoutPreset === preset.id
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border hover:border-foreground/30',
                )}
                title={preset.label}
                aria-label={`Layout: ${preset.label}`}
              >
                <svg viewBox="0 0 1 1" className="w-full h-full" preserveAspectRatio="none">
                  {preset.panels.map((p, i) => (
                    <rect
                      key={i}
                      x={p.x + 0.02}
                      y={p.y + 0.02}
                      width={p.w - 0.04}
                      height={p.h - 0.04}
                      rx={0.03}
                      className="fill-muted-foreground/30"
                    />
                  ))}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Mini preview */}
        {status === 'success' && outputImage ? (
          <div className="relative rounded-md overflow-hidden border border-border">
            <img
              src={outputImage}
              alt="Collage preview"
              className="w-full h-32 object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div
            className="relative rounded-md border border-border overflow-hidden"
            style={{ aspectRatio: `${arW}/${arH}`, backgroundColor }}
          >
            {activePreset.panels.map((panel, i) => (
              <div
                key={i}
                className="absolute overflow-hidden flex items-center justify-center"
                style={{
                  left: `${panel.x * 100}%`,
                  top: `${panel.y * 100}%`,
                  width: `${panel.w * 100}%`,
                  height: `${panel.h * 100}%`,
                  padding: `${Math.max(borderWidth / 2, 1)}px`,
                }}
              >
                <div
                  className="w-full h-full overflow-hidden flex items-center justify-center bg-muted/20"
                  style={{
                    borderRadius: `${borderRadius}px`,
                    border: borderWidth > 0 && borderStyle !== 'none'
                      ? `${Math.max(borderWidth / 4, 1)}px ${borderStyle} ${borderColor}`
                      : '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-1.5">
          {/* Aspect Ratio */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => update('aspectRatio', e.target.value)}
              className="flex-1 text-[10px] rounded border border-border bg-muted/30 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Aspect ratio"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Border Width */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Border</label>
            <input
              type="range"
              min={0}
              max={20}
              value={borderWidth}
              onChange={(e) => update('borderWidth', Number(e.target.value))}
              className="flex-1 h-1 accent-primary"
              aria-label="Border width"
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{borderWidth}px</span>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Colors</label>
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => update('borderColor', e.target.value)}
                  className="size-5 rounded border border-border cursor-pointer"
                  aria-label="Border color"
                />
                Bdr
              </label>
              <label className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => update('backgroundColor', e.target.value)}
                  className="size-5 rounded border border-border cursor-pointer"
                  aria-label="Background color"
                />
                Bg
              </label>
            </div>
          </div>

          {/* Border Style */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Style</label>
            <div className="flex gap-0.5">
              {(['none', 'solid', 'dashed', 'dotted'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update('borderStyle', s)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] transition-colors',
                    borderStyle === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                  )}
                  aria-label={`Border style: ${s}`}
                  aria-pressed={borderStyle === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Radius</label>
            <input
              type="range"
              min={0}
              max={20}
              value={borderRadius}
              onChange={(e) => update('borderRadius', Number(e.target.value))}
              className="flex-1 h-1 accent-primary"
              aria-label="Border radius"
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{borderRadius}px</span>
          </div>

          {/* Output Size */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Size</label>
            <div className="flex gap-0.5">
              {([1024, 2048] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update('outputSize', s)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] transition-colors',
                    outputSize === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                  )}
                  aria-label={`Output size: ${s}px`}
                  aria-pressed={outputSize === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        <p className="text-[10px] text-muted-foreground text-center">
          {status === 'idle'
            ? 'Connect images to panels'
            : status === 'running'
              ? 'Compositing\u2026'
              : status === 'success'
                ? 'Collage ready'
                : ''}
        </p>
      </div>
    </BaseWorkflowNode>
  );
}
