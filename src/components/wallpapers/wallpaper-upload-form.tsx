'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TagSelector } from './tag-selector';
import { CollectionManager } from './collection-manager';
import {
  validateWallpaperFile,
  validateWallpaperDimensions,
  getImageDimensions,
  computeAspectRatio,
  getResolutionCategory,
  formatFileSize,
} from '@/utils/wallpaper-validation';
import { toast } from 'sonner';

export function WallpaperUploadForm() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string | undefined>();
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    // Validate file
    const fileValidation = validateWallpaperFile(selectedFile);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error);
      return;
    }

    // Get dimensions
    try {
      const dims = await getImageDimensions(selectedFile);
      const dimValidation = validateWallpaperDimensions(dims.width, dims.height);
      if (!dimValidation.valid) {
        toast.error(dimValidation.error);
        return;
      }

      setDimensions(dims);
    } catch {
      toast.error('Failed to read image dimensions.');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));

    // Auto-fill title from filename if empty
    if (!title) {
      const name = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setDimensions(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !dimensions || !title.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'wallpapers',
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || 'Failed to get upload URL');
      }

      const { presignedUrl, key, publicUrl } = await presignRes.json();
      setUploadProgress(10);

      // Step 2: Upload to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(10 + Math.round((e.loaded / e.total) * 80));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      setUploadProgress(90);

      // Step 3: Create wallpaper record
      const createRes = await fetch('/api/wallpapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          image_url: publicUrl,
          image_path: key,
          width: dimensions.width,
          height: dimensions.height,
          file_size: file.size,
          mime_type: file.type,
          aspect_ratio: computeAspectRatio(dimensions.width, dimensions.height),
          tags: tags.length > 0 ? tags : undefined,
          collection_id: collectionId,
          is_public: isPublic,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create wallpaper');
      }

      const { wallpaper } = await createRes.json();
      setUploadProgress(100);

      toast.success('Wallpaper uploaded successfully!');
      router.push(`/wallpapers/w/${wallpaper.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Drop Zone / Preview */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-primary/20 bg-primary/[0.02] hover:border-primary/40'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp';
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFileSelect(f);
            };
            input.click();
          }}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-vt323 text-xl text-foreground uppercase tracking-wider">
                Drop your wallpaper here
              </p>
              <p className="font-lato text-sm text-muted-foreground mt-1">
                JPEG, PNG, or WebP &bull; Max 50MB &bull; Min 1280x720
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-border/50">
          <div className="relative aspect-video bg-black">
            {preview && (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            )}
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image Info */}
          {dimensions && (
            <div className="flex items-center gap-4 p-3 bg-primary/[0.02] border-t border-border/50">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">
                {dimensions.width}x{dimensions.height}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {getResolutionCategory(dimensions.width, dimensions.height)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {computeAspectRatio(dimensions.width, dimensions.height)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Metadata Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-vt323 text-sm uppercase tracking-wider">
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your wallpaper a name..."
            maxLength={100}
            required
            className="rounded-xl font-lato"
          />
          <p className="text-[10px] text-muted-foreground font-mono text-right">
            {title.length}/100
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="font-vt323 text-sm uppercase tracking-wider">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your wallpaper..."
            maxLength={500}
            rows={3}
            className="rounded-xl font-lato resize-none"
          />
          <p className="text-[10px] text-muted-foreground font-mono text-right">
            {description.length}/500
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="font-vt323 text-sm uppercase tracking-wider">
            Tags
          </Label>
          <TagSelector selectedTags={tags} onChange={setTags} />
        </div>

        {/* Collection */}
        <CollectionManager
          selectedCollectionId={collectionId}
          onChange={setCollectionId}
        />

        {/* Visibility */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/[0.02] border border-primary/5">
          <div>
            <Label className="font-vt323 text-sm uppercase tracking-wider">
              Public
            </Label>
            <p className="text-xs text-muted-foreground font-lato mt-0.5">
              {isPublic ? 'Anyone can see and download this wallpaper' : 'Only you can see this wallpaper'}
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono text-center">
            {uploadProgress < 10
              ? 'Preparing upload...'
              : uploadProgress < 90
                ? `Uploading... ${uploadProgress}%`
                : uploadProgress < 100
                  ? 'Creating record...'
                  : 'Complete!'}
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full rounded-xl font-vt323 text-xl uppercase tracking-wider h-12"
        disabled={!file || !title.trim() || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Upload Wallpaper
          </>
        )}
      </Button>
    </form>
  );
}
