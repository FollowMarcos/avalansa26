"use client";

import { signOut } from '@/app/auth/actions'
import { ModeToggle } from "@/components/mode-toggle"
import { GoogleSignInButton } from "@/components/google-signin-button"
import Image from 'next/image'
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden relative selection:bg-primary/10">
      {/* High-End Background: Subtle grain and grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise" />

      {/* Vertical Dashed Lines */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: "center center",
          maskImage: `
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      />

      {/* Horizontal Dashed Lines */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-40"
        style={{
          backgroundImage: `linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: "center center",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      />

      {/* Navigation: Absolute positioned at top */}
      <nav className="absolute top-0 w-full px-8 py-8 flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <ModeToggle />
        </motion.div>
      </nav>

      <main className="flex flex-col items-center max-w-sm w-full z-10 space-y-16">
        {/* Logo Section with Motion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <Image
                src="/ab.svg"
                alt="Avalansa Logo"
                width={100}
                height={100}
                priority
                className="dark:hidden transition-all duration-700"
              />
              <Image
                src="/aw.svg"
                alt="Avalansa Logo"
                width={100}
                height={100}
                priority
                className="hidden dark:block transition-all duration-700"
              />
            </div>
            <div className="flex items-center mt-6 select-none">
              <span className="font-sans font-medium text-3xl tracking-[0.15em] uppercase text-foreground">AVALANSA</span>
              <span className="font-serif italic text-3xl tracking-tight text-foreground/70">workflows</span>
            </div>
          </div>
        </motion.div>

        {/* Action Section with Staggered Motion */}
        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key={user ? 'authed' : 'anonymous'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center gap-8"
            >
              {user ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="space-y-1 flex flex-col items-center">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Verified Identity</span>
                    <p className="text-sm font-medium text-foreground/80 lowercase tracking-tight">
                      {user.email}
                    </p>
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-300 py-4 px-2 border-b border-transparent hover:border-foreground min-h-[44px]"
                    >
                      Disconnect session
                    </button>
                  </form>
                </div>
              ) : (
                <GoogleSignInButton />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* High-End Footer */}
      <footer className="absolute bottom-12 flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-muted-foreground/50 font-medium select-none">
        <span>Avalansa &bull; {new Date().getFullYear()}</span>
        <span className="opacity-20 text-[10px]">&bull;</span>
        <Link href="/labs" className="hover:text-foreground transition-colors">Labs</Link>
      </footer>

    </div>
  );
}
