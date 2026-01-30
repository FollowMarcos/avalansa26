"use client";

import { useImagine } from "./imagine-context";
import { Button } from "@/components/ui/button";
import { Settings2, Search, LayoutGrid, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export function ImagineTopNav() {
    const { galleryColumns, setGalleryColumns } = useImagine();

    return (
        <div className="flex items-center justify-between px-8 py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
            {/* Left: Logo Icon Only */}
            <div className="flex items-center gap-4">
                <div className="relative w-10 h-10">
                    <Image
                        src="/ab.svg"
                        alt="Avalansa"
                        fill
                        className="dark:hidden"
                    />
                    <Image
                        src="/aw.svg"
                        alt="Avalansa"
                        fill
                        className="hidden dark:block"
                    />
                </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-xl mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                    placeholder="Search your library..."
                    className="pl-10 h-10 bg-secondary/30 border-transparent focus:border-border transition-colors rounded-full"
                    aria-label="Search your library"
                />
            </div>

            {/* Right: View Options & Profile */}
            <div className="flex items-center gap-2">

                {/* View Options */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Grid settings">
                            {galleryColumns > 4 ? <LayoutGrid className="w-5 h-5" /> : <LayoutTemplate className="w-5 h-5" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Grid Density</Label>
                                <span className="text-xs text-muted-foreground">{galleryColumns} cols</span>
                            </div>
                            <Slider
                                value={[galleryColumns]}
                                onValueChange={(val) => setGalleryColumns(val[0])}
                                min={2}
                                max={8}
                                step={1}
                            />
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-6 bg-border mx-2" />

                <ModeToggle />
            </div>
        </div>
    );
}
