'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Upload,
    Download,
    Trash2,
    Grid2x2,
    Image as ImageIcon,
    Plus,
    X,
    Move,
    Scissors,
    ArrowLeft,
    Crop,
    ZoomIn,
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
    naturalWidth: number;
    naturalHeight: number;
    panX: number;
    panY: number;
    zoom: number;
}

interface SourceImage {
    url: string;
    file: File;
    naturalWidth: number;
    naturalHeight: number;
    panX: number;
    panY: number;
    zoom: number;
}

// ---------------------------------------------------------------------------
// Aspect ratio presets
// ---------------------------------------------------------------------------

interface AspectPreset {
    label: string;
    ratio: [number, number] | null;
}

const ASPECT_PRESETS: AspectPreset[] = [
    { label: 'Free', ratio: null },
    { label: '16:9', ratio: [16, 9] },
    { label: '3:2', ratio: [3, 2] },
    { label: '4:3', ratio: [4, 3] },
    { label: '1:1', ratio: [1, 1] },
    { label: '9:16', ratio: [9, 16] },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

// ---------------------------------------------------------------------------
// usePanDrag — pointer-drag logic for cover+pan+zoom containers
// ---------------------------------------------------------------------------

function usePanDrag(
    containerRef: React.RefObject<HTMLElement | null>,
    naturalWidth: number,
    naturalHeight: number,
    panX: number,
    panY: number,
    zoom: number,
    onPanChange: (px: number, py: number) => void,
) {
    const dragState = useRef<{
        startX: number;
        startY: number;
        startPanX: number;
        startPanY: number;
    } | null>(null);

    const getOverflow = useCallback(() => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const scale = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
        return {
            x: naturalWidth * scale - rect.width,
            y: naturalHeight * scale - rect.height,
        };
    }, [containerRef, naturalWidth, naturalHeight]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            dragState.current = { startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
        },
        [panX, panY],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState.current) return;
            const dx = e.clientX - dragState.current.startX;
            const dy = e.clientY - dragState.current.startY;
            const overflow = getOverflow();
            let newPanX = dragState.current.startPanX;
            let newPanY = dragState.current.startPanY;
            // Factor zoom into drag sensitivity so dragging feels 1:1 on screen
            if (overflow.x > 0) newPanX = dragState.current.startPanX - (dx / (overflow.x * zoom)) * 100;
            if (overflow.y > 0) newPanY = dragState.current.startPanY - (dy / (overflow.y * zoom)) * 100;
            onPanChange(Math.max(0, Math.min(100, newPanX)), Math.max(0, Math.min(100, newPanY)));
        },
        [getOverflow, onPanChange, zoom],
    );

    const onPointerUp = useCallback(() => {
        dragState.current = null;
    }, []);

    return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

// ---------------------------------------------------------------------------
// CroppableFrameSlot — for top/bottom reference frames
// ---------------------------------------------------------------------------

