"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useImagine } from "./imagine-context";
import { X, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function ImagineSidebar() {
    const { isSidebarOpen, settings, updateSettings, toggleSidebar } = useImagine();

    return (
        <div
            className={cn(
                "fixed right-0 top-0 bottom-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-l border-border transition-transform duration-300 ease-in-out flex flex-col pt-16",
                !isSidebarOpen && "translate-x-full"
            )}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                    <h2 className="text-sm font-semibold">Pro Settings</h2>
                    <p className="text-xs text-muted-foreground">Configuration presets</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* Generation Settings */}
                <div className="space-y-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generation</h3>

                    <div className="space-y-3">
                        <Label className="text-xs">Aspect Ratio</Label>
                        <Select
                            value={settings.aspectRatio}
                            onValueChange={(val) => updateSettings({ aspectRatio: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1:1">1:1 Square</SelectItem>
                                <SelectItem value="16:9">16:9 Landscape</SelectItem>
                                <SelectItem value="21:9">21:9 Ultrawide</SelectItem>
                                <SelectItem value="9:16">9:16 Portrait</SelectItem>
                                <SelectItem value="4:5">4:5 Social</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-xs">Outputs</Label>
                            <span className="text-xs text-muted-foreground">{settings.outputCount}</span>
                        </div>
                        <Slider
                            value={[settings.outputCount]}
                            onValueChange={(val) => updateSettings({ outputCount: val[0] })}
                            min={1}
                            max={4}
                            step={1}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs">Quality Level</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['std', 'hd', '4k'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => updateSettings({ quality: q })}
                                    className={cn(
                                        "px-2 py-1.5 rounded-md text-xs font-medium border transition-all",
                                        settings.quality === q
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    {q.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Prompt Settings */}
                <div className="space-y-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Directives</h3>

                    <div className="space-y-3">
                        <Label className="text-xs">Negative Prompt</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Elements to avoid..."
                            value={settings.negativePrompt}
                            onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                        />
                    </div>
                </div>

                <Separator />

                {/* Advanced Settings */}
                <div className="space-y-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced</h3>

                    <div className="space-y-3">
                        <Label className="text-xs">Seed</Label>
                        <Input
                            placeholder="Random (-1)"
                            value={settings.seed}
                            onChange={(e) => updateSettings({ seed: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs">Sampler</Label>
                        <Select
                            value={settings.sampler}
                            onValueChange={(val) => updateSettings({ sampler: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DPM++ 2M Karras">DPM++ 2M Karras</SelectItem>
                                <SelectItem value="Euler a">Euler a</SelectItem>
                                <SelectItem value="DDIM">DDIM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </div>
        </div>
    );
}
