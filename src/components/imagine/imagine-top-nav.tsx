"use client";

import { useImagine } from "./imagine-context";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagineTopNav() {
    const { toggleSidebar, isSidebarOpen } = useImagine();

    return (
        <div className="flex items-center justify-between px-8 py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-background rounded-full" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-none tracking-tight">NewOS</h1>
                    <p className="text-xs text-muted-foreground font-medium">Share and Create</p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn("transition-colors", isSidebarOpen && "bg-accent text-accent-foreground")}
            >
                <Settings2 className="w-5 h-5" />
            </Button>
        </div>
    );
}
