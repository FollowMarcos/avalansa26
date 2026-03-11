'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Fingerprint,
    Image as ImageIcon,
    RotateCcw,
    Lock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Clock,
    Shield,
    Cpu,
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

type AnalysisState = 'idle' | 'analyzing' | 'results';

type Verdict = 'no-c2pa' | 'ai-generated' | 'verified';

interface ProvenanceAction {
    action: string;
    when?: string | null;
    softwareAgent?: string | null;
    digitalSourceType?: string | null;
}

interface ProvenanceData {
    hasC2PA: boolean;
    isAIGenerated: boolean;
    claimGenerator: string | null;
    signer: string | null;
    digitalSourceType: string | null;
    dateCreated: string | null;
    title: string | null;
    actions: ProvenanceAction[];
    validationState: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/avif',
];

const AI_SOURCE_TYPES = [
    'trainedAlgorithmicMedia',
    'compositeWithTrainedAlgorithmicMedia',
];

const AI_TOOL_KEYWORDS = [
    'firefly',
    'dall-e',
    'dall\u00B7e',
    'midjourney',
    'stable diffusion',
    'imagen',
    'gemini',
    'copilot',
    'bing image creator',
];

const VERDICT_CONFIG: Record<
    Verdict,
    {
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
        border: string;
        title: string;
        description: string;
    }
