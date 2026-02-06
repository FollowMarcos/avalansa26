'use client';

import * as React from 'react';
import { ImagePlus, Upload, X, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import { useCreate } from '../../create-context';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import type { ReferenceImageWithUrl } from '@/types/reference-image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export const imageToImageDefinition: WorkflowNodeDefinition = {
  type: 'imageToImage',
  label: 'Reference Image',
  category: 'input',
  description: 'Provide a reference image for image-to-image generation',
  icon: 'ImagePlus',
  inputs: [
    { id: 'image', label: 'Source', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Reference', type: 'image' },
  ],
  defaultConfig: { imageUrl: '', storagePath: '' },
  minWidth: 240,
};

export const imageToImageExecutor: NodeExecutor = async (inputs, config) => {
  // Prefer connected input, then storage path from uploaded image
  const connectedImage = inputs.image as string | undefined;
  const storagePath = config.storagePath as string;

  if (connectedImage) return { image: connectedImage };
  if (storagePath) return { image: storagePath };

  throw new Error('No reference image provided');
};

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface ImageToImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageToImageNode({ data, id, selected }: ImageToImageNodeProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const config = data.config;
  const imageUrl = (config.imageUrl as string) || '';
  const storagePath = (config.storagePath as string) || '';
  const hasConnectedInput = Boolean(data.outputValues?.image);

  // Access the shared reference images system from create-context
  const { savedReferences, loadSavedReferences } = useCreate();

  // Load saved references when library opens
  React.useEffect(() => {
    if (showLibrary && savedReferences.length === 0) {
      loadSavedReferences();
    }
  }, [showLibrary, savedReferences.length, loadSavedReferences]);

  /** Pick an already-uploaded image from the shared library */
  const handlePickSaved = (saved: ReferenceImageWithUrl) => {
    dispatchConfig(id, {
      ...config,
      imageUrl: saved.url,
      storagePath: saved.storage_path,
    });
    setShowLibrary(false);
  };

  /** Upload a new file to Supabase storage, matching the canvas composer flow */
  const uploadFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Show local preview immediately
      const preview = URL.createObjectURL(file);
      dispatchConfig(id, { ...config, imageUrl: preview, storagePath: '' });
      setIsUploading(true);

      try {
        const { uploadReferenceImage } = await import('@/utils/supabase/storage');
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const result = await uploadReferenceImage(file, user.id);
        if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

        // Store public URL (for preview) + storage path (for executor)
        dispatchConfig(id, {
          ...config,
          imageUrl: result.url,
          storagePath: result.path,
        });

        // Create a DB record so it appears in the shared saved references library
        try {
          const { createReferenceImageRecord } = await import(
            '@/utils/supabase/reference-images.server'
          );
          await createReferenceImageRecord(result.path, file.name);
          // Refresh the library so the new image is immediately available
          loadSavedReferences();
        } catch {
          // Non-critical — image is uploaded, just not linked in the library
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        toast.error(message);
        dispatchConfig(id, { ...config, imageUrl: '', storagePath: '' });
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(preview);
      }
    },
    [id, config, loadSavedReferences],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatchConfig(id, { ...config, imageUrl: '', storagePath: '' });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageToImageDefinition.label}
      icon={<ImagePlus className="size-4" />}
      inputs={imageToImageDefinition.inputs}
      outputs={imageToImageDefinition.outputs}
      minWidth={imageToImageDefinition.minWidth}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Reference"
            className="w-full h-32 object-cover"
            draggable={false}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-5 text-white animate-spin" />
            </div>
          )}
          {!isUploading && storagePath && (
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white">
              Uploaded
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Remove reference image"
          >
            <X className="size-3.5 text-white" />
          </button>
        </div>
      ) : showLibrary ? (
        /* Saved references picker */
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border">
            <span className="text-[10px] font-medium">Your Images</span>
            <button
              type="button"
              onClick={() => setShowLibrary(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close library"
            >
              <X className="size-3" />
            </button>
          </div>
          <ScrollArea className="nodrag nowheel h-20">
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
                    onClick={() => handlePickSaved(ref)}
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
      ) : (
        /* Empty state — upload or pick from library */
        <div className="space-y-1.5">
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
            className="flex flex-col items-center justify-center h-20 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <Upload className="size-4 text-muted-foreground mb-1" />
            <span className="text-[10px] text-muted-foreground">
              Drop or click to upload
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md',
              'text-[10px] text-muted-foreground hover:text-foreground',
              'border border-border hover:bg-muted/40 transition-colors',
            )}
          >
            <FolderOpen className="size-3" />
            Pick from library
            {savedReferences.length > 0 && (
              <span className="text-muted-foreground/60">
                ({savedReferences.length})
              </span>
            )}
          </button>
        </div>
      )}

      {hasConnectedInput && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Using connected source image
        </p>
      )}
    </BaseWorkflowNode>
  );
}
