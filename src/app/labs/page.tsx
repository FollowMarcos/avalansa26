'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles, ThumbsUp, ThumbsDown, MessageSquare, X, Send, Zap, Clock,
  Settings, ImagePlus, Ban, ChevronDown, Maximize2, Minimize2,
  Layers, Library, Server, Command, Terminal, Palette, Wand2, Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { voteMockup, getUserMockupVotes, removeVote, getAllMockupVoteStats, type MockupVoteStats } from '@/utils/supabase/mockup-votes.server';
import type { VoteType } from '@/types/mockup-vote';

// Aspect ratio options matching the real composer
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'] as const;
const QUALITY_OPTIONS = ['1K', '2K', '4K'] as const;
const COUNT_OPTIONS = [1, 2, 3, 4] as const;

// Visual aspect ratio shape component
function AspectRatioShape({ ratio, className }: { ratio: string; className?: string }) {
  const getShapeDimensions = (r: string): { width: number; height: number } => {
    const [w, h] = r.split(':').map(Number);
    const maxSize = 12;
    if (w > h) return { width: maxSize, height: Math.round((h / w) * maxSize) };
    else if (h > w) return { width: Math.round((w / h) * maxSize), height: maxSize };
    return { width: maxSize, height: maxSize };
  };
  const { width, height } = getShapeDimensions(ratio);
  return (
    <div
      className={cn("border-2 border-current rounded-[1px]", className)}
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
    // Refresh stats
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
    // Refresh stats
    const stats = await getAllMockupVoteStats();
    setVoteStats(stats);
  };

  const mockups = [
    { id: 'composer-v1-glass', title: 'Glass Morphism', description: 'Frosted glass with gradient accents', component: ComposerGlass },
    { id: 'composer-v2-command', title: 'Command Palette', description: 'Spotlight-style with ⌘K shortcut', component: ComposerCommand },
    { id: 'composer-v3-minimal', title: 'Minimal Dark', description: 'Clean dark surface with subtle borders', component: ComposerMinimal },
    { id: 'composer-v4-neon', title: 'Neon Glow', description: 'Subtle glow effects with vibrant accents', component: ComposerNeon },
    { id: 'composer-v5-layered', title: 'Layered Cards', description: 'Stacked card aesthetic with depth', component: ComposerLayered },
    { id: 'composer-v6-terminal', title: 'Terminal Style', description: 'Developer-focused monospace design', component: ComposerTerminal },
    { id: 'composer-v7-floating', title: 'Floating Island', description: 'Elevated with prominent shadow', component: ComposerFloating },
    { id: 'composer-v8-gradient', title: 'Gradient Border', description: 'Animated gradient border accent', component: ComposerGradient },
    { id: 'composer-v9-brutalist', title: 'Brutalist', description: 'Bold borders and raw aesthetic', component: ComposerBrutalist },
    { id: 'composer-v10-aurora', title: 'Aurora', description: 'Animated aurora borealis gradient', component: ComposerAurora },
    { id: 'composer-v11-retro', title: 'Retro CRT', description: 'Vintage CRT monitor aesthetic', component: ComposerRetro },
    { id: 'composer-v12-neumorphic', title: 'Neumorphic', description: 'Soft shadows and pressed elements', component: ComposerNeumorphic },
  ];

  return (
    <PageShell contentClassName="flex flex-col antialiased selection:bg-primary/20 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 bg-background/50 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium tracking-wide">AVALANSA <span className="opacity-50 font-normal">LABS</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-48 px-8 relative z-10 w-full max-w-5xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h1 className="text-3xl font-light tracking-tight mb-2">Composer Island Designs</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">
            Vote on your favorite prompt composer style
          </p>
        </motion.header>

        {/* Mockups - 1 per row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col gap-12"
        >
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
                {/* Header with title and voting */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div>
                    <h2 className="text-base font-medium">{mockup.title}</h2>
                    <p className="text-sm text-muted-foreground/60 mt-0.5">{mockup.description}</p>
                  </div>

                  {/* Voting Buttons with Counters */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(mockup.id, 'like')}
                        aria-label={`Like ${mockup.title}`}
                        aria-pressed={vote?.type === 'like'}
                        className={cn(
                          "size-9 rounded-lg transition-colors",
                          vote?.type === 'like' && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        )}
                      >
                        <ThumbsUp className="size-4" aria-hidden="true" />
                      </Button>
                      {(stats?.likes ?? 0) > 0 && (
                        <span className="text-xs font-mono text-green-500 min-w-[1.25rem]">{stats?.likes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(mockup.id, 'dislike')}
                        aria-label={`Dislike ${mockup.title}`}
                        aria-pressed={vote?.type === 'dislike'}
                        className={cn(
                          "size-9 rounded-lg transition-colors",
                          vote?.type === 'dislike' && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        )}
                      >
                        <ThumbsDown className="size-4" aria-hidden="true" />
                      </Button>
                      {(stats?.dislikes ?? 0) > 0 && (
                        <span className="text-xs font-mono text-red-500 min-w-[1.25rem]">{stats?.dislikes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFeedbackOpen(feedbackOpen === mockup.id ? null : mockup.id);
                          setFeedbackText(vote?.feedback || '');
                        }}
                        aria-label={`Add feedback for ${mockup.title}`}
                        aria-expanded={feedbackOpen === mockup.id}
                        className={cn(
                          "size-9 rounded-lg transition-colors",
                          vote?.feedback && "bg-blue-500/10 text-blue-500"
                        )}
                      >
                        <MessageSquare className="size-4" aria-hidden="true" />
                      </Button>
                      {feedbackList.length > 0 && (
                        <button
                          onClick={() => setShowAllFeedback(showAllFeedback === mockup.id ? null : mockup.id)}
                          className="text-xs font-mono text-blue-500 hover:text-blue-400 transition-colors"
                          aria-label={`View ${feedbackList.length} feedback comments`}
                        >
                          {feedbackList.length}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Input */}
                <AnimatePresence>
                  {feedbackOpen === mockup.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-white/5"
                    >
                      <div className="flex items-center gap-2 px-6 py-3 bg-muted/20">
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Share your thoughts…"
                          aria-label={`Feedback for ${mockup.title}`}
                          className="flex-1 bg-muted/30 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFeedback(mockup.id);
                          }}
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleFeedback(mockup.id)} aria-label="Submit feedback" className="size-9 rounded-lg">
                          <Send className="size-4" aria-hidden="true" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setFeedbackOpen(null)} aria-label="Close feedback" className="size-9 rounded-lg">
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                      {vote?.feedback && (
                        <p className="text-xs text-muted-foreground px-6 pb-3">Your feedback: "{vote.feedback}"</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* All Feedback Display */}
                <AnimatePresence>
                  {showAllFeedback === mockup.id && feedbackList.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-white/5"
                    >
                      <div className="px-6 py-4 bg-blue-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-blue-400">Feedback ({feedbackList.length})</h3>
                          <Button size="icon" variant="ghost" onClick={() => setShowAllFeedback(null)} aria-label="Close feedback list" className="size-7 rounded-lg">
                            <X className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {feedbackList.map((fb, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                              <MessageSquare className="size-4 text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-300">{fb.feedback}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(fb.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview Area - Canvas-like background */}
                <div className="relative min-h-[320px] bg-muted/30 flex items-end justify-center p-8">
                  {/* Grain texture overlay like the real canvas */}
                  <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.02]" aria-hidden="true" />

                  <div className="relative w-full max-w-3xl">
                    <MockupComponent />
                  </div>
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
// MOCKUP 1: Glass Morphism
// Frosted glass with gradient blobs and floating chips
// ============================================================================
function ComposerGlass() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Gradient blobs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Floating settings chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" aria-label="Select API">
            <Server className="size-3 text-zinc-400" aria-hidden="true" />
            <span className="text-xs font-mono text-zinc-300">Nano Pro</span>
            <ChevronDown className="size-3 text-zinc-500" aria-hidden="true" />
          </button>

          <button
            onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label={`Aspect ratio ${aspectRatio}`}
          >
            <AspectRatioShape ratio={aspectRatio} className="text-violet-400" />
            <span className="text-xs font-mono text-zinc-300">{aspectRatio}</span>
          </button>

          <div className="flex items-center h-7 p-0.5 bg-white/5 rounded-full border border-white/10" role="radiogroup" aria-label="Quality">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                role="radio"
                aria-checked={quality === q}
                className={cn(
                  "h-6 px-2.5 rounded-full text-xs font-mono transition-all",
                  quality === q ? "bg-white/20 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Count">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                role="radio"
                aria-checked={count === n}
                className={cn(
                  "size-7 rounded-full text-xs font-mono transition-all",
                  count === n ? "bg-white/20 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors",
              speed === 'fast'
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
            aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}
          >
            {speed === 'fast' ? <Zap className="size-3 text-amber-400" aria-hidden="true" /> : <Clock className="size-3 text-zinc-400" aria-hidden="true" />}
            <span className={cn("text-xs font-mono", speed === 'fast' ? "text-amber-300" : "text-zinc-300")}>{speed === 'fast' ? 'Turbo' : 'Batch'}</span>
          </button>

          <button
            onClick={() => setShowNegative(!showNegative)}
            className={cn("size-7 rounded-full flex items-center justify-center border transition-colors", showNegative ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10")}
            aria-label="Toggle negative prompt"
            aria-expanded={showNegative}
          >
            <Ban className="size-3 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Negative Prompt */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="size-3.5 text-zinc-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-500 font-mono">Negative</span>
                </div>
                <input type="text" placeholder="blurry, low quality, distorted…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-4">
          <motion.div animate={{ height: isExpanded ? 200 : 60 }} transition={{ duration: 0.2 }}>
            <textarea placeholder="Imagine something beautiful…" aria-label="Image prompt" className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors" aria-label="Add reference images">
                <ImagePlus className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors" aria-label="Saved library">
                <Library className="size-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn("size-10 rounded-xl border flex items-center justify-center transition-colors", isExpanded ? "bg-white/10 border-white/20 text-zinc-300" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300 hover:bg-white/10")}
                aria-label={isExpanded ? "Collapse prompt" : "Expand prompt"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm shadow-lg shadow-violet-500/25 flex items-center gap-2 hover:shadow-violet-500/40 transition-shadow" aria-label="Generate image">
              <Sparkles className="size-4" aria-hidden="true" />
              Dream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 2: Command Palette
// Spotlight-style with ⌘K shortcut and keyboard-first design
// ============================================================================
function ComposerCommand() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Search-like header */}
      <motion.div animate={{ height: isExpanded ? 120 : 56 }} transition={{ duration: 0.2 }} className="flex items-start gap-3 px-4 py-4 border-b border-white/5">
        <Command className="size-5 text-violet-400 mt-0.5" aria-hidden="true" />
        {isExpanded ? (
          <textarea placeholder="What do you want to create?" aria-label="Image prompt" className="flex-1 bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none h-full" />
        ) : (
          <input type="text" placeholder="What do you want to create?" aria-label="Image prompt" className="flex-1 bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
        )}
        <button onClick={() => setIsExpanded(!isExpanded)} className="size-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors" aria-label={isExpanded ? "Collapse" : "Expand"}>
          {isExpanded ? <Minimize2 className="size-4 text-zinc-400" /> : <Maximize2 className="size-4 text-zinc-400" />}
        </button>
        <kbd className="px-2 py-1 text-[10px] font-mono bg-zinc-800 rounded border border-zinc-700 text-zinc-400">⌘K</kbd>
      </motion.div>

      {/* Settings bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-white/5 overflow-x-auto">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs" aria-label="API: Nano Pro">
          <Server className="size-3 text-zinc-400" aria-hidden="true" />
          <span className="font-mono text-zinc-300">Nano Pro</span>
        </button>

        <button
          onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs"
          aria-label={`Aspect ratio ${aspectRatio}`}
        >
          <AspectRatioShape ratio={aspectRatio} className="text-zinc-400" />
          <span className="font-mono text-zinc-300">{aspectRatio}</span>
        </button>

        {QUALITY_OPTIONS.map((q) => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            className={cn("px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors", quality === q ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}
            aria-label={`Quality ${q}`}
          >
            {q}
          </button>
        ))}

        <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Count">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              role="radio"
              aria-checked={count === n}
              className={cn("size-7 rounded-lg text-xs font-mono transition-colors", count === n ? "bg-white text-zinc-900" : "text-zinc-500 hover:bg-zinc-800")}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')}
          className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors", speed === 'fast' ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}
          aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}
        >
          {speed === 'fast' ? <Zap className="size-3" aria-hidden="true" /> : <Clock className="size-3" aria-hidden="true" />}
          <span className="font-mono">{speed === 'fast' ? 'Fast' : 'Batch'}</span>
        </button>

        <button
          onClick={() => setShowNegative(!showNegative)}
          className={cn("size-7 rounded-lg flex items-center justify-center transition-colors", showNegative ? "bg-zinc-700" : "hover:bg-zinc-800")}
          aria-label="Toggle negative prompt"
          aria-expanded={showNegative}
        >
          <Ban className="size-3 text-zinc-400" aria-hidden="true" />
        </button>

        <div className="flex-1" />

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs" aria-label="Add images">
          <ImagePlus className="size-3 text-zinc-400" aria-hidden="true" />
          <span className="text-zinc-300">Images</span>
        </button>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs" aria-label="Library">
          <Library className="size-3 text-zinc-400" aria-hidden="true" />
          <span className="text-zinc-300">Library</span>
        </button>
      </div>

      {/* Negative Prompt */}
      <AnimatePresence>
        {showNegative && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/30 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Ban className="size-3.5 text-zinc-500" aria-hidden="true" />
                <input type="text" placeholder="Exclude: blurry, distorted, low quality…" aria-label="Negative prompt" className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex items-center justify-end px-4 py-3">
        <button className="px-5 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors flex items-center gap-2" aria-label="Create image">
          <Sparkles className="size-4" aria-hidden="true" />
          Create
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 3: Minimal Dark
// Clean dark surface with subtle borders
// ============================================================================
function ComposerMinimal() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Compact settings row */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto">
        <button className="h-8 px-3 rounded-lg bg-zinc-800/50 text-xs font-mono text-zinc-400 flex items-center gap-2 hover:bg-zinc-800 transition-colors" aria-label="Select API">
          <Server className="size-3" aria-hidden="true" />
          <span>Nano</span>
        </button>

        <div className="w-px h-5 bg-zinc-800 mx-1" aria-hidden="true" />

        <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="h-8 px-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800/50 transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
          <AspectRatioShape ratio={aspectRatio} className="text-zinc-500" />
          <span className="font-mono text-xs text-zinc-400">{aspectRatio}</span>
        </button>

        <div className="flex items-center h-8 p-0.5 bg-zinc-800/50 rounded-lg" role="radiogroup" aria-label="Quality">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              role="radio"
              aria-checked={quality === q}
              className={cn("h-7 px-2.5 rounded-md font-mono text-xs transition-all", quality === q ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center h-8 gap-0.5" role="radiogroup" aria-label="Count">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              role="radio"
              aria-checked={count === n}
              className={cn("size-7 rounded-md font-mono text-xs transition-all flex items-center justify-center", count === n ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50")}
            >
              {n}
            </button>
          ))}
        </div>

        <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className="h-8 px-2.5 gap-1.5 rounded-lg font-mono text-xs flex items-center hover:bg-zinc-800/50 transition-colors" aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
          {speed === 'fast' ? <Zap className="size-3 text-amber-500" aria-hidden="true" /> : <Clock className="size-3 text-zinc-400" aria-hidden="true" />}
          <span className={speed === 'fast' ? "text-amber-400" : "text-zinc-400"}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
        </button>

        <button onClick={() => setShowNegative(!showNegative)} className={cn("size-8 rounded-lg flex items-center justify-center transition-colors", showNegative && "bg-zinc-800")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
          <Ban className="size-3 text-zinc-500" aria-hidden="true" />
        </button>

        <div className="flex-1" />

        <button className="h-8 px-4 rounded-lg font-medium text-sm gap-1.5 bg-zinc-200 text-zinc-900 hover:bg-white flex items-center transition-colors" aria-label="Generate image">
          <Sparkles className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          <span>Generate</span>
        </button>
      </div>

      {/* Negative Prompt */}
      <AnimatePresence>
        {showNegative && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800">
              <input type="text" placeholder="Negative: blurry, low quality…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <div className="flex items-end gap-3 p-3">
        <button className="size-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0" aria-label="Add reference images">
          <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button className="size-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0" aria-label="Saved library">
          <Library className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0", isExpanded ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800")} aria-label={isExpanded ? "Collapse prompt" : "Expand prompt"}>
          {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
        <motion.div animate={{ height: isExpanded ? 120 : 44 }} transition={{ duration: 0.2 }} className="flex-1">
          <textarea placeholder="Describe the image you want to create…" aria-label="Image prompt" className="w-full h-full bg-transparent text-base text-zinc-200 resize-none focus:outline-none placeholder:text-zinc-600 py-2" />
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 4: Neon Glow
// Subtle glow effects with vibrant accents
// ============================================================================
function ComposerNeon() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-pink-500/10 rounded-2xl blur-xl" aria-hidden="true" />

      <div className="relative bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/5 overflow-hidden">
        {/* Settings row with neon accents */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 transition-colors" aria-label="Select API">
            <Server className="size-3 text-cyan-400" aria-hidden="true" />
            <span className="text-xs font-mono text-zinc-300">Nano Pro</span>
          </button>

          <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
            <AspectRatioShape ratio={aspectRatio} className="text-cyan-400" />
            <span className="text-xs font-mono text-zinc-300">{aspectRatio}</span>
          </button>

          <div className="flex items-center gap-0.5 p-0.5 bg-zinc-900 rounded-lg border border-zinc-800" role="radiogroup" aria-label="Quality">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                role="radio"
                aria-checked={quality === q}
                className={cn("px-2.5 py-1 rounded-md text-xs font-mono transition-all", quality === q ? "bg-cyan-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300")}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Count">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                role="radio"
                aria-checked={count === n}
                className={cn("size-7 rounded-lg text-xs font-mono transition-all", count === n ? "bg-pink-500 text-white" : "text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-pink-500/30")}
              >
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-900 border-zinc-800 hover:border-amber-500/30")} aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
            {speed === 'fast' ? <Zap className="size-3 text-amber-400" aria-hidden="true" /> : <Clock className="size-3 text-zinc-400" aria-hidden="true" />}
            <span className={cn("text-xs font-mono", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
          </button>

          <button onClick={() => setShowNegative(!showNegative)} className={cn("size-7 rounded-lg flex items-center justify-center border transition-colors", showNegative ? "bg-zinc-800 border-zinc-700" : "border-zinc-800 hover:border-zinc-700")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
            <Ban className="size-3 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Negative Prompt */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 bg-zinc-900/50 border-b border-white/5">
                <input type="text" placeholder="Negative: blurry, distorted…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-4">
          <textarea placeholder="Describe your vision…" aria-label="Image prompt" className="w-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none min-h-[60px]" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors" aria-label="Add reference images">
                <ImagePlus className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors" aria-label="Saved library">
                <Library className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2" aria-label="Generate image">
              <Sparkles className="size-4" aria-hidden="true" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 5: Layered Cards
// Stacked card aesthetic with depth
// ============================================================================
function ComposerLayered() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);

  return (
    <div className="relative">
      {/* Background layers for depth */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-zinc-800/50 rounded-2xl" aria-hidden="true" />
      <div className="absolute inset-0 translate-x-1 translate-y-1 bg-zinc-800/70 rounded-2xl" aria-hidden="true" />

      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl overflow-hidden">
        {/* Settings as stacked chips */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700">
            <Server className="size-3.5 text-zinc-400" aria-hidden="true" />
            <span className="text-xs font-mono text-zinc-300">Nano Pro</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} role="button" aria-label={`Aspect ratio ${aspectRatio}`}>
            <AspectRatioShape ratio={aspectRatio} className="text-zinc-400" />
            <span className="text-xs font-mono text-zinc-300">{aspectRatio}</span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-zinc-800 border border-zinc-700" role="radiogroup" aria-label="Quality">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                role="radio"
                aria-checked={quality === q}
                className={cn("px-3 py-1 rounded-lg text-xs font-mono transition-all", quality === q ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1" role="radiogroup" aria-label="Count">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                role="radio"
                aria-checked={count === n}
                className={cn("size-8 rounded-lg text-xs font-mono transition-all border", count === n ? "bg-white text-zinc-900 border-white" : "text-zinc-500 border-zinc-700 hover:border-zinc-600")}
              >
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-800 border-zinc-700")} aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
            {speed === 'fast' ? <Zap className="size-3.5 text-amber-400" aria-hidden="true" /> : <Clock className="size-3.5 text-zinc-400" aria-hidden="true" />}
            <span className={cn("text-xs font-mono", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
          </button>

          <button onClick={() => setShowNegative(!showNegative)} className={cn("size-8 rounded-lg flex items-center justify-center border transition-colors", showNegative ? "bg-zinc-700 border-zinc-600" : "border-zinc-700 hover:border-zinc-600")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
            <Ban className="size-3.5 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Negative Prompt */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
                <input type="text" placeholder="Exclude: blurry, low quality…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4">
          <textarea placeholder="Describe what you'd like to create…" aria-label="Image prompt" className="w-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none min-h-[60px]" />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors" aria-label="Add reference images">
                <ImagePlus className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors" aria-label="Saved library">
                <Library className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-white text-zinc-900 font-medium text-sm shadow-lg flex items-center gap-2 hover:bg-zinc-100 transition-colors" aria-label="Generate image">
              <Sparkles className="size-4" aria-hidden="true" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 6: Terminal Style
// Developer-focused monospace design
// ============================================================================
function ComposerTerminal() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden font-mono">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-red-500/80" aria-hidden="true" />
          <div className="size-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <div className="size-3 rounded-full bg-green-500/80" aria-hidden="true" />
        </div>
        <span className="text-xs text-zinc-500 ml-2">avalansa — generate</span>
      </div>

      {/* Config section */}
      <div className="px-4 py-3 text-xs border-b border-zinc-800 space-y-1.5">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="text-green-400">$</span>
          <span>config</span>
          <button className="text-cyan-400 hover:underline" aria-label="API: Nano Pro">--api=nano-pro</button>
          <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="text-yellow-400 hover:underline" aria-label={`Aspect ratio ${aspectRatio}`}>--ratio={aspectRatio}</button>
          <button onClick={() => setQuality(quality === '2K' ? '4K' : '2K')} className="text-pink-400 hover:underline" aria-label={`Quality ${quality}`}>--quality={quality.toLowerCase()}</button>
          <button onClick={() => setCount(count >= 4 ? 1 : count + 1)} className="text-purple-400 hover:underline" aria-label={`Count ${count}`}>--count={count}</button>
          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("hover:underline", speed === 'fast' ? "text-amber-400" : "text-zinc-400")} aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>--{speed}</button>
        </div>

        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 text-zinc-500">
                <span className="text-green-400">$</span>
                <span>exclude</span>
                <input type="text" placeholder="blurry, low quality" aria-label="Negative prompt" className="flex-1 bg-transparent text-red-400 placeholder:text-zinc-700 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt input */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="text-green-400 text-sm mt-0.5">❯</span>
          <textarea placeholder="describe your image..." aria-label="Image prompt" className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none min-h-[60px]" />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200 transition-colors flex items-center gap-1.5" aria-label="Add reference images">
            <ImagePlus className="size-3" aria-hidden="true" />
            refs
          </button>
          <button className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200 transition-colors flex items-center gap-1.5" aria-label="Library">
            <Library className="size-3" aria-hidden="true" />
            lib
          </button>
          <button onClick={() => setShowNegative(!showNegative)} className={cn("px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5", showNegative ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
            <Ban className="size-3" aria-hidden="true" />
            neg
          </button>
        </div>
        <button className="px-4 py-2 rounded-md bg-green-500 text-zinc-950 text-xs font-medium hover:bg-green-400 transition-colors flex items-center gap-1.5" aria-label="Run generation">
          <Sparkles className="size-3" aria-hidden="true" />
          run
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 7: Floating Island
// Elevated with prominent shadow
// ============================================================================
function ComposerFloating() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <div className="relative">
      {/* Shadow layers */}
      <div className="absolute inset-0 translate-y-4 bg-black/40 rounded-3xl blur-2xl" aria-hidden="true" />
      <div className="absolute inset-0 translate-y-2 bg-black/20 rounded-3xl blur-xl" aria-hidden="true" />

      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        {/* Settings drawer */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 bg-zinc-800/30 border-b border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">API</span>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors" aria-label="Select API">
                      <Server className="size-4 text-zinc-400" aria-hidden="true" />
                      <span className="font-mono text-zinc-300">Nano Pro</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ratio</span>
                    <div className="flex items-center gap-1">
                      {['1:1', '16:9', '9:16'].map((r) => (
                        <button key={r} onClick={() => setAspectRatio(r)} className={cn("px-2.5 py-2 rounded-xl text-xs font-mono transition-colors", r === aspectRatio ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")} aria-label={`Aspect ratio ${r}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Quality</span>
                    <div className="flex items-center gap-1">
                      {QUALITY_OPTIONS.map((q) => (
                        <button key={q} onClick={() => setQuality(q)} className={cn("px-2.5 py-2 rounded-xl text-xs font-mono transition-colors", quality === q ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")} aria-label={`Quality ${q}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Speed</span>
                    <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-sm transition-colors" aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
                      {speed === 'fast' ? <Zap className="size-4 text-amber-400" aria-hidden="true" /> : <Clock className="size-4 text-zinc-400" aria-hidden="true" />}
                      <span className={cn("font-mono", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
                    </button>
                  </div>
                </div>

                {/* Count, negative, and references in second row */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Count</span>
                    <div className="flex items-center gap-1" role="radiogroup" aria-label="Count">
                      {COUNT_OPTIONS.map((n) => (
                        <button key={n} onClick={() => setCount(n)} role="radio" aria-checked={count === n} className={cn("size-8 rounded-lg text-xs font-mono transition-colors", count === n ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowNegative(!showNegative)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors mt-auto", showNegative ? "bg-zinc-700" : "bg-zinc-800 hover:bg-zinc-700")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
                    <Ban className="size-4 text-zinc-400" aria-hidden="true" />
                    <span className="text-zinc-400 font-mono">Negative</span>
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors" aria-label="Add reference images">
                      <ImagePlus className="size-4 text-zinc-400" aria-hidden="true" />
                      <span className="text-zinc-400 font-mono">References</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors" aria-label="Open library">
                      <Library className="size-4 text-zinc-400" aria-hidden="true" />
                      <span className="text-zinc-400 font-mono">Library</span>
                    </button>
                  </div>
                </div>

                {showNegative && (
                  <div className="mt-4">
                    <input type="text" placeholder="blurry, low quality, distorted…" aria-label="Negative prompt" className="w-full px-3 py-2 rounded-xl bg-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input - clean layout with full-width prompt */}
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => setShowSettings(!showSettings)} className={cn("size-12 rounded-2xl flex items-center justify-center transition-colors shrink-0", showSettings ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")} aria-label="Toggle settings" aria-expanded={showSettings}>
            <Settings className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <input type="text" placeholder="What would you like to create?" aria-label="Image prompt" className="flex-1 min-w-0 bg-transparent text-base text-zinc-200 placeholder:text-zinc-500 focus:outline-none" />

          <button className="size-12 rounded-2xl bg-white text-zinc-900 flex items-center justify-center hover:bg-zinc-100 transition-colors shrink-0" aria-label="Generate image">
            <Sparkles className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 8: Gradient Border
// Animated gradient border accent
// ============================================================================
function ComposerGradient() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500">
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 blur-lg opacity-30" aria-hidden="true" />

      <div className="relative bg-zinc-950 rounded-2xl overflow-hidden">
        {/* Settings row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors" aria-label="Select API">
            <Server className="size-3 text-zinc-400" aria-hidden="true" />
            <span className="text-xs font-mono text-zinc-300">Nano Pro</span>
          </button>

          <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
            <AspectRatioShape ratio={aspectRatio} className="text-violet-400" />
            <span className="text-xs font-mono text-zinc-300">{aspectRatio}</span>
          </button>

          <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-zinc-800" role="radiogroup" aria-label="Quality">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                role="radio"
                aria-checked={quality === q}
                className={cn("px-2.5 py-1 rounded-md text-xs font-mono transition-all", quality === q ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Count">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                role="radio"
                aria-checked={count === n}
                className={cn("size-7 rounded-lg text-xs font-mono transition-all", count === n ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors", speed === 'fast' ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-900 border-zinc-800")} aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
            {speed === 'fast' ? <Zap className="size-3 text-amber-400" aria-hidden="true" /> : <Clock className="size-3 text-zinc-400" aria-hidden="true" />}
            <span className={cn("text-xs font-mono", speed === 'fast' ? "text-amber-400" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
          </button>

          <button onClick={() => setShowNegative(!showNegative)} className={cn("size-7 rounded-lg flex items-center justify-center border transition-colors", showNegative ? "bg-zinc-800 border-zinc-700" : "border-zinc-800 hover:border-zinc-700")} aria-label="Toggle negative prompt" aria-expanded={showNegative}>
            <Ban className="size-3 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Negative Prompt */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                <input type="text" placeholder="Exclude: blurry, distorted…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-4">
          <motion.div animate={{ height: isExpanded ? 160 : 60 }} transition={{ duration: 0.2 }}>
            <textarea placeholder="Describe your creative vision…" aria-label="Image prompt" className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors" aria-label="Add reference images">
                <ImagePlus className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors" aria-label="Library">
                <Library className="size-4" aria-hidden="true" />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl border flex items-center justify-center transition-colors", isExpanded ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300")} aria-label={isExpanded ? "Collapse" : "Expand"}>
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 text-white font-medium text-sm shadow-lg shadow-pink-500/20 flex items-center gap-2 hover:shadow-pink-500/30 transition-shadow" aria-label="Generate image">
              <Sparkles className="size-4" aria-hidden="true" />
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 9: Brutalist
// Bold borders and raw aesthetic
// ============================================================================
function ComposerBrutalist() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-black border-4 border-white rounded-none shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
      {/* Bold header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-4 border-white bg-white text-black">
        <span className="text-sm font-black uppercase tracking-wider">CREATE</span>
        <div className="flex-1" />
        <button className="px-3 py-1 border-2 border-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors" aria-label="API">
          NANO PRO
        </button>
      </div>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b-2 border-white/30">
        <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="px-3 py-2 border-2 border-white text-xs font-mono uppercase hover:bg-white hover:text-black transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
          {aspectRatio}
        </button>
        {QUALITY_OPTIONS.map((q) => (
          <button key={q} onClick={() => setQuality(q)} className={cn("px-3 py-2 border-2 text-xs font-mono uppercase transition-colors", quality === q ? "bg-white text-black border-white" : "border-white/50 hover:border-white")} aria-label={`Quality ${q}`}>
            {q}
          </button>
        ))}
        {COUNT_OPTIONS.map((n) => (
          <button key={n} onClick={() => setCount(n)} className={cn("size-10 border-2 text-sm font-mono transition-colors", count === n ? "bg-white text-black border-white" : "border-white/50 hover:border-white")} aria-label={`Count ${n}`}>
            {n}
          </button>
        ))}
        <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("px-3 py-2 border-2 text-xs font-mono uppercase transition-colors flex items-center gap-2", speed === 'fast' ? "bg-amber-400 text-black border-amber-400" : "border-white/50 hover:border-white")} aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}>
          {speed === 'fast' ? <Zap className="size-3" /> : <Clock className="size-3" />}
          {speed.toUpperCase()}
        </button>
        <button onClick={() => setShowNegative(!showNegative)} className={cn("size-10 border-2 flex items-center justify-center transition-colors", showNegative ? "bg-red-500 border-red-500" : "border-white/50 hover:border-white")} aria-label="Negative prompt">
          <Ban className="size-4" />
        </button>
      </div>

      {/* Negative */}
      <AnimatePresence>
        {showNegative && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-red-500/50 bg-red-500/10">
              <input type="text" placeholder="EXCLUDE: BLURRY, LOW QUALITY..." aria-label="Negative prompt" className="w-full bg-transparent text-sm font-mono uppercase placeholder:text-white/30 focus:outline-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4">
        <motion.div animate={{ height: isExpanded ? 160 : 80 }} transition={{ duration: 0.15 }}>
          <textarea placeholder="DESCRIBE YOUR IMAGE..." aria-label="Image prompt" className="w-full h-full bg-transparent text-lg font-mono uppercase placeholder:text-white/20 focus:outline-none resize-none" />
        </motion.div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button className="size-12 border-2 border-white/50 flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Add images">
              <ImagePlus className="size-5" />
            </button>
            <button className="size-12 border-2 border-white/50 flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Library">
              <Library className="size-5" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-12 border-2 flex items-center justify-center transition-colors", isExpanded ? "bg-white text-black border-white" : "border-white/50 hover:border-white")} aria-label={isExpanded ? "Collapse" : "Expand"}>
              {isExpanded ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
            </button>
          </div>
          <button className="px-8 py-4 bg-white text-black font-black text-sm uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2" aria-label="Generate">
            <Sparkles className="size-4" />
            GENERATE
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 10: Aurora
// Animated aurora borealis gradient
// ============================================================================
function ComposerAurora() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* Aurora effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-2xl animate-pulse" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent rounded-2xl" aria-hidden="true" />

      <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Settings with aurora accent */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors" aria-label="API">
            <Server className="size-3 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-mono text-emerald-300">Nano Pro</span>
          </button>

          <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
            <AspectRatioShape ratio={aspectRatio} className="text-cyan-400" />
            <span className="text-xs font-mono text-cyan-300">{aspectRatio}</span>
          </button>

          <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/50 border border-white/5" role="radiogroup" aria-label="Quality">
            {QUALITY_OPTIONS.map((q) => (
              <button key={q} onClick={() => setQuality(q)} role="radio" aria-checked={quality === q} className={cn("px-2.5 py-1 rounded-lg text-xs font-mono transition-all", quality === q ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Count">
            {COUNT_OPTIONS.map((n) => (
              <button key={n} onClick={() => setCount(n)} role="radio" aria-checked={count === n} className={cn("size-7 rounded-lg text-xs font-mono transition-all", count === n ? "bg-purple-500 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors", speed === 'fast' ? "bg-amber-500/10 border border-amber-500/20" : "bg-zinc-900/50 border border-white/5")} aria-label={speed === 'fast' ? 'Fast' : 'Batch'}>
            {speed === 'fast' ? <Zap className="size-3 text-amber-400" /> : <Clock className="size-3 text-zinc-400" />}
            <span className={cn("text-xs font-mono", speed === 'fast' ? "text-amber-300" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
          </button>

          <button onClick={() => setShowNegative(!showNegative)} className={cn("size-7 rounded-lg flex items-center justify-center transition-colors", showNegative ? "bg-red-500/20 border border-red-500/30" : "bg-zinc-900/50 border border-white/5 hover:bg-zinc-800")} aria-label="Negative prompt">
            <Ban className="size-3 text-zinc-400" />
          </button>
        </div>

        {/* Negative */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/10">
                <input type="text" placeholder="Negative: blurry, distorted…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4">
          <motion.div animate={{ height: isExpanded ? 160 : 60 }} transition={{ duration: 0.2 }}>
            <textarea placeholder="Describe the aurora of your imagination…" aria-label="Image prompt" className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
          </motion.div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors" aria-label="Add images">
                <ImagePlus className="size-4" />
              </button>
              <button className="size-10 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-cyan-400 transition-colors" aria-label="Library">
                <Library className="size-4" />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-10 rounded-xl border flex items-center justify-center transition-colors", isExpanded ? "bg-purple-500/20 border-purple-500/30 text-purple-300" : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-purple-400")} aria-label={isExpanded ? "Collapse" : "Expand"}>
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2" aria-label="Generate">
              <Sparkles className="size-4" />
              Illuminate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 11: Retro CRT
// Vintage CRT monitor aesthetic
// ============================================================================
function ComposerRetro() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="relative">
      {/* CRT bezel */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-3xl" aria-hidden="true" />
      <div className="absolute inset-2 bg-zinc-900 rounded-2xl" aria-hidden="true" />

      {/* Scanlines overlay */}
      <div className="absolute inset-4 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] rounded-xl z-10" aria-hidden="true" />

      {/* Screen glow */}
      <div className="absolute inset-4 bg-green-500/5 rounded-xl" aria-hidden="true" />

      <div className="relative m-4 bg-zinc-950 rounded-xl overflow-hidden border border-green-500/20">
        {/* CRT header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-green-500/20 bg-green-500/5">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono text-green-400 uppercase tracking-widest">Image Generator v1.0</span>
          <div className="flex-1" />
          <span className="text-xs font-mono text-green-500/50">READY</span>
        </div>

        {/* Config line */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-green-500/10 font-mono text-xs text-green-400">
          <span className="text-green-500/50">&gt;</span>
          <button className="hover:text-green-300 transition-colors" aria-label="API">api:nano</button>
          <span className="text-green-500/30">|</span>
          <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className="hover:text-green-300 transition-colors" aria-label={`Ratio ${aspectRatio}`}>ratio:{aspectRatio}</button>
          <span className="text-green-500/30">|</span>
          {QUALITY_OPTIONS.map((q) => (
            <button key={q} onClick={() => setQuality(q)} className={cn("transition-colors", quality === q ? "text-green-300 underline" : "text-green-400/50 hover:text-green-300")} aria-label={`Quality ${q}`}>
              {q.toLowerCase()}
            </button>
          ))}
          <span className="text-green-500/30">|</span>
          <span className="text-green-500/50">n=</span>
          {COUNT_OPTIONS.map((n) => (
            <button key={n} onClick={() => setCount(n)} className={cn("transition-colors", count === n ? "text-green-300" : "text-green-400/50 hover:text-green-300")} aria-label={`Count ${n}`}>
              {n}
            </button>
          ))}
          <span className="text-green-500/30">|</span>
          <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("transition-colors", speed === 'fast' ? "text-amber-400" : "text-green-400/50")} aria-label={speed === 'fast' ? 'Fast' : 'Batch'}>
            {speed}
          </button>
          <button onClick={() => setShowNegative(!showNegative)} className={cn("transition-colors ml-auto", showNegative ? "text-red-400" : "text-green-400/50")} aria-label="Negative">
            [neg]
          </button>
        </div>

        {/* Negative */}
        <AnimatePresence>
          {showNegative && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-red-500/20 bg-red-500/5 font-mono text-xs">
                <span className="text-red-400">&gt; exclude:</span>
                <input type="text" placeholder="blurry, artifacts..." aria-label="Negative prompt" className="flex-1 bg-transparent text-red-300 placeholder:text-red-400/30 focus:outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4">
          <div className="flex items-start gap-2 font-mono">
            <span className="text-green-500 mt-1">&gt;</span>
            <motion.div animate={{ height: isExpanded ? 120 : 60 }} transition={{ duration: 0.2 }} className="flex-1">
              <textarea placeholder="Enter prompt..." aria-label="Image prompt" className="w-full h-full bg-transparent text-sm text-green-300 placeholder:text-green-500/30 focus:outline-none resize-none caret-green-400" />
            </motion.div>
          </div>
          <div className="flex items-center justify-between mt-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-1.5" aria-label="Add images">
                <ImagePlus className="size-3" />
                [img]
              </button>
              <button className="px-3 py-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-1.5" aria-label="Library">
                <Library className="size-3" />
                [lib]
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={cn("px-3 py-1.5 border transition-colors flex items-center gap-1.5", isExpanded ? "border-green-400 bg-green-500/10 text-green-300" : "border-green-500/30 text-green-400 hover:bg-green-500/10")} aria-label={isExpanded ? "Collapse" : "Expand"}>
                {isExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                [{isExpanded ? 'min' : 'max'}]
              </button>
            </div>
            <button className="px-4 py-2 bg-green-500 text-black font-bold uppercase tracking-wider hover:bg-green-400 transition-colors flex items-center gap-2" aria-label="Execute">
              <Sparkles className="size-3" />
              EXECUTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 12: Neumorphic
// Soft shadows and pressed elements
// ============================================================================
function ComposerNeumorphic() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const neumorphicBtn = "bg-zinc-800 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(0,0,0,0.5)] rounded-xl";
  const neumorphicBtnActive = "bg-zinc-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-xl";

  return (
    <div className="bg-zinc-800 rounded-3xl p-6 shadow-[20px_20px_60px_#1a1a1a,-20px_-20px_60px_#363636]">
      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button className={cn(neumorphicBtn, "px-4 py-2.5 flex items-center gap-2")} aria-label="API">
          <Server className="size-4 text-zinc-400" />
          <span className="text-sm font-mono text-zinc-300">Nano Pro</span>
        </button>

        <button onClick={() => setAspectRatio(aspectRatio === '1:1' ? '16:9' : '1:1')} className={cn(neumorphicBtn, "px-4 py-2.5 flex items-center gap-2")} aria-label={`Ratio ${aspectRatio}`}>
          <AspectRatioShape ratio={aspectRatio} className="text-zinc-400" />
          <span className="text-sm font-mono text-zinc-300">{aspectRatio}</span>
        </button>

        <div className="flex items-center gap-1">
          {QUALITY_OPTIONS.map((q) => (
            <button key={q} onClick={() => setQuality(q)} className={cn("px-3 py-2.5 text-xs font-mono transition-all", quality === q ? neumorphicBtnActive + " text-zinc-100" : neumorphicBtn + " text-zinc-400")} aria-label={`Quality ${q}`}>
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {COUNT_OPTIONS.map((n) => (
            <button key={n} onClick={() => setCount(n)} className={cn("size-10 text-sm font-mono transition-all", count === n ? neumorphicBtnActive + " text-zinc-100" : neumorphicBtn + " text-zinc-400")} aria-label={`Count ${n}`}>
              {n}
            </button>
          ))}
        </div>

        <button onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')} className={cn("px-4 py-2.5 flex items-center gap-2 transition-all", speed === 'fast' ? neumorphicBtnActive : neumorphicBtn)} aria-label={speed === 'fast' ? 'Fast' : 'Batch'}>
          {speed === 'fast' ? <Zap className="size-4 text-amber-400" /> : <Clock className="size-4 text-zinc-400" />}
          <span className={cn("text-sm font-mono", speed === 'fast' ? "text-amber-300" : "text-zinc-400")}>{speed === 'fast' ? 'Fast' : 'Batch'}</span>
        </button>

        <button onClick={() => setShowNegative(!showNegative)} className={cn("size-10 flex items-center justify-center transition-all", showNegative ? neumorphicBtnActive : neumorphicBtn)} aria-label="Negative">
          <Ban className={cn("size-4", showNegative ? "text-red-400" : "text-zinc-400")} />
        </button>
      </div>

      {/* Negative */}
      <AnimatePresence>
        {showNegative && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className={cn(neumorphicBtnActive, "px-4 py-3")}>
              <input type="text" placeholder="Negative: blurry, low quality…" aria-label="Negative prompt" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={cn(neumorphicBtnActive, "p-4 mb-4")}>
        <motion.div animate={{ height: isExpanded ? 140 : 60 }} transition={{ duration: 0.2 }}>
          <textarea placeholder="Describe your image…" aria-label="Image prompt" className="w-full h-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className={cn(neumorphicBtn, "size-12 flex items-center justify-center")} aria-label="Add images">
            <ImagePlus className="size-5 text-zinc-400" />
          </button>
          <button className={cn(neumorphicBtn, "size-12 flex items-center justify-center")} aria-label="Library">
            <Library className="size-5 text-zinc-400" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className={cn("size-12 flex items-center justify-center transition-all", isExpanded ? neumorphicBtnActive : neumorphicBtn)} aria-label={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? <Minimize2 className="size-5 text-zinc-300" /> : <Maximize2 className="size-5 text-zinc-400" />}
          </button>
        </div>
        <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium text-sm shadow-lg shadow-violet-500/30 flex items-center gap-2 hover:shadow-violet-500/50 transition-shadow" aria-label="Generate">
          <Sparkles className="size-4" />
          Generate
        </button>
      </div>
    </div>
  );
}
