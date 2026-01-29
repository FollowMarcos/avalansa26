"use client";

import * as React from "react";
import { ImagineDock } from "@/components/imagine/imagine-dock";
import { ContentGrid } from "@/components/imagine/content-grid";
import { ImagineControls } from "@/components/imagine/imagine-controls";

export default function ImaginePage() {
    const [itemsPerRow, setItemsPerRow] = React.useState(4);

    const handleGenerate = (prompt: string, options: any) => {
        console.log("Generating with:", prompt, options);
        // Integrate with actual API here later
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative flex flex-col">
            {/* Background Pattern */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none bg-noise" />

            <main className="relative z-10 flex-1 flex flex-col">
                <ImagineControls itemsPerRow={itemsPerRow} setItemsPerRow={setItemsPerRow} />

                <div className="flex-1 mt-4">
                    <ContentGrid itemsPerRow={itemsPerRow} />
                </div>
            </main>

            <ImagineDock onGenerate={handleGenerate} />
        </div>
    );
}
