'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { PageShell } from '@/components/layout/page-shell';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 6 — "BRUTALIST / SWISS"
   Strong grid, stark typography, raw exposed
   structure, heavy borders, asymmetric layout,
   International Typographic Style influence
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
  { id: 1, title: 'Fractal Genesis', year: '2026', medium: 'Generative / GLSL', dimensions: '4096 × 4096', edition: '1/1' },
  { id: 2, title: 'Neon Topology v2', year: '2026', medium: 'Spatial / WebGL', dimensions: '∞ × ∞ × ∞', edition: '1/10' },
  { id: 3, title: 'Void Sculpture', year: '2025', medium: 'Interactive / Three.js', dimensions: 'Variable', edition: '1/1' },
  { id: 4, title: 'Particle Dreams', year: '2025', medium: 'Audiovisual / GLSL', dimensions: '1920 × 1080', edition: 'Open' },
  { id: 5, title: 'Light Study #42', year: '2025', medium: 'Generative / Canvas', dimensions: '3000 × 3000', edition: '1/5' },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function Profile6Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Copied.');
  };

  return (
    <PageShell contentClassName="relative min-h-screen" showDock={false}>
      <main className="relative z-10">

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="border-b-2 border-foreground"
        >
          <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.3em] font-lato">Avalansa / Profile</span>
            <div className="flex items-center gap-6">
              <button onClick={handleShare} className="text-xs font-bold uppercase tracking-[0.2em] font-lato hover:opacity-60 transition-opacity">
                Share
              </button>
              <button className="text-xs font-bold uppercase tracking-[0.2em] font-lato bg-foreground text-background px-5 py-2 hover:opacity-80 transition-opacity">
                Follow
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── HERO SECTION — Asymmetric split ── */}
        <section className="border-b-2 border-foreground">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">

              {/* Left — Typography heavy */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease }}
                className="lg:col-span-7 xl:col-span-8 flex flex-col justify-end p-6 sm:p-10 lg:p-16 lg:border-r-2 border-foreground"
              >
                {/* Username label */}
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground mb-6 font-lato">
                  @{profile.username}
                </p>

                {/* Giant name */}
                <h1 className="text-7xl sm:text-8xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tighter leading-[0.85] font-lato uppercase break-words">
                  {displayName.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h1>

                {/* Tagline with heavy dash */}
                <div className="mt-10 flex items-start gap-4">
                  <div className="w-16 h-[3px] bg-foreground mt-3 shrink-0" />
                  <p className="text-lg sm:text-xl font-lato leading-snug max-w-md">
                    Digital sculptor &<br />creative technologist
                  </p>
                </div>
              </motion.div>

              {/* Right — Avatar + data */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease }}
                className="lg:col-span-5 xl:col-span-4 flex flex-col"
              >
                {/* Avatar block */}
                <div className="flex-1 border-b-2 border-foreground p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-primary/[0.02]">
                  <div className="w-full max-w-[280px] aspect-square relative">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" priority />
                    ) : (
                      <div className="w-full h-full border-2 border-foreground p-6 bg-card">
                        <DefaultAvatar className="w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Data grid */}
                <div className="grid grid-cols-2">
                  {[
                    { label: 'Works', value: '147' },
                    { label: 'Followers', value: '2.1K' },
                    { label: 'Views', value: '12.4K' },
                    { label: 'Since', value: 'Mar \'25' },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className={`p-5 sm:p-6 ${i % 2 === 0 ? 'border-r-2' : ''} ${i < 2 ? 'border-b-2' : ''} border-foreground`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 mb-1 font-lato">
                        {stat.label}
                      </p>
                      <p className="text-2xl sm:text-3xl font-black tracking-tight font-lato">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── BIO SECTION ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="border-b-2 border-foreground"
        >
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-3 p-6 sm:p-10 lg:p-12 lg:border-r-2 border-foreground">
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground font-lato lg:sticky lg:top-20">
                  About
                </p>
              </div>
              <div className="lg:col-span-9 p-6 sm:p-10 lg:p-12 xl:p-16">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-lato leading-snug tracking-tight text-pretty max-w-2xl">
                  {profile.bio}
                </p>

                {profile.website && (
                  <div className="mt-8 pt-8 border-t-2 border-foreground/10">
                    <a
                      href={`https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] font-lato hover:opacity-60 transition-opacity"
                    >
                      {profile.website}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── DISCIPLINES / INTERESTS ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="border-b-2 border-foreground"
        >
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-3 p-6 sm:p-10 lg:p-12 lg:border-r-2 border-foreground">
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground font-lato lg:sticky lg:top-20">
                  Disciplines
                </p>
              </div>
              <div className="lg:col-span-9">
                {profile.interests.map((interest, i) => (
                  <div
                    key={interest}
                    className={`p-6 sm:px-10 lg:px-12 xl:px-16 sm:py-6 flex items-center justify-between group cursor-default hover:bg-primary/[0.03] transition-colors ${
                      i < profile.interests.length - 1 ? 'border-b border-foreground/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-muted-foreground/30 w-6 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-lato uppercase tracking-wide group-hover:tracking-widest transition-all duration-500">
                        {interest.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-foreground group-hover:rotate-45 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── WORKS INDEX ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="border-b-2 border-foreground"
        >
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-3 p-6 sm:p-10 lg:p-12 lg:border-r-2 border-foreground">
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground font-lato lg:sticky lg:top-20">
                  Works Index
                </p>
              </div>
              <div className="lg:col-span-9">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 sm:px-10 lg:px-12 xl:px-16 py-4 border-b border-foreground/10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 font-lato">
                  <span className="col-span-4">Title</span>
                  <span className="col-span-2">Year</span>
                  <span className="col-span-3">Medium</span>
                  <span className="col-span-2">Dimensions</span>
                  <span className="col-span-1 text-right">Ed.</span>
                </div>

                {MOCK_WORKS.map((work, i) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease }}
                    className={`group cursor-pointer hover:bg-primary/[0.04] transition-colors ${
                      i < MOCK_WORKS.length - 1 ? 'border-b border-foreground/10' : ''
                    }`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden p-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold font-lato tracking-tight">{work.title}</h3>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground/50 font-lato">{work.year} · {work.medium} · {work.edition}</p>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 sm:px-10 lg:px-12 xl:px-16 py-5 items-center">
                      <h3 className="col-span-4 text-base font-bold font-lato tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {work.title}
                      </h3>
                      <span className="col-span-2 text-sm text-muted-foreground/60 font-lato tabular-nums">{work.year}</span>
                      <span className="col-span-3 text-sm text-muted-foreground/60 font-lato">{work.medium}</span>
                      <span className="col-span-2 text-sm text-muted-foreground/60 font-lato font-mono text-xs">{work.dimensions}</span>
                      <span className="col-span-1 text-sm text-muted-foreground/60 font-lato text-right tabular-nums">{work.edition}</span>
                    </div>
                  </motion.div>
                ))}

                {/* View all */}
                <div className="p-6 sm:px-10 lg:px-12 xl:px-16 sm:py-6">
                  <button className="text-xs font-bold uppercase tracking-[0.2em] font-lato hover:opacity-60 transition-opacity flex items-center gap-2">
                    View Complete Archive
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── COLOPHON / FOOTER ── */}
        <footer className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: 'Platform', value: 'Avalansa v2.6' },
              { label: 'Protocol', value: 'DIP-1' },
              { label: 'Identity', value: 'Verified' },
              { label: 'Visibility', value: 'Public' },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`p-6 sm:p-8 ${i < 3 ? 'sm:border-r-2' : ''} border-foreground/10`}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 mb-1 font-lato">{item.label}</p>
                <p className="text-sm font-bold font-lato">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-foreground p-6 sm:p-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/30 font-bold font-lato">
              Design Concept 6 — Brutalist / Swiss
            </p>
          </div>
        </footer>
      </main>
    </PageShell>
  );
}
