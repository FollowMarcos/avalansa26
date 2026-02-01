'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, ThumbsUp, ThumbsDown, MessageSquare, X, Send, Zap, Clock, Settings, ImagePlus, Images, Ban, ChevronDown, Maximize2, Sliders, Wand2, Layers, Grid3X3, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { voteMockup, getUserMockupVotes, removeVote } from '@/utils/supabase/mockup-votes.server';
import type { VoteType, MockupVote } from '@/types/mockup-vote';

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
      // Remove vote if clicking same type
      await removeVote(mockupId);
      setVotes((prev) => {
        const next = { ...prev };
        delete next[mockupId];
        return next;
      });
    } else {
      // Set or change vote
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
    { id: 'composer-minimal', title: 'Minimal Float', description: 'Ultra-minimal floating bar with just essentials', component: ComposerMinimal },
    { id: 'composer-command', title: 'Command Palette', description: 'CMD+K style spotlight interface', component: ComposerCommand },
    { id: 'composer-stacked', title: 'Vertical Stack', description: 'Settings stacked above the prompt area', component: ComposerStacked },
    { id: 'composer-split', title: 'Split Panel', description: 'Two-column with settings on left', component: ComposerSplit },
    { id: 'composer-pills', title: 'Pill Bar', description: 'All settings as inline pills in one row', component: ComposerPills },
    { id: 'composer-drawer', title: 'Drawer Settings', description: 'Clean textarea with collapsible settings', component: ComposerDrawer },
    { id: 'composer-compact', title: 'Compact Card', description: 'Small card that expands on focus', component: ComposerCompact },
    { id: 'composer-glass', title: 'Glass Morph', description: 'Frosted glass with floating elements', component: ComposerGlass },
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

      <main className="flex-1 pt-32 pb-48 px-8 relative z-10 w-full max-w-6xl mx-auto">
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

        {/* Mockups Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
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
                {/* Preview Area */}
                <div className="relative h-64 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 flex items-end justify-center p-4 overflow-hidden">
                  <div className="w-full max-w-md transform scale-[0.85] origin-bottom">
                    <MockupComponent />
                  </div>
                </div>

                {/* Info & Voting */}
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium">{mockup.title}</h3>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{mockup.description}</p>
                    </div>

                    {/* Voting Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(mockup.id, 'like')}
                        className={cn(
                          "size-8 rounded-lg transition-colors",
                          vote?.type === 'like' && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        )}
                      >
                        <ThumbsUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(mockup.id, 'dislike')}
                        className={cn(
                          "size-8 rounded-lg transition-colors",
                          vote?.type === 'dislike' && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        )}
                      >
                        <ThumbsDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFeedbackOpen(feedbackOpen === mockup.id ? null : mockup.id);
                          setFeedbackText(vote?.feedback || '');
                        }}
                        className={cn(
                          "size-8 rounded-lg transition-colors",
                          vote?.feedback && "bg-blue-500/10 text-blue-500"
                        )}
                      >
                        <MessageSquare className="size-4" />
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
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          <input
                            type="text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Share your thoughts..."
                            className="flex-1 bg-muted/30 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFeedback(mockup.id);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFeedback(mockup.id)}
                            className="size-8 rounded-lg"
                          >
                            <Send className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setFeedbackOpen(null)}
                            className="size-8 rounded-lg"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        {vote?.feedback && (
                          <p className="text-xs text-muted-foreground mt-2 px-1">
                            Your feedback: "{vote.feedback}"
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
// MOCKUP 1: Minimal Float
// Ultra-minimal floating bar with just textarea and generate button
// ============================================================================
function ComposerMinimal() {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button className="size-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-colors">
          <ImagePlus className="size-5" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          placeholder="Describe your image..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          readOnly
        />
        <button className="h-10 px-5 rounded-xl bg-white text-black font-medium text-sm flex items-center gap-2 hover:bg-white/90 transition-colors">
          <Sparkles className="size-4" />
          Generate
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 2: Command Palette
// Spotlight/CMD+K style interface with centered, focused design
// ============================================================================
function ComposerCommand() {
  return (
    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Search-like header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <Wand2 className="size-5 text-purple-400" />
        <input
          type="text"
          placeholder="What do you want to create?"
          className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/50 focus:outline-none"
          readOnly
        />
        <kbd className="px-2 py-1 text-[10px] font-mono bg-white/5 rounded border border-white/10 text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      {/* Quick actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
          <Square className="size-3" />
          1:1
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
          2K
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground">
          <Zap className="size-3" />
          Fast
        </div>
        <div className="flex-1" />
        <button className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium">
          Create
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 3: Vertical Stack
// Settings stacked above the prompt in a vertical layout
// ============================================================================
function ComposerStacked() {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Settings row */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Square className="size-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">1:1</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Layers className="size-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">2K</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Grid3X3 className="size-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">×4</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 transition-colors">
          <Zap className="size-4 text-amber-400" />
          <span className="text-[10px] text-muted-foreground">Fast</span>
        </button>
      </div>
      {/* Input area */}
      <div className="flex items-center gap-3 p-3">
        <button className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
          <ImagePlus className="size-5" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          placeholder="Describe your vision..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          readOnly
        />
        <button className="size-10 rounded-xl bg-white text-black flex items-center justify-center">
          <Sparkles className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 4: Split Panel
// Two-column layout with settings on left, prompt on right
// ============================================================================
function ComposerSplit() {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex">
      {/* Settings panel */}
      <div className="w-24 border-r border-white/5 p-2 bg-white/[0.02] flex flex-col gap-1">
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 text-xs text-muted-foreground">
          <RectangleHorizontal className="size-3.5" />
          <span>16:9</span>
        </button>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 text-xs text-muted-foreground">
          <Layers className="size-3.5" />
          <span>4K</span>
        </button>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/5 text-xs text-amber-400">
          <Zap className="size-3.5" />
          <span>Fast</span>
        </button>
        <button className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 text-xs text-muted-foreground">
          <Ban className="size-3.5" />
          <span>Neg</span>
        </button>
      </div>
      {/* Prompt area */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <textarea
          placeholder="Describe your image..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[60px]"
          readOnly
        />
        <div className="flex items-center justify-between">
          <button className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
            <ImagePlus className="size-4" />
          </button>
          <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium flex items-center gap-2">
            <Sparkles className="size-4" />
            Go
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 5: Pill Bar
// All settings as horizontal pills in a single compact row
// ============================================================================
function ComposerPills() {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Pills row */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 overflow-x-auto">
        <div className="flex items-center h-7 p-0.5 bg-white/5 rounded-full">
          <button className="h-6 px-2.5 rounded-full bg-white text-black text-[11px] font-medium">1:1</button>
          <button className="h-6 px-2.5 rounded-full text-muted-foreground text-[11px]">16:9</button>
          <button className="h-6 px-2.5 rounded-full text-muted-foreground text-[11px]">9:16</button>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center h-7 p-0.5 bg-white/5 rounded-full">
          <button className="h-6 px-2.5 rounded-full text-muted-foreground text-[11px]">1K</button>
          <button className="h-6 px-2.5 rounded-full bg-white text-black text-[11px] font-medium">2K</button>
          <button className="h-6 px-2.5 rounded-full text-muted-foreground text-[11px]">4K</button>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={cn(
                "size-6 rounded-full text-[11px] font-medium transition-colors",
                n === 1 ? "bg-white text-black" : "text-muted-foreground hover:bg-white/5"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {/* Input */}
      <div className="flex items-center gap-3 p-3">
        <button className="size-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
          <ImagePlus className="size-4" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          placeholder="Your prompt here..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          readOnly
        />
        <button className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm">
          Create
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 6: Drawer Settings
// Clean textarea with settings hidden in a collapsible drawer
// ============================================================================
function ComposerDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Drawer content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.02] border-b border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Aspect</span>
                <div className="flex items-center gap-1">
                  {['1:1', '16:9', '9:16'].map((r) => (
                    <button key={r} className={cn(
                      "px-2 py-1 rounded text-xs",
                      r === '1:1' ? "bg-white text-black" : "bg-white/5 text-muted-foreground"
                    )}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Quality</span>
                <div className="flex items-center gap-1">
                  {['1K', '2K', '4K'].map((q) => (
                    <button key={q} className={cn(
                      "px-2 py-1 rounded text-xs",
                      q === '2K' ? "bg-white text-black" : "bg-white/5 text-muted-foreground"
                    )}>
                      {q}
                    </button>
                  ))}
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
          className={cn(
            "size-10 rounded-xl flex items-center justify-center transition-colors",
            isOpen ? "bg-white text-black" : "bg-white/5 text-muted-foreground hover:bg-white/10"
          )}
        >
          <Settings className="size-5" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          placeholder="What would you like to create?"
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          readOnly
        />
        <button className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
          <Sparkles className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 7: Compact Card
// Small card that expands on focus
// ============================================================================
function ComposerCompact() {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <motion.div
      animate={{ width: isFocused ? '100%' : '280px' }}
      className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-auto"
    >
      <div className="flex items-center gap-2 p-2">
        <button className="size-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground flex-shrink-0">
          <ImagePlus className="size-4" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          placeholder="Create..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly
        />
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 flex-shrink-0"
            >
              <button className="px-2 py-1 rounded bg-white/5 text-[10px] text-muted-foreground">1:1</button>
              <button className="px-2 py-1 rounded bg-white/5 text-[10px] text-muted-foreground">2K</button>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="size-9 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
          <Sparkles className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MOCKUP 8: Glass Morph
// Frosted glass with floating elements and soft gradients
// ============================================================================
function ComposerGlass() {
  return (
    <div className="relative">
      {/* Gradient blob */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />

      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Floating settings chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <RectangleVertical className="size-3 text-purple-400" />
            <span className="text-xs text-white/70">9:16</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-xs text-white/70">4K</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Zap className="size-3 text-amber-400" />
            <span className="text-xs text-amber-300">Turbo</span>
          </div>
        </div>

        {/* Input area */}
        <div className="p-4">
          <textarea
            placeholder="Imagine something beautiful..."
            className="w-full bg-transparent text-sm placeholder:text-white/30 focus:outline-none resize-none min-h-[60px] text-white/80"
            readOnly
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
                <ImagePlus className="size-4" />
              </button>
              <button className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
                <Sliders className="size-4" />
              </button>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2">
              <Sparkles className="size-4" />
              Dream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
