"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Grid3X3, Grid2X2, LayoutGrid } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImagineControlsProps {
    itemsPerRow: number;
    setItemsPerRow: (value: number) => void;
}

export function ImagineControls({ itemsPerRow, setItemsPerRow }: ImagineControlsProps) {
    return (
        <div className="w-full flex items-center justify-between py-6 px-8 sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
            {/* Search */}
            <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input
                    type="text"
                    placeholder="Search your library..."
                    className="w-full h-10 bg-secondary/50 border border-transparent rounded-full pl-10 pr-4 text-sm focus:outline-none focus:bg-secondary focus:border-border transition-all placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-6">
                {/* Filter */}
                <div className="hidden md:flex items-center gap-2">
                    {['All', 'Favorites', 'Upscaled', 'Video'].map((filter, i) => (
                        <button
                            key={filter}
                            className={cn(
                                "text-sm font-medium px-3 py-1.5 rounded-full transition-all hover:bg-secondary/80",
                                i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-border/50 hidden md:block" />

                {/* Density Slider */}
                <div className="flex items-center gap-3">
                    <Grid2X2 className="w-4 h-4 text-muted-foreground" />
                    <div className="w-24">
                        <Slider
                            value={[itemsPerRow]}
                            onValueChange={(val) => setItemsPerRow(val[0])}
                            min={2}
                            max={6}
                            step={1}
                        />
                    </div>
                    <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}
