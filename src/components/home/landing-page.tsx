"use client";

import { GoogleSignInButton } from "@/components/google-signin-button"
import Image from 'next/image'
import { motion } from "motion/react"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, Sparkles } from "lucide-react"

interface LandingPageProps {
    user: User | null;
}

export function LandingPage({ user }: LandingPageProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            // Update local storage with user info for "last logged in" feature when they log out later
            try {
                if (user.email) {
                    localStorage.setItem('last_google_user', user.email);
                    // Also store name and avatar if available
                    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

                    if (fullName) localStorage.setItem('last_google_user_name', fullName);
                    if (avatarUrl) localStorage.setItem('last_google_user_avatar', avatarUrl);
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    }, [user]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
    };

    if (!mounted) return null; // Avoid hydration mismatch on initial render if any

    return (
        <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground px-6 py-12 selection:bg-primary/10 relative overflow-hidden">
            {/* Analog Grain Texture - Static layer, minimal performance impact */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-multiply bg-noise"></div>

            <main className="flex flex-col items-center max-w-2xl w-full space-y-12 text-center relative z-10">

                {user ? (
                    /* LOGGED IN VIEW */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-8 w-full"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20"></div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-xl"
                            >
                                {user.user_metadata?.avatar_url ? (
                                    <Image
                                        src={user.user_metadata.avatar_url}
                                        alt={user.user_metadata.full_name || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                                        {(user.email?.[0] || 'U').toUpperCase()}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        <div className="space-y-2">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="font-vt323 text-4xl md:text-5xl text-primary"
                            >
                                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="font-lato text-muted-foreground"
                            >
                                Ready to create something amazing today?
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
                        >
                            <Button asChild size="lg" className="rounded-full gap-2 text-base h-12 flex-1">
                                <Link href="/labs">
                                    <Sparkles className="w-4 h-4" />
                                    Go to Labs
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full gap-2 text-base h-12 flex-1">
                                <Link href="/dashboard">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors gap-2">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </Button>
                        </motion.div>

                    </motion.div>
                ) : (
                    /* GUEST VIEW (Original) */
                    <>
                        {/* Line 1: Logo + Create & Share */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-4 group cursor-default will-change-transform"
                        >
                            <motion.div
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="relative w-12 h-12"
                            >
                                <Image
                                    src="/ab.svg"
                                    alt="Avalansa"
                                    fill
                                    className="drop-shadow-sm"
                                    priority
                                />
                            </motion.div>
                            <h1 className="font-vt323 text-5xl md:text-6xl tracking-tight text-primary flex items-center text-balance">
                                Create & Share
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                    className="inline-block w-[0.5em] h-[1em] bg-primary ml-2 align-bottom will-change-opacity"
                                />
                            </h1>
                        </motion.div>

                        {/* Line 2: Slogan in Lato */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="font-lato text-base md:text-lg text-muted-foreground/80 leading-relaxed max-w-xl mx-auto font-normal will-change-transform text-pretty"
                        >
                            Save, share, and remix prompts. Showcase your art and generate beautiful content.
                        </motion.p>

                        {/* Line 3: Sign in or Sign up with (lines on each side) */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex items-center gap-4 w-full max-w-md will-change-transform"
                        >
                            <div className="h-[1px] flex-1 bg-primary/10" />
                            <span className="font-lato text-xs text-muted-foreground/60 whitespace-nowrap font-normal">
                                Sign or sign up with
                            </span>
                            <div className="h-[1px] flex-1 bg-primary/10" />
                        </motion.div>

                        {/* Line 4: Google Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="w-full max-w-[280px] will-change-transform"
                        >
                            <GoogleSignInButton />
                        </motion.div>
                    </>
                )}

            </main>

            {/* Footer at Bottom */}
            <footer className="absolute bottom-12 w-full px-12 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-foreground">
                    <div className="flex items-center gap-6 text-xs font-normal font-lato">
                        <span>&copy; {new Date().getFullYear()} Avalansa</span>
                    </div>

                    <div className="flex items-center gap-8 text-xs font-normal font-lato">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
