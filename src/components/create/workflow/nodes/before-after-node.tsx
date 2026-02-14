'use client';

import * as React from 'react';
import { Columns2, GripVertical } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { resolveStorageUrl } from '@/utils/r2/url-helpers';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';
import { ImageUploadSlot } from '../shared/image-upload-slot';
import type { UploadedImage } from '../shared/image-upload-slot';

/** Resolve a value that may be a storage path or a displayable URL */
function resolveImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) return value;
  // It's a storage path — resolve to a public URL (handles both R2 and Supabase paths)
  return resolveStorageUrl(value, 'reference-images');
}

export const beforeAfterDefinition: WorkflowNodeDefinition = {
  type: 'beforeAfterImage',
  label: 'Before & After',
  category: 'output',
  description: 'Compare two images with an interactive slider',
  icon: 'Columns2',
  inputs: [
    { id: 'before', label: 'Before', type: 'image' },
    { id: 'after', label: 'After', type: 'image' },
  ],
  outputs: [
    { id: 'before_out', label: 'Before', type: 'image' },
    { id: 'after_out', label: 'After', type: 'image' },
  ],
  defaultConfig: {},
  minWidth: 320,
};

export const beforeAfterExecutor: NodeExecutor = async (inputs, config) => {
  // Prefer connected wire inputs; fall back to config (uploaded/picked images)
  const beforeInput = inputs.before as string | undefined;
  const afterInput = inputs.after as string | undefined;

  const beforeConfig = config.beforeImage as UploadedImage | undefined;
  const afterConfig = config.afterImage as UploadedImage | undefined;

  const before = beforeInput || beforeConfig?.storagePath || beforeConfig?.url;
  const after = afterInput || afterConfig?.storagePath || afterConfig?.url;

  if (!before || !after) throw new Error('Both before and after images are required');
  return { before, after, before_out: before, after_out: after };
};

interface BeforeAfterImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function BeforeAfterImageNode({ data, id, selected }: BeforeAfterImageNodeProps) {
  const status = data.status ?? 'idle';
  const [config, , updateMultiple] = useNodeConfig(id, data.config);

  // Wire-connected images (from execution output)
  const connectedBefore = data.outputValues?.before as string | undefined;
  const connectedAfter = data.outputValues?.after as string | undefined;

  // Config images (uploaded/picked directly)
  const configBefore = config.beforeImage as UploadedImage | undefined;
  const configAfter = config.afterImage as UploadedImage | undefined;

  // Use connected images when executed, otherwise show config images for preview
  // Resolve storage paths to public URLs (reference image node outputs paths, not URLs)
  const rawBefore = (status === 'success' && connectedBefore) ? connectedBefore : configBefore?.url;
  const rawAfter = (status === 'success' && connectedAfter) ? connectedAfter : configAfter?.url;
  const beforeUrl = React.useMemo(() => resolveImageUrl(rawBefore), [rawBefore]);
  const afterUrl = React.useMemo(() => resolveImageUrl(rawAfter), [rawAfter]);
  const hasImages = beforeUrl && afterUrl;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);

  // Slider drag logic
  const updateSlider = React.useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      updateSlider(e.clientX);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, updateSlider]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={beforeAfterDefinition.label}
      icon={<Columns2 className="size-4" />}
      inputs={beforeAfterDefinition.inputs}
      outputs={beforeAfterDefinition.outputs}
      minWidth={beforeAfterDefinition.minWidth}
      maxWidth={500}
    >
      {hasImages ? (
        <div className="space-y-1.5">
          {/* Comparison slider */}
          <div
            ref={containerRef}
            className="relative rounded-md overflow-hidden border border-border select-none aspect-square"
            style={{ cursor: isDragging ? 'col-resize' : undefined }}
          >
            {/* Before image (full layer) */}
            <img
              src={beforeUrl}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* After image (clipped from the right) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
            >
              <img
                src={afterUrl}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.6)] pointer-events-none"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            />

            {/* Drag handle */}
            <div
              onPointerDown={handlePointerDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSliderPosition((prev) => Math.max(5, prev - 5));
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSliderPosition((prev) => Math.min(95, prev + 5));
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  setSliderPosition(5);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  setSliderPosition(95);
                }
              }}
              className="absolute top-1/2 size-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-col-resize z-10 hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
              style={{ left: `${sliderPosition}%`, transform: 'translate(-50%, -50%)' }}
              role="slider"
              aria-label="Comparison slider"
              aria-valuenow={Math.round(sliderPosition)}
              aria-valuemin={5}
              aria-valuemax={95}
              tabIndex={0}
            >
              <GripVertical className="size-4 text-zinc-500" aria-hidden="true" />
            </div>

            {/* Labels */}
            <span className="absolute bottom-2 left-2 text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
              Before
            </span>
            <span className="absolute bottom-2 right-2 text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
              After
            </span>
          </div>

          {/* Swap images hint */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                updateMultiple({ beforeImage: configAfter, afterImage: configBefore });
              }}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Swap images
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground mb-1 block">Before</span>
              <ImageUploadSlot
                images={configBefore ? [configBefore] : []}
                onChange={(imgs) => updateMultiple({ beforeImage: imgs[0] ?? undefined })}
                maxImages={1}
                emptyLabel="Upload"
                previewHeight="h-20"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground mb-1 block">After</span>
              <ImageUploadSlot
                images={configAfter ? [configAfter] : []}
                onChange={(imgs) => updateMultiple({ afterImage: imgs[0] ?? undefined })}
                maxImages={1}
                emptyLabel="Upload"
                previewHeight="h-20"
              />
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground text-center">
            Upload images or connect inputs
          </p>
        </div>
      )}
    </BaseWorkflowNode>
  );
}
