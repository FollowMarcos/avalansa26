"use client";

import { useImagine } from "./imagine-context";
import { Button } from "@/components/ui/button";
import { Plus, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ImagineInput() {
    const { prompt, setPrompt, isInputVisible, toggleInputVisibility, settings, updateSettings } = useImagine();

    return (
        <AnimatePresence>
            {isInputVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-4xl mx-auto pointer-events-auto origin-bottom"
                >
                    <div className="relative bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl ring-1 ring-white/5 overflow-hidden">

                        {/* Header / Actions */}
                        <div className="absolute top-4 right-4 z-10">
                            <Button variant="ghost" size="icon" onClick={toggleInputVisibility}>
                                <X className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Top Row: Input & Generate */}
                            <div className="flex gap-4 items-start">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-24 w-24 rounded-xl shrink-0 border-dashed border-2 hover:border-solid hover:bg-accent/50 group"
                                >
                                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </Button>

                                <div className="flex-1 relative">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe the scene you imagine..."
                                        className="w-full h-24 py-3 bg-secondary/20 border border-border/50 rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 text-lg leading-relaxed shadow-inner"
                                    />
                                    <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground">
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Button
                                    size="icon"
                                    className="h-24 w-24 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-all shrink-0"
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                                        <path d="M20 2H22V4H24V6H22V8H24V10H22V12H20V10H18V12H16V14H18V16H16V18H14V20H12V22H10V20H8V18H6V16H8V14H6V12H4V10H2V8H4V6H6V4H8V2H10V4H8V6H10V8H12V10H14V8H12V6H14V4H16V2H18V4H20V2Z" fillRule="evenodd" clipRule="evenodd" />
                                        <rect x="14" y="2" width="2" height="2" className="opacity-40" />
                                        <rect x="8" y="4" width="2" height="2" className="opacity-40" />
                                        <path d="M12 12L2 22M22 2L12 12" stroke="currentColor" strokeWidth="0" />
                                    </svg>
                                </Button>
                            </div>

                            {/* Middle Row: Controls */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Model</Label>
                                    <Select defaultValue="flux-v1">
                                        <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="flux-v1">Flux v1</SelectItem>
                                            <SelectItem value="mj-v6">MJ v6</SelectItem>
                                            <SelectItem value="sd-xl">SD XL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Aspect Ratio</Label>
                                    <Select value={settings.aspectRatio} onValueChange={(v) => updateSettings({ aspectRatio: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="16:9">16:9</SelectItem>
                                            <SelectItem value="1:1">1:1</SelectItem>
                                            <SelectItem value="9:16">9:16</SelectItem>
                                            <SelectItem value="21:9">21:9</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Quality</Label>
                                    <div className="flex rounded-md border p-1 bg-muted/20">
                                        {['std', 'hd', '4k'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => updateSettings({ quality: q })}
                                                className={cn(
                                                    "flex-1 py-1 text-[10px] uppercase font-medium rounded-sm transition-colors",
                                                    settings.quality === q ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Batch: {settings.outputCount}</Label>
                                    <Slider
                                        value={[settings.outputCount]}
                                        onValueChange={(v) => updateSettings({ outputCount: v[0] })}
                                        max={4} min={1} step={1}
                                        className="py-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Mode</Label>
                                    <div className="flex rounded-md border p-1 bg-muted/20">
                                        {['relaxed', 'fast'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => updateSettings({ speed: m as any })}
                                                className={cn(
                                                    "flex-1 py-1 text-[10px] uppercase font-medium rounded-sm transition-colors",
                                                    settings.speed === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: Negative Prompt */}
                            <div className="space-y-2">
                                <Label className="text-xs">Negative Prompt</Label>
                                <Input
                                    placeholder="Blurry, low quality, text, logos..."
                                    value={settings.negativePrompt}
                                    onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                                    className="bg-secondary/20"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
