"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground px-6 relative overflow-hidden selection:bg-primary/10">
      {/* Analog Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-multiply bg-noise"></div>

      <main className="flex flex-col items-center max-w-sm w-full space-y-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <SearchX className="w-10 h-10 text-muted-foreground/40" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="font-vt323 text-5xl md:text-6xl text-primary">System Error 404</h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-lato text-muted-foreground/80 leading-relaxed font-normal"
          >
            The profile you are looking for does not exist or has been moved to a different sector.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <Button asChild size="lg" className="rounded-full gap-2 w-full h-12">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-12 w-full px-12 z-10">
        <div className="max-w-7xl mx-auto flex justify-center opacity-30 text-foreground">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] font-lato">
            Avalansa &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
