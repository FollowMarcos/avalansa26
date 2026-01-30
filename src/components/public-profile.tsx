'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import type { Profile } from '@/types/database';
import { PageShell } from "@/components/layout/page-shell";

interface PublicProfileProps {
  profile: Profile;
}

export function PublicProfile({ profile }: PublicProfileProps) {
  const displayName = profile.name || profile.username;

  return (
    <PageShell contentClassName="items-center justify-center px-6 py-20">
      <main className="flex flex-col items-center max-w-md w-full z-10 space-y-10">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {profile.avatar_url ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-border">
              <Image
                src={profile.avatar_url!}
                alt={displayName || 'Profile'}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
              <span className="text-3xl font-medium text-muted-foreground uppercase">
                {(profile.username || 'U').charAt(0)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Name & Username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-2"
        >
          {profile.name && (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {profile.name}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="text-sm text-foreground/80 leading-relaxed max-w-sm">
              {profile.bio}
            </p>
          </motion.div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-2"
          >
            {profile.interests.map((interest, index) => (
              <motion.span
                key={interest}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.4 + index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground bg-muted/50 rounded-full border border-border/50 hover:bg-muted hover:text-foreground transition-colors"
              >
                {interest}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Join date */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
            Joined{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-12 mt-auto text-xs uppercase tracking-[0.4em] text-muted-foreground/50 font-medium select-none">
        Avalansa &bull; {new Date().getFullYear()}
      </footer>
    </PageShell>
  );
}

