'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';

export default function LabsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden">
            {/* Background Noise */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise z-0" />

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

            <main className="flex-1 pt-32 pb-20 px-8 relative z-10 w-full max-w-7xl mx-auto">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl font-light tracking-tight mb-2">Wordmark Explorations</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">20 Variations of AVALANSA workflows</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {variations.map((v, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                        >
                            <div className="flex flex-col items-center select-none text-center">
                                <span className={`${v.avalansaClass} uppercase`}>AVALANSA</span>
                                <span className={`${v.workflowsClass}`}>workflows</span>
                            </div>
                            <div className="mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                                {v.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}

const variations = [
    {
        label: "Modern Serif (Newsreader)",
        avalansaClass: "font-sans font-medium text-2xl tracking-[0.15em]",
        workflowsClass: "font-serif italic text-2xl tracking-tight text-foreground/70"
    },
    {
        label: "Classic Display (Playfair)",
        avalansaClass: "font-sans font-light text-2xl tracking-[0.2em]",
        workflowsClass: "font-[family-name:var(--font-playfair)] italic text-2xl tracking-tight text-foreground/80"
    },
    {
        label: "Tech Mono (JetBrains)",
        avalansaClass: "font-sans font-bold text-2xl tracking-tight",
        workflowsClass: "font-[family-name:var(--font-mono)] text-xl text-foreground/60 ml-1"
    },
    {
        label: "Elegant Garamond",
        avalansaClass: "font-sans font-normal text-2xl tracking-widest",
        workflowsClass: "font-[family-name:var(--font-cormorant)] italic text-3xl text-foreground/90 -mt-2"
    },
    {
        label: "Geometric Brutalist (Syne)",
        avalansaClass: "font-[family-name:var(--font-syne)] font-extrabold text-2xl tracking-tighter",
        workflowsClass: "font-serif italic text-2xl text-foreground/70"
    },
    {
        label: "Minimalist (Inter)",
        avalansaClass: "font-[family-name:var(--font-inter)] font-black text-xl tracking-[0.3em]",
        workflowsClass: "font-[family-name:var(--font-inter)] font-light text-xl text-foreground/50 mt-1"
    },
    {
        label: "Futuristic (Space Grotesk)",
        avalansaClass: "font-[family-name:var(--font-space-grotesk)] font-medium text-2xl",
        workflowsClass: "font-serif italic text-2xl text-foreground/60"
    },
    {
        label: "Sophisticated (Lora)",
        avalansaClass: "font-sans font-thin text-3xl tracking-tighter",
        workflowsClass: "font-[family-name:var(--font-lora)] italic text-2xl text-foreground/80 mt-1"
    },
    {
        label: "Bold & Delicate",
        avalansaClass: "font-sans font-black text-2xl tracking-normal",
        workflowsClass: "font-serif italic font-extralight text-3xl text-foreground/40 -mt-1"
    },
    {
        label: "Spaced Sans",
        avalansaClass: "font-sans font-normal text-sm tracking-[0.8em]",
        workflowsClass: "font-serif italic text-4xl text-foreground/90 block mt-2 text-center w-full"
    },
    {
        label: "The Architect",
        avalansaClass: "font-[family-name:var(--font-space-grotesk)] font-light text-2xl tracking-[0.1em]",
        workflowsClass: "font-[family-name:var(--font-mono)] text-sm uppercase text-foreground/50 mt-1"
    },
    {
        label: "Fashion House",
        avalansaClass: "font-[family-name:var(--font-playfair)] font-normal text-3xl tracking-widest",
        workflowsClass: "font-sans font-thin text-xs uppercase tracking-[1em] block mt-4 text-foreground/40"
    },
    {
        label: "Swiss Modern",
        avalansaClass: "font-[family-name:var(--font-inter)] font-bold text-2xl tracking-tighter",
        workflowsClass: "font-[family-name:var(--font-inter)] font-medium text-2xl tracking-tighter text-foreground/60"
    },
    {
        label: "High Contrast",
        avalansaClass: "font-sans font-black text-3xl tracking-[-0.05em]",
        workflowsClass: "font-[family-name:var(--font-cormorant)] italic text-xl text-foreground/60 transition-transform group-hover:translate-y-1"
    },
    {
        label: "Micro-Text",
        avalansaClass: "font-sans font-medium text-[10px] tracking-[0.5em]",
        workflowsClass: "font-serif italic text-5xl text-foreground/10 absolute opacity-20"
    },
    {
        label: "The Editor",
        avalansaClass: "font-serif italic text-2xl",
        workflowsClass: "font-sans font-bold text-2xl tracking-tighter"
    },
    {
        label: "Cyber Serif",
        avalansaClass: "font-[family-name:var(--font-mono)] text-xl",
        workflowsClass: "font-[family-name:var(--font-playfair)] italic text-3xl text-foreground/70 -mt-1"
    },
    {
        label: "Heavy Syne",
        avalansaClass: "font-[family-name:var(--font-syne)] font-black text-4xl leading-none",
        workflowsClass: "font-serif italic text-lg text-foreground/50"
    },
    {
        label: "Ultra Light",
        avalansaClass: "font-sans font-thin text-2xl tracking-[0.4em]",
        workflowsClass: "font-serif italic text-2xl text-foreground/30"
    },
    {
        label: "Condensed Core",
        avalansaClass: "font-[family-name:var(--font-inter)] font-extrabold text-3xl scale-x-75 origin-left",
        workflowsClass: "font-serif italic text-2xl text-foreground/80"
    }
];
