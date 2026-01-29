"use client";

import { useImagine } from "./imagine-context";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";

export function ImagineTopNav() {
    const { toggleSidebar, isSidebarOpen } = useImagine();

    return (
        <div className="flex items-center justify-between px-8 py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
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
                <div>
                    <h1 className="font-vt323 text-3xl leading-none text-foreground">Avalansa</h1>
                    <p className="font-lato text-xs text-muted-foreground font-medium">Share and Create</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className={cn("transition-colors", isSidebarOpen && "bg-accent text-accent-foreground")}
                >
                    <Settings2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
