'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";
import { InteractiveDock } from '@/components/labs/interactive-dock';

export default function LabsPage() {
    return (
        <PageShell contentClassName="flex flex-col antialiased selection:bg-primary/20 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 bg-background/50 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">AVALANSA <span className="opacity-50 font-normal">LABS</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                </div>
            </nav>

            <main className="flex-1 pt-32 pb-48 px-8 relative z-10 w-full max-w-4xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-16 text-center"
                >
                    <h1 className="text-3xl font-light tracking-tight mb-2">Customize Your Dock</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">
                        Choose a style & arrange your icons
                    </p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <InteractiveDock />
                </motion.div>

                {/* Preview section showing all variants */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-24"
                >
                    <h2 className="text-lg font-medium text-center mb-8 text-muted-foreground/60">All Variants Preview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PreviewCard
                            title="Milky Dream (Light)"
                            description="Rounded corners, milky white with wavy lines"
                        >
                            <MilkyDreamPreview dark={false} />
                        </PreviewCard>
                        <PreviewCard
                            title="Milky Dream (Dark)"
                            description="Dark #111111 background with subtle waves"
                        >
                            <MilkyDreamPreview dark={true} />
                        </PreviewCard>
                        <PreviewCard
                            title="Floating Islands (Light)"
                            description="Separated groups, light theme"
                        >
                            <FloatingIslandsPreview dark={false} />
                        </PreviewCard>
                        <PreviewCard
                            title="Floating Islands (Dark)"
                            description="Separated groups, dark theme"
                        >
                            <FloatingIslandsPreview dark={true} />
                        </PreviewCard>
                    </div>
                </motion.section>
            </main>
        </PageShell>
    );
}

function PreviewCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="mb-4 text-center">
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="text-xs text-muted-foreground/50 mt-1">{description}</p>
            </div>
            <div className="transform scale-75 origin-center">
                {children}
            </div>
        </div>
    );
}

// Static preview components (non-interactive)
import { Folder, Compass, MessageCircle, Mail, Image, Music, Settings } from 'lucide-react';

const WavyPatternPreview = ({ dark = false }: { dark?: boolean }) => (
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`wavy-preview-${dark ? 'dark' : 'light'}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <path
                    d="M0 10 Q10 5, 20 10 T40 10"
                    fill="none"
                    stroke={dark ? '#3f3f46' : '#d1d5db'}
                    strokeWidth="0.5"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wavy-preview-${dark ? 'dark' : 'light'})`} />
    </svg>
);

function MilkyDreamPreview({ dark }: { dark: boolean }) {
    return (
        <div
            className={`relative flex items-center gap-2 p-3 rounded-[28px] overflow-hidden shadow-2xl ${
                dark ? 'bg-[#111111]' : 'bg-gradient-to-br from-[#fefefe] via-[#f8f8f8] to-[#fefefe]'
            }`}
        >
            <WavyPatternPreview dark={dark} />
            <div className="relative z-10 flex items-center gap-2">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                    <Folder className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Compass className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-green-400 to-green-600">
                    <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                    <Mail className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400">
                    <Image className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-pink-500">
                    <Music className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className={`w-px h-10 mx-1 ${dark ? 'bg-zinc-700/50' : 'bg-gray-200/50'}`} />
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-gray-600 to-gray-800">
                    <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}

function FloatingIslandsPreview({ dark }: { dark: boolean }) {
    const containerClass = dark
        ? "bg-zinc-900/90 border-zinc-700/50"
        : "bg-white/90 border-zinc-200/50";

    return (
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg ${containerClass}`}>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                    <Folder className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Compass className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg ${containerClass}`}>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-green-400 to-green-600">
                    <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                    <Mail className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-pink-500">
                    <Music className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
            </div>
            <div className={`flex items-center p-3 rounded-2xl backdrop-blur-xl border shadow-lg ${containerClass}`}>
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-gray-600 to-gray-800">
                    <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}
