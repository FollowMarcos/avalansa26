"use client";

import { useImagine } from "./imagine-context";
import { Button } from "@/components/ui/button";
import { Plus, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function ImagineInput() {
    const { prompt, setPrompt } = useImagine();

    return (
        <div className="w-full max-w-2xl mx-auto pointer-events-auto">
            <div className="relative p-2 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl ring-1 ring-white/5">

                {/* Reference Image Badge (Placeholder logic) */}
                <div className="absolute -top-3 left-4">
                    <div className="flex -space-x-2">
                        {/* Will populate when references are added */}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl shrink-0 border-dashed border-2 hover:border-solid hover:bg-accent/50 group"
                    >
                        <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>

                    <div className="flex-1 relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the scene you imagine..."
                            className="w-full h-12 py-3 bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/50 text-base leading-relaxed"
                            style={{ minHeight: '48px' }}
                        />
                    </div>

                    <Button
                        size="lg"
                        className="h-12 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium shadow-lg transition-all"
                    >
                        <span>Generate</span>
                        <Wand2 className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
