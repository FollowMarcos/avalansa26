'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────
   PROFILE DESIGN 3 — "TERMINAL / HACKER"
   Full CLI aesthetic, monospace everything,
   ASCII art borders, command-line prompts,
   typewriter effects, scanline overlays
   ───────────────────────────────────────────── */

const MOCK_PROFILE = {
  id: '1',
  username: 'mira_santos',
  name: 'Mira Santos',
  avatar_url: null,
  bio: 'Digital sculptor & creative technologist exploring the boundaries between generative art, spatial computing, and human perception.',
  interests: ['generative-art', 'spatial-computing', 'creative-coding', 'typography', 'motion-design', 'glsl-shaders'],
  onboarding_completed: true,
  role: 'admin' as const,
  created_at: '2025-03-15T00:00:00Z',
  updated_at: '2026-02-10T00:00:00Z',
  website: 'mirasantos.design',
  visibility: 'public' as const,
  allowed_viewers: [],
};

const MOCK_LOGS = [
  { time: '14:23:01', type: 'CREATE', message: 'fractal_genesis.avl uploaded to /works/' },
  { time: '14:21:45', type: 'MODIFY', message: 'collection "spatial_studies" updated — 3 new items' },
  { time: '13:58:12', type: 'SYSTEM', message: 'profile.visibility changed: stealth → public' },
  { time: '12:04:33', type: 'CREATE', message: 'neon_topology_v2.avl generated — 4096x4096' },
  { time: '09:15:00', type: 'LOGIN', message: 'session authenticated via SSO/Google' },
];

const MOCK_WORKS = [
  { id: 'avl-0x7f3a', name: 'fractal_genesis.avl', size: '14.2 MB', date: 'Feb 10', perms: 'rw-r--r--' },
  { id: 'avl-0x3b2c', name: 'neon_topology_v2.avl', size: '8.7 MB', date: 'Feb 09', perms: 'rw-r--r--' },
  { id: 'avl-0x9d1e', name: 'void_sculpture.avl', size: '22.1 MB', date: 'Feb 07', perms: 'rw-r-----' },
  { id: 'avl-0x4a5f', name: 'particle_dreams.avl', size: '6.3 MB', date: 'Feb 04', perms: 'rw-r--r--' },
  { id: 'avl-0x1c8d', name: 'light_study_42.avl', size: '3.1 MB', date: 'Jan 28', perms: 'rw-r--r--' },
  { id: 'avl-0x6e2b', name: 'recursive_form.avl', size: '11.8 MB', date: 'Jan 22', perms: 'rwxr-xr-x' },
];

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayed, started, text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[0.6em] h-[1.1em] bg-primary/80 animate-pulse ml-[1px] align-text-bottom" />
      )}
    </span>
  );
}

function TerminalLine({ children, prompt = '$', className = '' }: { children: React.ReactNode; prompt?: string; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <span className="text-primary/50 select-none shrink-0">{prompt}</span>
      <span className="flex-1 break-all">{children}</span>
    </div>
  );
}

