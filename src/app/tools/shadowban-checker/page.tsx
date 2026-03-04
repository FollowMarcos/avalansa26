'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, XCircle, HelpCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { WaveLoader, TextShimmerLoader } from '@/components/ui/loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CheckStatus = 'clean' | 'banned' | 'unknown';

interface CheckResults {
  searchSuggestionBan: CheckStatus;
  searchBan: CheckStatus;
  ghostBan: CheckStatus;
  replyDeboosting: CheckStatus;
}

// ---------------------------------------------------------------------------
// Check definitions
// ---------------------------------------------------------------------------
const CHECK_DEFS = [
  {
    key: 'searchSuggestionBan' as const,
    title: 'Search Suggestion Ban',
    description:
      'Your username does not appear in typeahead suggestions when someone types it in the search bar.',
  },
  {
    key: 'searchBan' as const,
    title: 'Search Ban',
    description:
      'Your tweets do not appear in search results, even when searching "from:@yourusername".',
  },
  {
    key: 'ghostBan' as const,
    title: 'Ghost Ban',
    description:
      'Your replies are invisible in tweet threads to everyone except people who already follow you.',
  },
  {
    key: 'replyDeboosting' as const,
    title: 'Reply Deboosting',
    description:
      'Your replies are hidden behind "Show more replies" instead of appearing inline.',
  },
] as const;

const STATUS_CONFIG = {
  clean: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Not Banned',
  },
  banned: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Banned',
  },
  unknown: {
    icon: HelpCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Unknown',
  },
} as const;

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------
function ResultCard({
  title,
  description,
  status,
  index,
  shouldReduce,
}: {
  title: string;
  description: string;
  status: CheckStatus;
  index: number;
  shouldReduce: boolean;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        delay: shouldReduce ? 0 : index * 0.08,
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card
        className={`p-5 rounded-2xl border ${cfg.border} ${cfg.bg} space-y-3`}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-mono text-base text-foreground uppercase tracking-wide leading-tight">
            {title}
          </h3>
          <div
            className={`flex items-center gap-1.5 shrink-0 ${cfg.color}`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="font-mono text-sm uppercase">{cfg.label}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ShadowbanCheckerPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CheckResults | null>(null);
  const [checkedUsername, setCheckedUsername] = useState('');
  const [isCached, setIsCached] = useState(false);
  const shouldReduce = useReducedMotion() ?? false;

  const handleCheck = async () => {
    const clean = username.replace(/^@/, '').trim();
    if (!clean || isLoading) return;

    setIsLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/tools/shadowban-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error ?? 'Check failed. Please try again.');
        return;
      }

      setResults(data.results);
      setCheckedUsername(data.username);
      setIsCached(data.cached ?? false);
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const allClean =
    results &&
    Object.values(results).every((v) => v === 'clean');

  const hasBan =
    results &&
    Object.values(results).some((v) => v === 'banned');

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-primary fill-current"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-mono tracking-tight text-primary uppercase">
            Shadowban Checker
          </h1>

          <p className="text-muted-foreground text-base md:text-lg italic opacity-80 max-w-lg mx-auto">
            Check whether your X account has been shadowbanned across four
            distinct restriction types. Free, no login required.
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Input */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold select-none pointer-events-none"
                aria-hidden="true"
              >
                @
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder={"username"}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                maxLength={16}
                className="pl-8 rounded-xl border-primary/20 bg-primary/[0.02] focus:bg-background h-11"
                aria-label="X username to check"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleCheck}
              disabled={isLoading || !username.replace(/^@/, '').trim()}
              className="rounded-xl font-mono text-lg h-11 px-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <WaveLoader size="sm" />
                  <span>Checking</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Check</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Loading / Results */}
        {/* ---------------------------------------------------------------- */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <WaveLoader size="lg" />
              <TextShimmerLoader text="Checking with X..." size="md" />
              <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
                Running 4 independent checks. This may take a few seconds.
              </p>
            </motion.div>
          )}

          {results && !isLoading && (
            <motion.div
              key="results"
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="text-center space-y-1">
                <div>
                  <span className="font-mono text-2xl text-muted-foreground uppercase">
                    Results for{' '}
                  </span>
                  <span className="font-mono text-2xl text-primary">
                    @{checkedUsername}
                  </span>
                </div>

                {allClean && (
                  <p className="text-emerald-500 font-mono text-sm uppercase">
                    All clear — no restrictions detected
                  </p>
                )}
                {hasBan && (
                  <p className="text-red-500 font-mono text-sm uppercase">
                    Restrictions detected
                  </p>
                )}

                {isCached && (
                  <p className="text-xs text-muted-foreground/50">
                    Cached result (refreshes every 5 minutes)
                  </p>
                )}
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHECK_DEFS.map((def, i) => (
                  <ResultCard
                    key={def.key}
                    title={def.title}
                    description={def.description}
                    status={results[def.key]}
                    index={i}
                    shouldReduce={shouldReduce}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------------------------------------------------------- */}
        {/* Disclaimer */}
        {/* ---------------------------------------------------------------- */}
        <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-2">
          <h3 className="font-mono text-base text-muted-foreground uppercase">
            Accuracy Disclaimer
          </h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            This tool uses X&apos;s public guest API endpoints to infer
            shadowban status. Results may be inaccurate if X changes their API,
            if the account has no recent replies, or if the account is very new.
            &ldquo;Unknown&rdquo; results indicate the check could not be
            completed, not that a ban is present. Cached results are shown for up
            to 5 minutes. This tool is not affiliated with X Corp.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Background decorative blobs */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="fixed inset-0 pointer-events-none -z-50 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>
    </main>
  );
}
