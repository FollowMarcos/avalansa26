"use client";

import * as React from "react";
import { ImagineProvider, useImagine } from "@/components/imagine/imagine-context";
import { ImagineTopNav } from "@/components/imagine/imagine-top-nav";
import { ImagineDock } from "@/components/imagine/imagine-dock";
import { ImagineInput } from "@/components/imagine/imagine-input";
import { ContentGrid } from "@/components/imagine/content-grid";
import { cn } from "@/lib/utils";

function ImagineLayout() {

    return (
        <div className="relative min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-noise mix-blend-overlay" />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full">
                <ImagineTopNav />

                <div className="flex-1 w-full px-8 pb-48 overflow-y-auto">
                    <div className="py-6 max-w-[2400px] mx-auto">
                        <ContentGrid />
                    </div>
                </div>

                {/* Bottom Interactive Area */}
                <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
                    <div className="max-w-4xl mx-auto flex flex-col gap-4">
                        <ImagineInput />
                        <ImagineDock />
                    </div>
                </div>
            </main>
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
