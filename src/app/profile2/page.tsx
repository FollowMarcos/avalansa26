'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Calendar,
  Globe,
  Share2,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Eye,
  Heart,
  ChevronDown,
  ArrowRight,
  Play,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 2 — "EDITORIAL / CINEMATIC"
   Full-bleed hero, editorial typography,
   immersive scroll with parallax
   ───────────────────────────────────────────── */

const MOCK_PROFILE = {
  id: '1',
  username: 'mira_santos',
  name: 'Mira Santos',
  avatar_url: null,
  bio: 'Digital sculptor & creative technologist exploring the boundaries between generative art, spatial computing, and human perception. Currently building tools for the next generation of creators.',
  interests: ['generative-art', 'spatial-computing', 'creative-coding', 'typography', 'motion-design', 'glsl-shaders'],
  onboarding_completed: true,
  role: 'user' as const,
  created_at: '2025-03-15T00:00:00Z',
  updated_at: '2026-02-10T00:00:00Z',
  website: 'mirasantos.design',
  visibility: 'public' as const,
  allowed_viewers: [],
};

const MOCK_WORKS = [
  { id: 1, title: 'Fractal Genesis', subtitle: 'Generative Series', year: '2026', color: 'from-violet-600/30 via-fuchsia-500/20 to-transparent' },
  { id: 2, title: 'Neon Topology', subtitle: 'Spatial Experiment', year: '2026', color: 'from-cyan-600/30 via-blue-500/20 to-transparent' },
  { id: 3, title: 'Void Sculpture', subtitle: 'Interactive Installation', year: '2025', color: 'from-orange-600/30 via-red-500/20 to-transparent' },
  { id: 4, title: 'Particle Dreams', subtitle: 'Audiovisual Performance', year: '2025', color: 'from-emerald-600/30 via-teal-500/20 to-transparent' },
];

const MOCK_STATS = [
  { label: 'Works', value: '147' },
  { label: 'Views', value: '12.4K' },
  { label: 'Followers', value: '2.1K' },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function Profile2Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  return (
    <PageShell contentClassName="relative" showDock={false}>
      {/* ── HERO SECTION ── */}
      <div ref={heroRef} className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease }}
            className="mb-10"
          >
            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-border/40 shadow-2xl shadow-primary/[0.05]">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full p-4 bg-card">
                  <DefaultAvatar className="w-full h-full" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Name — oversized editorial typography */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter font-lato leading-[0.9] mb-6"
          >
            {displayName.split(' ').map((word, i) => (
              <span key={i} className="block">
                {i === 1 ? <span className="italic font-light">{word}</span> : word}
              </span>
            ))}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="text-lg sm:text-xl text-muted-foreground font-lato max-w-lg mx-auto mb-10"
          >
            Digital sculptor & creative technologist
          </motion.p>

          {/* Action row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Button size="lg" className="rounded-full gap-2 px-8 h-12 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Follow Creator
            </Button>
            <Button variant="outline" size="lg" className="rounded-full gap-2 px-8 h-12 text-sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-14"
          >
            {MOCK_STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight font-lato">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-muted-foreground/40"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── ABOUT SECTION ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="lg:col-span-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/50 sticky top-32">
                About
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease }}
              className="lg:col-span-9 space-y-8"
            >
              <p className="text-3xl sm:text-4xl leading-snug font-lato text-foreground/90 text-pretty tracking-tight">
                {profile.bio}
              </p>

              <Separator className="bg-border/30" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Location</p>
                  <p className="text-sm font-lato font-medium">Lisbon, Portugal</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Member Since</p>
                  <p className="text-sm font-lato font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {profile.website && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Website</p>
                    <a
                      href={`https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-lato font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {profile.website}
                      <ExternalLink className="w-3 h-3 opacity-40" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── INTERESTS SECTION ── */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="lg:col-span-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/50 sticky top-32">
                Focus
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease }}
              className="lg:col-span-9"
            >
              <div className="flex flex-wrap gap-3">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-2xl sm:text-3xl font-lato font-light tracking-tight text-foreground/70 hover:text-foreground transition-colors duration-300 cursor-default after:content-[','] last:after:content-none after:text-muted-foreground/30 after:ml-1"
                  >
                    {interest.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURED WORKS SECTION ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease }}
            className="flex items-end justify-between mb-16"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">Portfolio</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter font-lato">Selected Works</h2>
            </div>
            <Button variant="ghost" className="rounded-full gap-2 text-muted-foreground hover:text-foreground hidden sm:flex">
              View Archive
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <div className="space-y-6">
            {MOCK_WORKS.map((work, i) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease }}
              >
                <div className="group relative rounded-3xl overflow-hidden border border-border/40 hover:border-primary/20 transition-all duration-500 cursor-pointer">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${work.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                  <div className="relative flex items-center justify-between p-8 sm:p-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-muted-foreground/50">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">{work.year}</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight font-lato group-hover:translate-x-2 transition-transform duration-500">
                        {work.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-lato">{work.subtitle}</p>
                    </div>

                    <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 shrink-0">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Bottom border accent */}
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-32 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="max-w-md mx-auto space-y-6"
        >
          <p className="text-2xl font-lato tracking-tight">
            Interested in collaborating?
          </p>
          <Button size="lg" className="rounded-full gap-2 px-10 h-12 text-sm font-semibold">
            Get in Touch
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        <div className="mt-20 opacity-20 select-none pointer-events-none">
          <p className="text-xs uppercase tracking-[0.4em] font-medium text-muted-foreground">Design Concept 2 — Editorial / Cinematic</p>
        </div>
      </footer>
    </PageShell>
  );
}
