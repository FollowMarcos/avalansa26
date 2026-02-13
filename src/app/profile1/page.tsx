'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
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
  MapPin,
  Zap,
  Star,
  Eye,
  Heart,
  ArrowUpRight,
  Sparkles,
  Code2,
  Palette,
  Camera,
  Music,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 1 — "BENTO GRID"
   Apple-inspired bento layout with subtle glass
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

const MOCK_STATS = {
  creations: 147,
  views: '12.4k',
  likes: 892,
  collections: 8,
};

const MOCK_WORKS = [
  { id: 1, title: 'Fractal Genesis', color: 'from-violet-500/20 to-fuchsia-500/20' },
  { id: 2, title: 'Neon Topology', color: 'from-cyan-500/20 to-blue-500/20' },
  { id: 3, title: 'Void Sculpture', color: 'from-orange-500/20 to-red-500/20' },
  { id: 4, title: 'Particle Dreams', color: 'from-emerald-500/20 to-teal-500/20' },
  { id: 5, title: 'Light Study #42', color: 'from-amber-500/20 to-yellow-500/20' },
  { id: 6, title: 'Recursive Form', color: 'from-pink-500/20 to-rose-500/20' },
];

const interestIcons: Record<string, LucideIcon> = {
  'generative-art': Sparkles,
  'spatial-computing': Layers,
  'creative-coding': Code2,
  'typography': Star,
  'motion-design': Palette,
  'glsl-shaders': Zap,
};

const ease = [0.16, 1, 0.3, 1] as const;

function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Profile1Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  return (
    <PageShell contentClassName="relative min-h-screen">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-32 relative z-10">
        {/* ── TOP: Identity Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-10"
        >
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-[1.75rem] overflow-hidden bg-card border-2 border-border/50 ring-1 ring-primary/5 shadow-xl shadow-primary/[0.03]">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full p-3">
                  <DefaultAvatar className="w-full h-full" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-[3px] border-background" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-lato">{displayName}</h1>
              <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-widest font-semibold px-3">
                Creator
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">@{profile.username}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-full gap-2 h-9" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Button size="sm" className="rounded-full gap-2 h-9">
              <Zap className="w-3.5 h-3.5" />
              Follow
            </Button>
          </div>
        </motion.div>

        {/* ── BENTO GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">

          {/* Bio Card — spans 2 cols */}
          <BentoCard className="md:col-span-2 p-8" delay={0.05}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">About</p>
            <p className="text-lg leading-relaxed text-foreground/90 font-lato text-pretty">
              {profile.bio}
            </p>
          </BentoCard>

          {/* Stats Card */}
          <BentoCard className="p-6" delay={0.1}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">Stats</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Creations', value: MOCK_STATS.creations, icon: Sparkles },
                { label: 'Views', value: MOCK_STATS.views, icon: Eye },
                { label: 'Likes', value: MOCK_STATS.likes, icon: Heart },
                { label: 'Collections', value: MOCK_STATS.collections, icon: Layers },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <stat.icon className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight font-lato">{stat.value}</p>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Info Card */}
          <BentoCard className="p-6" delay={0.15}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">Details</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <span className="text-foreground/80 font-lato">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <span className="text-foreground/80 font-lato">Lisbon, Portugal</span>
              </div>
              {profile.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <a
                    href={`https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors font-lato truncate flex items-center gap-1"
                  >
                    {profile.website}
                    <ExternalLink className="w-3 h-3 opacity-40" />
                  </a>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Interests — spans 2 cols */}
          <BentoCard className="md:col-span-2 p-6" delay={0.2}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => {
                const Icon = interestIcons[interest] || Star;
                return (
                  <div
                    key={interest}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/[0.04] border border-primary/[0.08] hover:bg-primary/[0.08] hover:border-primary/[0.15] transition-all duration-300 cursor-default group"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium font-lato capitalize">
                      {interest.replace(/-/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </BentoCard>

          {/* Featured Work — spans 2 cols, tall */}
          <BentoCard className="lg:col-span-2 p-6" delay={0.25}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Featured Work</p>
              <Button disabled variant="ghost" size="sm" className="text-xs rounded-full h-7 gap-1 text-muted-foreground hover:text-primary">
                View All <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MOCK_WORKS.map((work) => (
                <div
                  key={work.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-border/40 hover:border-primary/20 transition-all duration-500"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${work.color}`} />
                  <div className="absolute inset-0 bg-primary/[0.02]" />
                  <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-semibold font-lato bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                      {work.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Activity Card */}
          <BentoCard className="lg:col-span-2 p-6" delay={0.3}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">Recent Activity</p>
            <div className="space-y-4">
              {[
                { action: 'Created', item: 'Fractal Genesis', time: '2 hours ago', icon: Sparkles },
                { action: 'Updated', item: 'Neon Topology collection', time: '1 day ago', icon: Layers },
                { action: 'Shared', item: 'Light Study #42', time: '3 days ago', icon: Share2 },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-xl bg-primary/[0.05] border border-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.1] transition-colors">
                    <activity.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-lato">
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium text-foreground">{activity.item}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 shrink-0 font-lato">{activity.time}</span>
                </div>
              ))}
            </div>
          </BentoCard>

        </div>

        {/* Footer watermark */}
        <div className="mt-20 text-center opacity-20 select-none pointer-events-none">
          <p className="text-xs uppercase tracking-[0.4em] font-medium text-muted-foreground">Design Concept 1 — Bento Grid</p>
        </div>
      </main>
    </PageShell>
  );
}