function AsciiBox({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-vt323 text-sm ${className}`}>
      {title && (
        <div className="text-primary/60 mb-1">
          {'┌─ '}<span className="text-primary">{title}</span>{' ─'}{'─'.repeat(Math.max(0, 40 - title.length))}{'┐'}
        </div>
      )}
      <div className="pl-1 border-l border-primary/10 ml-[2px]">
        {children}
      </div>
      {title && (
        <div className="text-primary/20 mt-1">{'└' + '─'.repeat(45) + '┘'}</div>
      )}
    </div>
  );
}

export default function Profile3Page() {
  const profile = MOCK_PROFILE;
  const displayName = profile.name || profile.username || 'User';
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to buffer.');
  };

  return (
    <PageShell contentClassName="relative min-h-screen">
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* CRT vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-40 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-32 relative z-10 font-vt323">

        {/* ── STATUS BAR ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between text-xs text-primary/40 mb-8 px-1"
        >
          <span>avalansa://u/{profile.username}</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              ONLINE
            </span>
            <span>{currentTime}</span>
          </span>
        </motion.div>

        {/* ── HEADER BLOCK ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            {/* Avatar - pixelated style */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 border border-primary/20 bg-primary/[0.03] overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" style={{ imageRendering: 'pixelated' }} priority />
                ) : (
                  <div className="w-full h-full p-2">
                    <DefaultAvatar className="w-full h-full" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5">
                LIVE
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              {/* Name */}
              <div>
                <h1 className="text-5xl sm:text-6xl text-primary leading-none tracking-tight uppercase">
                  <TypewriterText text={displayName} delay={300} speed={60} />
                </h1>
                <p className="text-lg text-primary/40 mt-1">
                  @{profile.username} · {profile.role === 'admin' ? 'ROOT' : 'USER'}
                </p>
              </div>

              {/* Quick stats inline */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-primary/50">
                <span>works: <span className="text-primary">147</span></span>
                <span>views: <span className="text-primary">12.4k</span></span>
                <span>followers: <span className="text-primary">2.1k</span></span>
                <span>joined: <span className="text-primary">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span></span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  className="text-sm border border-primary/20 bg-primary/[0.05] text-primary hover:bg-primary/[0.12] transition-colors px-4 py-1.5"
                  onClick={() => toast.success('Follow request sent.')}
                >
                  [F] FOLLOW
                </button>
                <button
                  className="text-sm border border-primary/20 bg-primary/[0.05] text-primary/60 hover:bg-primary/[0.12] hover:text-primary transition-colors px-4 py-1.5"
                  onClick={handleShare}
                >
                  [S] SHARE
                </button>
                <button disabled className="text-sm border border-primary/20 bg-primary/[0.05] text-primary/60 hover:bg-primary/[0.12] hover:text-primary transition-colors px-4 py-1.5">
                  [M] MESSAGE
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── BIO / ABOUT ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <AsciiBox title="README.md">
            <div className="py-3 px-2 space-y-3">
              <TerminalLine prompt=">">
                <span className="text-lg leading-relaxed text-primary/80">{profile.bio}</span>
              </TerminalLine>
              {profile.website && (
                <TerminalLine prompt="~">
                  <span className="text-primary/40">web: </span>
                  <a
                    href={`https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/70 hover:text-primary underline underline-offset-4 decoration-primary/20 hover:decoration-primary/50 transition-colors"
                  >
                    {profile.website}
                  </a>
                </TerminalLine>
              )}
            </div>
          </AsciiBox>
        </motion.div>

        {/* ── INTERESTS / MODULES ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <AsciiBox title="LOADED_MODULES">
            <div className="py-3 px-2">
              <TerminalLine prompt="$">
                <span className="text-primary/40">cat /proc/interests</span>
              </TerminalLine>
              <div className="flex flex-wrap gap-2 mt-3 pl-6">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-sm border border-primary/15 bg-primary/[0.04] text-primary/70 px-3 py-1 hover:bg-primary/[0.1] hover:text-primary hover:border-primary/30 transition-all cursor-default"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </AsciiBox>
        </motion.div>

        {/* ── FILE LISTING / WORKS ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <AsciiBox title="WORKS">
            <div className="py-3 px-2">
              <TerminalLine prompt="$">
                <span className="text-primary/40">ls -la ~/works/ --sort=date</span>
              </TerminalLine>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-primary/30 text-left">
                      <th className="pb-2 pr-4 font-normal">PERMS</th>
                      <th className="pb-2 pr-4 font-normal">ID</th>
                      <th className="pb-2 pr-4 font-normal">SIZE</th>
                      <th className="pb-2 pr-4 font-normal">DATE</th>
                      <th className="pb-2 font-normal">NAME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_WORKS.map((work, i) => (
                      <motion.tr
                        key={work.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 + i * 0.06 }}
                        className="group text-primary/60 hover:text-primary hover:bg-primary/[0.04] transition-colors cursor-pointer"
                      >
                        <td className="py-1.5 pr-4 text-primary/30 group-hover:text-primary/50">{work.perms}</td>
                        <td className="py-1.5 pr-4 text-primary/25 group-hover:text-primary/40">{work.id}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{work.size}</td>
                        <td className="py-1.5 pr-4 text-primary/40 group-hover:text-primary/60">{work.date}</td>
                        <td className="py-1.5">
                          <span className="group-hover:underline underline-offset-4 decoration-primary/30">{work.name}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-primary/30">
                <TerminalLine prompt=" ">
                  6 items — 66.2 MB total
                </TerminalLine>
              </div>
            </div>
          </AsciiBox>
        </motion.div>

        {/* ── ACTIVITY LOG ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <AsciiBox title="ACTIVITY_LOG">
            <div className="py-3 px-2 space-y-2">
              <TerminalLine prompt="$">
                <span className="text-primary/40">tail -f /var/log/activity.log</span>
              </TerminalLine>

              {MOCK_LOGS.map((log, i) => {
                const typeColors: Record<string, string> = {
                  CREATE: 'text-green-400/80',
                  MODIFY: 'text-blue-400/80',
                  SYSTEM: 'text-yellow-400/80',
                  LOGIN: 'text-cyan-400/80',
                };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.08 }}
                    className="flex gap-3 text-sm group hover:bg-primary/[0.03] px-1 -mx-1 transition-colors"
                  >
                    <span className="text-primary/20 shrink-0 tabular-nums">{log.time}</span>
                    <span className={`shrink-0 w-16 ${typeColors[log.type] || 'text-primary/40'}`}>
                      [{log.type}]
                    </span>
                    <span className="text-primary/60 group-hover:text-primary/80 transition-colors">{log.message}</span>
                  </motion.div>
                );
              })}

              <div className="flex items-center gap-2 mt-2 text-primary/20">
                <span className="w-1.5 h-3 bg-primary/40 animate-pulse" />
                <span className="text-sm">awaiting next event...</span>
              </div>
            </div>
          </AsciiBox>
        </motion.div>

        {/* ── SYSTEM INFO FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="border-t border-primary/10 pt-8 mt-16"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-primary/30 mb-8">
            <div>
              <p className="text-primary/15 text-xs mb-1">FRAMEWORK</p>
              <p>Avalansa v2.6</p>
            </div>
            <div>
              <p className="text-primary/15 text-xs mb-1">PROTOCOL</p>
              <p>Identity/DIP-1</p>
            </div>
            <div>
              <p className="text-primary/15 text-xs mb-1">SESSION</p>
              <p className="tabular-nums">0x7f3a...2c8d</p>
            </div>
            <div>
              <p className="text-primary/15 text-xs mb-1">UPTIME</p>
              <p>47d 13h 22m</p>
            </div>
          </div>

          <div className="text-center opacity-30 select-none pointer-events-none">
            <p className="text-xs uppercase tracking-[0.4em]">Design Concept 3 — Terminal / Hacker</p>
          </div>
        </motion.div>
      </main>
    </PageShell>
  );
}
