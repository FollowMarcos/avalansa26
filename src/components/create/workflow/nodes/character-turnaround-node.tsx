'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { Loader } from '@/components/ui/loader';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// View angle definitions
// ---------------------------------------------------------------------------

interface ViewAngle {
  key: string;
  label: string;
  promptSuffix: string;
}

const VIEW_ANGLES: ViewAngle[] = [
  { key: 'front', label: 'Front', promptSuffix: 'front view' },
  { key: 'threeQuarterFront', label: '3/4 Front', promptSuffix: 'three-quarter front view' },
  { key: 'sideLeft', label: 'Side (L)', promptSuffix: 'left side profile view' },
  { key: 'sideRight', label: 'Side (R)', promptSuffix: 'right side profile view' },
  { key: 'threeQuarterBack', label: '3/4 Back', promptSuffix: 'three-quarter back view' },
  { key: 'back', label: 'Back', promptSuffix: 'back view, from behind' },
];

const SHOT_TYPES = [
  { id: 'close-up', label: 'Close-Up' },
  { id: 'medium-shot', label: 'Medium' },
  { id: 'full-body', label: 'Full Body' },
] as const;

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export const characterTurnaroundDefinition: WorkflowNodeDefinition = {
  type: 'characterTurnaround',
  label: 'Character Turnaround',
  category: 'processing',
  description: 'Generate a multi-angle character reference sheet',
  icon: 'RotateCcw',
  inputs: [
    { id: 'prompt', label: 'Prompt', type: 'text', required: true },
    { id: 'negative', label: 'Negative', type: 'text' },
    { id: 'settings', label: 'Settings', type: 'settings' },
    { id: 'reference', label: 'Reference', type: 'image' },
  ],
  outputs: [{ id: 'sheet', label: 'Sheet', type: 'image' }],
  defaultConfig: {
    views: {
      front: true,
      threeQuarterFront: true,
      sideLeft: true,
      sideRight: false,
      threeQuarterBack: true,
      back: true,
    },
    shotType: 'full-body',
    showLabels: true,
    labelFontSize: 24,
    backgroundMode: 'solid',
    backgroundColor: '#ffffff',
    outputSize: 2048,
    gap: 8,
  },
  minWidth: 280,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a reference image URL to a storage path (same pattern as image-generate-node). */
async function resolveRefPath(raw: unknown): Promise<string | null> {
  if (!raw || typeof raw !== 'string') return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const { uploadReferenceImage } = await import('@/utils/supabase/storage');
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const res = await fetch(raw);
      const blob = await res.blob();
      const file = new File([blob], `workflow-ref-${Date.now()}.jpg`, {
        type: blob.type || 'image/jpeg',
      });
      const result = await uploadReferenceImage(file, user.id);
      return result.path || null;
    } catch {
      return null;
    }
  }

  return raw;
}

function loadImage(src: unknown): Promise<HTMLImageElement> {
  if (typeof src !== 'string' || !src) {
    return Promise.reject(new Error('Invalid image source'));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src.slice(0, 50)}`));
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const characterTurnaroundExecutor: NodeExecutor = async (inputs, config, context) => {
  const rawPrompt = inputs.prompt;
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : '';
  if (!prompt) throw new Error('Prompt is required');

  const negative = typeof inputs.negative === 'string' ? inputs.negative : '';
  const settings =
    inputs.settings && typeof inputs.settings === 'object' && !Array.isArray(inputs.settings)
      ? (inputs.settings as Record<string, unknown>)
      : {};

  // Resolve reference image if provided
  const referenceImagePaths: string[] = [];
  if (inputs.reference) {
    const resolved = await resolveRefPath(inputs.reference);
    if (resolved) referenceImagePaths.push(resolved);
  }

  // Determine API ID
  const settingsApiId = typeof settings.apiId === 'string' ? settings.apiId : '';
  const apiId = settingsApiId || context.apiId;

  // Collect enabled views
  const views = (config.views as Record<string, boolean>) || {};
  const enabledViews = VIEW_ANGLES.filter((v) => views[v.key]);
  if (enabledViews.length === 0) throw new Error('At least one view angle must be selected');

  const shotType = (config.shotType as string) || 'full-body';
  const backgroundMode = (config.backgroundMode as string) || 'solid';
  const backgroundColor = (config.backgroundColor as string) || '#ffffff';

  // Build prompt for each view and generate in parallel
  const bgInstruction =
    backgroundMode === 'solid' ? `, on a plain ${backgroundColor} colored background` : '';

  const generateView = async (view: ViewAngle): Promise<{ label: string; url: string }> => {
    const viewPrompt = `${prompt}, ${view.promptSuffix}, ${shotType} shot, character turnaround sheet${bgInstruction}`;

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiId,
        prompt: viewPrompt,
        negativePrompt: negative,
        aspectRatio: '3:4',
        imageSize: typeof settings.imageSize === 'string' ? settings.imageSize : '2K',
        outputCount: 1,
        referenceImagePaths,
        mode: typeof settings.generationSpeed === 'string' ? settings.generationSpeed : 'fast',
      }),
      signal: context.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Generation failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.images?.[0]) {
      throw new Error(data.error || `No image generated for ${view.label}`);
    }

    const imageUrl = data.images[0].url;
    if (typeof imageUrl !== 'string') {
      throw new Error(`Invalid image URL for ${view.label}`);
    }

    return { label: view.label, url: imageUrl };
  };

  const results = await Promise.all(enabledViews.map(generateView));

  // Load all generated images
  const loadedImages = await Promise.all(
    results.map(async (r) => ({
      label: r.label,
      img: await loadImage(r.url),
    })),
  );

  // Composite onto canvas
  const N = loadedImages.length;
  const cols = N <= 4 ? N : 3;
  const rows = Math.ceil(N / cols);

  const outputSize = (config.outputSize as number) || 2048;
  const gap = (config.gap as number) ?? 8;
  const showLabels = config.showLabels !== false;
  const labelFontSize = (config.labelFontSize as number) || 24;
  const labelH = showLabels ? labelFontSize + 12 : 0;

  const panelW = Math.floor((outputSize - (cols + 1) * gap) / cols);
  const panelH = Math.floor(panelW * 1.2);
  const canvasW = cols * panelW + (cols + 1) * gap;
  const canvasH = rows * (panelH + labelH) + (rows + 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // Background fill
  ctx.fillStyle = backgroundMode === 'solid' ? backgroundColor : '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (let i = 0; i < loadedImages.length; i++) {
    const { label, img } = loadedImages[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const px = gap + col * (panelW + gap);
    const py = gap + row * (panelH + labelH + gap);

    // Cover-fit drawing
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 8);
    ctx.clip();

    const scale = Math.max(panelW / img.width, panelH / img.height);
    const sw = panelW / scale;
    const sh = panelH / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, px, py, panelW, panelH);
    ctx.restore();

    // Draw label below panel
    if (showLabels) {
      ctx.save();
      ctx.font = `600 ${labelFontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = backgroundMode === 'solid' ? '#333333' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, px + panelW / 2, py + panelH + 4);
      ctx.restore();
    }
  }

  return { sheet: canvas.toDataURL('image/jpeg', 0.92) };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function dispatchConfig(nodeId: string, config: Record<string, unknown>): void {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', { detail: { nodeId, config } }),
  );
}

