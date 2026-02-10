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
  promptLabel: string;
}

const VIEW_ANGLES: ViewAngle[] = [
  { key: 'front', label: 'Front', promptLabel: 'Front View' },
  { key: 'threeQuarterFront', label: '3/4 Front', promptLabel: 'Three-Quarter Front View' },
  { key: 'sideLeft', label: 'Side (L)', promptLabel: 'Left Profile' },
  { key: 'sideRight', label: 'Side (R)', promptLabel: 'Right Profile' },
  { key: 'threeQuarterBack', label: '3/4 Back', promptLabel: 'Three-Quarter Back View' },
  { key: 'back', label: 'Back', promptLabel: 'Back View' },
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
    { id: 'prompt', label: 'Prompt', type: 'text' },
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
    backgroundMode: 'solid',
    backgroundColor: '#ffffff',
  },
  minWidth: 280,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a reference image URL to a storage path. */
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

/** Compute the best aspect ratio for the sheet based on view count and layout. */
function getSheetAspectRatio(viewCount: number): string {
  if (viewCount <= 3) return '16:9';
  if (viewCount === 4) return '16:9';
  // 5-6 views use a grid — slightly wider than square
  return '3:2';
}

/** Build the structured turnaround prompt. */
function buildTurnaroundPrompt(
  characterDescription: string,
  enabledViews: ViewAngle[],
  shotType: string,
  backgroundMode: string,
  backgroundColor: string,
): string {
  const viewCount = enabledViews.length;
  const viewList = enabledViews.map((v) => v.promptLabel).join(', ');

  // Layout instruction
  let layoutInstruction: string;
  if (viewCount <= 4) {
    layoutInstruction = `Place exactly ${viewCount} figures in a single horizontal row.`;
  } else {
    const cols = 3;
    const rows = Math.ceil(viewCount / cols);
    layoutInstruction = `Arrange the ${viewCount} figures in a clean ${rows}x${cols} grid layout.`;
  }

  // Background
  const bgValue = backgroundMode === 'solid' ? `Solid ${backgroundColor}` : 'Keep the original scene background';

  // Shot type label
  const shotLabel = shotType === 'close-up' ? 'close-up' : shotType === 'medium-shot' ? 'medium shot' : 'full-body';

  const characterLine = characterDescription
    ? `CHARACTER: ${characterDescription}`
    : `CHARACTER: Use the provided reference image as the character. Replicate it exactly.`;

  return [
    `Generate a professional character turnaround sheet based on the provided reference.`,
    ``,
    characterLine,
    ``,
    `STRICT LAYOUT REQUIREMENTS:`,
    `- VIEW COUNT: Generate EXACTLY ${viewCount} distinct character figures. No more, no less.`,
    `- ARRANGEMENT: ${layoutInstruction}`,
    `- VIEW LIST: The figures must represent these specific angles: ${viewList}.`,
    `- NO REPETITION: Every character figure must be a unique angle from the list. Do NOT duplicate the front view or any other pose.`,
    `- NO HALLUCINATIONS: Do not fill empty canvas space with extra characters or redundant sketches.`,
    ``,
    `VISUAL MANDATE:`,
    `- CONSISTENCY: Maintain 1:1 likeness, facial features, hair, and clothing across all views.`,
    `- FRAMING: ${shotLabel} framing for all figures.`,
    `- BACKGROUND: ${bgValue}.`,
    `- FORMAT: High-fidelity production asset. Zero text labels or UI elements.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const characterTurnaroundExecutor: NodeExecutor = async (inputs, config, context) => {
  const rawPrompt = inputs.prompt;
  const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';

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

  // Need at least a prompt or a reference image
  if (!prompt && referenceImagePaths.length === 0) {
    throw new Error('Provide a prompt, a reference image, or both');
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

  // Build structured prompt
  const turnaroundPrompt = buildTurnaroundPrompt(
    prompt,
    enabledViews,
    shotType,
    backgroundMode,
    backgroundColor,
  );

  // Determine aspect ratio based on layout
  const aspectRatio = getSheetAspectRatio(enabledViews.length);

  // Single API call — the model generates the entire sheet
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId,
      prompt: turnaroundPrompt,
      negativePrompt: negative,
      aspectRatio,
      imageSize: typeof settings.imageSize === 'string' ? settings.imageSize : '2K',
      outputCount: 1,
      referenceImagePaths,
      mode: typeof settings.generationSpeed === 'string' ? settings.generationSpeed : 'fast',
      source: 'characterTurnaround',
    }),
    signal: context.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Generation failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.images?.[0]) {
    throw new Error(data.error || 'No turnaround sheet generated');
  }

  const imageUrl = data.images[0].url;
  if (typeof imageUrl !== 'string') {
    throw new Error('Invalid image URL returned');
  }

  return { sheet: imageUrl };
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
      icon={<RotateCcw className="size-4" aria-hidden="true" />}
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
                  'px-1.5 py-1 rounded text-[10px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring',
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
                  'flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring',
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
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize focus-visible:ring-1 focus-visible:ring-ring',
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
            <span className="text-xs text-muted-foreground">Generating sheet…</span>
          </div>
        )}

        {status === 'success' && outputImage ? (
          <div className="relative rounded-md overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputImage}
              alt="Character turnaround sheet"
              className="w-full object-contain"
              width={280}
              height={187}
              draggable={false}
            />
          </div>
        ) : status === 'idle' ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Connect a prompt or reference image
          </p>
        ) : null}
      </div>
    </BaseWorkflowNode>
  );
}
