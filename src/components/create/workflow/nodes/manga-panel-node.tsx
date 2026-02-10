'use client';

import * as React from 'react';
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import { SOCKET_COLORS as socketColors } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { SpeechBubble, PanelTransform } from './manga-panel/canvas-renderer';
import { BUBBLE_POS, drawBubbleOnCanvas } from './manga-panel/canvas-renderer';
import { PAGE_FORMATS, MANGA_LAYOUTS, LAYOUT_GROUPS, computeReadingOrder, STATUS_DOT } from './manga-panel/constants';
import { BubbleCard } from './manga-panel/bubble-card';
import { InteractivePanel } from './manga-panel/interactive-panel';
import { Seg } from './manga-panel/seg';

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
  minWidth: 860,
};

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
// Component
// ---------------------------------------------------------------------------

interface MangaPanelNodeProps { data: WorkflowNodeData; id: string; selected?: boolean }

export function MangaPanelNode({ data, id, selected }: MangaPanelNodeProps) {
  const [config, update] = useNodeConfig(id, data.config);
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
  const [bubblesOpen, setBubblesOpen] = React.useState(false);

  const activePreset = MANGA_LAYOUTS.find((p) => p.id === layoutPreset) ?? MANGA_LAYOUTS[0];
  const activeFormat = PAGE_FORMATS.find((f) => f.id === pageFormat) ?? PAGE_FORMATS[0];
  const readOrder = computeReadingOrder(activePreset.panels, readingOrder);

  const addBubble = () => {
    const b: SpeechBubble = {
      id: crypto.randomUUID(), panelIndex: 0, type: 'speech', text: '',
      position: '1', tailDirection: 'bottom-left', fontSize: 16,
    };
    update('bubbles', [...bubbles, b]);
    setBubblesOpen(true);
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
          'relative rounded-2xl bg-zinc-950 shadow-2xl transition-all',
          status === 'error' ? 'ring-2 ring-red-500/40' : status === 'running' ? 'ring-2 ring-blue-500/40' : status === 'success' ? 'ring-1 ring-emerald-500/30' : 'ring-1 ring-zinc-800',
          selected && status === 'idle' && 'ring-2 ring-violet-500/50',
        )}
        style={{ width: 860 }}
        role="application"
        aria-label="Manga Editor"
      >
        {/* Input handles */}
        {mangaPanelDefinition.inputs.map((socket, index) => (
          <Tooltip key={`in-${socket.id}`}>
            <TooltipTrigger asChild>
              <Handle
                type="target"
                position={Position.Left}
                id={`in-${socket.id}`}
                className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-zinc-900 transition-all hover:!scale-150 hover:!border-white/50"
                style={{
                  backgroundColor: socketColors[socket.type],
                  top: 56 + index * 32,
                  left: -7,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs font-medium">
              {socket.label}{socket.required ? ' *' : ''}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Output handle */}
        {mangaPanelDefinition.outputs.map((socket) => (
          <Tooltip key={`out-${socket.id}`}>
            <TooltipTrigger asChild>
              <Handle
                type="source"
                position={Position.Right}
                id={`out-${socket.id}`}
                className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-zinc-900 transition-all hover:!scale-150 hover:!border-white/50"
                style={{
                  backgroundColor: socketColors[socket.type],
                  top: '50%',
                  right: -7,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              {socket.label}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Titlebar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 backdrop-blur-md select-none rounded-t-2xl">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="size-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all" />
            <div className="size-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all" />
            <div className="size-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="size-4 text-zinc-500" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-zinc-200 tracking-tight truncate">
              Manga Editor
            </span>
          </div>
          {status !== 'idle' && (
            <span className={cn(
              'text-[11px] font-medium px-2 py-0.5 rounded-full',
              status === 'running' && 'bg-blue-500/20 text-blue-300',
              status === 'queued' && 'bg-yellow-500/20 text-yellow-300',
              status === 'success' && 'bg-emerald-500/20 text-emerald-300',
              status === 'skipped' && 'bg-zinc-700/50 text-zinc-400',
            )}>
              {status === 'running' && 'Compositing\u2026'}
              {status === 'queued' && 'Queued'}
              {status === 'success' && 'Ready'}
              {status === 'skipped' && 'Skipped'}
            </span>
          )}
          <div
            className={cn('size-2 rounded-full flex-shrink-0', STATUS_DOT[status] || 'bg-zinc-600')}
            aria-label={`Status: ${status}`}
          />
        </div>

        {/* Main body */}
        <div className="flex nodrag nowheel overflow-hidden" style={{ height: 420 }}>

          {/* Canvas workspace (left, dominant) */}
          <div className="flex-1 min-w-0 flex flex-col bg-zinc-900/30">

            {/* Canvas viewport */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              {hasEditablePreview ? (
                <div className="relative h-full flex items-center justify-center">
                  <div
                    className="relative rounded border border-zinc-700/30 overflow-hidden shadow-lg"
                    style={{ aspectRatio: `${activeFormat.ratioW}/${activeFormat.ratioH}`, height: '100%', backgroundColor: gutterColor }}
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
                    className="absolute bottom-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold shadow-lg transition-colors"
                    aria-label="Recompose with adjusted transforms"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Recompose
                  </button>
                </div>
              ) : status === 'success' && outputImage ? (
                <div className="relative h-full flex items-center justify-center">
                  <img
                    src={outputImage}
                    alt="Manga page preview"
                    className="h-full object-contain rounded shadow-lg"
                    draggable={false}
                  />
                </div>
              ) : (
                <div
                  className="relative rounded border border-zinc-700/30 overflow-hidden shadow-lg"
                  style={{ aspectRatio: `${activeFormat.ratioW}/${activeFormat.ratioH}`, height: '100%', backgroundColor: gutterColor }}
                >
                  {activePreset.panels.map((panel, i) => (
                    <div key={i} className="absolute"
                      style={{ left: `${panel.x * 100}%`, top: `${panel.y * 100}%`, width: `${panel.w * 100}%`, height: `${panel.h * 100}%`, padding: `${Math.max(gutterWidth / 4, 1)}px` }}
                    >
                      <div className="w-full h-full relative flex items-center justify-center bg-zinc-800/50 rounded-sm"
                        style={{ border: `${Math.max(borderWidth / 4, 1)}px solid ${borderColor}` }}
                      >
                        <span className="text-sm text-zinc-600 font-mono font-bold">{i + 1}</span>
                        <span
                          className="absolute text-[8px] font-bold text-violet-400/60"
                          style={{ [readingOrder === 'rtl' ? 'right' : 'left']: '3px', top: '2px' }}
                        >
                          {readOrder[i] + 1}
                        </span>
                        {bubbles.filter((b) => b.panelIndex === i).map((b) => {
                          const pos = b.freePosition ?? BUBBLE_POS[b.position] ?? { nx: 0.5, ny: 0.2 };
                          return (
                            <div key={b.id} className="absolute size-2.5 rounded-full bg-white/80 border-2 border-violet-400/60 shadow-sm"
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

            {/* Layout strip -- floating at bottom of canvas */}
            <div className="px-4 pb-3 flex items-center gap-3">
              {LAYOUT_GROUPS.map((group) => (
                <div key={group.count} className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-600 font-mono font-bold w-3 text-right">{group.count}</span>
                  <div className="flex gap-0.5">
                    {group.layouts.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => update('layoutPreset', preset.id)}
                        className={cn(
                          'w-7 h-9 rounded-md border-2 transition-all flex-shrink-0 relative overflow-hidden',
                          layoutPreset === preset.id
                            ? 'border-violet-500 bg-violet-500/15 shadow-md shadow-violet-500/10'
                            : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/80',
                        )}
                        title={preset.label}
                        aria-label={`Layout: ${preset.label}`}
                      >
                        <svg viewBox="0 0 5 7" className="w-full h-full" preserveAspectRatio="none">
                          {preset.panels.map((p, pi) => (
                            <rect key={pi} x={p.x * 5 + 0.2} y={p.y * 7 + 0.2} width={p.w * 5 - 0.4} height={p.h * 7 - 0.4}
                              className={layoutPreset === preset.id ? 'fill-violet-400/50' : 'fill-zinc-600/40'} rx={0.15}
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

          {/* Properties sidebar (right) */}
          <div className="w-[300px] flex-shrink-0 border-l border-zinc-800/80 bg-zinc-900/50 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">

                {/* Page format */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Page</span>
                  <Seg
                    items={PAGE_FORMATS.map((f) => ({ id: f.id, label: f.label }))}
                    value={pageFormat}
                    onChange={(id) => update('pageFormat', id)}
                    label="Page format"
                  />
                </div>

                {/* Direction + Output */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Read</span>
                    <Seg
                      items={[
                        { id: 'rtl', label: 'RTL', title: 'Right-to-Left (manga)' },
                        { id: 'ltr', label: 'LTR', title: 'Left-to-Right (western)' },
                      ]}
                      value={readingOrder}
                      onChange={(id) => update('readingOrder', id)}
                      label="Reading direction"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Output</span>
                    <Seg
                      items={[{ id: '1024', label: '1024' }, { id: '2048', label: '2048' }]}
                      value={String(outputSize)}
                      onChange={(id) => update('outputSize', Number(id))}
                      label="Output size"
                    />
                  </div>
                </div>

                <Separator className="!bg-zinc-800/80" />

                {/* Gutter & Border -- inline sliders */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-medium">Gutter</span>
                      <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{gutterWidth}px</span>
                    </div>
                    <input type="range" min={0} max={20} value={gutterWidth}
                      onChange={(e) => update('gutterWidth', Number(e.target.value))}
                      className="w-full h-1.5 accent-violet-500 rounded-full" aria-label="Gutter width" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-medium">Border</span>
                      <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{borderWidth}px</span>
                    </div>
                    <input type="range" min={0} max={10} value={borderWidth}
                      onChange={(e) => update('borderWidth', Number(e.target.value))}
                      className="w-full h-1.5 accent-violet-500 rounded-full" aria-label="Border width" />
                  </div>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="size-7 rounded-lg border-2 border-zinc-700 overflow-hidden group-hover:border-zinc-500 transition-colors">
                      <input type="color" value={borderColor} onChange={(e) => update('borderColor', e.target.value)}
                        className="w-full h-full cursor-pointer border-0" aria-label="Border color" />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium">Border</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="size-7 rounded-lg border-2 border-zinc-700 overflow-hidden group-hover:border-zinc-500 transition-colors">
                      <input type="color" value={gutterColor} onChange={(e) => update('gutterColor', e.target.value)}
                        className="w-full h-full cursor-pointer border-0" aria-label="Gutter color" />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium">Gutter</span>
                  </label>
                </div>

                <Separator className="!bg-zinc-800/80" />

                {/* Bubbles -- collapsible */}
                <div>
                  <button
                    type="button"
                    onClick={() => setBubblesOpen(!bubblesOpen)}
                    className="w-full flex items-center justify-between py-1 group"
                  >
                    <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold group-hover:text-zinc-300 transition-colors">
                      Bubbles{bubbles.length > 0 && ` (${bubbles.length})`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => { e.stopPropagation(); addBubble(); }}
                        className="text-[11px] text-violet-400 hover:text-violet-300 font-medium cursor-pointer transition-colors"
                        role="button"
                        aria-label="Add speech bubble"
                      >
                        + Add
                      </span>
                      <svg className={cn('size-3.5 text-zinc-500 transition-transform', bubblesOpen && 'rotate-180')} viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.5 6L8 9.5L11.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>
                  {bubblesOpen && (
                    <div className="mt-2 space-y-2">
                      {bubbles.length === 0 ? (
                        <p className="text-[11px] text-zinc-600 text-center py-6">
                          No speech bubbles yet
                        </p>
                      ) : (
                        bubbles.map((b) => (
                          <BubbleCard key={b.id} bubble={b} maxPanel={activePreset.panelCount - 1}
                            onUpdate={updateBubble} onDelete={() => deleteBubble(b.id)} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Error bar */}
        {status === 'error' && data.error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-950/40 border-t border-red-500/30 rounded-b-2xl">
            <AlertCircle className="size-4 text-red-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-[12px] text-red-300 truncate">{data.error}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
