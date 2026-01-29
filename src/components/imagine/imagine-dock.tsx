"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Settings2,
    Image as ImageIcon,
    Zap,
    Layers,
    Maximize2,
    MinusCircle,
    PlusCircle,
    ChevronUp,
    ChevronDown,
    Wand2,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ImagineDockProps {
    onGenerate: (prompt: string, options: any) => void;
}

export function ImagineDock({ onGenerate }: ImagineDockProps) {
    const [isOpen, setIsOpen] = React.useState(true);
    const [prompt, setPrompt] = React.useState("");
    const [negativePrompt, setNegativePrompt] = React.useState("");
    const [aspectRatio, setAspectRatio] = React.useState("16:9");
    const [numOutputs, setNumOutputs] = React.useState([1]);
    const [quality, setQuality] = React.useState("hd"); // standard, hd, ultra
    const [speed, setSpeed] = React.useState("relaxed"); // relaxed, fast
    const [referenceImage, setReferenceImage] = React.useState<string | null>(null);

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
        >
            <div className={cn(
                "relative flex flex-col gap-4 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-3xl transition-all duration-500",
                "bg-black/60 dark:bg-black/80 text-white"
            )}>
                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-12 left-1/2 -translate-x-1/2 h-8 w-16 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-white/70" /> : <ChevronUp className="w-4 h-4 text-white/70" />}
                </Button>

                {/* Main Promt Input Area */}
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                        <input
                            type="text"
                            placeholder="Describe what you want to imagine..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                    </div>
                    <Button
                        size="lg"
                        className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-medium text-lg"
                        onClick={() => onGenerate(prompt, { negativePrompt, aspectRatio, numOutputs, quality, speed })}
                    >
                        Generate
                    </Button>
                </div>

                {/* Collapsible Settings Area */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 border-t border-white/5">
                                {/* Left Column: Core Settings */}
                                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">Aspect Ratio</Label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                                                <SelectValue placeholder="Ratio" />
                                            </SelectTrigger>
                                            <SelectContent className="dark bg-zinc-900 border-zinc-800">
                                                <SelectItem value="1:1">1:1 Square</SelectItem>
                                                <SelectItem value="16:9">16:9 landscape</SelectItem>
                                                <SelectItem value="9:16">9:16 Portrait</SelectItem>
                                                <SelectItem value="4:3">4:3 Standard</SelectItem>
                                                <SelectItem value="21:9">21:9 Ultrawide</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">Outputs: {numOutputs[0]}</Label>
                                        <div className="h-10 flex items-center px-2 bg-white/5 border border-white/10 rounded-xl">
                                            <Slider
                                                value={numOutputs}
                                                onValueChange={setNumOutputs}
                                                max={4}
                                                min={1}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">Quality</Label>
                                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 h-10">
                                            {['std', 'hd', '4k'].map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => setQuality(q)}
                                                    className={cn(
                                                        "flex-1 rounded-lg text-xs font-medium transition-all",
                                                        quality === q ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                                                    )}
                                                >
                                                    {q.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-2 sm:col-span-3 space-y-2">
                                        <Label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
                                            <MinusCircle className="w-3 h-3" /> Negative Prompt
                                        </Label>
                                        <Input
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Things to avoid (e.g. blurry, low quality, distorted)..."
                                            className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-white/20"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Advanced / Reference */}
                                <div className="md:col-span-4 flex flex-col gap-4 pl-0 md:pl-6 md:border-l border-white/5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">Speed Mode</Label>
                                        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
                                            <button
                                                onClick={() => setSpeed('relaxed')}
                                                className={cn("px-3 py-1 rounded-full text-xs transition-all", speed === 'relaxed' ? "bg-indigo-500/20 text-indigo-300" : "text-white/40")}
                                            >
                                                Relaxed
                                            </button>
                                            <button
                                                onClick={() => setSpeed('fast')}
                                                className={cn("px-3 py-1 rounded-full text-xs transition-all", speed === 'fast' ? "bg-amber-500/20 text-amber-300" : "text-white/40")}
                                            >
                                                <Zap className="w-3 h-3 inline mr-1" />
                                                Fast
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-white/20 transition-colors cursor-pointer border-dashed">
                                        {referenceImage ? (
                                            <>
                                                <img src={referenceImage} alt="Ref" className="w-full h-full object-cover opacity-50" />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                                    onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-6 h-6 text-white/20 mx-auto mb-2 group-hover:text-white/50 transition-colors" />
                                                <p className="text-xs text-white/30">Upload Reference Image</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
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
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