> = {
    'no-c2pa': {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        title: 'No Content Credentials Found',
        description:
            'This image does not contain C2PA metadata. Most images currently lack Content Credentials \u2014 their absence does not confirm the image is fake or AI-generated.',
    },
    'ai-generated': {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        title: 'AI-Generated Content Detected',
        description:
            'This image contains Content Credentials indicating it was created or significantly modified using AI.',
    },
    verified: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        title: 'Verified Content Credentials',
        description:
            'This image contains valid Content Credentials with a verifiable creation history.',
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function determineVerdict(data: ProvenanceData): Verdict {
    if (!data.hasC2PA) return 'no-c2pa';
    if (data.isAIGenerated) return 'ai-generated';
    return 'verified';
}

function formatDate(isoDate: string | null): string {
    if (!isoDate) return 'Unknown';
    try {
        return new Date(isoDate).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return isoDate;
    }
}

function cleanClaimGenerator(generator: string | null): string {
    if (!generator) return 'Unknown';
    return generator.replace(/\/[\d.]+$/, '').trim() || generator;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentProvenanceCheckerPage() {
    const [state, setState] = useState<AnalysisState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
    const [verdict, setVerdict] = useState<Verdict | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c2paRef = useRef<any>(null);

    // -- C2PA SDK init (dynamic import to avoid SSR) --------------------------

    const getC2pa = useCallback(async () => {
        if (c2paRef.current) return c2paRef.current;

        const { createC2pa } = await import('@contentauth/c2pa-web');
        const c2pa = await createC2pa({
            wasmSrc:
                'https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@0.6.1/dist/resources/c2pa_bg.wasm',
        });
        c2paRef.current = c2pa;
        return c2pa;
    }, []);

    // -- File handler + auto-analyze ------------------------------------------

    const handleFile = useCallback(
        async (file: File) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast.error(
                    'Invalid file type. Please upload a JPEG, PNG, WebP, TIFF, or AVIF image.',
                );
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
            setProvenance(null);
            setVerdict(null);
            setError(null);
            setState('analyzing');

            try {
                const c2pa = await getC2pa();
                const reader = await c2pa.reader.fromBlob(file.type, file);

                if (!reader) {
                    // No C2PA metadata found
                    const data: ProvenanceData = {
                        hasC2PA: false,
                        isAIGenerated: false,
                        claimGenerator: null,
                        signer: null,
                        digitalSourceType: null,
                        dateCreated: null,
                        title: null,
                        actions: [],
                        validationState: null,
                    };
                    setProvenance(data);
                    setVerdict(determineVerdict(data));
                    setState('results');
                    return;
                }

                const store = await reader.manifestStore();
                const activeLabel = store.active_manifest;
                const manifest =
                    activeLabel && store.manifests
                        ? store.manifests[activeLabel]
                        : null;

                let isAIGenerated = false;
                let digitalSourceType: string | null = null;
                let dateCreated: string | null = null;
                const actions: ProvenanceAction[] = [];

                if (manifest?.assertions) {
                    for (const assertion of manifest.assertions) {
                        if (
                            assertion.label === 'c2pa.actions' ||
                            assertion.label === 'c2pa.actions.v2'
                        ) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const actionsData = assertion.data as {
                                actions?: any[];
                            };
                            if (actionsData?.actions) {
                                for (const action of actionsData.actions) {
                                    const dst = action.digitalSourceType as
                                        | string
                                        | undefined;
                                    if (
                                        dst &&
                                        AI_SOURCE_TYPES.some((t) =>
                                            dst.includes(t),
                                        )
                                    ) {
                                        isAIGenerated = true;
                                        digitalSourceType = dst;
                                    }
                                    actions.push({
                                        action: action.action ?? 'Unknown',
                                        when: action.when ?? null,
                                        softwareAgent:
                                            typeof action.softwareAgent ===
                                            'string'
                                                ? action.softwareAgent
                                                : (action.softwareAgent
                                                      ?.name ?? null),
                                        digitalSourceType: dst ?? null,
                                    });
                                    if (action.when && !dateCreated) {
                                        dateCreated = action.when;
                                    }
                                }
                            }
                        }
                    }
                }

                // Check claim_generator for known AI tools
                const claimGen = manifest?.claim_generator ?? null;
                if (claimGen && !isAIGenerated) {
                    const lower = claimGen.toLowerCase();
                    if (AI_TOOL_KEYWORDS.some((k) => lower.includes(k))) {
                        isAIGenerated = true;
                    }
                }

                // Check claim_generator_info for AI indicators
                if (manifest?.claim_generator_info && !isAIGenerated) {
                    for (const info of manifest.claim_generator_info) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const name = ((info as any).name ?? '').toLowerCase();
                        if (AI_TOOL_KEYWORDS.some((k) => name.includes(k))) {
                            isAIGenerated = true;
                        }
                    }
                }

                const signer = manifest?.signature_info
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ((manifest.signature_info as any).issuer ?? null)
                    : null;

                const data: ProvenanceData = {
                    hasC2PA: true,
                    isAIGenerated,
                    claimGenerator: claimGen,
                    signer,
                    digitalSourceType,
                    dateCreated,
                    title: manifest?.title ?? null,
                    actions,
                    validationState: store.validation_state ?? null,
                };

                setProvenance(data);
                setVerdict(determineVerdict(data));
                setState('results');

                // Free WASM memory
                await reader.free();
            } catch (err) {
                console.error('C2PA analysis failed:', err);
                setError(
                    'Failed to read content credentials. The file may be corrupted or in an unsupported format.',
                );
                setState('idle');
                toast.error('Analysis failed');
            }
        },
        [imageUrl, getC2pa],
    );

    // -- Reset ----------------------------------------------------------------

    const reset = useCallback(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        setImageUrl(null);
        setFileName(null);
        setProvenance(null);
        setVerdict(null);
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

    // -- Drag-and-drop --------------------------------------------------------

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

    // -- Render ---------------------------------------------------------------

    return (
        <ToolAuthGate toolName="Content Provenance Checker">
        <PageShell contentClassName="bg-transparent">
            <div className="min-h-dvh pt-16 pb-12 px-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="p-2 bg-primary/10 rounded-xl"
                                aria-hidden="true"
                            >
                                <Fingerprint className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-vt323 tracking-tight text-primary uppercase text-balance">
                                Content Provenance Checker
                            </h1>
                        </div>
                        <p className="font-lato text-muted-foreground text-lg italic opacity-80 max-w-2xl text-pretty">
                            Check if images have Content Credentials (C2PA)
                            &mdash; detect AI-generated content and verify
                            provenance, all in your browser.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {state !== 'idle' && imageUrl && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={reset}
                            >
                                <RotateCcw
                                    className="w-4 h-4 mr-2"
                                    aria-hidden="true"
                                />
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
                        100% Browser-Based &mdash; No Data Uploaded
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
                        aria-label="Upload image to check content provenance"
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
                            <p className="text-sm text-muted-foreground">
                                or click to browse &middot; JPEG, PNG, WebP,
                                TIFF, AVIF &middot; Max 20 MB
                            </p>
                        </div>
                    </div>
                )}

                {/* ── ANALYZING ─────────────────────────────────────────── */}
                {state === 'analyzing' && imageUrl && (
                    <div className="space-y-6">
                        {/* Image preview */}
                        <Card className="overflow-hidden rounded-2xl border-border/50">
                            <div className="relative bg-black/5 dark:bg-white/5 flex items-center justify-center p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt="Image being analyzed"
                                    className="max-h-[400px] w-auto max-w-full object-contain rounded-lg"
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
                        <div
                            className="flex flex-col items-center gap-4 py-8"
                            role="status"
                            aria-live="polite"
                        >
                            <CircularLoader size="lg" />
                            <TextShimmerLoader
                                text="Reading content credentials..."
                                size="md"
                            />
                        </div>
                    </div>
                )}

                {/* ── RESULTS ──────────────────────────────────────────── */}
                {state === 'results' && imageUrl && verdict && provenance && (
                    <div className="space-y-6">
                        {/* Image preview */}
                        <Card className="overflow-hidden rounded-2xl border-border/50">
                            <div className="relative bg-black/5 dark:bg-white/5 flex items-center justify-center p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt="Analyzed image"
                                    className="max-h-[400px] w-auto max-w-full object-contain rounded-lg"
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

                        {/* Verdict card */}
                        {(() => {
                            const cfg = VERDICT_CONFIG[verdict];
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
                                            className={cn(
                                                'p-3 rounded-xl',
                                                cfg.bg,
                                            )}
                                        >
                                            <VerdictIcon
                                                className={cn(
                                                    'w-8 h-8',
                                                    cfg.color,
                                                )}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2
                                                className={cn(
                                                    'font-vt323 text-3xl uppercase',
                                                    cfg.color,
                                                )}
                                            >
                                                {cfg.title}
                                            </h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {cfg.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })()}

                        {/* Provenance details (only when C2PA is present) */}
                        {provenance.hasC2PA && (
                            <Card className="p-6 rounded-2xl border-border/50">
                                <h3 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider mb-4">
                                    Provenance Details
                                </h3>
                                <div className="space-y-4">
                                    {provenance.claimGenerator && (
                                        <div className="flex items-start gap-3">
                                            <Cpu
                                                className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider">
                                                    Created With
                                                </p>
                                                <p className="font-mono text-sm">
                                                    {cleanClaimGenerator(
                                                        provenance.claimGenerator,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {provenance.signer && (
                                        <div className="flex items-start gap-3">
                                            <Shield
                                                className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider">
                                                    Signed By
                                                </p>
                                                <p className="font-mono text-sm">
                                                    {provenance.signer}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {provenance.digitalSourceType && (
                                        <div className="flex items-start gap-3">
                                            <Fingerprint
                                                className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider">
                                                    Source Type
                                                </p>
                                                <p className="font-mono text-sm">
                                                    {provenance.digitalSourceType}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {provenance.dateCreated && (
                                        <div className="flex items-start gap-3">
                                            <Clock
                                                className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider">
                                                    Date
                                                </p>
                                                <p className="font-mono text-sm">
                                                    {formatDate(
                                                        provenance.dateCreated,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {provenance.validationState && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2
                                                className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider">
                                                    Validation
                                                </p>
                                                <p
                                                    className={cn(
                                                        'font-mono text-sm flex items-center gap-1.5',
                                                        provenance.validationState ===
                                                            'Valid' ||
                                                            provenance.validationState ===
                                                                'Trusted'
                                                            ? 'text-emerald-500'
                                                            : provenance.validationState ===
                                                                'Invalid'
                                                              ? 'text-red-500'
                                                              : '',
                                                    )}
                                                >
                                                    {(provenance.validationState === 'Valid' || provenance.validationState === 'Trusted') && (
                                                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                    )}
                                                    {provenance.validationState === 'Invalid' && (
                                                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                    )}
                                                    {provenance.validationState}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {provenance.actions.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground/60 uppercase font-vt323 tracking-wider mb-2">
                                                Edit History
                                            </p>
                                            <div className="space-y-2">
                                                {provenance.actions.map(
                                                    (action, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-2 text-sm font-mono flex-wrap"
                                                        >
                                                            <span className="text-muted-foreground/40">
                                                                {i + 1}.
                                                            </span>
                                                            <span>
                                                                {action.action}
                                                            </span>
                                                            {action.softwareAgent && (
                                                                <span className="text-muted-foreground/60">
                                                                    via{' '}
                                                                    {
                                                                        action.softwareAgent
                                                                    }
                                                                </span>
                                                            )}
                                                            {action.when && (
                                                                <span className="text-muted-foreground/40 text-xs">
                                                                    {formatDate(
                                                                        action.when,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Check another */}
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
                                Check Another Image
                            </Button>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-12 p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2">
                        <Info
                            className="w-4 h-4 text-muted-foreground/60"
                            aria-hidden="true"
                        />
                        <h3 className="font-vt323 text-base text-muted-foreground uppercase">
                            About Content Credentials
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Content Credentials (C2PA) is an open standard for
                        certifying the provenance of digital content. When
                        present, these credentials can reveal how an image was
                        created, edited, and by what tools. This check runs
                        entirely in your browser &mdash; no data is sent to any
                        server. Note that most images on the internet currently
                        lack Content Credentials. Their absence does not indicate
                        the image is fake or AI-generated.
                    </p>
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/tiff,image/avif"
                    aria-label="Upload image to check content provenance"
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
