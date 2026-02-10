'use client';

import * as React from 'react';
import { Upload, X, Loader2, ImageIcon, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreate } from '../../create-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReferenceImageWithUrl } from '@/types/reference-image';

export interface UploadedImage {
  url: string;
  storagePath: string;
}

interface ImageUploadSlotProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  showLibraryPicker?: boolean;
  emptyLabel?: string;
  previewHeight?: string;
}

export function ImageUploadSlot({
  images, onChange, maxImages = 1, showLibraryPicker = true,
  emptyLabel = 'Drop or click to upload', previewHeight = 'h-16',
}: ImageUploadSlotProps): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingUrls, setUploadingUrls] = React.useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const { savedReferences, loadSavedReferences } = useCreate();
  const canAddMore = images.length < maxImages;

  React.useEffect(() => {
    if (showLibrary && savedReferences.length === 0) loadSavedReferences();
  }, [showLibrary, savedReferences.length, loadSavedReferences]);

  const uploadFile = React.useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const blobUrl = URL.createObjectURL(file);
    const tempImg: UploadedImage = { url: blobUrl, storagePath: '' };
    const updated = [...images, tempImg];
    onChange(updated);
    setUploadingUrls((s) => new Set(s).add(blobUrl));
    try {
      const { uploadReferenceImage } = await import('@/utils/supabase/storage');
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const result = await uploadReferenceImage(file, userData.user.id);
      if (result.error || !result.path) throw new Error(result.error || 'Upload failed');
      onChange(updated.map((img) => (img.url === blobUrl ? { url: result.url, storagePath: result.path } : img)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      onChange(images);
    } finally {
      setUploadingUrls((s) => { const n = new Set(s); n.delete(blobUrl); return n; });
      URL.revokeObjectURL(blobUrl);
    }
  }, [images, onChange]);

  const processFiles = async (files: File[]) => {
    const available = maxImages - images.length;
    const toUpload = files.slice(0, available);
    if (files.length > available) toast.info(`Only adding ${available} image${available === 1 ? '' : 's'} (max ${maxImages})`);
    for (const f of toUpload) await uploadFile(f);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files ?? []));
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    await processFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')));
  };

  const handlePickSaved = (saved: ReferenceImageWithUrl) => {
    if (!canAddMore) { toast.error(`Maximum ${maxImages} image${maxImages === 1 ? '' : 's'}`); return; }
    if (images.some((i) => i.storagePath === saved.storage_path)) { toast.info('Image already added'); return; }
    onChange([...images, { url: saved.url, storagePath: saved.storage_path }]);
  };

  const triggerInput = () => inputRef.current?.click();
  const onKeyActivate = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerInput(); } };

  const libraryPanel = (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border">
        <span className="text-[10px] font-medium">Your Images</span>
        <button type="button" onClick={() => setShowLibrary(false)} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" aria-label="Close library"><X className="size-3" /></button>
      </div>
      <ScrollArea className="nodrag nowheel h-32">
        {savedReferences.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3">No saved images yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-0.5 p-1">
            {savedReferences.map((ref) => {
              const added = images.some((i) => i.storagePath === ref.storage_path);
              return (
                <button key={ref.id} type="button" onClick={() => handlePickSaved(ref)} disabled={added || !canAddMore}
                  className={cn('relative aspect-square rounded-sm overflow-hidden border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    added ? 'border-primary/50 opacity-50 cursor-not-allowed' : canAddMore ? 'border-border hover:ring-1 hover:ring-primary' : 'border-border opacity-40 cursor-not-allowed')}
                  title={added ? 'Already added' : (ref.name || 'Reference image')}>
                  <img src={ref.url} alt={ref.name || 'Reference'} className="w-full h-full object-cover" draggable={false} />
                  {added && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-[8px] text-white font-bold">Added</span></div>}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const fileInput = (
    <input ref={inputRef} type="file" accept="image/*" multiple={maxImages > 1} className="hidden" onChange={handleFileSelect} />
  );

  // Empty state
  if (images.length === 0) {
    return (
      <div className="space-y-1.5">
        {fileInput}
        {showLibrary ? libraryPanel : (
          <>
            <div role="button" tabIndex={0} onClick={triggerInput} onKeyDown={onKeyActivate}
              onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)}
              className={cn('flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', previewHeight, isDragOver && 'border-primary bg-primary/5')}
              aria-label={emptyLabel}>
              <Upload className="size-4 text-muted-foreground mb-1" />
              <span className="text-[10px] text-muted-foreground">{emptyLabel}</span>
            </div>
            {showLibraryPicker && (
              <button type="button" onClick={() => setShowLibrary(true)}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Pick from library">
                <FolderOpen className="size-3" />Pick from library
                {savedReferences.length > 0 && <span className="text-muted-foreground/60">({savedReferences.length})</span>}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Has images
  return (
    <div className="space-y-1.5">
      {fileInput}
      <div className={cn('grid gap-1', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}
        onDrop={canAddMore ? handleDrop : undefined}
        onDragOver={canAddMore ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
        onDragLeave={canAddMore ? () => setIsDragOver(false) : undefined}>
        {images.map((img, i) => (
          <div key={`${img.storagePath || img.url}-${i}`}
            className={cn('relative group rounded-md overflow-hidden border border-border', images.length === 1 ? previewHeight : 'aspect-square')}>
            <img src={img.url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            {uploadingUrls.has(img.url) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-4 text-white motion-safe:animate-spin" />
              </div>
            )}
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(images.filter((_, j) => j !== i)); }}
              className="absolute top-0.5 right-0.5 size-8 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Remove image">
              <X className="size-3 text-white" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {canAddMore && (
          <button type="button" onClick={triggerInput}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Add more images">
            <ImageIcon className="size-3 inline mr-0.5" />Add
          </button>
        )}
        {showLibraryPicker && (
          <button type="button" onClick={() => setShowLibrary(!showLibrary)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Pick from library">
            <FolderOpen className="size-3 inline mr-0.5" />Library
          </button>
        )}
      </div>
      {showLibrary && libraryPanel}
    </div>
  );
}
