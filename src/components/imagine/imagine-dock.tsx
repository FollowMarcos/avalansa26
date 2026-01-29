"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Image as ImageIcon,
    Zap,
    Settings2,
    X,
    Plus,
    FolderOpen,
    MessageSquare,
    SlidersHorizontal,
    Minus,
    Plus as PlusIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface ImagineDockProps {
    onGenerate: (prompt: string, options: any) => void;
}

export function ImagineDock({ onGenerate }: ImagineDockProps) {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [prompt, setPrompt] = React.useState("");
    const [negativePrompt, setNegativePrompt] = React.useState("");
    const [aspectRatio, setAspectRatio] = React.useState("16:9");
    const [numOutputs, setNumOutputs] = React.useState([1]);
    const [quality, setQuality] = React.useState("hd");
    const [speed, setSpeed] = React.useState("relaxed");
    const [referenceImage, setReferenceImage] = React.useState<string | null>(null);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2"
        >
            <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-end gap-3 transition-all duration-300">

                {/* Main Bar */}
                <div className={cn(
                    "flex-1 w-full flex items-center gap-3 p-2 rounded-2xl border shadow-2xl backdrop-blur-3xl transition-all duration-300",
                    "bg-card/80 border-border/50 supports-[backdrop-filter]:bg-background/60"
                )}>
                    {/* Upload Reference Trigger */}
                    <div className="relative group shrink-0">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setReferenceImage(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground">
                            {referenceImage ? (
                                <img src={referenceImage} className="w-8 h-8 rounded-md object-cover ring-2 ring-primary/20" alt="Ref" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="text"
                            placeholder="Describe what you want to imagine..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onGenerate(prompt, { negativePrompt, aspectRatio, numOutputs, quality, speed });
                                }
                            }}
                            className="w-full bg-transparent border-none text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-0 py-3 pr-12"
                        />

                        {/* Settings Toggle Inside Input */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("absolute right-0 h-8 w-8 rounded-lg transition-colors", isSettingsOpen ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/50")}
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Actions Block - Only visible on desktop or when needed */}
                <div className={cn(
                    "hidden md:flex items-center gap-1 p-2 rounded-2xl border shadow-2xl backdrop-blur-3xl shrink-0 h-[66px]",
                    "bg-card/80 border-border/50 supports-[backdrop-filter]:bg-background/60"
                )}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground">
                        <FolderOpen className="w-5 h-5" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-10 w-10 rounded-xl transition-colors", speed === 'fast' ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setSpeed(speed === 'fast' ? 'relaxed' : 'fast')}
                    >
                        <Zap className={cn("w-5 h-5", speed === 'fast' && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground">
                        <MessageSquare className="w-5 h-5" />
                    </Button>

                    <Button
                        size="lg"
                        className="h-10 px-6 ml-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-lg shadow-primary/20"
                        onClick={() => onGenerate(prompt, { negativePrompt, aspectRatio, numOutputs, quality, speed })}
                    >
                        Generate
                    </Button>
                </div>
            </div>

            {/* Collapsible Settings Panel */}
            <div className="max-w-[1800px] mx-auto px-1">
                <AnimatePresence>
                    {isSettingsOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className={cn(
                                "grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-2xl border shadow-lg backdrop-blur-3xl",
                                "bg-popover/90 border-border/50 supports-[backdrop-filter]:bg-popover/80"
                            )}>
                                {/* Aspect Ratio */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aspect Ratio</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'].map((ratio) => (
                                            <button
                                                key={ratio}
                                                onClick={() => setAspectRatio(ratio)}
                                                className={cn(
                                                    "px-2 py-2 rounded-lg text-xs font-medium border transition-all",
                                                    aspectRatio === ratio
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                                                )}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quality & Count */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outputs: {numOutputs[0]}</Label>
                                        </div>
                                        <Slider
                                            value={numOutputs}
                                            onValueChange={setNumOutputs}
                                            max={4}
                                            min={1}
                                            step={1}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</Label>
                                        <div className="flex bg-secondary/50 p-1 rounded-lg">
                                            {['std', 'hd', '4k'].map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => setQuality(q)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                                                        quality === q ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {q.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Negative Prompt */}
                                <div className="md:col-span-2 space-y-3">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Negative Prompt</Label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        placeholder="Things to avoid (e.g. blurry, low quality, distorted, text)..."
                                        className="w-full h-[108px] bg-secondary/30 border border-input rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
