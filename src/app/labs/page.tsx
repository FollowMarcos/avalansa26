'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { fal } from '@fal-ai/client';
import {
    Loader2,
    Image as ImageIcon,
    Sparkles,
    AlertCircle,
    Key,
    ArrowRight,
    Video as VideoIcon,
    History as HistoryIcon,
    Trash2,
    Play,
    Check
} from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Models
const MODEL_TXT2IMG = 'xai/grok-imagine-image';
const MODEL_TXT2VID = 'xai/grok-imagine-video/text-to-video';
const MODEL_IMG2VID = 'xai/grok-imagine-video/image-to-video';

// Types
interface GenerationSettings {
    aspectRatio: string;
    numImages: number;
    safetyChecker: boolean;
    seed?: number | null;
    duration?: number;
}

interface HistoryItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    prompt: string;
    timestamp: number;
    settings?: GenerationSettings;
    model: string;
}

const ASPECT_RATIOS = {
    '1:1': { width: 1024, height: 1024, label: 'Square (1:1)' },
    '4:3': { width: 1152, height: 896, label: 'Landscape (4:3)' },
    '3:4': { width: 896, height: 1152, label: 'Portrait (3:4)' },
    '16:9': { width: 1280, height: 720, label: 'Widescreen (16:9)' },
    '9:16': { width: 720, height: 1280, label: 'Mobile (9:16)' }
};

