"use client";

import * as React from "react";
import { ImagineProvider, useImagine } from "@/components/imagine/imagine-context";
import { ImagineSidebar } from "@/components/imagine/imagine-sidebar";
import { ImagineTopNav } from "@/components/imagine/imagine-top-nav";
import { ImagineDock } from "@/components/imagine/imagine-dock";
import { ImagineInput } from "@/components/imagine/imagine-input";
import { ContentGrid } from "@/components/imagine/content-grid";
import { cn } from "@/lib/utils";

function ImagineLayout() {
    const { isSidebarOpen } = useImagine();

    return (
        <div className="relative min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-noise mix-blend-overlay" />

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 flex flex-col relative z-10 transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "mr-80" : "mr-0"
                )}
            >
                <ImagineTopNav />

                <div className="flex-1 overflow-y-auto px-8 pb-48">
                    <div className="py-6">
                        <ContentGrid itemsPerRow={4} />
                    </div>
                </div>

                {/* Bottom Interactive Area */}
                <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
                    <div className={cn(
                        "max-w-screen-xl mx-auto flex flex-col gap-4 transition-all duration-300",
                        isSidebarOpen ? "pr-80" : "pr-0"
                    )}>
                        <ImagineInput />
                        <ImagineDock />
                    </div>
                </div>
            </main>

            {/* Right Sidebar */}
            <ImagineSidebar />
        </div>
    );
}

export default function ImaginePage() {
    return (
        <ImagineProvider>
            <ImagineLayout />
        </ImagineProvider>
    );
}
