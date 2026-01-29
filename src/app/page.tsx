"use client";

import { GoogleSignInButton } from "@/components/google-signin-button"
import Image from 'next/image'
import { motion } from "motion/react"
import Link from 'next/link'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Home() {

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        try {
          localStorage.setItem('last_google_user', user.email);
        } catch (e) {
          // Ignore localStorage errors (e.g., privacy mode)
        }
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground px-6 py-12 selection:bg-primary/10 relative overflow-hidden">
      {/* Analog Grain Texture - Static layer, minimal performance impact */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-multiply bg-noise"></div>

      <main className="flex flex-col items-center max-w-2xl w-full space-y-12 text-center relative z-10">

        {/* Line 1: Logo + Create & Share */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 group cursor-default will-change-transform"
        >
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-12 h-12"
          >
            <Image
              src="/ab.svg"
              alt="Avalansa"
              fill
              className="drop-shadow-sm"
              priority
            />
          </motion.div>
          <h1 className="font-vt323 text-5xl md:text-6xl tracking-tight text-primary flex items-center text-balance">
            Create & Share
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="inline-block w-[0.5em] h-[1em] bg-primary ml-2 align-bottom will-change-opacity"
            />
          </h1>
        </motion.div>

        {/* Line 2: Slogan in Lato */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-lato text-base md:text-lg text-muted-foreground/80 leading-relaxed max-w-xl mx-auto font-normal will-change-transform text-pretty"
        >
          Save, share, and remix prompts. Showcase your art and generate beautiful content.
        </motion.p>

        {/* Line 3: Sign in or Sign up with (lines on each side) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-4 w-full max-w-md will-change-transform"
        >
          <div className="h-[1px] flex-1 bg-primary/10" />
          <span className="font-lato text-xs text-muted-foreground/60 whitespace-nowrap font-normal">
            Sign or sign up with
          </span>
          <div className="h-[1px] flex-1 bg-primary/10" />
        </motion.div>

        {/* Line 4: Google Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-[280px] will-change-transform"
        >
          <GoogleSignInButton />
        </motion.div>

      </main>

      {/* Footer at Bottom */}
      <footer className="absolute bottom-12 w-full px-12 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-foreground">
          <div className="flex items-center gap-6 text-xs font-normal font-lato">
            <span>&copy; {new Date().getFullYear()} Avalansa</span>
          </div>

          <div className="flex items-center gap-8 text-xs font-normal font-lato">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
