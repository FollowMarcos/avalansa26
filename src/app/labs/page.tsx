'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles, ThumbsUp, ThumbsDown, MessageSquare, X, Send, Zap, Clock,
  Settings, ImagePlus, Ban, ChevronDown, Maximize2, Minimize2,
  Layers, Library, Server, Command, Wand2, Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { voteMockup, getUserMockupVotes, removeVote, getAllMockupVoteStats, type MockupVoteStats } from '@/utils/supabase/mockup-votes.server';
import type { VoteType } from '@/types/mockup-vote';

const QUALITY_OPTIONS = ['1K', '2K', '4K'] as const;
const COUNT_OPTIONS = [1, 2, 3, 4] as const;

function AspectRatioShape({ ratio, className }: { ratio: string; className?: string }) {
  const getShapeDimensions = (r: string): { width: number; height: number } => {
    const [w, h] = r.split(':').map(Number);
    const maxSize = 14;
    if (w > h) return { width: maxSize, height: Math.round((h / w) * maxSize) };
    else if (h > w) return { width: Math.round((w / h) * maxSize), height: maxSize };
    return { width: maxSize, height: maxSize };
  };
  const { width, height } = getShapeDimensions(ratio);
  return (
    <div
      className={cn("border-[1.5px] border-current rounded-[2px]", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

export default function LabsPage() {
  const [votes, setVotes] = React.useState<Record<string, { type: VoteType; feedback: string | null }>>({});
  const [voteStats, setVoteStats] = React.useState<Record<string, MockupVoteStats>>({});
  const [feedbackOpen, setFeedbackOpen] = React.useState<string | null>(null);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [showAllFeedback, setShowAllFeedback] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    const [userVotes, stats] = await Promise.all([
      getUserMockupVotes(),
      getAllMockupVoteStats()
    ]);
    const voteMap: Record<string, { type: VoteType; feedback: string | null }> = {};
    userVotes.forEach((v) => {
      voteMap[v.mockup_id] = { type: v.vote_type, feedback: v.feedback };
    });
    setVotes(voteMap);
    setVoteStats(stats);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (mockupId: string, voteType: VoteType) => {
    const currentVote = votes[mockupId];
    if (currentVote?.type === voteType) {
      await removeVote(mockupId);
      setVotes((prev) => {
        const next = { ...prev };
        delete next[mockupId];
        return next;
      });
    } else {
      await voteMockup(mockupId, voteType);
      setVotes((prev) => ({
        ...prev,
        [mockupId]: { type: voteType, feedback: prev[mockupId]?.feedback || null }
      }));
    }
    const stats = await getAllMockupVoteStats();
    setVoteStats(stats);
  };

  const handleFeedback = async (mockupId: string) => {
    if (!feedbackText.trim()) return;
    const currentVote = votes[mockupId];
    await voteMockup(mockupId, currentVote?.type || 'like', feedbackText);
    setVotes((prev) => ({
      ...prev,
      [mockupId]: { type: prev[mockupId]?.type || 'like', feedback: feedbackText }
    }));
    setFeedbackOpen(null);
    setFeedbackText('');
    const stats = await getAllMockupVoteStats();
    setVoteStats(stats);
  };

  const mockups = [
    { id: 'composer-v1-bento', title: 'Bento Active Grid', description: 'Modular cards with hover interactions', component: ComposerBento },
    { id: 'composer-v2-liquid', title: 'Liquid Morphism', description: 'Organic flowing shapes with fluid motion', component: ComposerLiquid },
    { id: 'composer-v3-radiant', title: 'Radiant Glow', description: 'Premium glow effects with depth layers', component: ComposerRadiant },
    { id: 'composer-v4-dimensional', title: 'Dimensional Layers', description: 'Multi-layer glassmorphism with parallax', component: ComposerDimensional },
    { id: 'composer-v5-orb', title: 'Orb Interface', description: 'Floating orbs as interactive controls', component: ComposerOrb },
    { id: 'composer-v6-crystalline', title: 'Crystalline', description: 'Faceted gem-like surfaces with prismatic colors', component: ComposerCrystalline },
    { id: 'composer-v7-void', title: 'Void Portal', description: 'Deep space aesthetic with portal focus', component: ComposerVoid },
    { id: 'composer-v8-neo', title: 'Neo Minimal', description: 'Clean warmth with humanized touches', component: ComposerNeo },
    { id: 'composer-v9-flux', title: 'Flux Field', description: 'Dynamic gradient mesh with motion', component: ComposerFlux },
    { id: 'composer-v10-ethereal', title: 'Ethereal Mist', description: 'Soft atmospheric layers with depth', component: ComposerEthereal },
    { id: 'composer-v11-prism', title: 'Prism Split', description: 'Light refraction with chromatic accents', component: ComposerPrism },
    { id: 'composer-v12-organic', title: 'Organic Flow', description: 'Biomorphic shapes with natural curves', component: ComposerOrganic },
  ];

  return (
    <PageShell contentClassName="flex flex-col antialiased selection:bg-primary/20 overflow-x-hidden">
      <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 bg-background/50 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium tracking-wide">AVALANSA <span className="opacity-50 font-normal">LABS</span></span>
        </Link>
        <ModeToggle />
      </nav>

      <main className="flex-1 pt-32 pb-48 px-8 relative z-10 w-full max-w-5xl mx-auto">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16 text-center">
          <h1 className="text-3xl font-light tracking-tight mb-2">Composer Island Designs</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">Vote on your favorite prompt composer style</p>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="flex flex-col gap-12">
          {mockups.map((mockup, index) => {
            const MockupComponent = mockup.component;
            const vote = votes[mockup.id];
            const stats = voteStats[mockup.id];
            const feedbackList = stats?.feedback || [];

            return (
              <motion.div
                key={mockup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div>
                    <h2 className="text-base font-medium">{mockup.title}</h2>
                    <p className="text-sm text-muted-foreground/60 mt-0.5">{mockup.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleVote(mockup.id, 'like')} aria-label={`Like ${mockup.title}`} aria-pressed={vote?.type === 'like'} className={cn("size-9 rounded-lg transition-colors", vote?.type === 'like' && "bg-green-500/10 text-green-500 hover:bg-green-500/20")}>
                        <ThumbsUp className="size-4" aria-hidden="true" />
                      </Button>
                      {(stats?.likes ?? 0) > 0 && <span className="text-xs font-mono text-green-500 min-w-[1.25rem]">{stats?.likes}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleVote(mockup.id, 'dislike')} aria-label={`Dislike ${mockup.title}`} aria-pressed={vote?.type === 'dislike'} className={cn("size-9 rounded-lg transition-colors", vote?.type === 'dislike' && "bg-red-500/10 text-red-500 hover:bg-red-500/20")}>
                        <ThumbsDown className="size-4" aria-hidden="true" />
                      </Button>
                      {(stats?.dislikes ?? 0) > 0 && <span className="text-xs font-mono text-red-500 min-w-[1.25rem]">{stats?.dislikes}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setFeedbackOpen(feedbackOpen === mockup.id ? null : mockup.id); setFeedbackText(vote?.feedback || ''); }} aria-label={`Feedback for ${mockup.title}`} aria-expanded={feedbackOpen === mockup.id} className={cn("size-9 rounded-lg transition-colors", vote?.feedback && "bg-blue-500/10 text-blue-500")}>
                        <MessageSquare className="size-4" aria-hidden="true" />
                      </Button>
                      {feedbackList.length > 0 && <button onClick={() => setShowAllFeedback(showAllFeedback === mockup.id ? null : mockup.id)} className="text-xs font-mono text-blue-500 hover:text-blue-400 transition-colors">{feedbackList.length}</button>}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {feedbackOpen === mockup.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/5">
                      <div className="flex items-center gap-2 px-6 py-3 bg-muted/20">
                        <input type="text" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Share your thoughts…" aria-label={`Feedback for ${mockup.title}`} className="flex-1 bg-muted/30 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" onKeyDown={(e) => { if (e.key === 'Enter') handleFeedback(mockup.id); }} />
                        <Button size="icon" variant="ghost" onClick={() => handleFeedback(mockup.id)} aria-label="Submit" className="size-9 rounded-lg"><Send className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setFeedbackOpen(null)} aria-label="Close" className="size-9 rounded-lg"><X className="size-4" /></Button>
                      </div>
                      {vote?.feedback && <p className="text-xs text-muted-foreground px-6 pb-3">Your feedback: "{vote.feedback}"</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showAllFeedback === mockup.id && feedbackList.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/5">
                      <div className="px-6 py-4 bg-blue-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-blue-400">Feedback ({feedbackList.length})</h3>
                          <Button size="icon" variant="ghost" onClick={() => setShowAllFeedback(null)} className="size-7 rounded-lg"><X className="size-3" /></Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {feedbackList.map((fb, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                              <MessageSquare className="size-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-300">{fb.feedback}</p>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(fb.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative min-h-[360px] bg-muted/30 flex items-end justify-center p-8">
                  <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.02]" aria-hidden="true" />
                  <div className="relative w-full max-w-3xl"><MockupComponent /></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </PageShell>
  );
}

// ============================================================================
// MOCKUP 1: Bento Active Grid
// Modular, asymmetric card layouts inspired by 2026 Bento trend
// ============================================================================
function ComposerBento() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(2);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hoveredCell, setHoveredCell] = React.useState<string | null>(null);

  return (
    <div className="bg-[#0a0a0b] rounded-[28px] p-5 shadow-2xl">
      {/* Bento Grid Settings */}
      <div className="grid grid-cols-12 gap-2 mb-4">
        {/* API - Large cell */}
        <motion.div
          onHoverStart={() => setHoveredCell('api')}
          onHoverEnd={() => setHoveredCell(null)}
          animate={{ scale: hoveredCell === 'api' ? 1.02 : 1 }}
          className="col-span-4 row-span-2 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/5 p-4 cursor-pointer hover:border-violet-500/30 transition-colors"
        >
          <Server className="size-5 text-violet-400 mb-3" />
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Model</p>
          <p className="text-sm font-medium text-zinc-200">Nano Pro</p>
          <p className="text-xs text-zinc-500 mt-1">v2.1 Turbo</p>
        </motion.div>

        {/* Ratio */}
        <motion.div
          onHoverStart={() => setHoveredCell('ratio')}
          onHoverEnd={() => setHoveredCell(null)}
          animate={{ scale: hoveredCell === 'ratio' ? 1.02 : 1 }}
          onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : aspectRatio === '16:9' ? '9:16' : '1:1')}
          className="col-span-3 rounded-2xl bg-zinc-900/80 border border-white/5 p-3 cursor-pointer hover:border-white/10 transition-colors flex flex-col items-center justify-center"
        >
          <AspectRatioShape ratio={aspectRatio} className="text-cyan-400 mb-2" />
          <p className="text-xs font-mono text-zinc-400">{aspectRatio}</p>
        </motion.div>

        {/* Quality */}
        <motion.div
          onHoverStart={() => setHoveredCell('quality')}
          onHoverEnd={() => setHoveredCell(null)}
          animate={{ scale: hoveredCell === 'quality' ? 1.02 : 1 }}
          className="col-span-5 rounded-2xl bg-zinc-900/80 border border-white/5 p-3 cursor-pointer hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between h-full">
            {QUALITY_OPTIONS.map((q) => (
              <button key={q} onClick={() => setQuality(q)} className={cn("flex-1 py-2 rounded-xl text-xs font-mono transition-all", quality === q ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>
                {q}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Count */}
        <motion.div
          onHoverStart={() => setHoveredCell('count')}
          onHoverEnd={() => setHoveredCell(null)}
          animate={{ scale: hoveredCell === 'count' ? 1.02 : 1 }}
          className="col-span-4 rounded-2xl bg-zinc-900/80 border border-white/5 p-3"
        >
          <div className="flex items-center gap-1">
            {COUNT_OPTIONS.map((n) => (
              <button key={n} onClick={() => setCount(n)} className={cn("flex-1 py-2 rounded-xl text-xs font-mono transition-all", count === n ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                {n}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Speed */}
        <motion.div
          onHoverStart={() => setHoveredCell('speed')}
          onHoverEnd={() => setHoveredCell(null)}
          animate={{ scale: hoveredCell === 'speed' ? 1.02 : 1 }}
          onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')}
          className={cn("col-span-4 rounded-2xl border p-3 cursor-pointer transition-colors flex items-center justify-center gap-2", speed === 'fast' ? "bg-amber-500/10 border-amber-500/20" : "bg-zinc-900/80 border-white/5")}
        >
          {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-zinc-400" />}
          <span className={cn("text-xs font-medium", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Turbo' : 'Batch'}</span>
        </motion.div>
      </div>

      {/* Prompt Input */}
      <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-4">
        <motion.div animate={{ height: isExpanded ? 140 : 56 }} transition={{ duration: 0.2 }}>
          <textarea placeholder="Describe your vision in detail..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
        </motion.div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button className="size-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"><ImagePlus className="size-4" /></button>
            <button className="size-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"><Library className="size-4" /></button>
            <button className="size-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"><Ban className="size-4" /></button>
            <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl flex items-center justify-center transition-colors", isExpanded ? "bg-white text-black" : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300")}>
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
          <button className="h-11 px-8 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-fuchsia-500/20">
            <Sparkles className="size-4" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 2: Liquid Morphism
// Organic flowing shapes with fluid motion
// ============================================================================
function ComposerLiquid() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Liquid blob backgrounds */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-teal-400/20 via-cyan-500/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-gradient-to-tl from-violet-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />

      <div className="relative bg-zinc-950/80 backdrop-blur-2xl border border-white/[0.08] rounded-[32px] overflow-hidden">
        {/* Organic shaped settings bar */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pill-shaped controls with organic curves */}
            <button className="h-10 px-5 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center gap-2 hover:from-teal-500/30 hover:to-cyan-500/30 transition-all">
              <Server className="size-3.5 text-teal-400" />
              <span className="text-sm text-teal-300">Nano Pro</span>
            </button>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-10 px-4 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
              <AspectRatioShape ratio={aspectRatio} className="text-purple-400" />
              <span className="text-sm text-zinc-300">{aspectRatio}</span>
            </button>

            <div className="h-10 rounded-full bg-white/5 border border-white/10 flex items-center p-1">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-8 px-4 rounded-full text-sm font-medium transition-all", quality === q ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20" : "text-zinc-500 hover:text-zinc-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="h-10 rounded-full bg-white/5 border border-white/10 flex items-center p-1 gap-0.5">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-8 rounded-full text-sm font-mono transition-all", count === n ? "bg-purple-500 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-10 px-4 rounded-full border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30" : "bg-white/5 border-white/10")}>
              {speed === 'fast' ? <Zap className="size-3.5 text-amber-400" /> : <Clock className="size-3.5 text-zinc-400" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
            </button>
          </div>
        </div>

        {/* Prompt area with organic curve */}
        <div className="p-6">
          <motion.div animate={{ height: isExpanded ? 160 : 72 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <textarea placeholder="Let your imagination flow..." className="w-full h-full bg-transparent text-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2">
              <button className="size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-teal-400 hover:border-teal-500/30 transition-all"><ImagePlus className="size-5" /></button>
              <button className="size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 transition-all"><Library className="size-5" /></button>
              <button className="size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"><Ban className="size-5" /></button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-11 rounded-2xl border flex items-center justify-center transition-all", isExpanded ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white font-medium flex items-center gap-2 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow">
              <Wand2 className="size-5" />
              Create Magic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 3: Radiant Glow
// Premium glow effects with depth layers
// ============================================================================
function ComposerRadiant() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [focusedInput, setFocusedInput] = React.useState(false);

  return (
    <div className="relative">
      {/* Radiant glow layers */}
      <div className={cn("absolute inset-0 rounded-3xl transition-all duration-500", focusedInput ? "bg-gradient-to-r from-rose-500/30 via-pink-500/20 to-purple-500/30 blur-2xl scale-105" : "bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 blur-xl")} />
      <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-transparent" />

      <div className="relative bg-[#0c0c0e]/95 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        {/* Glowing header line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        {/* Settings */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-9 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
              <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-medium text-rose-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-pink-400" />
              <span className="text-xs text-zinc-400">{aspectRatio}</span>
            </button>

            {QUALITY_OPTIONS.map((q) => (
              <button key={q} onClick={() => setQuality(q)} className={cn("h-9 px-4 rounded-xl text-xs font-medium transition-all", quality === q ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-300")}>
                {q}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-1">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-9 rounded-xl text-xs font-mono transition-all", count === n ? "bg-purple-500/20 border border-purple-500/40 text-purple-300" : "bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-300")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-9 px-4 rounded-xl border flex items-center gap-1.5 transition-all", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-zinc-500")}>
              {speed === 'fast' ? <Zap className="size-3" /> : <Clock className="size-3" />}
              <span className="text-xs">{speed === 'fast' ? 'Turbo' : 'Batch'}</span>
            </button>
          </div>
        </div>

        {/* Input with glow focus effect */}
        <div className="p-5">
          <motion.div animate={{ height: isExpanded ? 140 : 64 }} transition={{ duration: 0.2 }} className={cn("rounded-2xl p-4 transition-all duration-300", focusedInput ? "bg-gradient-to-r from-rose-500/5 via-pink-500/5 to-purple-500/5 ring-1 ring-rose-500/30" : "bg-white/[0.02]")}>
            <textarea
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              placeholder="What radiant vision shall we create..."
              className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
            />
          </motion.div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors"><ImagePlus className="size-4" /></button>
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-pink-400 transition-colors"><Library className="size-4" /></button>
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"><Ban className="size-4" /></button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl border flex items-center justify-center transition-all", isExpanded ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/5 border-white/10 text-zinc-500")}>
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
            <button className="h-11 px-7 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white font-medium text-sm flex items-center gap-2 shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 transition-all">
              <Sparkles className="size-4" />
              Radiate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 4: Dimensional Layers
// Multi-layer glassmorphism with parallax
// ============================================================================
function ComposerDimensional() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative perspective-1000">
      {/* Background layers for depth */}
      <div className="absolute inset-0 translate-z-[-40px] scale-[1.08] rounded-3xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 blur-sm" style={{ transform: 'translateZ(-40px) scale(1.08)' }} />
      <div className="absolute inset-0 translate-z-[-20px] scale-[1.04] rounded-3xl bg-zinc-800/50" style={{ transform: 'translateZ(-20px) scale(1.04)' }} />

      <div className="relative bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Floating settings layer */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent" />
          <div className="relative px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-10 px-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center gap-2 shadow-lg shadow-blue-500/10">
                <Server className="size-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Nano Pro</span>
              </div>

              <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-10 px-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors shadow-lg">
                <AspectRatioShape ratio={aspectRatio} className="text-violet-400" />
                <span className="text-sm text-zinc-300">{aspectRatio}</span>
              </button>

              <div className="h-10 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex items-center p-1 shadow-lg">
                {QUALITY_OPTIONS.map((q) => (
                  <button key={q} onClick={() => setQuality(q)} className={cn("h-8 px-4 rounded-xl text-sm transition-all", quality === q ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300")}>
                    {q}
                  </button>
                ))}
              </div>

              <div className="h-10 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex items-center p-1 gap-0.5 shadow-lg">
                {COUNT_OPTIONS.map((n) => (
                  <button key={n} onClick={() => setCount(n)} className={cn("size-8 rounded-xl text-sm font-mono transition-all", count === n ? "bg-violet-500 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300")}>
                    {n}
                  </button>
                ))}
              </div>

              <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-10 px-4 rounded-2xl border flex items-center gap-2 shadow-lg transition-all", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 backdrop-blur border-white/10")}>
                {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-zinc-400" />}
                <span className={cn("text-sm", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deep input layer */}
        <div className="p-5">
          <motion.div animate={{ height: isExpanded ? 160 : 80 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-zinc-950/50 border border-white/5 p-4 shadow-inner">
            <textarea placeholder="Describe your multi-dimensional vision..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-11 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-lg">
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-11 rounded-2xl backdrop-blur border flex items-center justify-center shadow-lg transition-all", isExpanded ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-zinc-500")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white font-medium flex items-center gap-2 shadow-xl shadow-violet-500/30">
              <Layers className="size-5" />
              Render
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 5: Orb Interface
// Floating orbs as interactive controls
// ============================================================================
function ComposerOrb() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  const orbStyle = "rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer";

  return (
    <div className="relative">
      {/* Ambient orb glows */}
      <div className="absolute top-4 left-8 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-4 right-12 w-24 h-24 bg-sky-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />

      <div className="relative bg-zinc-950/95 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden">
        {/* Orb controls row */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Main API orb */}
            <div className={cn(orbStyle, "size-16 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border-2 border-emerald-500/40 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/30")}>
              <Server className="size-6 text-emerald-400" />
            </div>

            {/* Ratio orb */}
            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className={cn(orbStyle, "size-14 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-500/30 hover:scale-110 hover:shadow-lg hover:shadow-violet-500/30 flex-col gap-0.5")}>
              <AspectRatioShape ratio={aspectRatio} className="text-violet-400" />
              <span className="text-[9px] text-violet-400">{aspectRatio}</span>
            </button>

            {/* Quality orbs */}
            <div className="flex items-center gap-2">
              {QUALITY_OPTIONS.map((q, i) => (
                <button key={q} onClick={() => setQuality(q)} className={cn(orbStyle, "size-12 border-2 hover:scale-110", quality === q ? "bg-gradient-to-br from-sky-500/40 to-blue-500/40 border-sky-500/50 shadow-lg shadow-sky-500/30" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300")}>
                  <span className="text-xs font-mono">{q}</span>
                </button>
              ))}
            </div>

            {/* Count orbs */}
            <div className="flex items-center gap-1">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn(orbStyle, "size-10 border-2 hover:scale-110", count === n ? "bg-gradient-to-br from-pink-500/40 to-rose-500/40 border-pink-500/50 shadow-lg shadow-pink-500/30" : "bg-white/5 border-white/10 text-zinc-500")}>
                  <span className="text-xs font-mono">{n}</span>
                </button>
              ))}
            </div>

            {/* Speed orb */}
            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn(orbStyle, "size-14 border-2 hover:scale-110", speed === 'fast' ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-500/40 shadow-lg shadow-amber-500/30" : "bg-white/5 border-white/10")}>
              {speed === 'fast' ? <Zap className="size-5 text-amber-400" /> : <Clock className="size-5 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* Prompt with rounded organic shape */}
        <div className="px-6 pb-6">
          <motion.div animate={{ height: isExpanded ? 150 : 70 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="rounded-[28px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 p-5">
            <textarea placeholder="Speak your vision into existence..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-3">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className={cn(orbStyle, "size-12 bg-white/5 border-2 border-white/10 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:scale-110")}>
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn(orbStyle, "size-12 border-2 hover:scale-110", isExpanded ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-white/10 text-zinc-500")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className={cn(orbStyle, "h-14 px-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-xl shadow-emerald-500/30 hover:scale-105 gap-2")}>
              <Circle className="size-5" />
              Manifest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 6: Crystalline
// Faceted gem-like surfaces with prismatic colors
// ============================================================================
function ComposerCrystalline() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Prismatic reflections */}
      <div className="absolute -inset-4 bg-gradient-conic from-rose-500/20 via-violet-500/20 via-blue-500/20 via-emerald-500/20 to-rose-500/20 rounded-3xl blur-2xl opacity-50" style={{ background: 'conic-gradient(from 0deg, rgba(244,63,94,0.2), rgba(139,92,246,0.2), rgba(59,130,246,0.2), rgba(16,185,129,0.2), rgba(244,63,94,0.2))' }} />

      <div className="relative bg-zinc-950/90 backdrop-blur-xl rounded-2xl overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}>
        {/* Faceted top edge */}
        <div className="h-1 bg-gradient-to-r from-rose-500 via-violet-500 via-blue-500 to-emerald-500" />

        {/* Crystal settings */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-10 px-4 bg-gradient-to-r from-rose-500/10 via-violet-500/10 to-blue-500/10 border border-white/10 flex items-center gap-2" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
              <Server className="size-4 text-violet-400" />
              <span className="text-sm text-violet-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-10 px-4 bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
              <AspectRatioShape ratio={aspectRatio} className="text-blue-400" />
              <span className="text-sm text-zinc-300">{aspectRatio}</span>
            </button>

            {QUALITY_OPTIONS.map((q, i) => (
              <button key={q} onClick={() => setQuality(q)} className={cn("h-10 px-4 border transition-all", quality === q ? "bg-gradient-to-r from-blue-500/30 to-violet-500/30 border-blue-500/40 text-blue-300" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300")} style={{ clipPath: i === 0 ? 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' : i === 2 ? 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' : undefined }}>
                <span className="text-sm font-mono">{q}</span>
              </button>
            ))}

            <div className="flex items-center">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-10 border-y border-r first:border-l first:rounded-l last:rounded-r transition-all", count === n ? "bg-gradient-to-b from-emerald-500/30 to-teal-500/30 border-emerald-500/40 text-emerald-300" : "bg-white/5 border-white/10 text-zinc-500")}>
                  <span className="text-sm font-mono">{n}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-10 px-4 border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10")} style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
              {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-zinc-400" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="p-5">
          <motion.div animate={{ height: isExpanded ? 140 : 72 }} transition={{ duration: 0.2 }} className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 p-4" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
            <textarea placeholder="Craft your crystalline vision..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-11 bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-violet-400 transition-colors" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-11 border flex items-center justify-center transition-all", isExpanded ? "bg-violet-500/20 border-violet-500/40 text-violet-400" : "bg-white/5 border-white/10 text-zinc-500")} style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 text-white font-medium flex items-center gap-2 shadow-xl" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
              <Sparkles className="size-5" />
              Crystallize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 7: Void Portal
// Deep space aesthetic with portal focus
// ============================================================================
function ComposerVoid() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Void portal effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-gradient-radial from-purple-900/30 via-indigo-950/20 to-transparent blur-3xl" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border border-purple-500/10 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <div className="relative bg-[#030305] rounded-3xl border border-purple-500/10 overflow-hidden">
        {/* Void ring header */}
        <div className="relative h-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent animate-pulse" />
        </div>

        {/* Settings floating in void */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 px-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
              <div className="size-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-sm font-medium text-purple-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-11 px-4 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 hover:border-purple-500/30 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-indigo-400" />
              <span className="text-sm text-zinc-400">{aspectRatio}</span>
            </button>

            <div className="h-11 rounded-full bg-white/5 border border-white/10 flex items-center p-1.5 gap-1">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-8 px-4 rounded-full text-sm transition-all", quality === q ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-11 rounded-full border-2 text-sm font-mono transition-all", count === n ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-zinc-500 hover:border-white/20")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-11 px-5 rounded-full border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-violet-500/10 border-violet-500/30" : "border-white/10")}>
              {speed === 'fast' ? <Zap className="size-4 text-violet-400" /> : <Clock className="size-4 text-zinc-500" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-violet-400" : "text-zinc-500")}>{speed === 'fast' ? 'Warp' : 'Drift'}</span>
            </button>
          </div>
        </div>

        {/* Portal input */}
        <div className="px-6 pb-6">
          <motion.div animate={{ height: isExpanded ? 160 : 80 }} transition={{ duration: 0.3 }} className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-indigo-500/5" />
            <div className="absolute inset-0 border border-purple-500/20 rounded-2xl" />
            <textarea placeholder="What lies beyond the void..." className="relative w-full h-full bg-transparent text-base text-zinc-300 placeholder:text-zinc-700 focus:outline-none resize-none p-4" />
          </motion.div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 hover:text-purple-400 hover:border-purple-500/30 transition-all">
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-12 rounded-full border flex items-center justify-center transition-all", isExpanded ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/10 text-zinc-600")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-13 px-10 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-medium flex items-center gap-3 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-shadow">
              <div className="size-2 rounded-full bg-white animate-pulse" />
              Enter the Void
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 8: Neo Minimal
// Clean warmth with humanized touches
// ============================================================================
function ComposerNeo() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-[#111113] rounded-[24px] p-1">
      <div className="bg-[#18181b] rounded-[20px] overflow-hidden">
        {/* Clean minimal header */}
        <div className="px-6 py-5 border-b border-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />
              <span className="text-sm font-medium text-zinc-300">Nano Pro</span>
            </div>

            <div className="h-5 w-px bg-zinc-800" />

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-zinc-400" />
              <span>{aspectRatio}</span>
            </button>

            <div className="h-5 w-px bg-zinc-800" />

            <div className="flex items-center gap-1">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors", quality === q ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-zinc-800" />

            <div className="flex items-center gap-0.5">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-8 rounded-lg text-sm font-mono transition-colors", count === n ? "bg-orange-500/10 text-orange-400" : "text-zinc-500 hover:text-zinc-300")}>
                  {n}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-zinc-800" />

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className="flex items-center gap-1.5 text-sm">
              {speed === 'fast' ? <Zap className="size-3.5 text-amber-500" /> : <Clock className="size-3.5 text-zinc-500" />}
              <span className={speed === 'fast' ? "text-amber-500" : "text-zinc-500"}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
            </button>
          </div>
        </div>

        {/* Clean input area */}
        <div className="p-6">
          <motion.div animate={{ height: isExpanded ? 140 : 72 }} transition={{ duration: 0.2 }}>
            <textarea placeholder="What would you like to create today?" className="w-full h-full bg-transparent text-[17px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed" />
          </motion.div>

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-800/50">
            <div className="flex items-center gap-3">
              <button className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><ImagePlus className="size-[18px]" /></button>
              <button className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><Library className="size-[18px]" /></button>
              <button className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><Ban className="size-[18px]" /></button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl flex items-center justify-center transition-colors", isExpanded ? "bg-orange-500/10 text-orange-400" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800")}>
                {isExpanded ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
              </button>
            </div>
            <button className="h-11 px-7 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm flex items-center gap-2">
              <Sparkles className="size-4" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 9: Flux Field
// Dynamic gradient mesh with motion
// ============================================================================
function ComposerFlux() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-600/20 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-purple-600/20 to-transparent animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-cyan-600/10 via-transparent to-pink-600/10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      <div className="relative bg-zinc-950/70 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
        {/* Flux bar */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-blue-500 bg-[length:200%_100%] animate-gradient" style={{ animation: 'gradient 3s linear infinite' }} />

        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-10 px-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center gap-2">
              <Server className="size-4 text-blue-400" />
              <span className="text-sm text-blue-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-10 px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-purple-400" />
              <span className="text-sm text-zinc-400">{aspectRatio}</span>
            </button>

            <div className="h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center p-1">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-8 px-4 rounded-xl text-sm transition-all", quality === q ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-10 rounded-xl border text-sm font-mono transition-all", count === n ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30 text-pink-300" : "border-white/10 text-zinc-500 hover:text-zinc-300")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-10 px-4 rounded-2xl border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "border-white/10")}>
              {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-zinc-500" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-amber-400" : "text-zinc-500")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          <motion.div animate={{ height: isExpanded ? 140 : 72 }} transition={{ duration: 0.2 }} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <textarea placeholder="Let your creativity flux..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-blue-400 transition-colors">
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-11 rounded-xl border flex items-center justify-center transition-all", isExpanded ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/10 text-zinc-500")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium flex items-center gap-2 shadow-xl shadow-purple-500/30">
              <Sparkles className="size-5" />
              Flux It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 10: Ethereal Mist
// Soft atmospheric layers with depth
// ============================================================================
function ComposerEthereal() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Ethereal mist layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-slate-900/30 to-slate-950/50 rounded-3xl blur-xl" />
      <div className="absolute inset-4 bg-gradient-to-t from-slate-700/20 via-transparent to-slate-600/10 rounded-2xl blur-2xl" />

      <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-3xl border border-slate-700/30 overflow-hidden">
        {/* Soft mist top */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 px-5 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center gap-2">
              <Server className="size-4 text-slate-400" />
              <span className="text-sm text-slate-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-11 px-4 rounded-2xl bg-slate-800/30 border border-slate-700/20 flex items-center gap-2 hover:bg-slate-800/50 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-slate-400" />
              <span className="text-sm text-slate-400">{aspectRatio}</span>
            </button>

            <div className="h-11 rounded-2xl bg-slate-800/30 border border-slate-700/20 flex items-center p-1.5">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-8 px-4 rounded-xl text-sm transition-all", quality === q ? "bg-slate-700/70 text-slate-200 shadow-inner" : "text-slate-500 hover:text-slate-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-11 rounded-xl border text-sm font-mono transition-all", count === n ? "bg-slate-700/50 border-slate-600/50 text-slate-200" : "border-slate-700/30 text-slate-500 hover:text-slate-300")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-11 px-5 rounded-2xl border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-800/30 border-slate-700/20")}>
              {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-slate-500" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-amber-400" : "text-slate-500")}>{speed === 'fast' ? 'Swift' : 'Gentle'}</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <motion.div animate={{ height: isExpanded ? 150 : 80 }} transition={{ duration: 0.3 }} className="rounded-2xl bg-slate-800/20 border border-slate-700/20 p-5 shadow-inner">
            <textarea placeholder="Whisper your vision into the mist..." className="w-full h-full bg-transparent text-base text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-12 rounded-xl bg-slate-800/30 border border-slate-700/20 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-12 rounded-xl border flex items-center justify-center transition-all", isExpanded ? "bg-slate-700/50 border-slate-600/50 text-slate-300" : "bg-slate-800/30 border-slate-700/20 text-slate-500")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-slate-100 font-medium flex items-center gap-2 shadow-lg shadow-slate-900/50 hover:from-slate-500 hover:to-slate-600 transition-all">
              <Sparkles className="size-5" />
              Materialize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 11: Prism Split
// Light refraction with chromatic accents
// ============================================================================
function ComposerPrism() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Chromatic aberration effect */}
      <div className="absolute -inset-1 rounded-3xl bg-zinc-900 transform translate-x-1 opacity-50" style={{ filter: 'hue-rotate(60deg)' }} />
      <div className="absolute -inset-1 rounded-3xl bg-zinc-900 transform -translate-x-1 opacity-50" style={{ filter: 'hue-rotate(-60deg)' }} />

      <div className="relative bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden">
        {/* RGB split line */}
        <div className="flex h-1">
          <div className="flex-1 bg-red-500" />
          <div className="flex-1 bg-green-500" />
          <div className="flex-1 bg-blue-500" />
        </div>

        <div className="px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <Server className="size-4 text-white" />
              <span className="text-sm text-zinc-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 hover:border-zinc-700 transition-colors">
              <AspectRatioShape ratio={aspectRatio} className="text-cyan-400" />
              <span className="text-sm text-zinc-400">{aspectRatio}</span>
            </button>

            <div className="flex items-center">
              {QUALITY_OPTIONS.map((q, i) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-10 px-4 border-y border-r first:border-l first:rounded-l-xl last:rounded-r-xl text-sm transition-all", quality === q ? `text-white ${i === 0 ? 'bg-red-500/20 border-red-500/30' : i === 1 ? 'bg-green-500/20 border-green-500/30' : 'bg-blue-500/20 border-blue-500/30'}` : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300")}>
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {COUNT_OPTIONS.map((n, i) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-10 rounded-xl border text-sm font-mono transition-all", count === n ? `text-white ${i % 3 === 0 ? 'bg-red-500/20 border-red-500/30' : i % 3 === 1 ? 'bg-green-500/20 border-green-500/30' : 'bg-blue-500/20 border-blue-500/30'}` : "border-zinc-800 text-zinc-500")}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-10 px-4 rounded-xl border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-900 border-zinc-800")}>
              {speed === 'fast' ? <Zap className="size-4 text-yellow-400" /> : <Clock className="size-4 text-zinc-500" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-yellow-400" : "text-zinc-500")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          <motion.div animate={{ height: isExpanded ? 140 : 72 }} transition={{ duration: 0.2 }} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <textarea placeholder="Refract your imagination..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className={cn("size-11 rounded-xl bg-zinc-900 border flex items-center justify-center transition-all hover:text-white", i === 0 ? "border-red-500/20 text-red-400/50 hover:border-red-500/40" : i === 1 ? "border-green-500/20 text-green-400/50 hover:border-green-500/40" : "border-blue-500/20 text-blue-400/50 hover:border-blue-500/40")}>
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-11 rounded-xl border flex items-center justify-center transition-all", isExpanded ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-zinc-900 border-zinc-800 text-zinc-500")}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-12 px-8 rounded-xl bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white font-medium flex items-center gap-2 shadow-xl">
              <Sparkles className="size-5" />
              Refract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 12: Organic Flow
// Biomorphic shapes with natural curves
// ============================================================================
function ComposerOrganic() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Organic blob shapes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="organic-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
          </linearGradient>
          <linearGradient id="organic-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.1)" />
            <stop offset="100%" stopColor="rgba(110, 231, 183, 0.05)" />
          </linearGradient>
        </defs>
        <path d="M-50,150 Q100,50 200,150 T450,150" fill="url(#organic-grad-1)" className="animate-pulse" style={{ animationDuration: '5s' }} />
        <path d="M-50,200 Q150,100 250,200 T450,200" fill="url(#organic-grad-2)" className="animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </svg>

      <div className="relative bg-zinc-950/95 backdrop-blur-xl overflow-hidden" style={{ borderRadius: '40px 40px 32px 32px' }}>
        {/* Organic wave header */}
        <div className="h-2 bg-gradient-to-r from-emerald-500/30 via-teal-500/50 to-green-500/30" style={{ borderRadius: '40px 40px 0 0' }} />

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-12 px-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center gap-2" style={{ borderRadius: '24px' }}>
              <Server className="size-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Nano Pro</span>
            </div>

            <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-12 px-5 bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors" style={{ borderRadius: '24px' }}>
              <AspectRatioShape ratio={aspectRatio} className="text-green-400" />
              <span className="text-sm text-zinc-300">{aspectRatio}</span>
            </button>

            <div className="h-12 bg-white/5 border border-white/10 flex items-center p-1.5 gap-1" style={{ borderRadius: '24px' }}>
              {QUALITY_OPTIONS.map((q) => (
                <button key={q} onClick={() => setQuality(q)} className={cn("h-9 px-5 text-sm transition-all", quality === q ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "text-zinc-500 hover:text-zinc-300")} style={{ borderRadius: '18px' }}>
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} className={cn("size-12 border text-sm font-mono transition-all", count === n ? "bg-green-500/20 border-green-500/30 text-green-300" : "border-white/10 text-zinc-500 hover:text-zinc-300")} style={{ borderRadius: '16px' }}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("h-12 px-5 border flex items-center gap-2 transition-all", speed === 'fast' ? "bg-lime-500/10 border-lime-500/30" : "border-white/10")} style={{ borderRadius: '24px' }}>
              {speed === 'fast' ? <Zap className="size-4 text-lime-400" /> : <Clock className="size-4 text-zinc-500" />}
              <span className={cn("text-sm", speed === 'fast' ? "text-lime-400" : "text-zinc-500")}>{speed === 'fast' ? 'Rapid' : 'Calm'}</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <motion.div animate={{ height: isExpanded ? 150 : 80 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="bg-white/[0.02] border border-white/5 p-5" style={{ borderRadius: '28px' }}>
            <textarea placeholder="Let nature inspire your creation..." className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-3">
              {[ImagePlus, Library, Ban].map((Icon, i) => (
                <button key={i} className="size-13 bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors" style={{ borderRadius: '20px', width: '52px', height: '52px' }}>
                  <Icon className="size-5" />
                </button>
              ))}
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("flex items-center justify-center transition-all", isExpanded ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-white/10 text-zinc-500")} style={{ borderRadius: '20px', width: '52px', height: '52px', borderWidth: '1px', borderStyle: 'solid' }}>
                {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
            <button className="h-14 px-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white font-medium flex items-center gap-2 shadow-xl shadow-emerald-500/30" style={{ borderRadius: '28px' }}>
              <Sparkles className="size-5" />
              Bloom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