export default function LabsPage() {
    // State
    const [apiKey, setApiKey] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [mode, setMode] = useState<'text-to-image' | 'text-to-video' | 'image-to-video'>('text-to-image');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Settings
    const [settings, setSettings] = useState<GenerationSettings>({
        aspectRatio: '16:9',
        numImages: 1,
        safetyChecker: true,
        seed: null,
        duration: 5
    });

    // Load history and key from local storage on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('avalansa-labs-history');
        if (storedHistory) {
            try {
                setHistory(JSON.parse(storedHistory));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }

        const storedKey = localStorage.getItem('avalansa-fal-key');
        if (storedKey) {
            setApiKey(storedKey);
            fal.config({ credentials: storedKey });
        }
    }, []);

    // Save history to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('avalansa-labs-history', JSON.stringify(history));
    }, [history]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.value;
        setApiKey(key);
        localStorage.setItem('avalansa-fal-key', key);
        if (key) {
            fal.config({ credentials: key });
        }
    };

    const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        const newItem: HistoryItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        setHistory(prev => [newItem, ...prev]);
    };

    const clearHistory = () => {
        if (confirm('Are you sure you want to clear your generation history?')) {
            setHistory([]);
        }
    };

    const handleGenerate = async () => {
        if (!prompt && mode !== 'image-to-video') return;
        if (!generatedImage && mode === 'image-to-video') {
            setError('Please generate or select an image first.');
            return;
        }
        if (!apiKey) {
            setError('Please enter your Fal API Key first.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setLogs([]);

        try {
            let result: any;
            const size = ASPECT_RATIOS[settings.aspectRatio as keyof typeof ASPECT_RATIOS];

            if (mode === 'text-to-image') {
                result = await fal.subscribe(MODEL_TXT2IMG, {
                    input: {
                        prompt: prompt,
                        image_size: { width: size.width, height: size.height },
                        num_images: settings.numImages,
                        enable_safety_checker: settings.safetyChecker,
                        seed: settings.seed ? Number(settings.seed) : undefined,
                        image_format: "url"
                    },
                    logs: true,
                    onQueueUpdate: handleQueueUpdate
                });

                if (result.images?.[0]?.url || result.image?.url) {
                    const url = result.images?.[0]?.url || result.image?.url;
                    setGeneratedImage(url);
                    addToHistory({ type: 'image', url, prompt, model: MODEL_TXT2IMG, settings });
                }

            } else if (mode === 'text-to-video') {
                result = await fal.subscribe(MODEL_TXT2VID, {
                    input: {
                        prompt: prompt,
                        duration: settings.duration,
                        aspect_ratio: settings.aspectRatio,
                        seed: settings.seed ? Number(settings.seed) : undefined,
                    },
                    logs: true,
                    onQueueUpdate: handleQueueUpdate
                });

                if (result.video?.url) {
                    setGeneratedVideo(result.video.url);
                    addToHistory({ type: 'video', url: result.video.url, prompt, model: MODEL_TXT2VID, settings });
                }

            } else if (mode === 'image-to-video') {
                result = await fal.subscribe(MODEL_IMG2VID, {
                    input: {
                        prompt: prompt, // Optional: Use prompt to guide motion if supported
                        image_url: generatedImage,
                        duration: settings.duration,
                        seed: settings.seed ? Number(settings.seed) : undefined,
                    } as any, // Cast for safety if types are strict
                    logs: true,
                    onQueueUpdate: handleQueueUpdate
                });

                if (result.video?.url) {
                    setGeneratedVideo(result.video.url);
                    addToHistory({ type: 'video', url: result.video.url, prompt, model: MODEL_IMG2VID, settings });
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleQueueUpdate = (update: any) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
            setLogs((prev) => [...prev, ...update.logs.map((l: any) => l.message)]);
        }
    };

    const restoreHistoryItem = (item: HistoryItem) => {
        setPrompt(item.prompt);
        if (item.settings) setSettings(item.settings);

        if (item.type === 'image') {
            setGeneratedImage(item.url);
            setMode('text-to-image');
        } else {
            setGeneratedVideo(item.url);
            // Infer mode based on model
            setMode(item.model.includes('image-to-video') ? 'image-to-video' : 'text-to-video');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise z-0" />

            <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 bg-background/50 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">AVALANSA <span className="opacity-50 font-normal">LABS</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-muted/50 border border-white/5 gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground font-mono">GROK/IMAGINE</span>
                    </div>
                    <ModeToggle />
                </div>
            </nav>

            <main className="flex-1 pt-32 pb-20 px-4 relative z-10 w-full max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-[85vh]">

                    {/* Controls */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-6 bg-card/30 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl overflow-y-auto flex-1 custom-scrollbar"
                        >
                            <div className="space-y-4">
                                <Label htmlFor="api-key" className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Key className="w-3 h-3" /> Fal API Key (Req. Grok Access)
                                </Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder="sk-fal-..."
                                    value={apiKey}
                                    onChange={handleKeyChange}
                                    className="bg-background/50 border-white/10 focus:border-primary/50 font-mono text-xs h-9"
                                />
                            </div>

                            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                <TabsList className="w-full grid grid-cols-3 bg-white/5 border border-white/5">
                                    <TabsTrigger value="text-to-image" className="text-[10px]">Text 2 Img</TabsTrigger>
                                    <TabsTrigger value="text-to-video" className="text-[10px]">Text 2 Vid</TabsTrigger>
                                    <TabsTrigger value="image-to-video" className="text-[10px]">Img 2 Vid</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt" className="text-[10px] uppercase tracking-wider text-muted-foreground">Prompt</Label>
                                    <Textarea
                                        id="prompt"
                                        placeholder={mode === 'image-to-video' ? "Optional guidance for motion..." : "Describe your vision..."}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="min-h-[100px] bg-background/50 border-white/10 focus:border-primary/50 resize-none text-sm leading-relaxed"
                                    />
                                </div>

                                {mode === 'image-to-video' && (
                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] text-primary/80 mb-2 uppercase tracking-wide">Source Image</p>
                                        {generatedImage ? (
                                            <div className="relative w-full h-24 rounded-md overflow-hidden border border-white/10">
                                                <Image src={generatedImage} alt="Source" fill className="object-cover" />
                                                <div className="absolute top-1 right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check className="w-2.5 h-2.5" /> Ready
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic text-center py-4">
                                                No image selected. Generate one first or select from history.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {!mode.includes('image-to-video') && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Ratio</Label>
                                            <Select
                                                value={settings.aspectRatio}
                                                onValueChange={(v) => setSettings(s => ({ ...s, aspectRatio: v }))}
                                            >
                                                <SelectTrigger className="bg-background/50 border-white/10 text-xs h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(ASPECT_RATIOS).map(([key, value]) => (
                                                        <SelectItem key={key} value={key} className="text-xs">{value.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {mode === 'text-to-image' && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Count</Label>
                                            <Select
                                                value={String(settings.numImages)}
                                                onValueChange={(v) => setSettings(s => ({ ...s, numImages: Number(v) }))}
                                            >
                                                <SelectTrigger className="bg-background/50 border-white/10 text-xs h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4].map(num => (
                                                        <SelectItem key={num} value={String(num)} className="text-xs">{num}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {mode.includes('video') && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</Label>
                                            <Select
                                                value={String(settings.duration)}
                                                onValueChange={(v) => setSettings(s => ({ ...s, duration: Number(v) }))}
                                            >
                                                <SelectTrigger className="bg-background/50 border-white/10 text-xs h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="5" className="text-xs">5 Seconds</SelectItem>
                                                    <SelectItem value="10" className="text-xs">10 Seconds</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={(!prompt && mode !== 'image-to-video') || !apiKey || isGenerating}
                                    className="w-full h-11 text-xs font-semibold tracking-widest uppercase relative overflow-hidden group mt-4"
                                    variant="default"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <span className="relative flex items-center gap-2">
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : mode.includes('video') ? <VideoIcon className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                        {mode === 'image-to-video' ? 'Animate' : 'Generate'}
                                    </span>
                                </Button>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                        <p className="text-[10px] text-red-400 leading-tight">{error}</p>
                                    </div>
                                )}
                            </div>

                            {logs.length > 0 && isGenerating && (
                                <div className="flex-1 bg-black/40 rounded-xl p-3 font-mono text-[10px] text-green-400/80 overflow-hidden relative max-h-[150px]">
                                    <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="h-full flex flex-col justify-end">
                                        {logs.slice(-5).map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="truncate py-0.5"
                                            >
                                                {`> ${log}`}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Display */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 bg-card/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col min-h-[500px]"
                        >
                            <div className="flex-1 relative flex items-center justify-center bg-black/40">
                                <AnimatePresence mode="wait">
                                    {isGenerating ? (
                                        <motion.div
                                            key="generating"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-black/20"
                                        >
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
                                                <div className="w-16 h-16 rounded-full border-b-2 border-l-2 border-purple-500 animate-spin absolute inset-0 reverse-spin" />
                                            </div>
                                            <p className="mt-6 text-xs tracking-[0.2em] uppercase text-muted-foreground animate-pulse font-medium">
                                                Dreaming with Grok...
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            {mode === 'text-to-image' && generatedImage && (
                                                <motion.div key="img" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full p-8">
                                                    <Image src={generatedImage} alt="Result" fill className="object-contain" unoptimized />
                                                </motion.div>
                                            )}
                                            {mode.includes('video') && generatedVideo && (
                                                <motion.div key="vid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full flex items-center justify-center p-8">
                                                    <video src={generatedVideo} controls autoPlay loop className="max-h-full max-w-full rounded-xl shadow-2xl" />
                                                </motion.div>
                                            )}
                                            {!generatedImage && !generatedVideo && (
                                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                                                        <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground/50">Ready to Create</p>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Context Action */}
                            {mode === 'text-to-image' && generatedImage && !isGenerating && (
                                <div className="p-4 border-t border-white/5 bg-background/20 backdrop-blur-md flex justify-end">
                                    <Button
                                        onClick={() => setMode('image-to-video')}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/5 hover:bg-white/10 text-xs gap-2"
                                    >
                                        <VideoIcon className="w-3 h-3" />
                                        Animate this Image
                                        <ArrowRight className="w-3 h-3 opacity-50" />
                                    </Button>
                                </div>
                            )}
                        </motion.div>

                        {/* History */}
                        <motion.div
                            className="h-32 bg-card/30 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col gap-2 relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                    <HistoryIcon className="w-3 h-3" /> History
                                    <span className="bg-white/10 px-1.5 rounded text-[10px]">{history.length}</span>
                                </div>
                                {history.length > 0 && (
                                    <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-red-400 uppercase tracking-wider flex items-center gap-1">
                                        <Trash2 className="w-3 h-3" /> Clear
                                    </button>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground/40 italic">
                                    Generations will appear here...
                                </div>
                            ) : (
                                <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-3 px-1 pb-1">
                                    {history.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => restoreHistoryItem(item)}
                                            className="relative flex-shrink-0 group w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            {item.type === 'video' ? (
                                                <div className="w-full h-full bg-black flex items-center justify-center relative">
                                                    <video src={item.url} className="w-full h-full object-cover opacity-60" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <VideoIcon className="w-6 h-6 text-white/80 drop-shadow-md" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <Image src={item.url} alt="H" fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
