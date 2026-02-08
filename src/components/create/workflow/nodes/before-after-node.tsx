'use client';

import * as React from 'react';
import { Columns2, GripVertical, Upload, FolderOpen, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import { useCreate } from '../../create-context';
import { createClient } from '@/utils/supabase/client';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import type { ReferenceImageWithUrl } from '@/types/reference-image';
import { ScrollArea } from '@/components/ui/scroll-area';

/** Resolve a value that may be a storage path or a displayable URL */
function resolveImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) return value;
  // It's a storage path — resolve to a public URL via Supabase
  const supabase = createClient();
  const { data } = supabase.storage.from('reference-images').getPublicUrl(value);
  return data.publicUrl;
}

interface SlotImage {
  url: string;
  storagePath: string;
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

  const beforeConfig = config.beforeImage as SlotImage | undefined;
  const afterConfig = config.afterImage as SlotImage | undefined;

  const before = beforeInput || beforeConfig?.storagePath || beforeConfig?.url;
  const after = afterInput || afterConfig?.storagePath || afterConfig?.url;

  if (!before || !after) throw new Error('Both before and after images are required');
  return { before, after, before_out: before, after_out: after };
};

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface BeforeAfterImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

/** Upload/picker for a single image slot */
function ImageSlot({
  label,
  image,
  onUpload,
  onPickFromLibrary,
  onRemove,
  isUploading,
}: {
  label: string;
  image: SlotImage | undefined;
  onUpload: (file: File) => void;
  onPickFromLibrary: () => void;
  onRemove: () => void;
  isUploading: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onUpload(file);
  };

  return (
    <div className="flex-1 min-w-0">
      <span className="text-[10px] font-medium text-muted-foreground mb-1 block">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {image ? (
        <div className="relative group rounded-md overflow-hidden border border-border aspect-square">
          <img
            src={image.url}
            alt={label}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-4 text-white animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
            aria-label={`Remove ${label} image`}
          >
            <X className="size-3 text-white" />
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center aspect-square rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <Upload className="size-3.5 text-muted-foreground mb-0.5" />
            <span className="text-[9px] text-muted-foreground">Upload</span>
          </div>
          <button
            type="button"
            onClick={onPickFromLibrary}
            className="flex items-center justify-center gap-1 w-full py-1 rounded text-[9px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40 transition-colors"
          >
            <FolderOpen className="size-3" />
            Library
          </button>
        </div>
      )}
    </div>
  );
}

export function BeforeAfterImageNode({ data, id, selected }: BeforeAfterImageNodeProps) {
  const status = data.status ?? 'idle';
  const config = data.config;

  // Wire-connected images (from execution output)
  const connectedBefore = data.outputValues?.before as string | undefined;
  const connectedAfter = data.outputValues?.after as string | undefined;

  // Config images (uploaded/picked directly)
  const configBefore = config.beforeImage as SlotImage | undefined;
  const configAfter = config.afterImage as SlotImage | undefined;

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
  const [librarySlot, setLibrarySlot] = React.useState<'before' | 'after' | null>(null);
  const [uploadingSlot, setUploadingSlot] = React.useState<'before' | 'after' | null>(null);

  const { savedReferences, loadSavedReferences } = useCreate();

  React.useEffect(() => {
    if (librarySlot && savedReferences.length === 0) {
      loadSavedReferences();
    }
  }, [librarySlot, savedReferences.length, loadSavedReferences]);

  const updateConfig = React.useCallback(
    (updates: Record<string, unknown>) => {
      dispatchConfig(id, { ...config, ...updates });
    },
    [id, config],
  );

  const uploadFile = React.useCallback(
    async (file: File, slot: 'before' | 'after') => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const preview = URL.createObjectURL(file);
      const key = slot === 'before' ? 'beforeImage' : 'afterImage';
      const tempImg: SlotImage = { url: preview, storagePath: '' };
      updateConfig({ [key]: tempImg });
      setUploadingSlot(slot);

      try {
        const { uploadReferenceImage } = await import('@/utils/supabase/storage');
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const result = await uploadReferenceImage(file, userData.user.id);
        if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

        updateConfig({ [key]: { url: result.url, storagePath: result.path } });

        try {
          const { createReferenceImageRecord } = await import(
            '@/utils/supabase/reference-images.server'
          );
          await createReferenceImageRecord(result.path, file.name);
          loadSavedReferences();
        } catch {
          // Non-critical
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        toast.error(message);
        updateConfig({ [key]: undefined });
      } finally {
        setUploadingSlot(null);
        URL.revokeObjectURL(preview);
      }
    },
    [updateConfig, loadSavedReferences],
  );

  const handlePickSaved = (saved: ReferenceImageWithUrl, slot: 'before' | 'after') => {
    const key = slot === 'before' ? 'beforeImage' : 'afterImage';
    updateConfig({ [key]: { url: saved.url, storagePath: saved.storage_path } });
    setLibrarySlot(null);
  };

  const removeImage = (slot: 'before' | 'after') => {
    const key = slot === 'before' ? 'beforeImage' : 'afterImage';
    updateConfig({ [key]: undefined });
  };

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
              className="absolute top-1/2 size-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-col-resize z-10 hover:scale-110 transition-transform"
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
                updateConfig({ beforeImage: configAfter, afterImage: configBefore });
              }}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Swap images
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Two side-by-side upload slots */}
          <div className="flex gap-2">
            <ImageSlot
              label="Before"
              image={configBefore}
              onUpload={(file) => uploadFile(file, 'before')}
              onPickFromLibrary={() => setLibrarySlot('before')}
              onRemove={() => removeImage('before')}
              isUploading={uploadingSlot === 'before'}
            />
            <ImageSlot
              label="After"
              image={configAfter}
              onUpload={(file) => uploadFile(file, 'after')}
              onPickFromLibrary={() => setLibrarySlot('after')}
              onRemove={() => removeImage('after')}
              isUploading={uploadingSlot === 'after'}
            />
          </div>

          <p className="text-[9px] text-muted-foreground text-center">
            Upload images or connect inputs
          </p>
        </div>
      )}

      {/* Library picker */}
      {librarySlot && (
        <div className="mt-1.5 rounded-md border border-border overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border">
            <span className="text-[10px] font-medium">
              Pick {librarySlot === 'before' ? 'Before' : 'After'} Image
            </span>
            <button
              type="button"
              onClick={() => setLibrarySlot(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close library"
            >
              <X className="size-3" />
            </button>
          </div>
          <ScrollArea className="nodrag nowheel h-32">
            {savedReferences.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                No saved images yet
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-0.5 p-1">
                {savedReferences.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => handlePickSaved(ref, librarySlot)}
                    className="relative aspect-square rounded-sm overflow-hidden border border-border hover:ring-1 hover:ring-primary transition-all"
                    title={ref.name || 'Reference image'}
                  >
                    <img
                      src={ref.url}
                      alt={ref.name || 'Reference'}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </BaseWorkflowNode>
  );
}
