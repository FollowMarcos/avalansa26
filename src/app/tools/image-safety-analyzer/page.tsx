'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    ShieldCheck,
    Image as ImageIcon,
    RotateCcw,
    Lock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { ToolAuthGate } from '@/components/tools/tool-auth-gate';
import { toast } from 'sonner';
import { CircularLoader, TextShimmerLoader } from '@/components/ui/loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnalysisState = 'idle' | 'model-loading' | 'ready' | 'analyzing' | 'results';

type Verdict = 'Safe' | 'Questionable' | 'Unsafe';

interface ClassificationResult {
    className: string;
    probability: number;
}

interface AnalysisResults {
    predictions: ClassificationResult[];
    verdict: Verdict;
    topClass: string;
    topProbability: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

const MODEL_NAMES = ['MobileNetV2', 'MobileNetV2Mid', 'InceptionV3'] as const;
type ModelName = (typeof MODEL_NAMES)[number];

const CLASS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    Neutral: { label: 'Neutral', color: 'text-emerald-500', bgColor: 'bg-emerald-500' },
    Drawing: { label: 'Drawing', color: 'text-blue-500', bgColor: 'bg-blue-500' },
    Sexy: { label: 'Sexy', color: 'text-amber-500', bgColor: 'bg-amber-500' },
    Porn: { label: 'Porn', color: 'text-red-500', bgColor: 'bg-red-500' },
    Hentai: { label: 'Hentai', color: 'text-rose-500', bgColor: 'bg-rose-500' },
};

const VERDICT_CONFIG: Record<
    Verdict,
    {
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
        border: string;
        description: string;
    }
