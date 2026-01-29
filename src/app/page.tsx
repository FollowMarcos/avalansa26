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
import { StatsCards } from "@/components/stats-cards"
import { FeatureGrid } from "@/components/feature-grid"
import { ChevronRight, Sparkles, Wand2, Share2, Palette } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.username) {
              setUsername(data.username);
            } else {
              setUsername(user.email?.split('@')[0] || 'friend');
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise z-0" />

      {/* Dynamic Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15] dark:opacity-[0.07]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem"
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full px-6 py-4 flex justify-between items-center z-50 bg-background/50 backdrop-blur-xl border-b border-border/10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-outfit)] font-bold text-lg tracking-tighter uppercase leading-none">AVALANSA</span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground/60 font-bold">Endless Creation</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {user && (
              <motion.form
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                action={signOut}
              >
                <button
                  type="submit"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all duration-300 px-4 py-2 rounded-full border border-border/50 hover:border-foreground/20"
                >
                  Disconnect
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          <ModeToggle />
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 mb-32 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/50 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Now Multi-Modal: Image, Video, 3D</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-[0.9] md:leading-[0.85] uppercase">
              The Engine of <br />
              <span className="text-primary italic">Latent</span> Space
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto">
              Save, share, and remix the world&apos;s most powerful AI prompts. Showcase your art in premium portfolios and generate multi-modal content in one workspace.
            </p>
          </motion.div>

          {/* Action Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full pt-8 flex flex-col items-center gap-6"
          >
            <AnimatePresence mode="wait">
              {!loading ? (
                user ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="px-6 py-3 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium tracking-tight">
                        welcome back, <span className="font-bold">{username}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href="/labs"
                        className="group relative h-14 inline-flex items-center justify-center px-10 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Enter Studio
                        <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href={`/u/${username}`}
                        className="h-14 inline-flex items-center justify-center px-10 rounded-full border border-border/50 hover:bg-foreground/[0.03] text-sm font-bold transition-all"
                      >
                        My Portfolio
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 w-full">
                    <GoogleSignInButton />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-medium">Join 50k+ creators pushing the edge</p>
                  </div>
                )
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Feature Bento Section */}
        <section className="w-full space-y-16 mb-40">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 px-4">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-[family-name:var(--font-outfit)]">Built for the <br />AI-Native Generation</h2>
              <p className="mt-4 text-muted-foreground text-lg">A unified hub for the tools you use every day.</p>
            </div>
            <div className="hidden md:block h-px flex-1 bg-border/20 mb-4" />
          </div>
          <FeatureGrid />
        </section>

        {/* Dynamic Showcase Section */}
        <section className="w-full max-w-6xl space-y-24 mb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-[family-name:var(--font-outfit)]">Save & Share <br />The DNA of Art</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Every masterpiece starts with a perfect prompt. Store your best performing configurations, share them with the community, and build your reputation as a Master of Latent Space.
              </p>
              <ul className="space-y-4">
                {[
                  "Version controlled prompt history",
                  "Model-specific metadata tags",
                  "Community remixing & branching",
                  "Private vaults for proprietary prompts"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <div className="relative group">
              {/* Visual Mockup Placeholder / Stats */}
              <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 -z-10 group-hover:opacity-40 transition-opacity" />
              <StatsCards />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              {/* This could be a portfolio preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] rounded-[24px] bg-foreground/[0.02] border border-border/50 overflow-hidden relative group/img">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  {/* Placeholder for real images */}
                  <div className="absolute bottom-4 left-4 text-white text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover/img:opacity-100 transition-all translate-y-2 group-hover/img:translate-y-0">@cyber_art</div>
                </div>
                <div className="aspect-[4/5] rounded-[24px] bg-foreground/[0.05] border border-border/50 overflow-hidden mt-8 transform translate-y-4">
                  <div className="absolute inset-0 bg-primary/5" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 order-1 lg:order-2"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Palette className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-[family-name:var(--font-outfit)]">A Premium <br />Portfolio Experience</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Your AI art deserves more than a social feed. Create a professional, customizable portfolio that showcases your unique style and multi-modal range.
              </p>
              <div className="pt-4">
                <Link href="/onboarding" className="text-sm font-bold uppercase tracking-widest text-primary hover:underline underline-offset-8">Start your portfolio &rarr;</Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Multi-modal Workbench Section */}
        <section className="w-full bg-foreground/[0.02] border border-border/50 rounded-[48px] p-8 md:p-16 mb-40 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8">
            <Wand2 className="w-32 h-32 text-primary opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-[family-name:var(--font-outfit)] mb-8">The Infinite <br />Workbench</h2>
            <p className="text-lg text-muted-foreground mb-12">
              From text to 3D, our unified studio provides a seamless interface to the state-of-the-art models. No context switching, just pure creation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: "Image Generation", desc: "Flux, Midjourney API, SDXL" },
                { title: "Video & Motion", desc: "Runway Gen-3, Luma Dream Machine" },
                { title: "3D & Spatial", desc: "Point-E, Splatting tools" },
                { title: "Text & Reasoning", desc: "Claude 3.5 Sonnet, GPT-4o" }
              ].map((tool, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="font-bold text-foreground tracking-tight">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* High-End Footer */}
      <footer className="relative z-10 w-full px-8 py-20 bg-background border-t border-border/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="font-[family-name:var(--font-outfit)] font-bold text-xl tracking-tighter uppercase">AVALANSA</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The multi-modal platform for the next generation of digital creators. Built for scale, engineered for art.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground">Platform</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/labs" className="hover:text-primary transition-colors">Labs</Link></li>
              <li><Link href="/prompts" className="hover:text-primary transition-colors">Prompts</Link></li>
              <li><Link href="/creators" className="hover:text-primary transition-colors">Creators</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-medium">
            &copy; {new Date().getFullYear()} Avalansa Space &bull; All Rights Reserved
          </p>
          <div className="flex items-center gap-6 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <span className="text-[10px] uppercase tracking-[0.1em] font-bold">Backed by the future</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
