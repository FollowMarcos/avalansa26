'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload,
    Download,
    Trash2,
    Grid2x2,
    Image as ImageIcon,
    Plus,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuadrantData {
    url: string;
    blob: Blob;
    width: number;
    height: number;
}

interface FrameImage {
    url: string;
    file: File;
}

// ---------------------------------------------------------------------------
// FrameSlot — drop zone for top/bottom reference images
// ---------------------------------------------------------------------------

function FrameSlot({
    label,
    image,
    onUpload,
    onRemove,
    onDrop,
}: {
    label: string;
    image: FrameImage | null;
    onUpload: () => void;
    onRemove: () => void;
    onDrop: (file: File) => void;
}) {
    const [dragOver, setDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onDrop(file);
        }
    };

    if (image) {
        return (
            <div className="relative group rounded-lg overflow-hidden border border-border/30 bg-black/20">
                <img src={image.url} alt={label} className="w-full h-auto" draggable={false} />
                <button
                    onClick={onRemove}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    aria-label={`Remove ${label}`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={onUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'w-full py-5 rounded-lg border border-dashed border-border/40 bg-background/30 transition-all flex flex-col items-center gap-1.5 cursor-pointer',
                dragOver
                    ? 'border-primary/60 bg-primary/10 scale-[1.02]'
                    : 'hover:border-primary/30 hover:bg-primary/5',
            )}
            aria-label={`Add ${label}`}
        >
            <Plus className="w-4 h-4 text-muted-foreground/40" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-bold">
                {label}
            </span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const QUADRANT_LABELS = ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export default function QuadFrameStackerPage() {
    // Source image
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [quadrants, setQuadrants] = useState<QuadrantData[]>([]);

    // Top and bottom images for each quadrant (indexed 0-3)
    const [topImages, setTopImages] = useState<(FrameImage | null)[]>([null, null, null, null]);
    const [bottomImages, setBottomImages] = useState<(FrameImage | null)[]>([null, null, null, null]);

    // Refs
    const sourceInputRef = useRef<HTMLInputElement>(null);
    const topInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
    const bottomInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

    // Drag state for source drop zone
    const [sourceDragOver, setSourceDragOver] = useState(false);

    // -----------------------------------------------------------------------
    // Split source image into 2×2 quadrants
    // -----------------------------------------------------------------------
    const splitImage = useCallback((file: File) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            const halfW = Math.floor(img.width / 2);
            const halfH = Math.floor(img.height / 2);

            const positions = [
                { x: 0, y: 0 },            // top-left
                { x: halfW, y: 0 },         // top-right
                { x: 0, y: halfH },         // bottom-left
                { x: halfW, y: halfH },     // bottom-right
            ];

            const promises = positions.map(
                (pos) =>
                    new Promise<QuadrantData>((resolve) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = halfW;
                        canvas.height = halfH;
                        const ctx = canvas.getContext('2d')!;
                        ctx.drawImage(img, pos.x, pos.y, halfW, halfH, 0, 0, halfW, halfH);

                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    url: URL.createObjectURL(blob),
                                    blob,
                                    width: halfW,
                                    height: halfH,
                                });
                            }
                        }, 'image/png');
                    }),
            );

            Promise.all(promises).then((results) => {
                setQuadrants(results);
                setSourcePreview(url);
                toast.success('Image split into 4 quadrants');
            });
        };
    }, []);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSourceUpload = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large (Max 30MB)');
            return;
        }
        // Reset everything
        setTopImages([null, null, null, null]);
        setBottomImages([null, null, null, null]);
        splitImage(file);
    };

    const handleSourceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleSourceUpload(file);
    };

    const handleSourceDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleSourceUpload(file);
        }
    };

    const addFrameImage = (file: File, index: number, position: 'top' | 'bottom') => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large (Max 30MB)');
            return;
        }

        const frameImage: FrameImage = {
            url: URL.createObjectURL(file),
            file,
        };

        const setter = position === 'top' ? setTopImages : setBottomImages;
        setter((prev) => {
            const next = [...prev];
            if (next[index]) URL.revokeObjectURL(next[index]!.url);
            next[index] = frameImage;
            return next;
        });
    };

    const handleFrameInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number,
        position: 'top' | 'bottom',
    ) => {
        const file = e.target.files?.[0];
        if (file) addFrameImage(file, index, position);
    };

    const removeFrame = (index: number, position: 'top' | 'bottom') => {
        const setter = position === 'top' ? setTopImages : setBottomImages;
        setter((prev) => {
            const next = [...prev];
            if (next[index]) URL.revokeObjectURL(next[index]!.url);
            next[index] = null;
            return next;
        });
    };

    // -----------------------------------------------------------------------
    // Canvas export
    // -----------------------------------------------------------------------
    const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });

    const exportStrip = async (index: number) => {
        const quadrant = quadrants[index];
        if (!quadrant) return;

        const top = topImages[index];
        const bottom = bottomImages[index];

        const quadImg = await loadImg(quadrant.url);
        const targetWidth = quadrant.width;

        let totalHeight = quadrant.height;
        let topImg: HTMLImageElement | null = null;
        let bottomImg: HTMLImageElement | null = null;
        let topScaledH = 0;
        let bottomScaledH = 0;

        if (top) {
            topImg = await loadImg(top.url);
            topScaledH = Math.round((topImg.height / topImg.width) * targetWidth);
            totalHeight += topScaledH;
        }

        if (bottom) {
            bottomImg = await loadImg(bottom.url);
            bottomScaledH = Math.round((bottomImg.height / bottomImg.width) * targetWidth);
            totalHeight += bottomScaledH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d')!;

        let y = 0;

        if (topImg) {
            ctx.drawImage(topImg, 0, 0, topImg.width, topImg.height, 0, y, targetWidth, topScaledH);
            y += topScaledH;
        }

        ctx.drawImage(quadImg, 0, 0, quadrant.width, quadrant.height, 0, y, targetWidth, quadrant.height);
        y += quadrant.height;

        if (bottomImg) {
            ctx.drawImage(bottomImg, 0, 0, bottomImg.width, bottomImg.height, 0, y, targetWidth, bottomScaledH);
        }

        canvas.toBlob((blob) => {
            if (blob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `strip-${index + 1}.png`;
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }, 'image/png');
    };

    const exportAll = async () => {
        for (let i = 0; i < quadrants.length; i++) {
            await exportStrip(i);
        }
        toast.success('All strips exported');
    };

    const reset = () => {
        if (sourcePreview) URL.revokeObjectURL(sourcePreview);
        quadrants.forEach((q) => URL.revokeObjectURL(q.url));
        topImages.forEach((t) => t && URL.revokeObjectURL(t.url));
        bottomImages.forEach((b) => b && URL.revokeObjectURL(b.url));

        setSourcePreview(null);
        setQuadrants([]);
        setTopImages([null, null, null, null]);
        setBottomImages([null, null, null, null]);
        if (sourceInputRef.current) sourceInputRef.current.value = '';
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <PageShell contentClassName="bg-transparent">
            <div className="min-h-dvh pt-16 pb-12 px-6 max-w-7xl mx-auto">
                {/* --------------------------------------------------------------- */}
                {/* Header */}
                {/* --------------------------------------------------------------- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true">
                                <Grid2x2 className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-vt323 tracking-tight text-primary uppercase text-balance">
                                Quad Frame Stacker
                            </h1>
                        </div>
                        <p className="font-lato text-muted-foreground text-lg italic opacity-80 max-w-2xl text-pretty">
                            Split an image into 4 quadrants, attach reference frames above &amp; below each, then export as vertical strips. Fully client-side.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="outline"
                            className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={reset}
                            disabled={quadrants.length === 0}
                        >
                            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            Reset
                        </Button>
                        {quadrants.length > 0 && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={exportAll}
                            >
                                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                                Export All
                            </Button>
                        )}
                        <Button
                            className="rounded-full font-vt323 text-lg h-11 px-8"
                            onClick={() => sourceInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                            {sourcePreview ? 'Change Source' : 'Upload Source'}
                        </Button>
                        <input
                            type="file"
                            ref={sourceInputRef}
                            className="hidden"
                            accept="image/*"
                            aria-label="Upload source image"
                            onChange={handleSourceInputChange}
                        />
                    </div>
                </div>

                {/* --------------------------------------------------------------- */}
                {/* Main Content */}
                {/* --------------------------------------------------------------- */}
                {quadrants.length === 0 ? (
                    /* Empty state — drop zone */
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => sourceInputRef.current?.click()}
                        onKeyDown={(e) => e.key === 'Enter' && sourceInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setSourceDragOver(true); }}
                        onDragLeave={() => setSourceDragOver(false)}
                        onDrop={handleSourceDrop}
                        className={cn(
                            'flex flex-col items-center justify-center gap-4 py-32 rounded-[2rem] border-2 border-dashed bg-card/50 transition-all',
                            sourceDragOver
                                ? 'border-primary/60 bg-primary/10 scale-[1.01]'
                                : 'border-border/50 hover:border-primary/30 hover:bg-card/80 cursor-pointer',
                        )}
                    >
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <ImageIcon className="w-10 h-10 text-primary/40" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-vt323 text-xl text-muted-foreground uppercase">
                                Drop your source image here
                            </p>
                            <p className="text-sm text-muted-foreground/50">
                                or click to browse · Max 30MB
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Stacking workspace — 4 columns */
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {quadrants.map((quadrant, index) => (
                            <div key={index} className="space-y-3">
                                <h3 className="font-vt323 text-lg text-muted-foreground uppercase tracking-wider text-center">
                                    {QUADRANT_LABELS[index]}
                                </h3>

                                <div className="p-3 rounded-[1.5rem] bg-card border border-border/50 space-y-2">
                                    {/* Top frame slot */}
                                    <FrameSlot
                                        label="Top Frame"
                                        image={topImages[index]}
                                        onUpload={() => topInputRefs.current[index]?.click()}
                                        onRemove={() => removeFrame(index, 'top')}
                                        onDrop={(file) => addFrameImage(file, index, 'top')}
                                    />

                                    {/* Quadrant image */}
                                    <div className="relative rounded-lg overflow-hidden border border-border/30 bg-black/20">
                                        <img
                                            src={quadrant.url}
                                            alt={`Quadrant ${index + 1}: ${QUADRANT_LABELS[index]}`}
                                            className="w-full h-auto"
                                            draggable={false}
                                        />
                                        <div className="absolute bottom-1 right-2 text-[8px] font-black italic opacity-30 text-white select-none">
                                            #{String(index + 1).padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* Bottom frame slot */}
                                    <FrameSlot
                                        label="Bottom Frame"
                                        image={bottomImages[index]}
                                        onUpload={() => bottomInputRefs.current[index]?.click()}
                                        onRemove={() => removeFrame(index, 'bottom')}
                                        onDrop={(file) => addFrameImage(file, index, 'bottom')}
                                    />

                                    {/* Export single strip */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary hover:text-primary/80 font-vt323 text-base"
                                        onClick={() => exportStrip(index)}
                                    >
                                        <Download className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                                        Export Strip
                                    </Button>
                                </div>

                                {/* Hidden file inputs */}
                                <input
                                    type="file"
                                    ref={(el) => { topInputRefs.current[index] = el; }}
                                    className="hidden"
                                    accept="image/*"
                                    aria-label={`Upload top frame for ${QUADRANT_LABELS[index]}`}
                                    onChange={(e) => handleFrameInputChange(e, index, 'top')}
                                />
                                <input
                                    type="file"
                                    ref={(el) => { bottomInputRefs.current[index] = el; }}
                                    className="hidden"
                                    accept="image/*"
                                    aria-label={`Upload bottom frame for ${QUADRANT_LABELS[index]}`}
                                    onChange={(e) => handleFrameInputChange(e, index, 'bottom')}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-50 overflow-hidden" aria-hidden="true">
                <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[5%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px]" />
            </div>
        </PageShell>
    );
}
