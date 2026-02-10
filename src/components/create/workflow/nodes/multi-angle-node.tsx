'use client';

import * as React from 'react';
import { Rotate3d, ChevronDown, ChevronRight, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import { Loader } from '@/components/ui/loader';
import { CameraAngleViewport } from './camera-angle-viewport';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';
import { useConnectedInputValue } from '../hooks/use-connected-input';

interface LocalImage {
  url: string;
  storagePath: string;
}

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export const multiAngleDefinition: WorkflowNodeDefinition = {
  type: 'multiAngle',
  label: 'Multi-Angle',
  category: 'processing',
  description: 'Re-render an image from a different camera angle',
  icon: 'Rotate3d',
  inputs: [
    { id: 'image', label: 'Image', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Image 1', type: 'image' },
    { id: 'image2', label: 'Image 2', type: 'image' },
    { id: 'image3', label: 'Image 3', type: 'image' },
    { id: 'image4', label: 'Image 4', type: 'image' },
  ],
  defaultConfig: {
    horizontalAngle: 0,
    verticalAngle: 0,
    zoom: 5,
    loraScale: 1,
    guidanceScale: 4.5,
    numInferenceSteps: 28,
    numImages: 1,
    outputFormat: 'png',
    additionalPrompt: '',
    showAdvanced: false,
    localImage: null,
  },
  minWidth: 300,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a reference image URL to a public URL for the API. */
async function resolveImageUrl(raw: unknown): Promise<string | null> {
  if (!raw || typeof raw !== 'string') return null;

  // Already a URL — use directly
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  // Storage path — upload to get a public URL
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

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const multiAngleExecutor: NodeExecutor = async (inputs, config, context) => {
  // Prefer connected wire input; fall back to locally uploaded image
  const imageInput = inputs.image;
  const localImg = config.localImage as LocalImage | null;
  const rawImage = imageInput || localImg?.storagePath || localImg?.url;
  if (!rawImage) throw new Error('Image input is required — connect one or upload directly');

  // Resolve image to a URL the API can access
  const imageUrl = await resolveImageUrl(rawImage);
  if (!imageUrl) throw new Error('Could not resolve input image');

  // Use the globally selected API (from CreateContext → workflow execution context)
  const apiId = context.apiId;

  const response = await fetch('/api/multi-angle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId,
      imageUrls: [imageUrl],
      horizontalAngle: Number(config.horizontalAngle) || 0,
      verticalAngle: Number(config.verticalAngle) || 0,
      zoom: Number(config.zoom) ?? 5,
      loraScale: Number(config.loraScale) ?? 1,
      guidanceScale: Number(config.guidanceScale) ?? 4.5,
      numInferenceSteps: Number(config.numInferenceSteps) ?? 28,
      numImages: Number(config.numImages) || 1,
      outputFormat: (config.outputFormat as string) || 'png',
      additionalPrompt: (config.additionalPrompt as string) || '',
    }),
    signal: context.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Multi-angle generation failed' }));
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function dispatchConfig(nodeId: string, config: Record<string, unknown>): void {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', { detail: { nodeId, config } }),
  );
}

interface MultiAngleNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function MultiAngleNode({ data, id, selected }: MultiAngleNodeProps) {
  const config = data.config;
  const configRef = React.useRef(config);
  configRef.current = config;

  const status = data.status ?? 'idle';
  const connectedImageUrl = useConnectedInputValue(id, 'image') as string | undefined;
  const localImage = config.localImage as LocalImage | null;
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Priority: connected image > local upload > undefined (sphere)
  const viewportImageUrl = connectedImageUrl || localImage?.url || undefined;

  const horizontalAngle = Number(config.horizontalAngle) || 0;
  const verticalAngle = Number(config.verticalAngle) || 0;
  const zoom = Number(config.zoom) ?? 5;
  const showAdvanced = !!config.showAdvanced;

  const outputImages: string[] = [];
  const keys = ['image', 'image2', 'image3', 'image4'] as const;
  for (const key of keys) {
    const url = data.outputValues?.[key] as string | undefined;
    if (url) outputImages.push(url);
  }

  const handleAngleChange = React.useCallback(
    (h: number, v: number) => {
      dispatchConfig(id, { ...configRef.current, horizontalAngle: h, verticalAngle: v });
    },
    [id],
  );

  const handleZoomChange = React.useCallback(
    (z: number) => {
      dispatchConfig(id, { ...configRef.current, zoom: z });
    },
    [id],
  );

  const update = (key: string, value: unknown): void => {
    dispatchConfig(id, { ...config, [key]: value });
  };

  const uploadFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const preview = URL.createObjectURL(file);
      const tempImg: LocalImage = { url: preview, storagePath: '' };
      dispatchConfig(id, { ...configRef.current, localImage: tempImg });
      setIsUploading(true);

      try {
        const { uploadReferenceImage } = await import('@/utils/supabase/storage');
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const result = await uploadReferenceImage(file, userData.user.id);
        if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

        dispatchConfig(id, {
          ...configRef.current,
          localImage: { url: result.url, storagePath: result.path },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        toast.error(message);
        dispatchConfig(id, { ...configRef.current, localImage: null });
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(preview);
      }
    },
    [id],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) uploadFile(file);
  };

  const removeLocalImage = (): void => {
    dispatchConfig(id, { ...configRef.current, localImage: null });
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={multiAngleDefinition.label}
      icon={<Rotate3d className="size-4" aria-hidden="true" />}
      inputs={multiAngleDefinition.inputs}
      outputs={multiAngleDefinition.outputs}
      minWidth={multiAngleDefinition.minWidth}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="space-y-2.5 nodrag nowheel">
        {/* Image source: upload or connected */}
        {!connectedImageUrl && !localImage && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            aria-label="Upload reference image"
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-[10px] text-muted-foreground">
              Upload image or connect input
            </span>
          </div>
        )}

        {/* Local image thumbnail with remove */}
        {!connectedImageUrl && localImage && (
          <div className="relative group rounded-md overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={localImage.url}
              alt="Uploaded reference"
              className="w-full h-16 object-cover"
              width={300}
              height={64}
              draggable={false}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-4 text-white animate-spin" aria-hidden="true" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeLocalImage(); }}
              className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Remove uploaded image"
            >
              <X className="size-3 text-white" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* 3D Camera Viewport */}
        <CameraAngleViewport
          horizontalAngle={horizontalAngle}
          verticalAngle={verticalAngle}
          zoom={zoom}
          onAngleChange={handleAngleChange}
          onZoomChange={handleZoomChange}
          imageUrl={viewportImageUrl}
        />

        {/* Angle readouts */}
        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-muted-foreground px-0.5">
          <span>H: {horizontalAngle.toFixed(1)}&deg;</span>
          <span>V: {verticalAngle.toFixed(1)}&deg;</span>
          <span>Z: {zoom.toFixed(1)}</span>
        </div>

        {/* Additional prompt */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">
            Additional Prompt
          </label>
          <textarea
            value={(config.additionalPrompt as string) || ''}
            onChange={(e) => update('additionalPrompt', e.target.value)}
            placeholder={"Optional: describe desired changes\u2026"}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Additional prompt for image editing"
          />
        </div>

        {/* Advanced settings toggle */}
        <button
          type="button"
          onClick={() => update('showAdvanced', !showAdvanced)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
          aria-expanded={showAdvanced}
          aria-controls={`${id}-advanced`}
        >
          {showAdvanced ? (
            <ChevronDown className="size-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3" aria-hidden="true" />
          )}
          Advanced Settings
        </button>

        {showAdvanced && (
          <div id={`${id}-advanced`} className="space-y-2 pl-1">
            {/* LoRA Scale */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 flex justify-between">
                <span>LoRA Scale</span>
                <span className="font-mono">{Number(config.loraScale ?? 1).toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={4}
                step={0.1}
                value={Number(config.loraScale ?? 1)}
                onChange={(e) => update('loraScale', parseFloat(e.target.value))}
                className="w-full h-1.5 accent-primary"
                aria-label="LoRA scale"
              />
            </div>

            {/* Guidance Scale */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 flex justify-between">
                <span>Guidance</span>
                <span className="font-mono">{Number(config.guidanceScale ?? 4.5).toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={Number(config.guidanceScale ?? 4.5)}
                onChange={(e) => update('guidanceScale', parseFloat(e.target.value))}
                className="w-full h-1.5 accent-primary"
                aria-label="Guidance scale"
              />
            </div>

            {/* Inference Steps */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 flex justify-between">
                <span>Steps</span>
                <span className="font-mono">{Number(config.numInferenceSteps ?? 28)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={Number(config.numInferenceSteps ?? 28)}
                onChange={(e) => update('numInferenceSteps', parseInt(e.target.value, 10))}
                className="w-full h-1.5 accent-primary"
                aria-label="Number of inference steps"
              />
            </div>

            {/* Num Images */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Images</label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('numImages', n)}
                    className={cn(
                      'flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring',
                      Number(config.numImages || 1) === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                    aria-label={`Generate ${n} image${n > 1 ? 's' : ''}`}
                    aria-pressed={Number(config.numImages || 1) === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Format</label>
              <div className="flex gap-0.5">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => update('outputFormat', fmt)}
                    className={cn(
                      'flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors uppercase focus-visible:ring-1 focus-visible:ring-ring',
                      (config.outputFormat || 'png') === fmt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                    aria-label={`Output format: ${fmt.toUpperCase()}`}
                    aria-pressed={(config.outputFormat || 'png') === fmt}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status display */}
        {status === 'running' && (
          <div className="flex items-center gap-2 py-2">
            <Loader size="sm" />
            <span className="text-xs text-muted-foreground">Generating angles\u2026</span>
          </div>
        )}

        {status === 'success' && outputImages.length > 0 && (
          <div
            className={cn(
              'gap-1',
              outputImages.length === 1 ? 'block' : 'grid grid-cols-2',
            )}
          >
            {outputImages.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative rounded-md overflow-hidden border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Multi-angle result ${i + 1}`}
                  className="w-full h-28 object-cover"
                  width={280}
                  height={112}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}

        {status === 'idle' && !viewportImageUrl && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Upload or connect an image, then adjust camera angle
          </p>
        )}
      </div>
    </BaseWorkflowNode>
  );
}
