'use client';

import * as React from 'react';
import { ImagePlus, Upload, X, Loader2, FolderOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import { useCreate } from '../../create-context';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import type { ReferenceImageWithUrl } from '@/types/reference-image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAX_IMAGES = 5;

interface RefImage {
  url: string;
  storagePath: string;
}

export const imageToImageDefinition: WorkflowNodeDefinition = {
  type: 'imageToImage',
  label: 'Reference Image',
  category: 'input',
  description: 'Provide one or more reference images (up to 5)',
  icon: 'ImagePlus',
  inputs: [
    { id: 'image', label: 'Source', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Primary', type: 'image' },
    { id: 'references', label: 'All Refs', type: 'image' },
  ],
  defaultConfig: { images: [] },
  minWidth: 240,
};

export const imageToImageExecutor: NodeExecutor = async (inputs, config) => {
  const connectedImage = inputs.image as string | undefined;

  // New multi-image config
  const images = (config.images as RefImage[]) ?? [];

  // Legacy single-image config (backward compat)
  const legacyPath = config.storagePath as string | undefined;

  if (connectedImage) {
    return { image: connectedImage, references: [connectedImage] };
  }

  if (images.length > 0) {
    const paths = images.map((i) => i.storagePath).filter(Boolean);
    if (paths.length === 0) throw new Error('Images are still uploading');
    return { image: paths[0], references: paths };
  }

  // Legacy fallback
  if (legacyPath) {
    return { image: legacyPath, references: [legacyPath] };
  }

  throw new Error('No reference images provided');
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
  const [uploadingCount, setUploadingCount] = React.useState(0);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const config = data.config;
  const hasConnectedInput = Boolean(data.outputValues?.image);

  // Multi-image list (new format)
  const images: RefImage[] = React.useMemo(() => {
    const imgs = config.images as RefImage[] | undefined;
    if (imgs && imgs.length > 0) return imgs;
    // Migrate legacy single-image config
    const legacyUrl = config.imageUrl as string | undefined;
    const legacyPath = config.storagePath as string | undefined;
    if (legacyUrl || legacyPath) {
      return [{ url: legacyUrl || '', storagePath: legacyPath || '' }];
    }
    return [];
  }, [config.images, config.imageUrl, config.storagePath]);

  const canAddMore = images.length < MAX_IMAGES;

  const { savedReferences, loadSavedReferences } = useCreate();

  React.useEffect(() => {
    if (showLibrary && savedReferences.length === 0) {
      loadSavedReferences();
    }
  }, [showLibrary, savedReferences.length, loadSavedReferences]);

  const updateImages = React.useCallback(
    (newImages: RefImage[]) => {
      dispatchConfig(id, { ...config, images: newImages, imageUrl: '', storagePath: '' });
    },
    [id, config],
  );

  const handlePickSaved = (saved: ReferenceImageWithUrl) => {
    if (!canAddMore) {
      toast.error(`Maximum ${MAX_IMAGES} reference images`);
      return;
    }
    const already = images.some((i) => i.storagePath === saved.storage_path);
    if (already) {
      toast.info('Image already added');
      return;
    }
    updateImages([...images, { url: saved.url, storagePath: saved.storage_path }]);
  };

  const uploadFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const preview = URL.createObjectURL(file);
      // Add with preview URL immediately (no storagePath yet)
      const tempImg: RefImage = { url: preview, storagePath: '' };
      const currentImages = (config.images as RefImage[]) ?? images;
      const updatedWithPreview = [...currentImages, tempImg];
      dispatchConfig(id, { ...config, images: updatedWithPreview, imageUrl: '', storagePath: '' });
      setUploadingCount((c) => c + 1);

      try {
        const { uploadReferenceImage } = await import('@/utils/supabase/storage');
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const result = await uploadReferenceImage(file, userData.user.id);
        if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

        // Replace the preview entry with the real upload
        const finalImg: RefImage = { url: result.url, storagePath: result.path };
        // Re-read current config to avoid stale closure
        dispatchConfig(id, {
          ...config,
          images: updatedWithPreview.map((img) =>
            img.url === preview ? finalImg : img,
          ),
          imageUrl: '',
          storagePath: '',
        });

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
        // Remove the failed preview entry
        dispatchConfig(id, {
          ...config,
          images: currentImages,
          imageUrl: '',
          storagePath: '',
        });
      } finally {
        setUploadingCount((c) => c - 1);
        URL.revokeObjectURL(preview);
      }
    },
    [id, config, images, loadSavedReferences],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const available = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, available);
    if (files.length > available) {
      toast.info(`Only adding ${available} image${available === 1 ? '' : 's'} (max ${MAX_IMAGES})`);
    }
    for (const file of toUpload) {
      await uploadFile(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    const available = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, available);
    if (files.length > available) {
      toast.info(`Only adding ${available} image${available === 1 ? '' : 's'} (max ${MAX_IMAGES})`);
    }
    for (const file of toUpload) {
      await uploadFile(file);
    }
  };

  const removeImage = (index: number) => {
    updateImages(images.filter((_, i) => i !== index));
  };

  const isUploading = uploadingCount > 0;

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
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {images.length > 0 ? (
        <div className="space-y-1.5">
          {/* Image grid */}
          <div className={cn(
            'grid gap-1',
            images.length === 1 ? 'grid-cols-1' : images.length <= 4 ? 'grid-cols-2' : 'grid-cols-3',
          )}>
            {images.map((img, i) => (
              <div key={`${img.storagePath || img.url}-${i}`} className="relative group rounded-md overflow-hidden border border-border aspect-square">
                <img
                  src={img.url}
                  alt={`Reference ${i + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Uploading overlay */}
                {!img.storagePath && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="size-4 text-white animate-spin" />
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
                  aria-label={`Remove reference image ${i + 1}`}
                >
                  <X className="size-3 text-white" />
                </button>
                {/* Index badge */}
                <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-black/60 text-[8px] text-white font-mono">
                  {i + 1}
                </span>
              </div>
            ))}

            {/* Add more tile */}
            {canAddMore && (
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
                <Plus className="size-4 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground mt-0.5">Add</span>
              </div>
            )}
          </div>

          {/* Count + library button */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {images.length}/{MAX_IMAGES} images
              {isUploading && ' (uploading...)'}
            </span>
            <button
              type="button"
              onClick={() => setShowLibrary(!showLibrary)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Pick from library"
            >
              <FolderOpen className="size-3 inline mr-0.5" />
              Library
            </button>
          </div>

          {/* Library picker (inline) */}
          {showLibrary && (
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
              <ScrollArea className="nodrag nowheel h-32">
                {savedReferences.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-3">
                    No saved images yet
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-0.5 p-1">
                    {savedReferences.map((ref) => {
                      const alreadyAdded = images.some((i) => i.storagePath === ref.storage_path);
                      return (
                        <button
                          key={ref.id}
                          type="button"
                          onClick={() => handlePickSaved(ref)}
                          disabled={alreadyAdded || !canAddMore}
                          className={cn(
                            'relative aspect-square rounded-sm overflow-hidden border transition-all',
                            alreadyAdded
                              ? 'border-primary/50 opacity-50 cursor-not-allowed'
                              : canAddMore
                                ? 'border-border hover:ring-1 hover:ring-primary'
                                : 'border-border opacity-40 cursor-not-allowed',
                          )}
                          title={alreadyAdded ? 'Already added' : (ref.name || 'Reference image')}
                        >
                          <img
                            src={ref.url}
                            alt={ref.name || 'Reference'}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          {alreadyAdded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-[8px] text-white font-bold">Added</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      ) : showLibrary ? (
        /* Saved references picker (no images yet) */
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
          <ScrollArea className="nodrag nowheel h-40">
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
              Drop or click to upload (up to {MAX_IMAGES})
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
