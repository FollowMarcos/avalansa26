import { PageShell } from "@/components/layout/page-shell";
import { ImagineTopNav } from "@/components/imagine/imagine-top-nav";
import { ImagineInput } from "@/components/imagine/imagine-input";
import { ContentGrid } from "@/components/imagine/content-grid";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Imagine // AI Creation Lab',
    description: 'Create and generate beautiful content with Avalansa AI. Save, share, and remix prompts.',
};

function ImagineLayout() {
    return (
        <div className="flex-1 flex flex-col relative w-full overflow-hidden">
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
                    {/* SiteDock is now inside PageShell */}
                </div>
            </div>
        </div>
    );
}

export default function ImaginePage() {
    return (
        <PageShell>
            <ImagineLayout />
        </PageShell>
    );
}