function CroppableFrameSlot({
    label,
    image,
    quadrantAspect,
    onUpload,
    onRemove,
    onDrop,
    onPanChange,
    onZoomChange,
}: {
    label: string;
    image: FrameImage | null;
    quadrantAspect: number;
    onUpload: () => void;
    onRemove: () => void;
    onDrop: (file: File) => void;
    onPanChange: (panX: number, panY: number) => void;
    onZoomChange: (zoom: number) => void;
}) {
    const [dragOver, setDragOver] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const pointerHandlers = usePanDrag(
        containerRef,
        image?.naturalWidth ?? 1,
        image?.naturalHeight ?? 1,
        image?.panX ?? 50,
        image?.panY ?? 50,
        image?.zoom ?? 1,
        onPanChange,
    );

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!image) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            onZoomChange(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, image.zoom + delta)));
        },
        [image, onZoomChange],
    );

    if (image) {
        return (
            <div
                ref={containerRef}
                className="relative group rounded-lg overflow-hidden border border-border/30 bg-black/20 cursor-grab active:cursor-grabbing touch-none"
                style={{ aspectRatio: quadrantAspect }}
                onWheel={handleWheel}
                {...pointerHandlers}
            >
                <img
                    src={image.url}
                    alt={label}
                    className="w-full h-full object-cover select-none pointer-events-none origin-center"
                    style={{
                        objectPosition: `${image.panX}% ${image.panY}%`,
                        transform: `scale(${image.zoom})`,
                    }}
                    draggable={false}
                />
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 z-10"
                    aria-label={`Remove ${label}`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                {/* Zoom badge */}
                {image.zoom > 1 && (
                    <div className="absolute top-1.5 left-1.5 text-[9px] bg-black/50 text-white/70 px-1.5 py-0.5 rounded-full backdrop-blur-sm font-mono z-10">
                        {image.zoom.toFixed(1)}x
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="flex items-center gap-1 text-[9px] bg-black/50 text-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <Move className="w-3 h-3" />
                        drag · scroll to zoom
                    </span>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onUpload}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) onDrop(file);
            }}
            className={cn(
                'w-full rounded-lg border border-dashed bg-background/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer',
                dragOver
                    ? 'border-primary/60 bg-primary/10 scale-[1.02]'
                    : 'border-border/40 hover:border-primary/30 hover:bg-primary/5',
            )}
            style={{ aspectRatio: quadrantAspect }}
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
// Helpers
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const QUADRANT_LABELS = ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'];

function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

/** Compute crop rect in source-pixel space from aspect ratio + pan + zoom */
function computeCropRect(
    natW: number,
    natH: number,
    targetRatio: number,
    panX: number,
    panY: number,
    zoom: number = 1,
) {
    const sourceRatio = natW / natH;
    let baseCropW: number, baseCropH: number;

    if (sourceRatio > targetRatio) {
        baseCropH = natH;
        baseCropW = Math.round(natH * targetRatio);
    } else {
        baseCropW = natW;
        baseCropH = Math.round(natW / targetRatio);
    }

    // Zoom shrinks the crop area (shows less of the source)
    const cropW = Math.round(baseCropW / zoom);
    const cropH = Math.round(baseCropH / zoom);

    const maxOffX = natW - cropW;
    const maxOffY = natH - cropH;
    const offX = Math.round((panX / 100) * maxOffX);
    const offY = Math.round((panY / 100) * maxOffY);

    return { cropW, cropH, offX, offY };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuadFrameStackerPage() {
    const [source, setSource] = useState<SourceImage | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<number>(1); // default 16:9
    const [exportScale, setExportScale] = useState<number>(1);
    const [quadrants, setQuadrants] = useState<QuadrantData[]>([]);
    const [topImages, setTopImages] = useState<(FrameImage | null)[]>([null, null, null, null]);
    const [bottomImages, setBottomImages] = useState<(FrameImage | null)[]>([null, null, null, null]);

    const sourceInputRef = useRef<HTMLInputElement>(null);
    const sourceCropRef = useRef<HTMLDivElement>(null);
    const topInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
    const bottomInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
    const [sourceDragOver, setSourceDragOver] = useState(false);

    const phase = !source ? 'upload' : quadrants.length === 0 ? 'crop' : 'stack';

    const targetRatio = useMemo(() => {
        const preset = ASPECT_PRESETS[selectedPreset];
        if (preset.ratio) return preset.ratio[0] / preset.ratio[1];
        if (source) return source.naturalWidth / source.naturalHeight;
        return 16 / 9;
    }, [selectedPreset, source]);

    const cropInfo = useMemo(() => {
        if (!source) return null;
        const { cropW, cropH } = computeCropRect(
            source.naturalWidth,
            source.naturalHeight,
            targetRatio,
            source.panX,
            source.panY,
            source.zoom,
        );
        return { cropW, cropH, quadW: Math.floor(cropW / 2), quadH: Math.floor(cropH / 2) };
    }, [source, targetRatio]);

    const quadrantAspect = cropInfo ? cropInfo.quadW / cropInfo.quadH : 16 / 9;

    const sourcePointerHandlers = usePanDrag(
        sourceCropRef,
        source?.naturalWidth ?? 1,
        source?.naturalHeight ?? 1,
        source?.panX ?? 50,
        source?.panY ?? 50,
        source?.zoom ?? 1,
        (px, py) => setSource((prev) => prev ? { ...prev, panX: px, panY: py } : prev),
    );

    const handleSourceWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!source) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setSource((prev) =>
                prev ? { ...prev, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta)) } : prev,
            );
        },
        [source],
    );

    // -----------------------------------------------------------------------
    // Upload source
    // -----------------------------------------------------------------------
    const handleSourceFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large (Max 30MB)');
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            setSource({
                url,
                file,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                panX: 50,
                panY: 50,
                zoom: 1,
            });
            setQuadrants([]);
            setTopImages([null, null, null, null]);
            setBottomImages([null, null, null, null]);
        };
        img.src = url;
    };

    // -----------------------------------------------------------------------
    // Crop & Split
    // -----------------------------------------------------------------------
    const cropAndSplit = async () => {
        if (!source || !cropInfo) return;

        const img = await loadImg(source.url);
        const { cropW, cropH, offX, offY } = computeCropRect(
            source.naturalWidth,
            source.naturalHeight,
            targetRatio,
            source.panX,
            source.panY,
            source.zoom,
        );

        const halfW = Math.floor(cropW / 2);
        const halfH = Math.floor(cropH / 2);

        const positions = [
            { x: offX, y: offY },
            { x: offX + halfW, y: offY },
            { x: offX, y: offY + halfH },
            { x: offX + halfW, y: offY + halfH },
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
                            resolve({ url: URL.createObjectURL(blob), blob, width: halfW, height: halfH });
                        }
                    }, 'image/png');
                }),
        );

        const results = await Promise.all(promises);
        setQuadrants(results);
        toast.success(`Split into 4 quadrants (${halfW}×${halfH} each)`);
    };

    // -----------------------------------------------------------------------
    // Frame handlers
    // -----------------------------------------------------------------------
    const addFrameImage = (file: File, index: number, position: 'top' | 'bottom') => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large (Max 30MB)');
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const frameImage: FrameImage = {
                url,
                file,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                panX: 50,
                panY: 50,
                zoom: 1,
            };
            const setter = position === 'top' ? setTopImages : setBottomImages;
            setter((prev) => {
                const next = [...prev];
                if (next[index]) URL.revokeObjectURL(next[index]!.url);
                next[index] = frameImage;
                return next;
            });
        };
        img.src = url;
    };

    const updateFrame = (
        index: number,
        position: 'top' | 'bottom',
        updates: Partial<Pick<FrameImage, 'panX' | 'panY' | 'zoom'>>,
    ) => {
        const setter = position === 'top' ? setTopImages : setBottomImages;
        setter((prev) => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index]!, ...updates };
            return next;
        });
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
    // Export — each frame is cropped to exact quadrant dimensions
    // -----------------------------------------------------------------------

    /**
     * Draws a frame image cropped to targetW × targetH using pan + zoom.
     * Mirrors CSS object-fit:cover + object-position + transform:scale in pixel space.
     */
    const drawCroppedFrame = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        frame: FrameImage,
        destX: number,
        destY: number,
        targetW: number,
        targetH: number,
    ) => {
        // Cover scale × zoom
        const scale = Math.max(targetW / frame.naturalWidth, targetH / frame.naturalHeight) * frame.zoom;
        const scaledW = frame.naturalWidth * scale;
        const scaledH = frame.naturalHeight * scale;
        const overflowX = scaledW - targetW;
        const overflowY = scaledH - targetH;
        const srcX = ((frame.panX / 100) * overflowX) / scale;
        const srcY = ((frame.panY / 100) * overflowY) / scale;
        const srcW = targetW / scale;
        const srcH = targetH / scale;
        ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, targetW, targetH);
    };

    const exportStrip = async (index: number) => {
        const quadrant = quadrants[index];
        if (!quadrant) return;

        const top = topImages[index];
        const bottom = bottomImages[index];
        const quadImg = await loadImg(quadrant.url);

        const s = exportScale;
        const W = Math.round(quadrant.width * s);
        const H = Math.round(quadrant.height * s);

        let totalHeight = H;
        if (top) totalHeight += H;
        if (bottom) totalHeight += H;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d')!;

        let y = 0;

        if (top) {
            const topImg = await loadImg(top.url);
            drawCroppedFrame(ctx, topImg, top, 0, y, W, H);
            y += H;
        }

        ctx.drawImage(quadImg, 0, 0, quadrant.width, quadrant.height, 0, y, W, H);
        y += H;

        if (bottom) {
            const bottomImg = await loadImg(bottom.url);
            drawCroppedFrame(ctx, bottomImg, bottom, 0, y, W, H);
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

    // -----------------------------------------------------------------------
    // Reset / back
    // -----------------------------------------------------------------------
    const resetAll = () => {
        if (source) URL.revokeObjectURL(source.url);
        quadrants.forEach((q) => URL.revokeObjectURL(q.url));
        topImages.forEach((t) => t && URL.revokeObjectURL(t.url));
        bottomImages.forEach((b) => b && URL.revokeObjectURL(b.url));
        setSource(null);
        setQuadrants([]);
        setTopImages([null, null, null, null]);
        setBottomImages([null, null, null, null]);
        if (sourceInputRef.current) sourceInputRef.current.value = '';
    };

    const backToCrop = () => {
        quadrants.forEach((q) => URL.revokeObjectURL(q.url));
        topImages.forEach((t) => t && URL.revokeObjectURL(t.url));
        bottomImages.forEach((b) => b && URL.revokeObjectURL(b.url));
        setQuadrants([]);
        setTopImages([null, null, null, null]);
        setBottomImages([null, null, null, null]);
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <PageShell contentClassName="bg-transparent">
            <div className="min-h-dvh pt-16 pb-12 px-6 max-w-7xl mx-auto">
                {/* Header */}
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
                            Crop &amp; split an image into 4 quadrants, attach reference frames above &amp; below, then export as vertical strips. Fully client-side.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {phase === 'stack' && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={backToCrop}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                                Back
                            </Button>
                        )}
                        {phase !== 'upload' && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={resetAll}
                            >
                                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                Reset
                            </Button>
                        )}
                        {phase === 'stack' && (
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
                            {source ? 'Change Source' : 'Upload Source'}
                        </Button>
                        <input
                            type="file"
                            ref={sourceInputRef}
                            className="hidden"
                            accept="image/*"
                            aria-label="Upload source image"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSourceFile(file);
                            }}
                        />
                    </div>
                </div>

                {/* =========================================================== */}
                {/* Phase: Upload */}
                {/* =========================================================== */}
                {phase === 'upload' && (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => sourceInputRef.current?.click()}
                        onKeyDown={(e) => e.key === 'Enter' && sourceInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setSourceDragOver(true); }}
                        onDragLeave={() => setSourceDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSourceDragOver(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith('image/')) handleSourceFile(file);
                        }}
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
                )}

                {/* =========================================================== */}
                {/* Phase: Crop & Configure */}
                {/* =========================================================== */}
                {phase === 'crop' && source && cropInfo && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Controls card */}
                        <div className="p-5 rounded-[1.5rem] bg-card border border-border/50 space-y-5">
                            {/* Aspect ratio */}
                            <div className="space-y-3">
                                <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Crop className="w-5 h-5" /> Aspect Ratio
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {ASPECT_PRESETS.map((preset, i) => (
                                        <Button
                                            key={preset.label}
                                            variant={selectedPreset === i ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                'rounded-full font-vt323 text-base h-9 px-5',
                                                selectedPreset !== i && 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                                            )}
                                            onClick={() => {
                                                setSelectedPreset(i);
                                                setSource((prev) => prev ? { ...prev, panX: 50, panY: 50, zoom: 1 } : prev);
                                            }}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Export scale */}
                            <div className="space-y-3">
                                <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider">
                                    Export Scale
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 1.5, 2].map((s) => (
                                        <Button
                                            key={s}
                                            variant={exportScale === s ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                'rounded-full font-vt323 text-base h-9 px-5',
                                                exportScale !== s && 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                                            )}
                                            onClick={() => setExportScale(s)}
                                        >
                                            {s}x
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions info */}
                            <p className="text-[11px] text-muted-foreground/50">
                                Quadrant: {Math.round(cropInfo.quadW * exportScale)} × {Math.round(cropInfo.quadH * exportScale)}px
                                · Strip: {Math.round(cropInfo.quadW * exportScale)} × {Math.round(cropInfo.quadH * 3 * exportScale)}px (with both frames)
                                {exportScale !== 1 && (
                                    <span className="text-primary/60"> · {exportScale}x upscaled</span>
                                )}
                            </p>
                        </div>

                        {/* Croppable source preview */}
                        <div
                            ref={sourceCropRef}
                            className="relative rounded-2xl overflow-hidden border border-border/30 bg-black/20 cursor-grab active:cursor-grabbing touch-none group"
                            style={{ aspectRatio: targetRatio }}
                            onWheel={handleSourceWheel}
                            {...sourcePointerHandlers}
                        >
                            <img
                                src={source.url}
                                alt="Source image — drag to reposition, scroll to zoom"
                                className="w-full h-full object-cover select-none pointer-events-none origin-center"
                                style={{
                                    objectPosition: `${source.panX}% ${source.panY}%`,
                                    transform: `scale(${source.zoom})`,
                                }}
                                draggable={false}
                            />
                            {/* 2×2 grid overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                            </div>
                            {/* Zoom badge */}
                            {source.zoom > 1 && (
                                <div className="absolute top-3 left-3 flex items-center gap-1 text-xs bg-black/50 text-white/70 px-2 py-1 rounded-full backdrop-blur-sm font-mono z-10">
                                    <ZoomIn className="w-3 h-3" />
                                    {source.zoom.toFixed(1)}x
                                </div>
                            )}
                            {/* Hint */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="flex items-center gap-1 text-xs bg-black/50 text-white/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                    <Move className="w-3.5 h-3.5" />
                                    drag to pan · scroll to zoom
                                </span>
                            </div>
                        </div>

                        {/* Split button */}
                        <div className="flex justify-center">
                            <Button
                                className="rounded-full font-vt323 text-xl h-12 px-10"
                                onClick={cropAndSplit}
                            >
                                <Scissors className="w-5 h-5 mr-2" aria-hidden="true" />
                                Split into 4 Quadrants
                            </Button>
                        </div>
                    </div>
                )}

                {/* =========================================================== */}
                {/* Phase: Stack & Export */}
                {/* =========================================================== */}
                {phase === 'stack' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {quadrants.map((quadrant, index) => (
                            <div key={index} className="space-y-3">
                                <h3 className="font-vt323 text-lg text-muted-foreground uppercase tracking-wider text-center">
                                    {QUADRANT_LABELS[index]}
                                </h3>

                                <div className="p-3 rounded-[1.5rem] bg-card border border-border/50 space-y-2">
                                    <CroppableFrameSlot
                                        label="Top Frame"
                                        image={topImages[index]}
                                        quadrantAspect={quadrantAspect}
                                        onUpload={() => topInputRefs.current[index]?.click()}
                                        onRemove={() => removeFrame(index, 'top')}
                                        onDrop={(file) => addFrameImage(file, index, 'top')}
                                        onPanChange={(px, py) => updateFrame(index, 'top', { panX: px, panY: py })}
                                        onZoomChange={(z) => updateFrame(index, 'top', { zoom: z })}
                                    />

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

                                    <CroppableFrameSlot
                                        label="Bottom Frame"
                                        image={bottomImages[index]}
                                        quadrantAspect={quadrantAspect}
                                        onUpload={() => bottomInputRefs.current[index]?.click()}
                                        onRemove={() => removeFrame(index, 'bottom')}
                                        onDrop={(file) => addFrameImage(file, index, 'bottom')}
                                        onPanChange={(px, py) => updateFrame(index, 'bottom', { panX: px, panY: py })}
                                        onZoomChange={(z) => updateFrame(index, 'bottom', { zoom: z })}
                                    />

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

                                <input
                                    type="file"
                                    ref={(el) => { topInputRefs.current[index] = el; }}
                                    className="hidden"
                                    accept="image/*"
                                    aria-label={`Upload top frame for ${QUADRANT_LABELS[index]}`}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) addFrameImage(file, index, 'top');
                                    }}
                                />
                                <input
                                    type="file"
                                    ref={(el) => { bottomInputRefs.current[index] = el; }}
                                    className="hidden"
                                    accept="image/*"
                                    aria-label={`Upload bottom frame for ${QUADRANT_LABELS[index]}`}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) addFrameImage(file, index, 'bottom');
                                    }}
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
