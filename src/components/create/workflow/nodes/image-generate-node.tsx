'use client';

import * as React from 'react';
import { Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { Loader } from '@/components/ui/loader';
import { useNodeConfig } from '../hooks/use-node-config';
import { useConnectedInputValue } from '../hooks/use-connected-input';
import { useCreate } from '../../create-context';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '5:4', '4:5', '21:9'];
const IMAGE_SIZES = ['1K', '2K', '4K'];

export const imageGenerateDefinition: WorkflowNodeDefinition = {
  type: 'imageGenerate',
  label: 'Generate Image',
  category: 'processing',
  description: 'Generate an image using the connected prompt and settings',
  icon: 'Sparkles',
  inputs: [
    { id: 'prompt', label: 'Prompt', type: 'text', required: true },
    { id: 'negative', label: 'Negative', type: 'text' },
    { id: 'settings', label: 'Settings', type: 'settings' },
    { id: 'reference', label: 'Reference', type: 'image' },
    { id: 'references', label: 'References', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Image 1', type: 'image' },
    { id: 'image2', label: 'Image 2', type: 'image' },
    { id: 'image3', label: 'Image 3', type: 'image' },
    { id: 'image4', label: 'Image 4', type: 'image' },
  ],
  defaultConfig: {
    apiId: null,
    aspectRatio: '1:1',
    imageSize: '2K',
    outputCount: 1,
    generationSpeed: 'fast',
    showSettings: true,
  },
  minWidth: 240,
};

/** Resolve a single reference (URL or storage path) to a storage path. */
async function resolveRefPath(raw: string): Promise<string | null> {
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const { uploadReferenceImage } = await import('@/utils/supabase/storage');
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const res = await fetch(raw);
      const blob = await res.blob();
      const file = new File([blob], `workflow-ref-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const result = await uploadReferenceImage(file, user.id);
      return result.path || null;
    } catch {
      return null;
    }
  }

  return raw;
}

export const imageGenerateExecutor: NodeExecutor = async (inputs, config, context) => {
  const prompt = inputs.prompt as string;
  if (!prompt) throw new Error('Prompt is required');

  const negative = (inputs.negative as string) || '';
  const settings = (inputs.settings as Record<string, unknown>) || {};

  // Collect reference images from both input sockets
  const rawReference = inputs.reference as string | undefined;
  const rawReferences = inputs.references as string[] | undefined;

  const allRawRefs: string[] = [];

  // "references" carries an array from the multi-image Reference node
  if (rawReferences && Array.isArray(rawReferences)) {
    allRawRefs.push(...rawReferences);
  }

  // "reference" carries a single image (backward compat / other node types)
  if (rawReference && !allRawRefs.includes(rawReference)) {
    allRawRefs.push(rawReference);
  }

  // Resolve all refs (download URLs → storage paths if needed)
  const resolvedPaths = await Promise.all(allRawRefs.map(resolveRefPath));
  const referenceImagePaths = resolvedPaths.filter((p): p is string => p !== null);

  // Priority: settings wire > inline config > defaults/global
  const apiId = (settings.apiId as string) || (config.apiId as string) || context.apiId;
  const aspectRatio = (settings.aspectRatio as string) || (config.aspectRatio as string) || '1:1';
  const imageSize = (settings.imageSize as string) || (config.imageSize as string) || '2K';
  const outputCount = Number(settings.outputCount || config.outputCount) || 1;
  const mode = (settings.generationSpeed as string) || (config.generationSpeed as string) || 'fast';

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId,
      prompt,
      negativePrompt: negative,
      aspectRatio,
      imageSize,
      outputCount,
      referenceImagePaths,
      mode,
    }),
    signal: context.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Generation failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.images?.[0]) {
    throw new Error(data.error || 'No image generated');
  }

  const outputKeys = ['image', 'image2', 'image3', 'image4'] as const;
  const outputs: Record<string, unknown> = {};
  for (let i = 0; i < data.images.length && i < outputKeys.length; i++) {
    outputs[outputKeys[i]] = data.images[i].url;
  }
  return outputs;
};

interface ImageGenerateNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageGenerateNode({ data, id, selected }: ImageGenerateNodeProps) {
  const [config, update] = useNodeConfig(id, data.config);
  const { availableApis } = useCreate();
  const status = data.status ?? 'idle';

  // Check if a Settings node is wired in
  const connectedSettings = useConnectedInputValue(id, 'settings');
  const hasWiredSettings = Boolean(connectedSettings);

  const showSettings = !!config.showSettings;

  const outputImages: string[] = [];
  const keys = ['image', 'image2', 'image3', 'image4'] as const;
  for (const key of keys) {
    const url = data.outputValues?.[key] as string | undefined;
    if (url) outputImages.push(url);
  }

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageGenerateDefinition.label}
      icon={<Sparkles className="size-4" aria-hidden="true" />}
      inputs={imageGenerateDefinition.inputs}
      outputs={imageGenerateDefinition.outputs}
      minWidth={imageGenerateDefinition.minWidth}
    >
      <div className="space-y-2 nodrag nowheel">
        {/* Inline settings */}
        <button
          type="button"
          onClick={() => update('showSettings', !showSettings)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          aria-expanded={showSettings}
          aria-controls={`${id}-settings`}
        >
          {showSettings ? (
            <ChevronDown className="size-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3" aria-hidden="true" />
          )}
          Settings
          {hasWiredSettings && (
            <span className="ml-auto text-[9px] text-muted-foreground/60">wire overrides</span>
          )}
        </button>

        {showSettings && (
          <div id={`${id}-settings`} className="space-y-1.5 pl-1">
            {/* API / Provider */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">
                API
              </label>
              <select
                value={(config.apiId as string) || ''}
                onChange={(e) => update('apiId', e.target.value || null)}
                className="flex-1 min-w-0 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring truncate"
                aria-label="API provider"
              >
                <option value="">Default</option>
                {availableApis.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.name}{api.model_id ? ` (${api.model_id})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">
                Ratio
              </label>
              <select
                value={(config.aspectRatio as string) || '1:1'}
                onChange={(e) => update('aspectRatio', e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Aspect ratio"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Image Size */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">
                Size
              </label>
              <select
                value={(config.imageSize as string) || '2K'}
                onChange={(e) => update('imageSize', e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Image size"
              >
                {IMAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Output Count */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">
                Count
              </label>
              <div className="flex gap-0.5" role="radiogroup" aria-label="Output count">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('outputCount', n)}
                    className={cn(
                      'flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring',
                      Number(config.outputCount || 1) === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                    aria-label={`Generate ${n} image${n > 1 ? 's' : ''}`}
                    aria-pressed={Number(config.outputCount || 1) === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-12 flex-shrink-0">
                Speed
              </label>
              <div className="flex gap-0.5" role="radiogroup" aria-label="Generation speed">
                {(['fast', 'relaxed'] as const).map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => update('generationSpeed', speed)}
                    className={cn(
                      'flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors capitalize focus-visible:ring-1 focus-visible:ring-ring',
                      (config.generationSpeed || 'fast') === speed
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                    aria-label={`Speed: ${speed}`}
                    aria-pressed={(config.generationSpeed || 'fast') === speed}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Running indicator */}
        {status === 'running' && (
          <div className="flex items-center gap-2 py-2" role="status" aria-live="polite">
            <Loader size="sm" />
            <span className="text-xs text-muted-foreground">Generating{'\u2026'}</span>
          </div>
        )}

        {/* Thumbnail previews of generated images */}
        {status === 'success' && outputImages.length > 0 && (
          <div className={cn(
            'gap-1',
            outputImages.length === 1 ? 'block' : 'grid grid-cols-2',
          )}>
            {outputImages.map((url, i) => (
              <div key={`${url}-${i}`} className="relative rounded-md overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Generated image ${i + 1}`}
                  className="w-full h-32 object-cover"
                  width={240}
                  height={128}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Idle state hint */}
        {status === 'idle' && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Connect a prompt and run the workflow
          </p>
        )}
      </div>
    </BaseWorkflowNode>
  );
}
