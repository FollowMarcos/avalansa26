'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles, ThumbsUp, ThumbsDown, MessageSquare, X, Send, Zap, Clock,
  Settings, ImagePlus, Images, Ban, ChevronDown, Maximize2, Minimize2,
  Sliders, Wand2, Layers, Grid3X3, Square, RectangleHorizontal,
  RectangleVertical, Library, Bookmark, Server, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { voteMockup, getUserMockupVotes, removeVote } from '@/utils/supabase/mockup-votes.server';
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
  const [feedbackOpen, setFeedbackOpen] = React.useState<string | null>(null);
  const [feedbackText, setFeedbackText] = React.useState('');

  React.useEffect(() => {
    getUserMockupVotes().then((userVotes) => {
      const voteMap: Record<string, { type: VoteType; feedback: string | null }> = {};
      userVotes.forEach((v) => {
        voteMap[v.mockup_id] = { type: v.vote_type, feedback: v.feedback };
      });
      setVotes(voteMap);
    });
  }, []);

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
  };

  const mockups = [
    { id: 'composer-v1-current', title: 'Current Design', description: 'The existing composer with settings row above input', component: ComposerCurrent },
    { id: 'composer-v2-minimal', title: 'Minimal Floating', description: 'Clean single-row with popover settings', component: ComposerMinimal },
    { id: 'composer-v3-command', title: 'Command Palette', description: 'Spotlight-style with keyboard-first navigation', component: ComposerCommand },
    { id: 'composer-v4-stacked', title: 'Stacked Controls', description: 'Vertical layout with icon buttons above input', component: ComposerStacked },
    { id: 'composer-v5-split', title: 'Split Panel', description: 'Settings sidebar with spacious prompt area', component: ComposerSplit },
    { id: 'composer-v6-pills', title: 'Pill Segmented', description: 'All settings as inline segmented pill controls', component: ComposerPills },
    { id: 'composer-v7-drawer', title: 'Collapsible Drawer', description: 'Hidden settings revealed on demand', component: ComposerDrawer },
    { id: 'composer-v8-glass', title: 'Glass Morphism', description: 'Frosted glass with floating chip settings', component: ComposerGlass },
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

                  {/* Voting Buttons */}
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

                {/* Preview Area - Canvas-like background */}
                <div className="relative min-h-[280px] bg-muted/30 flex items-end justify-center p-8">
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
// MOCKUP 1: Current Design (baseline)
// The existing composer layout with settings row above input
// ============================================================================
function ComposerCurrent() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');
  const [showNegative, setShowNegative] = React.useState(false);

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      {/* Settings Row */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
        {/* API Selector */}
        <button className="h-8 px-3 rounded-lg bg-muted/50 text-xs font-mono flex items-center gap-2 hover:bg-muted transition-colors" aria-label="Select API">
          <Server className="size-3.5" aria-hidden="true" />
          <span>Nano Pro</span>
          <ChevronDown className="size-3" aria-hidden="true" />
        </button>

        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />

        {/* Aspect Ratio */}
        <button className="h-8 px-2.5 gap-2 rounded-lg flex items-center hover:bg-muted/50 transition-colors" aria-label={`Aspect ratio ${aspectRatio}`}>
          <AspectRatioShape ratio={aspectRatio} className="opacity-70" />
          <span className="font-mono text-xs">{aspectRatio}</span>
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
        </button>

        {/* Quality Segmented Control */}
        <div className="flex items-center h-8 p-0.5 bg-muted/50 rounded-lg" role="radiogroup" aria-label="Image quality">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              role="radio"
              aria-checked={quality === q}
              className={cn(
                "h-7 px-2.5 rounded-md font-mono text-xs transition-all",
                quality === q ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Output Count */}
        <div className="flex items-center h-8 gap-0.5" role="radiogroup" aria-label="Number of images">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              role="radio"
              aria-checked={count === n}
              className={cn(
                "size-7 rounded-md font-mono text-xs transition-all flex items-center justify-center",
                count === n ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Speed Toggle */}
        <button
          onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')}
          aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}
          className="h-8 px-2.5 gap-1.5 rounded-lg font-mono text-xs flex items-center hover:bg-muted/50 transition-colors"
        >
          {speed === 'fast' ? <Zap className="size-3.5" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}
          <span className="hidden sm:inline">{speed === 'fast' ? 'Fast' : 'Batch'}</span>
        </button>

        {/* Negative Prompt Toggle */}
        <button
          onClick={() => setShowNegative(!showNegative)}
          aria-label="Toggle negative prompt"
          aria-expanded={showNegative}
          className={cn("size-8 rounded-lg flex items-center justify-center transition-colors", showNegative && "bg-muted")}
        >
          <Ban className="size-3.5" aria-hidden="true" />
        </button>

        <div className="flex-1" />

        {/* Generate Button */}
        <button className="h-8 px-4 rounded-lg font-medium text-sm gap-1.5 bg-foreground text-background hover:bg-foreground/90 flex items-center" aria-label="Generate image">
          <Sparkles className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          <span>Generate</span>
        </button>
      </div>

      {/* Negative Prompt (collapsible) */}
      <AnimatePresence>
        {showNegative && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-b border-border">
            <div className="px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground font-mono">Negative</span>
              </div>
              <input type="text" placeholder="blurry, low quality, distorted…" aria-label="Negative prompt" className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <div className="flex items-end gap-3 p-3">
        <button className="size-11 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0" aria-label="Add reference images">
          <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <textarea placeholder="Describe the image you want to create…" aria-label="Image prompt" className="flex-1 bg-transparent text-base resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded placeholder:text-muted-foreground min-h-[44px] py-3" rows={1} />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="px-2 py-1 text-xs font-mono text-muted-foreground tabular-nums">0</span>
          <button className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors" aria-label="Expand prompt">
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 2: Minimal Floating
// Clean single-row with popover settings
// ============================================================================
function ComposerMinimal() {
  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button className="size-11 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Add reference images">
          <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <input type="text" placeholder="Describe your image…" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded" />

        {/* Compact settings cluster */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30">
          <button className="px-2 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground" aria-label="Aspect ratio 1:1">
            <AspectRatioShape ratio="1:1" />
          </button>
          <span className="text-xs text-muted-foreground font-mono">2K</span>
          <span className="text-xs text-muted-foreground font-mono">×1</span>
          <Zap className="size-3 text-amber-500" aria-hidden="true" />
        </div>

        <button className="size-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors" aria-label="More settings">
          <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>

        <button className="h-11 px-6 rounded-xl bg-foreground text-background font-medium text-sm flex items-center gap-2 hover:bg-foreground/90 transition-colors" aria-label="Generate image">
          <Sparkles className="size-4" aria-hidden="true" />
          Generate
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 3: Command Palette
// Spotlight-style with keyboard navigation feel
// ============================================================================
function ComposerCommand() {
  const [quality, setQuality] = React.useState('2K');

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      {/* Search-like header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Wand2 className="size-5 text-primary" aria-hidden="true" />
        <input type="text" placeholder="What do you want to create?" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/50 focus:outline-none" />
        <kbd className="px-2 py-1 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground">⌘K</kbd>
      </div>

      {/* Quick settings bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2 text-xs">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80" aria-label="API: Nano Pro">
            <Server className="size-3" aria-hidden="true" />
            <span className="font-mono">Nano Pro</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80" aria-label="Aspect ratio 1:1">
            <AspectRatioShape ratio="1:1" />
            <span className="font-mono">1:1</span>
          </button>
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn("px-2 py-1 rounded-md font-mono", quality === q ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80")}
              aria-label={`Quality ${q}`}
            >
              {q}
            </button>
          ))}
          <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80" aria-label="Fast mode">
            <Zap className="size-3 text-amber-500" aria-hidden="true" />
            <span className="font-mono">Fast</span>
          </button>
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs" aria-label="Add images">
          <ImagePlus className="size-3" aria-hidden="true" />
          <span>Images</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium" aria-label="Create image">Create</button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 4: Stacked Controls
// Vertical icon buttons above input
// ============================================================================
function ComposerStacked() {
  const [count, setCount] = React.useState(1);
  const [speed, setSpeed] = React.useState<'fast' | 'batch'>('fast');

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      {/* Icon settings row */}
      <div className="flex items-center justify-center gap-1 p-2 border-b border-border bg-muted/20">
        <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors" aria-label="API: Nano Pro">
          <Server className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground font-mono">API</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors" aria-label="Aspect ratio 1:1">
          <AspectRatioShape ratio="1:1" className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono">1:1</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors" aria-label="Quality 2K">
          <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground font-mono">2K</span>
        </button>
        <div className="flex items-center gap-0.5 px-2" role="radiogroup" aria-label="Number of images">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              role="radio"
              aria-checked={count === n}
              className={cn("size-7 rounded-md text-xs font-mono transition-colors", count === n ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSpeed(speed === 'fast' ? 'batch' : 'fast')}
          className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors", speed === 'fast' ? "bg-amber-500/10" : "hover:bg-muted")}
          aria-label={speed === 'fast' ? 'Fast mode' : 'Batch mode'}
          aria-pressed={speed === 'fast'}
        >
          {speed === 'fast' ? <Zap className="size-4 text-amber-500" aria-hidden="true" /> : <Clock className="size-4 text-muted-foreground" aria-hidden="true" />}
          <span className="text-[10px] text-muted-foreground font-mono">{speed === 'fast' ? 'Fast' : 'Batch'}</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors" aria-label="Negative prompt">
          <Ban className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground font-mono">Neg</span>
        </button>
      </div>

      {/* Input area */}
      <div className="flex items-center gap-3 p-3">
        <button className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Add reference images">
          <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <input type="text" placeholder="Describe your vision…" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded" />
        <button className="size-10 rounded-xl bg-foreground text-background flex items-center justify-center" aria-label="Generate image">
          <Sparkles className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 5: Split Panel
// Settings sidebar with spacious prompt area
// ============================================================================
function ComposerSplit() {
  const [quality, setQuality] = React.useState('2K');

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden flex">
      {/* Settings sidebar */}
      <div className="w-32 border-r border-border p-3 bg-muted/20 flex flex-col gap-2">
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted text-xs" aria-label="API: Nano Pro">
          <Server className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-mono">Nano</span>
        </button>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted text-xs" aria-label="Aspect ratio 16:9">
          <AspectRatioShape ratio="16:9" className="text-muted-foreground" />
          <span className="font-mono">16:9</span>
        </button>
        <div className="flex flex-col gap-1">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn("px-2 py-1.5 rounded-md text-xs font-mono text-left", quality === q ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground")}
              aria-label={`Quality ${q}`}
            >
              {q}
            </button>
          ))}
        </div>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md bg-amber-500/10 text-xs" aria-label="Fast mode">
          <Zap className="size-3.5 text-amber-500" aria-hidden="true" />
          <span className="font-mono text-amber-600 dark:text-amber-400">Fast</span>
        </button>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted text-xs" aria-label="Negative prompt">
          <Ban className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-mono text-muted-foreground">Neg</span>
        </button>
      </div>

      {/* Prompt area */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <textarea placeholder="Describe your image in detail…" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none resize-none min-h-[80px]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="size-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Add reference images">
              <ImagePlus className="size-4" aria-hidden="true" />
            </button>
            <button className="size-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Saved references library">
              <Library className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium flex items-center gap-2" aria-label="Generate image">
            <Sparkles className="size-4" aria-hidden="true" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 6: Pill Segmented
// All settings as inline pill controls
// ============================================================================
function ComposerPills() {
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');
  const [count, setCount] = React.useState(1);

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      {/* Pills row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
        {/* API Pill */}
        <div className="flex items-center h-8 px-3 bg-muted/50 rounded-full gap-2 flex-shrink-0">
          <Server className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-mono">Nano Pro</span>
        </div>

        {/* Aspect Ratio Pills */}
        <div className="flex items-center h-8 p-0.5 bg-muted/50 rounded-full flex-shrink-0" role="radiogroup" aria-label="Aspect ratio">
          {['1:1', '16:9', '9:16'].map((r) => (
            <button
              key={r}
              onClick={() => setAspectRatio(r)}
              role="radio"
              aria-checked={aspectRatio === r}
              className={cn("h-7 px-2.5 rounded-full text-xs font-mono transition-colors flex items-center gap-1.5", aspectRatio === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              <AspectRatioShape ratio={r} className={aspectRatio === r ? "" : "opacity-50"} />
              {r}
            </button>
          ))}
        </div>

        {/* Quality Pills */}
        <div className="flex items-center h-8 p-0.5 bg-muted/50 rounded-full flex-shrink-0" role="radiogroup" aria-label="Quality">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              role="radio"
              aria-checked={quality === q}
              className={cn("h-7 px-3 rounded-full text-xs font-mono transition-colors", quality === q ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Count Pills */}
        <div className="flex items-center gap-0.5 flex-shrink-0" role="radiogroup" aria-label="Number of images">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              role="radio"
              aria-checked={count === n}
              className={cn("size-8 rounded-full text-xs font-mono transition-colors", count === n ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50")}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Speed Pill */}
        <div className="flex items-center h-8 px-3 bg-amber-500/10 rounded-full gap-1.5 flex-shrink-0">
          <Zap className="size-3.5 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400">Fast</span>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-3">
        <button className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Add reference images">
          <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <input type="text" placeholder="Your prompt here…" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded" />
        <button className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm" aria-label="Create image">Create</button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 7: Collapsible Drawer
// Hidden settings revealed on demand
// ============================================================================
function ComposerDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [quality, setQuality] = React.useState('2K');

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
      {/* Drawer content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 bg-muted/20 border-b border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">API</span>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm" aria-label="Select API">
                    <Server className="size-4" aria-hidden="true" />
                    <span className="font-mono">Nano Pro</span>
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Aspect</span>
                  <div className="flex items-center gap-1">
                    {['1:1', '16:9', '9:16'].map((r) => (
                      <button key={r} className={cn("px-2 py-2 rounded-lg text-xs font-mono", r === '1:1' ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80")} aria-label={`Aspect ratio ${r}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Quality</span>
                  <div className="flex items-center gap-1">
                    {QUALITY_OPTIONS.map((q) => (
                      <button key={q} onClick={() => setQuality(q)} className={cn("px-2 py-2 rounded-lg text-xs font-mono", quality === q ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80")} aria-label={`Quality ${q}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Speed</span>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-sm" aria-label="Fast mode">
                    <Zap className="size-4 text-amber-500" aria-hidden="true" />
                    <span className="font-mono text-amber-600 dark:text-amber-400">Fast</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle settings"
          aria-expanded={isOpen}
          className={cn("size-11 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:text-foreground")}
        >
          <Settings className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <input type="text" placeholder="What would you like to create?" aria-label="Image prompt" className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded" />
        <button className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center" aria-label="Generate image">
          <Sparkles className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 8: Glass Morphism
// Frosted glass with floating chip settings
// ============================================================================
function ComposerGlass() {
  return (
    <div className="relative">
      {/* Gradient blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative bg-background/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Floating settings chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Server className="size-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-mono">Nano Pro</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <AspectRatioShape ratio="9:16" className="text-primary" />
            <span className="text-xs font-mono">9:16</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-xs font-mono">4K</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-xs font-mono">×2</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Zap className="size-3 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-mono text-amber-300">Turbo</span>
          </div>
        </div>

        {/* Input area */}
        <div className="p-4">
          <textarea placeholder="Imagine something beautiful…" aria-label="Image prompt" className="w-full bg-transparent text-base placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[80px]" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Add reference images">
                <ImagePlus className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Saved library">
                <Library className="size-4" aria-hidden="true" />
              </button>
              <button className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Negative prompt">
                <Ban className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25 flex items-center gap-2" aria-label="Generate image">
              <Sparkles className="size-4" aria-hidden="true" />
              Dream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
