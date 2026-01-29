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

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-4xl md:text-6xl font-light tracking-tighter text-foreground/90">
                        avalansa labs soon
                    </h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">
                        Experimental Features
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
