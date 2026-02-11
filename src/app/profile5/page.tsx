'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useState } from 'react';
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
  Layers,
  UserPlus,
  MessageSquare,
  MoreHorizontal,
  Bookmark,
  Repeat2,
  ImageIcon,
  Grid3X3,
  List,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 5 — "SIDEBAR + FEED"
   Social-media layout: sticky left sidebar
   with profile summary, scrollable right feed
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

const MOCK_FEED = [
  {
    id: 1,
    type: 'creation' as const,
    title: 'Fractal Genesis',
    description: 'New generative piece exploring recursive fractal patterns with real-time audio reactivity. Built with custom GLSL shaders.',
    color: 'from-violet-500/20 to-fuchsia-500/10',
    time: '2h ago',
    likes: 42,
    views: 891,
    reposts: 12,
  },
  {
    id: 2,
    type: 'milestone' as const,
    title: 'Reached 10,000 views',
    description: 'Thanks to everyone supporting the journey. Excited to share what\'s coming next.',
    color: '',
    time: '1d ago',
    likes: 128,
    views: 2340,
    reposts: 34,
  },
  {
    id: 3,
    type: 'creation' as const,
    title: 'Neon Topology v2',
    description: 'Updated spatial experiment with improved mesh deformation algorithms and dynamic lighting system.',
    color: 'from-cyan-500/20 to-blue-500/10',
    time: '3d ago',
    likes: 67,
    views: 1203,
    reposts: 8,
  },
  {
    id: 4,
    type: 'creation' as const,
    title: 'Void Sculpture',
    description: 'Interactive installation piece — drag to rotate, scroll to zoom. Exploring negative space in digital environments.',
    color: 'from-orange-500/20 to-red-500/10',
    time: '5d ago',
    likes: 93,
    views: 1876,
    reposts: 21,
  },
  {
    id: 5,
    type: 'thought' as const,
    title: '',
    description: 'Been thinking about how spatial computing changes the relationship between creator and audience. When a viewer can walk around your art, they become part of it. The boundary dissolves.',
    color: '',
    time: '1w ago',
    likes: 156,
    views: 3201,
    reposts: 45,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

function FeedCard({ item, index }: { item: typeof MOCK_FEED[0]; index: number }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease }}
      className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-border/70 transition-all duration-300 overflow-hidden group"
    >
      {/* Creation thumbnail */}
      {item.type === 'creation' && item.color && (
        <div className={`h-48 sm:h-56 bg-gradient-to-br ${item.color} relative`}>
          <div className="absolute inset-0 bg-primary/[0.02]" />
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-sm text-[10px] uppercase tracking-wider border-0 shadow-sm">
              {item.type}
            </Badge>
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border/40 shrink-0 bg-card">
              <DefaultAvatar className="w-full h-full p-1" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-lato truncate">Mira Santos</span>
                {item.type === 'milestone' && (
                  <Badge className="rounded-full text-[9px] uppercase tracking-wider h-5 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
                    Milestone
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground/50 font-lato">@mira_santos · {item.time}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground/40 hover:text-foreground shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        {item.title && item.type !== 'creation' && (
          <h3 className="text-base font-semibold font-lato mb-1.5">{item.title}</h3>
        )}
        {item.type === 'creation' && (
          <h3 className="text-lg font-semibold font-lato mb-1.5 tracking-tight">{item.title}</h3>
        )}
        <p className="text-sm text-foreground/70 font-lato leading-relaxed text-pretty">
          {item.description}
        </p>

        {/* Engagement bar */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/30">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                liked
                  ? 'text-rose-500 bg-rose-500/10'
                  : 'text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/5'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              {item.likes + (liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all duration-200">
              <Repeat2 className="w-3.5 h-3.5" />
              {item.reposts}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/50 hover:text-foreground hover:bg-primary/5 transition-all duration-200">
              <Eye className="w-3.5 h-3.5" />
              {item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                bookmarked
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-1.5 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-primary/5 transition-all duration-200">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function Profile5Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';
  const [feedView, setFeedView] = useState<'all' | 'creations' | 'thoughts'>('all');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  const filteredFeed = feedView === 'all'
    ? MOCK_FEED
    : feedView === 'creations'
    ? MOCK_FEED.filter((f) => f.type === 'creation')
    : MOCK_FEED.filter((f) => f.type === 'thought' || f.type === 'milestone');

  return (
    <PageShell contentClassName="relative min-h-screen">
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT SIDEBAR — Sticky Profile Card ── */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-20 space-y-5">

              {/* Profile card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease }}
                className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden"
              >
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-primary/[0.08] via-primary/[0.03] to-transparent relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>

                <div className="px-5 pb-5 -mt-10 relative">
                  {/* Avatar */}
                  <div className="relative w-20 h-20 mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-card bg-card shadow-md">
                      {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" priority />
                      ) : (
                        <div className="w-full h-full p-2">
                          <DefaultAvatar className="w-full h-full" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-[3px] border-card" />
                  </div>

                  {/* Name */}
                  <h1 className="text-xl font-bold tracking-tight font-lato">{displayName}</h1>
                  <p className="text-xs text-muted-foreground font-mono">@{profile.username}</p>

                  {/* Bio */}
                  <p className="text-sm text-foreground/70 font-lato leading-relaxed mt-3 text-pretty">
                    {profile.bio}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-lato">Lisbon, Portugal</span>
                    </div>
                    {profile.website && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <Globe className="w-3.5 h-3.5" />
                        <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="font-lato hover:text-primary transition-colors">
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-lato">
                        Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border/30">
                    {[
                      { label: 'Following', value: '342' },
                      { label: 'Followers', value: '2.1K' },
                    ].map((s) => (
                      <button key={s.label} className="group cursor-pointer">
                        <span className="text-sm font-bold font-lato group-hover:text-primary transition-colors">{s.value}</span>
                        <span className="text-xs text-muted-foreground/50 ml-1">{s.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5">
                    <Button className="flex-1 rounded-full h-9 gap-2 text-xs font-semibold">
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={handleShare}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Interests */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
                className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-full bg-primary/[0.04] border border-primary/[0.08] text-xs font-medium font-lato capitalize hover:bg-primary/[0.08] transition-colors cursor-default"
                    >
                      {interest.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Suggested (compact) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">Similar Creators</p>
                <div className="space-y-3">
                  {['Alex Chen', 'Yuki Ito', 'Sara Oberg'].map((name) => (
                    <div key={name} className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/[0.06] border border-primary/[0.08] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">{name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-lato truncate group-hover:text-primary transition-colors">{name}</p>
                        <p className="text-[10px] text-muted-foreground/40">Creator</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full h-7 text-[10px] px-3 shrink-0">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </aside>

          {/* ── RIGHT SIDE — Feed ── */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Feed tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="flex items-center gap-1 mb-6 border-b border-border/30 pb-3"
            >
              {[
                { id: 'all' as const, label: 'All', icon: List },
                { id: 'creations' as const, label: 'Creations', icon: Grid3X3 },
                { id: 'thoughts' as const, label: 'Thoughts', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFeedView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium font-lato transition-all duration-200 ${
                    feedView === tab.id
                      ? 'bg-primary/[0.06] text-primary'
                      : 'text-muted-foreground/50 hover:text-foreground hover:bg-primary/[0.03]'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Feed items */}
            <div className="space-y-5">
              {filteredFeed.map((item, i) => (
                <FeedCard key={item.id} item={item} index={i} />
              ))}
            </div>

            {/* Load more */}
            <div className="text-center mt-8">
              <Button variant="outline" className="rounded-full gap-2">
                Load More
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center opacity-20 select-none pointer-events-none">
          <p className="text-xs uppercase tracking-[0.4em] font-medium text-muted-foreground">Design Concept 5 — Sidebar + Feed</p>
        </div>
      </main>
    </PageShell>
  );
}