> = {
    Safe: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        description: 'This image appears to be safe for general audiences.',
    },
    Questionable: {
        icon: HelpCircle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        description: 'This image contains content that may be considered suggestive.',
    },
    Unsafe: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        description: 'This image contains content that is likely not safe for work.',
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function determineVerdict(predictions: ClassificationResult[]): Verdict {
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    const topClass = sorted[0];

    const probMap: Record<string, number> = {};
    for (const p of predictions) {
        probMap[p.className] = p.probability;
    }

    const pornProb = probMap['Porn'] ?? 0;
    const hentaiProb = probMap['Hentai'] ?? 0;
    const sexyProb = probMap['Sexy'] ?? 0;

    // Unsafe: Porn or Hentai is top class, OR Porn/Hentai probability > 60%
    if (
        topClass.className === 'Porn' ||
        topClass.className === 'Hentai' ||
        pornProb > 0.6 ||
        hentaiProb > 0.6
    ) {
        return 'Unsafe';
    }

    // Questionable: Sexy is top class, or any NSFW class 30-60%
    if (
        topClass.className === 'Sexy' ||
        (pornProb > 0.3 && pornProb <= 0.6) ||
        (hentaiProb > 0.3 && hentaiProb <= 0.6) ||
        sexyProb > 0.3
    ) {
        return 'Questionable';
    }

    // Safe: Neutral or Drawing is top class with > 60%
    if (
        (topClass.className === 'Neutral' || topClass.className === 'Drawing') &&
        topClass.probability > 0.6
    ) {
        return 'Safe';
    }

    return 'Questionable';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImageSafetyAnalyzerPage() {
    const [state, setState] = useState<AnalysisState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelsRef = useRef<Map<ModelName, any>>(new Map());
    const imageRef = useRef<HTMLImageElement>(null);

    // -- Model loading (dynamic import to avoid SSR) -------------------------

    const loadModels = useCallback(async () => {
        if (modelsRef.current.size === MODEL_NAMES.length) return;
        setState('model-loading');
        setError(null);
        try {
            await import('@tensorflow/tfjs');
            const nsfwjs = await import('nsfwjs');

            for (let i = 0; i < MODEL_NAMES.length; i++) {
                const name = MODEL_NAMES[i];
                if (modelsRef.current.has(name)) continue;
                setLoadingProgress(`Loading model ${i + 1} of ${MODEL_NAMES.length}...`);
                const model = await nsfwjs.load(name);
                modelsRef.current.set(name, model);
            }

            setLoadingProgress('');
            setState('ready');
        } catch (err) {
            console.error('Failed to load NSFW models:', err);
            setError('Failed to load the AI models. Please check your connection and try again.');
            setState('idle');
            toast.error('Model loading failed');
        }
    }, []);

    // -- File handler --------------------------------------------------------

    const handleFile = useCallback(
        async (file: File) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or BMP image.');
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error('File too large. Maximum size is 20 MB.');
                return;
            }

            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }

            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setFileName(file.name);
            setResults(null);
            setError(null);

            if (modelsRef.current.size < MODEL_NAMES.length) {
                await loadModels();
            } else {
                setState('ready');
            }
        },
        [imageUrl, loadModels],
    );

    // -- Analyze -------------------------------------------------------------

    const analyzeImage = useCallback(async () => {
        if (modelsRef.current.size === 0 || !imageRef.current) return;

        setState('analyzing');
        setError(null);

        try {
            // Run all loaded models and collect predictions
            const allPredictions: { className: string; probability: number }[][] = [];
            for (const [, model] of modelsRef.current) {
                const preds: { className: string; probability: number }[] =
                    await model.classify(imageRef.current);
                allPredictions.push(preds);
            }

            // Average probabilities across all models
            const avgMap: Record<string, number> = {};
            const classNames = allPredictions[0].map((p) => p.className);

            for (const cls of classNames) {
                let sum = 0;
                for (const preds of allPredictions) {
                    const match = preds.find((p) => p.className === cls);
                    sum += match?.probability ?? 0;
                }
                avgMap[cls] = sum / allPredictions.length;
            }

            const averaged: ClassificationResult[] = classNames.map((cls) => ({
                className: cls,
                probability: avgMap[cls],
            }));

            const sorted = [...averaged].sort((a, b) => b.probability - a.probability);
            const verdict = determineVerdict(averaged);

            setResults({
                predictions: sorted,
                verdict,
                topClass: sorted[0].className,
                topProbability: sorted[0].probability,
            });
            setState('results');
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('Failed to analyze the image. Please try a different image.');
            setState('ready');
            toast.error('Analysis failed');
        }
    }, []);

    // -- Reset ---------------------------------------------------------------

    const reset = useCallback(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        setImageUrl(null);
        setFileName(null);
        setResults(null);
        setError(null);
        setState('idle');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [imageUrl]);

    // Cleanup on unmount
    useEffect(() => {
        const url = imageUrl;
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [imageUrl]);

    // -- Auto-analyze when image element loads --------------------------------

    const onImageLoad = useCallback(() => {
        if (state === 'ready' && modelsRef.current.size > 0 && imageRef.current) {
            analyzeImage();
        }
    }, [state, analyzeImage]);

    // Also trigger when state transitions to 'ready' and image is already loaded
    useEffect(() => {
        if (state === 'ready' && imageUrl && imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
            analyzeImage();
        }
    }, [state, imageUrl, analyzeImage]);

    // -- Drag-and-drop helpers -----------------------------------------------

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('image/')) handleFile(file);
        },
        [handleFile],
    );

    // -- Render --------------------------------------------------------------

    return (
        <ToolAuthGate toolName="Image Safety Analyzer">
        <PageShell contentClassName="bg-transparent">
            <div className="min-h-dvh pt-16 pb-12 px-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-vt323 tracking-tight text-primary uppercase text-balance">
                                Image Safety Analyzer
                            </h1>
                        </div>
                        <p className="font-lato text-muted-foreground text-lg italic opacity-80 max-w-2xl text-pretty">
                            Classify images for NSFW content using AI, entirely in your browser. No
                            data leaves your device.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {state !== 'idle' && state !== 'model-loading' && imageUrl && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={reset}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Privacy badge */}
                <div className="flex items-center gap-2 mb-6">
                    <Badge
                        variant="outline"
                        className="font-lato text-xs gap-1.5 py-1 px-3 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    >
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        100% Browser-Based — No Data Uploaded
                    </Badge>
                </div>

                {/* Error alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── IDLE: Upload zone ─────────────────────────────────── */}
                {state === 'idle' && !imageUrl && (
                    <div
                        role="button"
                        aria-label="Upload image for safety analysis"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={cn(
                            'flex flex-col items-center justify-center gap-4 py-32 rounded-[2rem] border-2 border-dashed bg-card/50 transition-all',
                            dragOver
                                ? 'border-primary/60 bg-primary/10 scale-[1.01]'
                                : 'border-border/50 hover:border-primary/30 hover:bg-card/80 cursor-pointer',
                        )}
                    >
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <ImageIcon className="w-10 h-10 text-primary/40" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-vt323 text-xl text-muted-foreground uppercase">
                                Drop your image here
                            </p>
                            <p className="text-sm text-muted-foreground/50">
                                or click to browse &middot; JPEG, PNG, WebP, GIF, BMP &middot; Max
                                20 MB
                            </p>
                        </div>
                    </div>
                )}

                {/* ── MODEL LOADING ─────────────────────────────────────── */}
                {state === 'model-loading' && (
                    <div className="flex flex-col items-center gap-4 py-24" role="status" aria-live="polite">
                        <CircularLoader size="lg" />
                        <TextShimmerLoader text={loadingProgress || 'Loading AI models...'} size="md" />
                        <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
                            Downloading 3 classification models. These are cached by your browser
                            for future visits.
                        </p>
                    </div>
                )}

                {/* ── READY / ANALYZING / RESULTS ───────────────────────── */}
                {(state === 'ready' || state === 'analyzing' || state === 'results') &&
                    imageUrl && (
                        <div className="space-y-6">
                            {/* Image preview */}
                            <Card className="overflow-hidden rounded-2xl border-border/50">
                                <div className="relative bg-black/5 dark:bg-white/5 flex items-center justify-center p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        ref={imageRef}
                                        src={imageUrl}
                                        alt="Image to analyze"
                                        className="max-h-[400px] w-auto max-w-full object-contain rounded-lg"
                                        crossOrigin="anonymous"
                                        onLoad={onImageLoad}
                                        onError={() => {
                                            setError(
                                                'Failed to load the image. The file may be corrupted.',
                                            );
                                            setState('idle');
                                            toast.error('Image load failed');
                                        }}
                                    />
                                </div>
                                {fileName && (
                                    <div className="px-4 py-2 border-t border-border/30 flex items-center gap-2">
                                        <ImageIcon
                                            className="w-3.5 h-3.5 text-muted-foreground/50"
                                            aria-hidden="true"
                                        />
                                        <span className="text-xs text-muted-foreground/70 truncate">
                                            {fileName}
                                        </span>
                                    </div>
                                )}
                            </Card>

                            {/* Analyzing spinner */}
                            {(state === 'ready' || state === 'analyzing') && (
                                <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
                                    <CircularLoader size="lg" />
                                    <TextShimmerLoader text="Analyzing image..." size="md" />
                                </div>
                            )}

                            {/* Results */}
                            {state === 'results' && results && (
                                <div className="space-y-6">
                                    {/* Verdict card */}
                                    {(() => {
                                        const cfg = VERDICT_CONFIG[results.verdict];
                                        const VerdictIcon = cfg.icon;
                                        return (
                                            <Card
                                                className={cn(
                                                    'p-6 rounded-2xl border',
                                                    cfg.border,
                                                    cfg.bg,
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn('p-3 rounded-xl', cfg.bg)}
                                                    >
                                                        <VerdictIcon
                                                            className={cn('w-8 h-8', cfg.color)}
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h2
                                                                className={cn(
                                                                    'font-vt323 text-3xl uppercase',
                                                                    cfg.color,
                                                                )}
                                                            >
                                                                {results.verdict}
                                                            </h2>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'font-mono text-xs',
                                                                    cfg.color,
                                                                    cfg.border,
                                                                )}
                                                            >
                                                                {(
                                                                    results.topProbability * 100
                                                                ).toFixed(1)}
                                                                %{' '}
                                                                {results.topClass}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-xs text-muted-foreground border-border/50"
                                                            >
                                                                Multi-Model
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {cfg.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })()}

                                    {/* Classification breakdown */}
                                    <Card className="p-6 rounded-2xl border-border/50">
                                        <h3 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider mb-4">
                                            Classification Breakdown
                                        </h3>
                                        <div
                                            className="space-y-3"
                                            role="list"
                                            aria-label="Classification results"
                                        >
                                            {results.predictions.map((prediction) => {
                                                const config = CLASS_CONFIG[
                                                    prediction.className
                                                ] ?? {
                                                    label: prediction.className,
                                                    color: 'text-muted-foreground',
                                                    bgColor: 'bg-muted-foreground',
                                                };
                                                const percentage = prediction.probability * 100;
                                                return (
                                                    <div
                                                        key={prediction.className}
                                                        className="space-y-1.5"
                                                        role="listitem"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={cn(
                                                                    'font-mono text-sm font-medium',
                                                                    config.color,
                                                                )}
                                                            >
                                                                {config.label}
                                                            </span>
                                                            <span className="font-mono text-sm text-muted-foreground">
                                                                {percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
                                                            role="progressbar"
                                                            aria-valuenow={Math.round(percentage)}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-label={`${config.label}: ${percentage.toFixed(1)}%`}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'h-full rounded-full transition-all duration-500 ease-out',
                                                                    config.bgColor,
                                                                )}
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>

                                    {/* Analyze another */}
                                    <div className="flex justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                            onClick={reset}
                                        >
                                            <RotateCcw
                                                className="w-4 h-4 mr-2"
                                                aria-hidden="true"
                                            />
                                            Analyze Another
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                {/* Disclaimer */}
                <div className="mt-12 p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
                        <h3 className="font-vt323 text-base text-muted-foreground uppercase">
                            How It Works &amp; Disclaimer
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This tool uses AI to classify images entirely within your browser. No image
                        data is ever sent to any server. Multiple classification models are
                        downloaded once and cached by your browser for future visits. Results are
                        averaged across all models for higher accuracy. Predictions are
                        probabilistic estimates and may not be 100% accurate. This tool is intended
                        for content moderation guidance only and should not be used as the sole
                        basis for content decisions.
                    </p>
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                    aria-label="Upload image for safety analysis"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
            </div>

            {/* Background decor */}
            <div
                className="fixed top-0 left-0 w-full h-full pointer-events-none -z-50 overflow-hidden"
                aria-hidden="true"
            >
                <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[5%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px]" />
            </div>
        </PageShell>
        </ToolAuthGate>
    );
}
