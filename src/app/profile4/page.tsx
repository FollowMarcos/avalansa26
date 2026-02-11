'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Calendar,
  Globe,
  Share2,
  ExternalLink,
  Zap,
  Star,
  Eye,
  Heart,
  ArrowUpRight,
  Sparkles,
  Layers,
  MapPin,
  Link as LinkIcon,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 4 — "SPATIAL / CARD STACK"
   Floating depth-layered ID card, glassmorphism,
   centered stage with orbiting info panels
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
  { id: 1, title: 'Fractal Genesis', type: 'Generative', color: 'from-violet-500/30 to-fuchsia-500/10' },
  { id: 2, title: 'Neon Topology', type: 'Spatial', color: 'from-cyan-500/30 to-blue-500/10' },
  { id: 3, title: 'Void Sculpture', type: 'Installation', color: 'from-orange-500/30 to-red-500/10' },
];

const ease = [0.16, 1, 0.3, 1] as const;

function FloatingPanel({
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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease }}
      className={`rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-xl shadow-primary/[0.02] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Profile4Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';
  const [activeTab, setActiveTab] = useState<'about' | 'work' | 'activity'>('about');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  return (
    <PageShell contentClassName="relative min-h-screen">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-primary/[0.025] rounded-full blur-[150px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.015] rounded-full blur-[200px]" />
      </div>

      {/* Dot grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-32 relative z-10">

        {/* ── MAIN IDENTITY CARD ── */}
        <div className="flex flex-col items-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, ease }}
            style={{ perspective: '1200px' }}
            className="w-full max-w-md"
          >
            <div className="relative rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-primary/[0.04]">
              {/* Card header accent line */}
              <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              <div className="p-8 sm:p-10 text-center">
                {/* Avatar */}
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse scale-110" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-background ring-1 ring-primary/10 shadow-lg">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" priority />
                    ) : (
                      <div className="w-full h-full p-3 bg-card">
                        <DefaultAvatar className="w-full h-full" />
                      </div>
                    )}
                  </div>
                  {/* Online dot */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-[3px] border-card shadow-sm" />
                </div>

                {/* Name & handle */}
                <h1 className="text-3xl font-bold tracking-tight font-lato mb-1">{displayName}</h1>
                <p className="text-sm text-muted-foreground font-mono mb-4">@{profile.username}</p>

                {/* Role badge */}
                <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-[0.15em] px-4 py-1 border-primary/15 bg-primary/[0.03] mb-6">
                  Creator
                </Badge>

                {/* Quick stats */}
                <div className="flex items-center justify-center gap-8 py-4 border-y border-border/40">
                  {[
                    { label: 'Works', value: '147' },
                    { label: 'Followers', value: '2.1K' },
                    { label: 'Following', value: '342' },
                  ].map((stat) => (
                    <button key={stat.label} className="text-center group cursor-pointer">
                      <p className="text-xl font-bold tracking-tight font-lato group-hover:text-primary transition-colors">{stat.value}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-0.5">{stat.label}</p>
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-6">
                  <Button className="flex-1 rounded-full h-11 gap-2 font-semibold">
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </Button>
                  <Button variant="outline" className="rounded-full h-11 w-11 p-0" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="rounded-full h-11 w-11 p-0">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── TAB NAVIGATION ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="flex items-center justify-center gap-1 mb-10"
        >
          {(['about', 'work', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium font-lato capitalize transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.05]'
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* ── CONTENT PANELS ── */}
        <div className="max-w-2xl mx-auto">

          {/* About Panel */}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="space-y-6"
            >
              {/* Bio */}
              <FloatingPanel className="p-7" delay={0}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">Bio</p>
                <p className="text-base leading-relaxed font-lato text-foreground/85 text-pretty">
                  {profile.bio}
                </p>
              </FloatingPanel>

              {/* Details */}
              <FloatingPanel className="p-7" delay={0.05}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-5">Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, label: 'Location', value: 'Lisbon, Portugal' },
                    { icon: Calendar, label: 'Joined', value: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
                    { icon: Globe, label: 'Website', value: profile.website, isLink: true },
                    { icon: Zap, label: 'Status', value: 'Available for work' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/[0.03] transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/[0.05] border border-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.08] transition-colors">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">{item.label}</p>
                        {item.isLink && item.value ? (
                          <a
                            href={`https://${item.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-lato font-medium hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {item.value}
                            <ExternalLink className="w-3 h-3 opacity-30" />
                          </a>
                        ) : (
                          <p className="text-sm font-lato font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FloatingPanel>

              {/* Focus areas */}
              <FloatingPanel className="p-7" delay={0.1}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-5">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-4 py-2 rounded-full bg-primary/[0.04] border border-primary/[0.08] text-sm font-medium font-lato capitalize hover:bg-primary/[0.08] hover:border-primary/[0.15] transition-all duration-300 cursor-default"
                    >
                      {interest.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </FloatingPanel>
            </motion.div>
          )}

          {/* Work Panel */}
          {activeTab === 'work' && (
            <motion.div
              key="work"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="space-y-4"
            >
              {MOCK_WORKS.map((work, i) => (
                <FloatingPanel key={work.id} className="overflow-hidden group cursor-pointer" delay={i * 0.06}>
                  <div className="relative">
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${work.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative flex items-center gap-5 p-6">
                      {/* Thumbnail */}
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${work.color} border border-border/30 shrink-0 flex items-center justify-center`}>
                        <Sparkles className="w-5 h-5 text-foreground/30" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold font-lato tracking-tight group-hover:text-primary transition-colors">{work.title}</h3>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{work.type}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground/40">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs font-lato">2.4k</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/40">
                          <Heart className="w-3.5 h-3.5" />
                          <span className="text-xs font-lato">128</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </FloatingPanel>
              ))}

              <div className="text-center pt-4">
                <Button variant="outline" className="rounded-full gap-2 text-sm">
                  View All Works
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Activity Panel */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <FloatingPanel className="p-7" delay={0}>
                <div className="space-y-6">
                  {[
                    { action: 'Created a new work', item: 'Fractal Genesis', time: '2 hours ago', icon: Sparkles, color: 'text-violet-500' },
                    { action: 'Updated collection', item: 'Spatial Studies', time: '1 day ago', icon: Layers, color: 'text-blue-500' },
                    { action: 'Reached milestone', item: '10K total views', time: '3 days ago', icon: Eye, color: 'text-emerald-500' },
                    { action: 'Received', item: '50 new followers', time: '5 days ago', icon: Heart, color: 'text-rose-500' },
                    { action: 'Published', item: 'Light Study #42', time: '1 week ago', icon: Star, color: 'text-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-full bg-primary/[0.04] border border-primary/[0.08] flex items-center justify-center shrink-0 ${item.color}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        {i < 4 && (
                          <div className="absolute top-9 left-1/2 -translate-x-1/2 w-px h-6 bg-border/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-sm font-lato">
                          <span className="text-muted-foreground">{item.action}</span>{' '}
                          <span className="font-semibold text-foreground">{item.item}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground/40 mt-0.5 font-lato">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FloatingPanel>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-24 text-center opacity-20 select-none pointer-events-none">
          <p className="text-xs uppercase tracking-[0.4em] font-medium text-muted-foreground">Design Concept 4 — Spatial / Card Stack</p>
        </div>
      </main>
    </PageShell>
  );
}
