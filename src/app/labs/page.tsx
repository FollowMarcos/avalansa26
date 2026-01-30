'use client';

import Link from 'next/link';
import { Sparkles, Folder, Compass, MessageCircle, Mail, Image, Music, Settings, Phone, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { PageShell } from "@/components/layout/page-shell";

export default function LabsPage() {
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

            <main className="flex-1 pt-32 pb-48 px-8 relative z-10 w-full max-w-7xl mx-auto">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl font-light tracking-tight mb-2">Dock Explorations</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest opacity-60">20 Variations of Navigation Docks</p>
                </header>

                <div className="grid grid-cols-1 gap-16">
                    {dockDesigns.map((design, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-full max-w-4xl">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="text-xs font-mono text-muted-foreground/40">#{String(i + 1).padStart(2, '0')}</span>
                                    <span className="text-sm font-medium">{design.name}</span>
                                </div>
                                <div className="relative flex items-center justify-center p-12 rounded-2xl border border-white/5 bg-white/[0.02] min-h-[180px]">
                                    {design.component}
                                </div>
                                {design.description && (
                                    <p className="mt-3 text-xs text-muted-foreground/50 text-center">{design.description}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </PageShell>
    );
}

// macOS-inspired icon button component
const MacIcon = ({ icon: Icon, color, className = "" }: { icon: React.ElementType; color: string; className?: string }) => (
    <div
        className={`w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer ${className}`}
        style={{ background: color }}
    >
        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
    </div>
);

// Wavy lines SVG pattern for the special dock
const WavyPattern = () => (
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="wavy-lines" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <path
                    d="M0 10 Q10 5, 20 10 T40 10"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="0.5"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wavy-lines)" />
    </svg>
);

const dockDesigns = [
    // #1 - macOS Milky White with Wavy Lines (THE SPECIAL ONE)
    {
        name: "macOS Milky Dream",
        description: "Rounded corners, milky white background with subtle wavy lines — macOS-inspired icons",
        component: (
            <div className="relative flex items-center gap-2 p-3 rounded-[28px] overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f8f8f8 50%, #fefefe 100%)' }}>
                <WavyPattern />
                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 transition-transform hover:scale-110 cursor-pointer">
                        <Folder className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 transition-transform hover:scale-110 cursor-pointer">
                        <Compass className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-green-400 to-green-600 transition-transform hover:scale-110 cursor-pointer">
                        <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 transition-transform hover:scale-110 cursor-pointer">
                        <Mail className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400 transition-transform hover:scale-110 cursor-pointer">
                        <Image className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-pink-500 transition-transform hover:scale-110 cursor-pointer">
                        <Music className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-px h-10 bg-gray-200/50 mx-1" />
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-gray-600 to-gray-800 transition-transform hover:scale-110 cursor-pointer">
                        <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                </div>
            </div>
        )
    },

    // #2 - Glassmorphism Dark
    {
        name: "Glassmorphism Dark",
        description: "Frosted glass effect with deep blur and subtle border",
        component: (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <MacIcon icon={Folder} color="linear-gradient(135deg, #3b82f6, #1d4ed8)" />
                <MacIcon icon={Compass} color="linear-gradient(135deg, #06b6d4, #0284c7)" />
                <MacIcon icon={MessageCircle} color="linear-gradient(135deg, #22c55e, #16a34a)" />
                <MacIcon icon={Mail} color="linear-gradient(135deg, #3b82f6, #2563eb)" />
                <MacIcon icon={Music} color="linear-gradient(135deg, #f43f5e, #e11d48)" />
                <MacIcon icon={Settings} color="linear-gradient(135deg, #6b7280, #4b5563)" />
            </div>
        )
    },

    // #3 - Pill Minimal
    {
        name: "Pill Minimal",
        description: "Ultra-minimal pill-shaped dock with monochrome icons",
        component: (
            <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900 shadow-xl">
                <Folder className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                <Compass className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                <MessageCircle className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                <Mail className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                <Music className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                <Settings className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            </div>
        )
    },

    // #4 - Floating Islands
    {
        name: "Floating Islands",
        description: "Separated icon groups floating independently",
        component: (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 shadow-lg">
                    <MacIcon icon={Folder} color="#3b82f6" />
                    <MacIcon icon={Compass} color="#0ea5e9" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 shadow-lg">
                    <MacIcon icon={MessageCircle} color="#22c55e" />
                    <MacIcon icon={Mail} color="#3b82f6" />
                    <MacIcon icon={Music} color="#f43f5e" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 shadow-lg">
                    <MacIcon icon={Settings} color="#6b7280" />
                </div>
            </div>
        )
    },

    // #5 - Vertical Stack
    {
        name: "Vertical Stack",
        description: "Side-aligned vertical dock like classic macOS",
        component: (
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl">
                <MacIcon icon={Folder} color="linear-gradient(135deg, #3b82f6, #1d4ed8)" />
                <MacIcon icon={Compass} color="linear-gradient(135deg, #06b6d4, #0284c7)" />
                <MacIcon icon={MessageCircle} color="linear-gradient(135deg, #22c55e, #16a34a)" />
                <div className="w-10 h-px bg-zinc-300 dark:bg-zinc-600 my-1" />
                <MacIcon icon={Mail} color="linear-gradient(135deg, #3b82f6, #2563eb)" />
                <MacIcon icon={Music} color="linear-gradient(135deg, #f43f5e, #e11d48)" />
                <MacIcon icon={Settings} color="linear-gradient(135deg, #6b7280, #4b5563)" />
            </div>
        )
    },

    // #6 - Brutalist
    {
        name: "Brutalist",
        description: "Raw, bold design with hard edges and stark contrast",
        component: (
            <div className="flex items-center gap-0 border-4 border-black dark:border-white">
                <div className="w-14 h-14 flex items-center justify-center border-r-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <Folder className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
                <div className="w-14 h-14 flex items-center justify-center border-r-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <Compass className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
                <div className="w-14 h-14 flex items-center justify-center border-r-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <MessageCircle className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
                <div className="w-14 h-14 flex items-center justify-center border-r-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <Mail className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
                <div className="w-14 h-14 flex items-center justify-center border-r-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <Music className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
                <div className="w-14 h-14 flex items-center justify-center bg-white dark:bg-black hover:bg-black dark:hover:bg-white group cursor-pointer transition-colors">
                    <Settings className="w-6 h-6 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
            </div>
        )
    },

    // #7 - Neumorphic
    {
        name: "Neumorphic",
        description: "Soft UI with subtle shadows creating depth illusion",
        component: (
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-zinc-200 dark:bg-zinc-800" style={{ boxShadow: '8px 8px 16px #bebebe, -8px -8px 16px #ffffff' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <Folder className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <Compass className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <Music className="w-5 h-5 text-pink-500" />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 cursor-pointer transition-all hover:scale-105" style={{ boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' }}>
                    <Settings className="w-5 h-5 text-gray-500" />
                </div>
            </div>
        )
    },

    // #8 - Gradient Border
    {
        name: "Gradient Border",
        description: "Vibrant gradient border with dark interior",
        component: (
            <div className="p-[2px] rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
                <div className="flex items-center gap-3 p-4 rounded-[22px] bg-zinc-900">
                    <MacIcon icon={Folder} color="#3b82f6" />
                    <MacIcon icon={Compass} color="#0ea5e9" />
                    <MacIcon icon={MessageCircle} color="#22c55e" />
                    <MacIcon icon={Mail} color="#3b82f6" />
                    <MacIcon icon={Music} color="#f43f5e" />
                    <MacIcon icon={Settings} color="#6b7280" />
                </div>
            </div>
        )
    },

    // #9 - Neon Glow
    {
        name: "Neon Glow",
        description: "Cyberpunk-inspired neon glowing icons",
        component: (
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-black border border-purple-500/30">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-cyan-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #22d3ee, inset 0 0 10px #22d3ee33' }}>
                    <Folder className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px #22d3ee)' }} />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-pink-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #f472b6, inset 0 0 10px #f472b633' }}>
                    <Compass className="w-5 h-5 text-pink-400" style={{ filter: 'drop-shadow(0 0 8px #f472b6)' }} />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-green-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #4ade80, inset 0 0 10px #4ade8033' }}>
                    <MessageCircle className="w-5 h-5 text-green-400" style={{ filter: 'drop-shadow(0 0 8px #4ade80)' }} />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-purple-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #c084fc, inset 0 0 10px #c084fc33' }}>
                    <Mail className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px #c084fc)' }} />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-yellow-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #facc15, inset 0 0 10px #facc1533' }}>
                    <Music className="w-5 h-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-transparent border border-orange-400 cursor-pointer transition-all hover:scale-110" style={{ boxShadow: '0 0 20px #fb923c, inset 0 0 10px #fb923c33' }}>
                    <Settings className="w-5 h-5 text-orange-400" style={{ filter: 'drop-shadow(0 0 8px #fb923c)' }} />
                </div>
            </div>
        )
    },

    // #10 - Retro Pixel
    {
        name: "Retro Pixel",
        description: "8-bit inspired pixelated aesthetic",
        component: (
            <div className="flex items-center gap-1 p-2 bg-zinc-800 border-4 border-zinc-600" style={{ imageRendering: 'pixelated' }}>
                <div className="w-12 h-12 flex items-center justify-center bg-blue-600 border-2 border-blue-400 cursor-pointer hover:bg-blue-500 transition-colors">
                    <Folder className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-cyan-600 border-2 border-cyan-400 cursor-pointer hover:bg-cyan-500 transition-colors">
                    <Compass className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-green-600 border-2 border-green-400 cursor-pointer hover:bg-green-500 transition-colors">
                    <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-purple-600 border-2 border-purple-400 cursor-pointer hover:bg-purple-500 transition-colors">
                    <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-red-600 border-2 border-red-400 cursor-pointer hover:bg-red-500 transition-colors">
                    <Music className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-gray-600 border-2 border-gray-400 cursor-pointer hover:bg-gray-500 transition-colors">
                    <Settings className="w-6 h-6 text-white" />
                </div>
            </div>
        )
    },

    // #11 - Material Design
    {
        name: "Material Design",
        description: "Google's Material Design with elevation and ripple hints",
        component: (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500 shadow-lg shadow-blue-500/30 cursor-pointer hover:shadow-blue-500/50 transition-shadow">
                    <Folder className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-500 shadow-lg shadow-teal-500/30 cursor-pointer hover:shadow-teal-500/50 transition-shadow">
                    <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 shadow-lg shadow-green-500/30 cursor-pointer hover:shadow-green-500/50 transition-shadow">
                    <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500 shadow-lg shadow-indigo-500/30 cursor-pointer hover:shadow-indigo-500/50 transition-shadow">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-500 shadow-lg shadow-pink-500/30 cursor-pointer hover:shadow-pink-500/50 transition-shadow">
                    <Music className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-500 shadow-lg shadow-gray-500/30 cursor-pointer hover:shadow-gray-500/50 transition-shadow">
                    <Settings className="w-5 h-5 text-white" />
                </div>
            </div>
        )
    },

    // #12 - Frosted White
    {
        name: "Frosted White",
        description: "Light mode frosted glass with subtle shadows",
        component: (
            <div className="flex items-center gap-3 p-4 rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-600 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <Music className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <Settings className="w-5 h-5 text-white" />
                </div>
            </div>
        )
    },

    // #13 - Outlined Wireframe
    {
        name: "Outlined Wireframe",
        description: "Minimalist wireframe with outlined icons",
        component: (
            <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-zinc-300 dark:border-zinc-600 bg-transparent">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-blue-500 cursor-pointer hover:bg-blue-500/10 transition-colors">
                    <Folder className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-cyan-500 cursor-pointer hover:bg-cyan-500/10 transition-colors">
                    <Compass className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-green-500 cursor-pointer hover:bg-green-500/10 transition-colors">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500/10 transition-colors">
                    <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-pink-500 cursor-pointer hover:bg-pink-500/10 transition-colors">
                    <Music className="w-5 h-5 text-pink-500" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-gray-500 cursor-pointer hover:bg-gray-500/10 transition-colors">
                    <Settings className="w-5 h-5 text-gray-500" />
                </div>
            </div>
        )
    },

    // #14 - Rainbow Gradient
    {
        name: "Rainbow Gradient",
        description: "Full spectrum gradient dock with white icons",
        component: (
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-xl">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Folder className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Music className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Settings className="w-5 h-5 text-white" />
                </div>
            </div>
        )
    },

    // #15 - Monochrome Elegant
    {
        name: "Monochrome Elegant",
        description: "Single-tone sophisticated design",
        component: (
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Folder className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Compass className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <MessageCircle className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Mail className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Music className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Settings className="w-5 h-5 text-zinc-400" />
                </div>
            </div>
        )
    },

    // #16 - Aurora Gradient
    {
        name: "Aurora Gradient",
        description: "Northern lights inspired gradient background",
        component: (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 shadow-xl shadow-cyan-500/20">
                <MacIcon icon={Folder} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
                <MacIcon icon={Compass} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
                <MacIcon icon={MessageCircle} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
                <MacIcon icon={Mail} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
                <MacIcon icon={Music} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
                <MacIcon icon={Settings} color="rgba(255,255,255,0.25)" className="backdrop-blur-md" />
            </div>
        )
    },

    // #17 - Stacked Cards
    {
        name: "Stacked Cards",
        description: "Layered card effect with depth perception",
        component: (
            <div className="relative">
                <div className="absolute inset-0 translate-y-2 translate-x-2 flex items-center gap-3 p-4 rounded-2xl bg-zinc-300 dark:bg-zinc-700" />
                <div className="absolute inset-0 translate-y-1 translate-x-1 flex items-center gap-3 p-4 rounded-2xl bg-zinc-200 dark:bg-zinc-600" />
                <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg">
                    <MacIcon icon={Folder} color="#3b82f6" />
                    <MacIcon icon={Compass} color="#0ea5e9" />
                    <MacIcon icon={MessageCircle} color="#22c55e" />
                    <MacIcon icon={Mail} color="#6366f1" />
                    <MacIcon icon={Music} color="#ec4899" />
                    <MacIcon icon={Settings} color="#6b7280" />
                </div>
            </div>
        )
    },

    // #18 - Minimal Dots
    {
        name: "Minimal Dots",
        description: "Extremely minimal with dot indicators",
        component: (
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-6 px-8 py-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Folder className="w-6 h-6 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 cursor-pointer transition-colors" />
                    <Compass className="w-6 h-6 text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 cursor-pointer transition-colors" />
                    <MessageCircle className="w-6 h-6 text-zinc-600 dark:text-zinc-300 hover:text-green-500 cursor-pointer transition-colors" />
                    <Mail className="w-6 h-6 text-blue-500 cursor-pointer" />
                    <Music className="w-6 h-6 text-zinc-600 dark:text-zinc-300 hover:text-pink-500 cursor-pointer transition-colors" />
                    <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-300 hover:text-gray-500 cursor-pointer transition-colors" />
                </div>
                <div className="flex items-center gap-6 px-8">
                    <div className="w-1 h-1 rounded-full bg-transparent" />
                    <div className="w-1 h-1 rounded-full bg-transparent" />
                    <div className="w-1 h-1 rounded-full bg-transparent" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div className="w-1 h-1 rounded-full bg-transparent" />
                    <div className="w-1 h-1 rounded-full bg-transparent" />
                </div>
            </div>
        )
    },

    // #19 - Windows 11 Inspired
    {
        name: "Windows 11 Inspired",
        description: "Microsoft's Fluent Design with mica effect",
        component: (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <Folder className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <Music className="w-5 h-5 text-orange-500" />
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </div>
            </div>
        )
    },

    // #20 - iOS Dock
    {
        name: "iOS Dock",
        description: "Apple iOS-style dock with squircle icons",
        component: (
            <div className="flex items-center gap-4 p-4 rounded-[32px] bg-white/30 dark:bg-black/30 backdrop-blur-2xl border border-white/20 shadow-xl">
                <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <Compass className="w-7 h-7 text-white" />
                </div>
                <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-gradient-to-br from-red-400 via-pink-500 to-red-600 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <Music className="w-7 h-7 text-white" />
                </div>
            </div>
        )
    },
];