interface CharacterTurnaroundNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function CharacterTurnaroundNode({ data, id, selected }: CharacterTurnaroundNodeProps) {
  const config = data.config;
  const status = data.status ?? 'idle';
  const outputImage = data.outputValues?.sheet as string | undefined;

  const views = (config.views as Record<string, boolean>) || {};
  const shotType = (config.shotType as string) || 'full-body';
  const showLabels = config.showLabels !== false;
  const labelFontSize = (config.labelFontSize as number) || 24;
  const backgroundMode = (config.backgroundMode as string) || 'solid';
  const backgroundColor = (config.backgroundColor as string) || '#ffffff';

  const enabledCount = VIEW_ANGLES.filter((v) => views[v.key]).length;

  const update = (key: string, value: unknown): void => {
    dispatchConfig(id, { ...config, [key]: value });
  };

  const toggleView = (viewKey: string): void => {
    const newViews = { ...views, [viewKey]: !views[viewKey] };
    dispatchConfig(id, { ...config, views: newViews });
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={characterTurnaroundDefinition.label}
      icon={<RotateCcw className="size-4" />}
      inputs={characterTurnaroundDefinition.inputs}
      outputs={characterTurnaroundDefinition.outputs}
      minWidth={characterTurnaroundDefinition.minWidth}
    >
      <div className="space-y-2.5 nodrag nowheel">
        {/* View angle toggles */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">
            Views ({enabledCount})
          </label>
          <div className="grid grid-cols-3 gap-1">
            {VIEW_ANGLES.map((view) => (
              <button
                key={view.key}
                type="button"
                onClick={() => toggleView(view.key)}
                className={cn(
                  'px-1.5 py-1 rounded text-[10px] font-medium transition-colors',
                  views[view.key]
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                )}
                aria-label={`View: ${view.label}`}
                aria-pressed={!!views[view.key]}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shot type */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Shot Type</label>
          <div className="flex gap-0.5">
            {SHOT_TYPES.map((shot) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => update('shotType', shot.id)}
                className={cn(
                  'flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors',
                  shotType === shot.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                )}
                aria-label={`Shot type: ${shot.label}`}
                aria-pressed={shotType === shot.id}
              >
                {shot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Labels toggle */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">Labels</label>
          <button
            type="button"
            onClick={() => update('showLabels', !showLabels)}
            className={cn(
              'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
              showLabels ? 'bg-primary' : 'bg-muted',
            )}
            role="switch"
            aria-checked={showLabels}
            aria-label="Show labels"
          >
            <span
              className={cn(
                'inline-block size-3 rounded-full bg-white transition-transform',
                showLabels ? 'translate-x-3.5' : 'translate-x-0.5',
              )}
            />
          </button>
          {showLabels && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={12}
                max={48}
                value={labelFontSize}
                onChange={(e) => update('labelFontSize', Number(e.target.value))}
                className="w-10 text-[10px] rounded border border-border bg-muted/30 px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Label font size"
              />
              <span className="text-[9px] text-muted-foreground">px</span>
            </div>
          )}
        </div>

        {/* Background */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground block">Background</label>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {(['solid', 'original'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update('backgroundMode', mode)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize',
                    backgroundMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                  )}
                  aria-label={`Background: ${mode}`}
                  aria-pressed={backgroundMode === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
            {backgroundMode === 'solid' && (
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="size-5 rounded border border-border cursor-pointer"
                aria-label="Background color"
              />
            )}
          </div>
        </div>

        {/* Preview / Status */}
        {status === 'running' && (
          <div className="flex items-center gap-2 py-2">
            <Loader size="sm" />
            <span className="text-xs text-muted-foreground">
              Generating {enabledCount} views…
            </span>
          </div>
        )}

        {status === 'success' && outputImage ? (
          <div className="relative rounded-md overflow-hidden border border-border">
            <img
              src={outputImage}
              alt="Character turnaround sheet"
              className="w-full object-contain"
              draggable={false}
            />
          </div>
        ) : status === 'idle' ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Connect a prompt and run the workflow
          </p>
        ) : null}
      </div>
    </BaseWorkflowNode>
  );
}
