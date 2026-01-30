'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import type { Profile } from '@/types/database';
import { PageShell } from "@/components/layout/page-shell";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { cn } from "@/lib/utils";
import { Calendar, Mail, Link as LinkIcon, Share2, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PublicProfileProps {
  profile: Profile;
}

export function PublicProfile({ profile }: PublicProfileProps) {
  const displayName = profile.name || profile.username || 'User';
  const avatarUrl = profile.avatar_url;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!');
  };

  return (
    <PageShell contentClassName="relative min-h-screen">
      {/* Dynamic Background Gradient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-primary/40 to-transparent blur-[120px]" />
      </div>

      <main className="container max-w-4xl mx-auto px-6 pt-24 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-card border-4 border-background ring-1 ring-primary/10">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized={avatarUrl.startsWith('data:')}
                    priority
                  />
                ) : (
                  <div className="w-full h-full p-8">
                    <DefaultAvatar className="w-full h-full" />
                  </div>
                )}
              </div>

              {/* Online Indicator Badge */}
              <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-2xl">
                <div className="bg-green-500 text-[10px] font-bold text-white px-3 py-1 rounded-xl uppercase tracking-wider animate-pulse">
                  Live Now
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h1 className="font-vt323 text-4xl text-primary leading-none uppercase tracking-tight">
                  {displayName}
                </h1>
                <p className="font-mono text-sm text-muted-foreground opacity-70">
                  u/{profile.username}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-lato text-xs h-9 bg-primary/5 border-primary/10 hover:bg-primary/10"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" />
                  Share Profile
                </Button>
              </div>
            </motion.div>

            {/* Account Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-3xl bg-primary/[0.02] border border-primary/5 space-y-4"
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-lato">
                <Calendar className="w-4 h-4 text-primary/60" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-lato">
                <ShieldCheck className="w-4 h-4 text-primary/60" />
                <span className="capitalize">{profile.role || 'Member'} // Identity Verified</span>
              </div>
              {profile.website && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-lato">
                  <Globe className="w-4 h-4 text-primary/60" />
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors truncate"
                  >
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Bio, Interests, Collections */}
          <div className="lg:col-span-8 space-y-12">

            {/* Biography Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-[0.2em]">~/ Biography</h2>
              <div className="p-8 rounded-[2rem] bg-card border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <span className="font-vt323 text-6xl select-none">"</span>
                </div>
                <p className="font-lato text-xl leading-relaxed text-foreground/90 selection:bg-primary/20">
                  {profile.bio || "No biography provided yet. This user is keeping their mystery alive..."}
                </p>
              </div>
            </motion.section>

            {/* Interests Section */}
            {profile.interests && profile.interests.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-[0.2em]">~/ Focus Area</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.interests.map((interest, idx) => (
                    <div
                      key={interest}
                      className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary font-vt323 text-lg lowercase transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105 cursor-default"
                    >
                      #{interest}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Gallery Placeholder / Collections */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-[0.2em]">~/ Latest Work</h2>
                <Button variant="ghost" size="sm" className="font-vt323 text-lg hover:text-primary uppercase tracking-wider">View All &rarr;</Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-primary/[0.03] border border-dashed border-primary/20 flex items-center justify-center group hover:border-primary/50 transition-all">
                    <div className="text-center space-y-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-8 h-8 mx-auto text-primary" />
                      <span className="font-vt323 text-sm uppercase tracking-tighter">Encrypted // Cell</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>
        </div>
      </main>

      {/* Signature Footer */}
      <footer className="py-20 text-center relative z-10 opacity-30 select-none pointer-events-none">
        <div className="font-vt323 text-lg uppercase tracking-[0.5em] mb-2">Avalansa Framework // v2.6</div>
        <div className="text-[10px] uppercase tracking-[0.4em] font-medium">Digital Identity Protocol &bull; 2026</div>
      </footer>
    </PageShell>
  );
}

// Sub-components used in the layout
function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  )
}


