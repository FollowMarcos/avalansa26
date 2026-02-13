"use client";

import * as React from "react";
import { CreateProvider } from "@/components/create/create-context";
import { SiteDock } from "./site-dock";
import { cn } from "@/lib/utils";

interface PageShellProps {
    children: React.ReactNode;
    className?: string; // Classes for the root container
    contentClassName?: string; // Classes for the internal main element
    showDock?: boolean;
    dockPosition?: "bottom" | "left" | "top-left";
    noDockPadding?: boolean; // Skip automatic dock padding
}

export function PageShell({ children, className, contentClassName, showDock = true, dockPosition = "bottom", noDockPadding = false }: PageShellProps) {
    const isLeft = dockPosition === "left";
    const isTopLeft = dockPosition === "top-left";

    return (
        <CreateProvider>
            <div className={cn("relative min-h-screen bg-background text-foreground flex flex-col antialiased", className)}>
                {/* Analog Grain Texture */}
                <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply bg-noise dark:hidden"></div>

                {/* Background Gradients / Effects could go here */}

                <main className={cn(
                    "flex-1 flex flex-col relative z-10 w-full",
                    !noDockPadding && showDock && !isTopLeft && !isLeft && "pb-24 lg:pb-32",
                    !noDockPadding && showDock && isLeft && "pl-20",
                    contentClassName
                )}>
                    {children}
                </main>

                {showDock && (
                    <div className={cn(
                        "fixed z-[60] pointer-events-none",
                        isLeft
                            ? "top-0 left-0 bottom-0 p-3 flex items-center"
                            : isTopLeft
                                ? "top-0 left-0 p-4"
                                : "bottom-0 left-0 right-0 p-6 flex justify-center"
                    )}>
                        <SiteDock vertical={isLeft} />
                    </div>
                )}
            </div>
        </CreateProvider>
    );
}
