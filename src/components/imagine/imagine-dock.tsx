"use client";

import * as React from "react";
import {
    ImageIcon,
    Settings2,
    Folder,
    MessageSquare,
    Zap,
    Plus,
    X,
    ChevronUp,
    ChevronDown,
    SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ImagineDockProps {
    onGenerate: (prompt: string, options: any) => void;
}

export function ImagineDock({ onGenerate }: ImagineDockProps) {
    const [prompt, setPrompt] = React.useState("");
    const [negativePrompt, setNegativePrompt] = React.useState("");
    const [aspectRatio, setAspectRatio] = React.useState("16:9");
    const [numOutputs, setNumOutputs] = React.useState([1]);
    const [quality, setQuality] = React.useState("hd");
    const [speed, setSpeed] = React.useState("relaxed");
    const [referenceImage, setReferenceImage] = React.useState<string | null>(null);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-md border-t">
            <div className="max-w-6xl mx-auto flex items-end gap-2">

                {/* Reference Image Trigger */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl relative overflow-hidden">
                            {referenceImage ? (
                                <img src={referenceImage} className="w-full h-full object-cover opacity-80" alt="ref" />
                            ) : (
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-4 space-y-3">
                            <Label>Reference Image</Label>
                            <div className="relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors group">
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
                                {referenceImage ? (
                                    <>
                                        <img src={referenceImage} alt="Reference" className="w-full h-32 object-contain rounded-md" />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReferenceImage(null);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-xs text-muted-foreground">Upload image</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Main Input Bar */}
                <Card className="flex-1 flex items-center p-1.5 gap-2 rounded-xl shadow-sm">
                    <div className="flex-1 relative">
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onGenerate(prompt, { negativePrompt, aspectRatio, numOutputs, quality, speed });
                            }}
                            placeholder="Describe what you want to imagine..."
                            className="border-none shadow-none focus-visible:ring-0 px-4 h-11 text-base bg-transparent"
                        />
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Settings Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end" sideOffset={10}>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Generation Settings</h4>
                                    <p className="text-sm text-muted-foreground">Configure output options.</p>
                                </div>
                                <Separator />
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="width">Aspect Ratio</Label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger className="col-span-2 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1:1">1:1 Square</SelectItem>
                                                <SelectItem value="16:9">16:9 Landscape</SelectItem>
                                                <SelectItem value="9:16">9:16 Portrait</SelectItem>
                                                <SelectItem value="4:3">4:3 Standard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="width">Outputs: {numOutputs[0]}</Label>
                                        <div className="col-span-2">
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
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label>Quality</Label>
                                        <div className="col-span-2 flex rounded-md border p-0.5">
                                            {['std', 'hd', '4k'].map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => setQuality(q)}
                                                    className={cn(
                                                        "flex-1 text-[10px] font-medium py-1 rounded-sm uppercase transition-colors",
                                                        quality === q ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Negative Prompt</Label>
                                        <Input
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Avoid these..."
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        size="lg"
                        onClick={() => onGenerate(prompt, { negativePrompt, aspectRatio, numOutputs, quality, speed })}
                        className="h-10 px-6 rounded-lg font-medium"
                    >
                        Generate
                    </Button>
                </Card>

                {/* Quick Actions (Right) */}
                <div className="hidden md:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-12 w-12 rounded-xl border bg-background", speed === 'fast' && "border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20")}
                        onClick={() => setSpeed(speed === 'fast' ? 'relaxed' : 'fast')}
                    >
                        <Zap className={cn("h-5 w-5", speed === 'fast' && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border bg-background text-muted-foreground hover:text-foreground">
                        <Folder className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
