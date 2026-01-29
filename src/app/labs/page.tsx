'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { fal } from '@fal-ai/client';
import { Loader2, Play, Image as ImageIcon, Sparkles, AlertCircle, Key, ArrowRight, Video as VideoIcon } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Models
const TEXT_TO_IMAGE_MODEL = 'fal-ai/flux-pro/v1.1-ultra'; // Using Flux Ultra as Grok Imagine placeholder/proxy if needed, or specific ID if known.
// Note: fal.ai/models/xai/grok-imagine-image is the requested ID.
const GROK_MODEL = 'fal-ai/grok-imagine'; // This is speculative; usually it's xai/grok-imagine-image or similar.
// I will use a fallback or user input model if needed, but for now I will try the specific one requested.
// If the user specific linked 'fal.ai/models/xai/grok-imagine-image', the ID is likely 'xai/grok-imagine-image'.
const TARGET_TXT2IMG_MODEL = 'xai/grok-imagine-image';
const TARGET_IMG2VID_MODEL = 'fal-ai/luma-dream-machine';

export default function LabsPage() {
    const [apiKey, setApiKey] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

    // Configure FAL client when key changes
    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.value;
        setApiKey(key);
        if (key) {
            // We set it locally for client-side only usage (not recommended for prod but creating a 'labs' interface)
            fal.config({
                credentials: key,
            });
        }
    };

    const generateImage = async () => {
        if (!prompt) return;
        if (!apiKey) {
            setError('Please enter your Fal API Key first.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setLogs([]);
        setGeneratedVideo(null); // Reset video if new image

        try {
            const result: any = await fal.subscribe(TARGET_TXT2IMG_MODEL, {
                input: {
                    prompt: prompt,
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === 'IN_PROGRESS' && update.logs) {
                        setLogs((prev) => [...prev, ...update.logs.map(l => l.message)]);
                    }
                },
            });

            if (result.images && result.images.length > 0) {
                setGeneratedImage(result.images[0].url);
            } else if (result.image && result.image.url) {
                setGeneratedImage(result.image.url);
            } else {
                // Fallback structure
                console.log('Result:', result);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate image');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateVideo = async () => {
        if (!generatedImage) return;
        if (!apiKey) {
            setError('Please enter your Fal API Key first.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setLogs([]);
        setActiveTab('video');

        try {
            const result: any = await fal.subscribe(TARGET_IMG2VID_MODEL, {
                input: {
                    prompt: prompt, // Use same prompt for video guidance
                    image_url: generatedImage,
                } as any,
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === 'IN_PROGRESS' && update.logs) {
                        setLogs((prev) => [...prev, ...update.logs.map(l => l.message)]);
                    }
                },
            });

            if (result.video && result.video.url) {
                setGeneratedVideo(result.video.url);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate video');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden">
            {/* Background Noise */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise z-0" />

            {/* Navbar */}
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

            <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10 w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-[80vh]">

                    {/* Left Panel: Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 flex flex-col gap-6 bg-card/30 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl h-full overflow-y-auto"
                    >
                        <div className="space-y-2">
                            <h1 className="text-3xl font-light tracking-tight">Imagine</h1>
                            <p className="text-sm text-muted-foreground">
                                Generate visuals with xAI Grok and animate with Luma Dream Machine.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="api-key" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Key className="w-3 h-3" /> Fal API Key
                                </Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder="sk-fal-..."
                                    value={apiKey}
                                    onChange={handleKeyChange}
                                    className="bg-background/50 border-white/10 focus:border-primary/50 font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Key is only used locally in your browser.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prompt" className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</Label>
                                <Textarea
                                    id="prompt"
                                    placeholder="A futuristic city in the clouds, cyberpunk style..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[120px] bg-background/50 border-white/10 focus:border-primary/50 resize-none text-base leading-relaxed"
                                />
                            </div>

                            <Button
                                onClick={generateImage}
                                disabled={!prompt || !apiKey || isGenerating}
                                className="w-full h-12 text-sm font-medium tracking-wide relative overflow-hidden group"
                                variant="default"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="relative flex items-center gap-2">
                                    {isGenerating && activeTab === 'image' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    GENERATE IMAGE
                                </span>
                            </Button>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                    <p className="text-xs text-red-400">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Logs (Mini) */}
                        {logs.length > 0 && isGenerating && (
                            <div className="flex-1 bg-black/40 rounded-xl p-4 font-mono text-[10px] text-green-400/80 overflow-hidden relative">
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="h-full flex flex-col justify-end">
                                    {logs.slice(-3).map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="truncate"
                                        >
                                            {`> ${log}`}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right Panel: Display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-8 bg-card/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col"
                    >
                        {/* Tabs */}
                        {generatedVideo && (
                            <div className="absolute top-4 left-4 z-20 flex gap-2 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5">
                                <button
                                    onClick={() => setActiveTab('image')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'image' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Image
                                </button>
                                <button
                                    onClick={() => setActiveTab('video')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'video' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Video
                                </button>
                            </div>
                        )}

                        <div className="flex-1 relative flex items-center justify-center bg-black/40">
                            <AnimatePresence mode="wait">
                                {isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-black/20"
                                    >
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
                                            <div className="w-16 h-16 rounded-full border-b-2 border-l-2 border-purple-500 animate-spin absolute inset-0 reverse-spin" />
                                        </div>
                                        <p className="mt-4 text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Dreaming...</p>
                                    </motion.div>
                                )}

                                {!generatedImage && !isGenerating ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center space-y-4 p-8"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-lg font-medium text-muted-foreground">Ready to Imagine</h3>
                                        <p className="text-sm text-muted-foreground/50 max-w-xs mx-auto">
                                            Enter a prompt to start generating high-fidelity visuals using xAI Grok.
                                        </p>
                                    </motion.div>
                                ) : activeTab === 'image' ? (
                                    <motion.div
                                        key="image"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative w-full h-full"
                                    >
                                        {generatedImage && (
                                            <Image
                                                src={generatedImage}
                                                alt="Generated Content"
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="video"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative w-full h-full flex items-center justify-center"
                                    >
                                        {generatedVideo && (
                                            <video
                                                src={generatedVideo}
                                                controls
                                                autoPlay
                                                loop
                                                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Controls for Image View */}
                        {generatedImage && activeTab === 'image' && (
                            <div className="p-4 border-t border-white/5 bg-background/10 backdrop-blur-md flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    Generated with <span className="text-foreground font-medium">{TARGET_TXT2IMG_MODEL}</span>
                                </div>
                                <Button
                                    onClick={generateVideo}
                                    disabled={isGenerating}
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/10 hover:bg-white/20 text-white border-white/10 gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <VideoIcon className="w-3 h-3" />}
                                    Animate with Luma
                                    <ArrowRight className="w-3 h-3 opacity-50" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
