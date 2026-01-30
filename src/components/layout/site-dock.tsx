"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Library, Sparkles, FlaskConical, Settings, User, ExternalLink, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import { motion } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DockType } from "@/types/database";
import { getDockPreferences } from "@/utils/supabase/dock-preferences.client";

// Wavy lines SVG pattern for Milky Dream style
const WavyPattern = ({ dark = false }: { dark?: boolean }) => (
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`wavy-dock-${dark ? 'dark' : 'light'}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <path
                    d="M0 10 Q10 5, 20 10 T40 10"
                    fill="none"
                    stroke={dark ? '#3f3f46' : '#d1d5db'}
                    strokeWidth="0.5"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wavy-dock-${dark ? 'dark' : 'light'})`} />
    </svg>
);

export function SiteDock() {
    const pathname = usePathname();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [username, setUsername] = React.useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const [dockType, setDockType] = React.useState<DockType>('milky_dream_light');

    React.useEffect(() => {
        async function fetchProfileAndPreferences() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();
                if (profile?.username) {
                    setUsername(profile.username);
                }

                // Load dock preferences
                const prefs = await getDockPreferences();
                if (prefs?.dock_type) {
                    setDockType(prefs.dock_type);
                }
            } else {
                setIsAuthenticated(false);
            }
        }
        fetchProfileAndPreferences();
    }, []);

    const isImaginePage = pathname === "/imagine";
    const isDark = dockType.includes('dark');
    const isFloating = dockType.includes('floating');

    const handleImagineClick = (e: React.MouseEvent) => {
        if (isImaginePage) {
            e.preventDefault();
            toggleInputVisibility();
        } else {
            setActiveTab("imagine");
        }
    };

    // Don't render dock for unauthenticated users or while checking auth
    if (isAuthenticated === null || isAuthenticated === false) return null;
    if (isInputVisible && isImaginePage) return null;

    // Icon button component
    const IconButton = ({
        href,
        label,
        gradient,
        isActive,
        onClick,
        children
    }: {
        href: string;
        label: string;
        gradient: string;
        isActive: boolean;
        onClick?: (e: React.MouseEvent) => void;
        children: React.ReactNode;
    }) => (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg",
                gradient,
                isActive ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
            )}
            aria-label={label}
        >
            {children}
        </Link>
    );

    // Floating Islands Layout
    if (isFloating) {
        const containerClass = isDark
            ? "bg-zinc-900/90 border-zinc-700/50"
            : "bg-white/90 border-zinc-200/50";

        return (
            <div className="flex items-center justify-center pointer-events-auto">
                <div className="flex items-center gap-3">
                    {/* Main nav group */}
                    <div className={cn("flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg", containerClass)}>
                        {/* Home */}
                        <IconButton href="/" label="Home" gradient="bg-white dark:bg-zinc-100" isActive={pathname === "/"}>
                            <div className="relative w-6 h-6">
                                <Image src="/ab.svg" alt="Logo" fill className="object-contain" />
                            </div>
                        </IconButton>

                        {/* Library */}
                        <IconButton href="/library" label="Library" gradient="bg-gradient-to-br from-blue-400 to-blue-600" isActive={pathname === "/library"}>
                            <Library className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </IconButton>

                        {/* Imagine */}
                        <div className="relative group/imagine">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-md opacity-40 group-hover/imagine:opacity-80 transition-opacity rounded-[12px]" />
                            <Link
                                href="/imagine"
                                onClick={handleImagineClick}
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                                    pathname === "/imagine" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                )}
                                aria-label="Imagine"
                            >
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-[12px]"
                                />
                                <Sparkles className="w-6 h-6 text-white relative z-10" strokeWidth={1.5} />
                            </Link>
                        </div>

                        {/* Labs */}
                        <IconButton href="/labs" label="Labs" gradient="bg-gradient-to-br from-orange-400 to-orange-600" isActive={pathname === "/labs"}>
                            <FlaskConical className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </IconButton>
                    </div>

                    {/* Tools group */}
                    <div className={cn("flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg", containerClass)}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600",
                                        pathname.startsWith("/tools") ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                    )}
                                    aria-label="Tools"
                                >
                                    <Hammer className="w-6 h-6 text-white" strokeWidth={1.5} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="center" className="mb-2 min-w-[170px] p-1.5 bg-background/80 backdrop-blur-3xl border-border rounded-2xl shadow-2xl">
                                <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer focus:bg-primary/10">
                                    <Link href="/tools/x-preview" className="flex items-center justify-between w-full group/item py-2 px-3">
                                        <span className="flex items-center gap-2.5 font-medium">
                                            <div className="w-6 h-6 rounded-[7px] bg-[#5856D6] flex items-center justify-center shadow-sm">
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            X Preview
                                        </span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); window.open("/tools/x-preview", "_blank"); }}
                                            className="opacity-0 group-hover/item:opacity-100 hover:text-primary transition-opacity p-1"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* User group */}
                    <div className={cn("flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg", containerClass)}>
                        <IconButton
                            href={username ? `/u/${username}` : "/onboarding"}
                            label="Profile"
                            gradient="bg-gradient-to-br from-green-400 to-green-600"
                            isActive={pathname === `/u/${username}`}
                        >
                            <User className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </IconButton>

                        <IconButton
                            href={username ? `/u/${username}/settings` : "/onboarding"}
                            label="Settings"
                            gradient="bg-gradient-to-br from-gray-600 to-gray-800"
                            isActive={username ? pathname === `/u/${username}/settings` : false}
                        >
                            <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </IconButton>
                    </div>
                </div>
            </div>
        );
    }

    // Milky Dream Layout
    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div
                className={cn(
                    "relative flex items-center gap-2 p-3 rounded-[28px] overflow-hidden shadow-2xl",
                    isDark
                        ? "bg-[#111111]"
                        : "bg-gradient-to-br from-[#fefefe] via-[#f8f8f8] to-[#fefefe]"
                )}
            >
                <WavyPattern dark={isDark} />

                <div className="relative z-10 flex items-center gap-2">
                    {/* Home */}
                    <IconButton href="/" label="Home" gradient="bg-white dark:bg-zinc-100" isActive={pathname === "/"}>
                        <div className="relative w-6 h-6">
                            <Image src="/ab.svg" alt="Logo" fill className="object-contain" />
                        </div>
                    </IconButton>

                    {/* Library */}
                    <IconButton href="/library" label="Library" gradient="bg-gradient-to-br from-blue-400 to-blue-600" isActive={pathname === "/library"}>
                        <Library className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </IconButton>

                    {/* Imagine */}
                    <div className="relative group/imagine">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-md opacity-40 group-hover/imagine:opacity-80 transition-opacity rounded-[12px]" />
                        <Link
                            href="/imagine"
                            onClick={handleImagineClick}
                            className={cn(
                                "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                                pathname === "/imagine" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                            )}
                            aria-label="Imagine"
                        >
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-[12px]"
                            />
                            <Sparkles className="w-6 h-6 text-white relative z-10" strokeWidth={1.5} />
                        </Link>
                    </div>

                    {/* Labs */}
                    <IconButton href="/labs" label="Labs" gradient="bg-gradient-to-br from-orange-400 to-orange-600" isActive={pathname === "/labs"}>
                        <FlaskConical className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </IconButton>

                    {/* Tools */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600",
                                    pathname.startsWith("/tools") ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                )}
                                aria-label="Tools"
                            >
                                <Hammer className="w-6 h-6 text-white" strokeWidth={1.5} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center" className="mb-2 min-w-[170px] p-1.5 bg-background/80 backdrop-blur-3xl border-border rounded-2xl shadow-2xl">
                            <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer focus:bg-primary/10">
                                <Link href="/tools/x-preview" className="flex items-center justify-between w-full group/item py-2 px-3">
                                    <span className="flex items-center gap-2.5 font-medium">
                                        <div className="w-6 h-6 rounded-[7px] bg-[#5856D6] flex items-center justify-center shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        X Preview
                                    </span>
                                    <button
                                        onClick={(e) => { e.preventDefault(); window.open("/tools/x-preview", "_blank"); }}
                                        className="opacity-0 group-hover/item:opacity-100 hover:text-primary transition-opacity p-1"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Divider */}
                    <div className={cn("w-px h-10 mx-1", isDark ? "bg-zinc-700/50" : "bg-gray-200/50")} />

                    {/* Profile */}
                    <IconButton
                        href={username ? `/u/${username}` : "/onboarding"}
                        label="Profile"
                        gradient="bg-gradient-to-br from-green-400 to-green-600"
                        isActive={pathname === `/u/${username}`}
                    >
                        <User className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </IconButton>

                    {/* Settings */}
                    <IconButton
                        href={username ? `/u/${username}/settings` : "/onboarding"}
                        label="Settings"
                        gradient="bg-gradient-to-br from-gray-600 to-gray-800"
                        isActive={username ? pathname === `/u/${username}/settings` : false}
                    >
                        <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </IconButton>
                </div>
            </div>
        </div>
    );
}
