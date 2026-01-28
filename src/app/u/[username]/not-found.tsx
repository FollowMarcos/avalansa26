'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';

export default function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden relative selection:bg-primary/10">
      {/* Background grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise" />

      {/* Navigation */}
      <nav className="absolute top-0 w-full px-8 py-8 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Avalansa
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <ModeToggle />
        </motion.div>
      </nav>

      <main className="flex flex-col items-center max-w-sm w-full z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4"
        >
          <h1 className="text-6xl font-light tracking-tighter text-foreground">
            404
          </h1>
          <p className="text-sm text-muted-foreground">
            This profile doesn&apos;t exist
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-300 py-4 px-2 border-b border-transparent hover:border-foreground"
          >
            Go home
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-12 text-xs uppercase tracking-[0.4em] text-muted-foreground/50 font-medium select-none">
        Avalansa &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
