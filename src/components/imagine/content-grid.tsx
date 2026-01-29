"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Download, Share2, MoreHorizontal, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentItem {
    id: string;
    url: string;
    prompt: string;
    aspectRatio: string;
    type: 'image' | 'video';
}

interface ContentGridProps {
    itemsPerRow: number;
    items?: ContentItem[];
}

// Temporary mock data generator
const generateMockData = (count: number): ContentItem[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `item-${i}`,
        url: `https://picsum.photos/seed/${i * 123}/800/${i % 2 === 0 ? 1200 : 800}`,
        prompt: "A futuristic city with flying cars and neon lights...",
        aspectRatio: i % 2 === 0 ? "2:3" : "1:1",
        type: 'image'
    }));
};

import { useImagine } from "./imagine-context";

export function ContentGrid() {
    const { galleryColumns } = useImagine();
    const items = React.useMemo(() => generateMockData(20), []);

    return (
        <div className="w-full px-8 pb-32">
            <div
                className="grid gap-4 transition-all duration-500 ease-in-out"
                style={{ gridTemplateColumns: `repeat(${galleryColumns}, minmax(0, 1fr))` }}
            >
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "group relative rounded-xl overflow-hidden cursor-pointer",
                            "bg-secondary/20 aspect-[3/4]" // Default aspect ratio container
                        )}
                    >
                        <img
                            src={item.url}
                            alt={item.prompt}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <p className="text-white text-sm font-medium line-clamp-2 mb-3">{item.prompt}</p>

                            <div className="flex items-center gap-2 justify-end">
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                                    <Download className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                                    <Maximize2 className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                                    <MoreHorizontal className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
