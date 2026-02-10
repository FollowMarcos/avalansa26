'use client';

import * as React from 'react';
import { Rotate3d, ChevronDown, ChevronRight } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { Loader } from '@/components/ui/loader';
import { CameraAngleViewport, buildCameraPrompt } from './camera-angle-viewport';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';
import { cn } from '@/lib/utils';
import { useConnectedInputValue } from '../hooks/use-connected-input';
import { ImageUploadSlot } from '../shared/image-upload-slot';
import type { UploadedImage } from '../shared/image-upload-slot';
import { createClient } from '@/utils/supabase/client';

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
    { id: 'settings', label: 'Settings', type: 'settings' },
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
    guidanceScale: 1,
    numInferenceSteps: 4,
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

/** Resolve a value (URL or storage path) to a displayable / API-accessible URL. */
function resolveToPublicUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http') || raw.startsWith('blob:') || raw.startsWith('data:')) return raw;

  // Storage path — resolve to a public URL via Supabase
  const supabase = createClient();
  const { data } = supabase.storage.from('reference-images').getPublicUrl(raw);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const multiAngleExecutor: NodeExecutor = async (inputs, config, context) => {
  // Prefer connected wire input; fall back to locally uploaded image
  const imageInput = inputs.image as string | undefined;
  const localImg = config.localImage as Record<string, unknown> | null;

  // Build image source — send storage paths to server for reliable resolution
  let imageUrls: string[] | undefined;
  let imageStoragePaths: string[] | undefined;

  if (imageInput) {
    // Connected wire — could be a URL or a storage path from another node
    const resolved = resolveToPublicUrl(imageInput);
    if (resolved?.startsWith('http')) {
      imageUrls = [resolved];
    } else if (imageInput) {
      imageStoragePaths = [imageInput];
    }
  } else if (localImg) {
    // Locally uploaded image — prefer storagePath (server resolves reliably)
    const path = (localImg.storagePath || localImg.path) as string | undefined;
    const url = localImg.url as string | undefined;

    if (path) {
      imageStoragePaths = [path];
    } else if (url?.startsWith('http')) {
      imageUrls = [url];
    }
  }

  if (!imageUrls?.length && !imageStoragePaths?.length) {
    throw new Error('Image input is required — connect one or upload directly');
  }

  // Priority: settings wire > global context
  const settings = (inputs.settings as Record<string, unknown>) || {};
  const apiId = (settings.apiId as string) || context.apiId;

  const response = await fetch('/api/multi-angle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId,
      ...(imageUrls ? { imageUrls } : {}),
      ...(imageStoragePaths ? { imageStoragePaths } : {}),
      horizontalAngle: Number(config.horizontalAngle) || 0,
      verticalAngle: Number(config.verticalAngle) || 0,
      zoom: Number(config.zoom) ?? 5,
      loraScale: Number(config.loraScale) ?? 1,
      guidanceScale: Number(config.guidanceScale) ?? 1,
      numInferenceSteps: Number(config.numInferenceSteps) ?? 4,
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

interface MultiAngleNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function MultiAngleNode({ data, id, selected }: MultiAngleNodeProps) {
  const [config, update, updateMultiple] = useNodeConfig(id, data.config);

  const status = data.status ?? 'idle';
  const connectedImageUrl = useConnectedInputValue(id, 'image') as string | undefined;
  const localImage = config.localImage as UploadedImage | null;

  // Priority: connected image > local upload > undefined (sphere)
  // Resolve storage paths to displayable public URLs
  const viewportImageUrl = React.useMemo(
    () => resolveToPublicUrl(connectedImageUrl || localImage?.url),
    [connectedImageUrl, localImage?.url],
  );

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
      updateMultiple({ horizontalAngle: h, verticalAngle: v });
    },
    [updateMultiple],
  );

  const handleZoomChange = React.useCallback(
    (z: number) => {
      update('zoom', z);
    },
    [update],
  );

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
      <div className="space-y-2.5 nodrag nowheel">
        {/* Image source: upload or connected */}
        {!connectedImageUrl && (
          <ImageUploadSlot
            images={localImage ? [localImage] : []}
            onChange={(imgs) => update('localImage', imgs[0] ?? null)}
            maxImages={1}
            showLibraryPicker={false}
            emptyLabel="Upload image or connect input"
            previewHeight="h-16"
          />
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

        {/* Snap position preview */}
        <p className="text-[10px] text-muted-foreground text-center truncate px-0.5">
          {buildCameraPrompt(horizontalAngle, verticalAngle)}
        </p>

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
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
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
                <span className="font-mono tabular-nums">{Number(config.loraScale ?? 1).toFixed(2)}</span>
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
                <span className="font-mono tabular-nums">{Number(config.guidanceScale ?? 1).toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={Number(config.guidanceScale ?? 1)}
                onChange={(e) => update('guidanceScale', parseFloat(e.target.value))}
                className="w-full h-1.5 accent-primary"
                aria-label="Guidance scale"
              />
            </div>

            {/* Inference Steps */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 flex justify-between">
                <span>Steps</span>
                <span className="font-mono tabular-nums">{Number(config.numInferenceSteps ?? 4)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={Number(config.numInferenceSteps ?? 4)}
                onChange={(e) => update('numInferenceSteps', parseInt(e.target.value, 10))}
                className="w-full h-1.5 accent-primary"
                aria-label="Number of inference steps"
              />
            </div>

            {/* Num Images */}
            <div>
              <span id={`${id}-images-label`} className="text-[10px] text-muted-foreground mb-0.5 block">Images</span>
              <div className="flex gap-0.5" role="radiogroup" aria-labelledby={`${id}-images-label`}>
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
              <span id={`${id}-format-label`} className="text-[10px] text-muted-foreground mb-0.5 block">Format</span>
              <div className="flex gap-0.5" role="radiogroup" aria-labelledby={`${id}-format-label`}>
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
          <div className="flex items-center gap-2 py-2" role="status" aria-live="polite">
            <Loader size="sm" />
            <span className="text-xs text-muted-foreground">Generating angles{"\u2026"}</span>
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
