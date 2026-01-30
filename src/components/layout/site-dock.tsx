"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Library,
    Sparkles,
    FlaskConical,
    Settings2,
    User,
    Globe,
    ExternalLink,
    Orbit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
    { id: "home", label: "Home", href: "/", icon: Orbit },
    { id: "library", label: "Library", href: "/library", icon: Library },
    { id: "imagine", label: "Imagine", href: "/imagine", icon: Sparkles },
    { id: "labs", label: "Labs", href: "/labs", icon: FlaskConical },
];

export function SiteDock() {
    const pathname = usePathname();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [username, setUsername] = React.useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();
                if (profile?.username) {
                    setUsername(profile.username);
                }
            }
        }
        fetchProfile();
    }, []);

    const isImaginePage = pathname === "/imagine";

    const handleItemClick = (e: React.MouseEvent, item: typeof NAV_ITEMS[0]) => {
        if (item.id === "imagine" && isImaginePage) {
            e.preventDefault();
            toggleInputVisibility();
        } else if (item.id === "imagine") {
            setActiveTab("imagine");
        }
    };

    if (isInputVisible && isImaginePage) return null;

    const renderNavItem = (item: typeof NAV_ITEMS[0]) => {
        const isImagine = item.id === "imagine";
        const isActive = pathname === item.href || (isImagine && isImaginePage && isInputVisible);

        return (
            <Link
                key={item.id}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={(e) => handleItemClick(e, item)}
                className="relative flex items-center h-10 group"
            >
                {/* Pulsing Neural Aura for Imagine */}
                {isImagine && (
                    <motion.div
                        animate={{
                            opacity: [0.2, 0.5, 0.2],
                            scale: [0.9, 1.1, 0.9],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-[#4285F4]/40 via-[#9B72CB]/40 to-[#D96570]/40 blur-2xl rounded-full -z-10"
                    />
                )}

                <motion.div
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={cn(
                        "flex items-center justify-center rounded-full transition-all duration-300 overflow-hidden relative z-10",
                        isActive
                            ? "bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] px-4 shadow-[0_0_25px_rgba(155,114,203,0.5)] bg-[length:200%_auto] animate-gradient"
                            : "w-10 text-white/40 hover:text-white/80"
                    )}
                >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "transition-transform group-hover:scale-110")} />
                    <AnimatePresence mode="popLayout">
                        {isActive && (
                            <motion.span
                                initial={{ opacity: 0, x: -10, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: "auto" }}
                                exit={{ opacity: 0, x: -10, width: 0 }}
                                className="ml-2 text-sm font-medium text-white whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            </Link>
        );
    };

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <motion.div
                layout
                className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/40 border border-white/10 shadow-2xl backdrop-blur-3xl"
            >
                {NAV_ITEMS.map(renderNavItem)}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={() => setHoveredItem("tools")}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={cn(
                                "relative flex items-center h-10 transition-all duration-300 group rounded-full",
                                pathname.startsWith("/tools")
                                    ? "bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] px-4 shadow-[0_0_25px_rgba(155,114,203,0.5)]"
                                    : "w-10 text-white/40 hover:text-white/80"
                            )}
                        >
                            <Globe className={cn("w-5 h-5", pathname.startsWith("/tools") ? "text-white" : "transition-transform group-hover:scale-110")} />
                            <AnimatePresence>
                                {pathname.startsWith("/tools") && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10, width: 0 }}
                                        animate={{ opacity: 1, x: 0, width: "auto" }}
                                        exit={{ opacity: 0, x: -10, width: 0 }}
                                        className="ml-2 text-sm font-medium text-white"
                                    >
                                        Tools
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" className="mb-4 min-w-[200px] p-2 bg-black/60 backdrop-blur-3xl border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-white/10 text-white/70 hover:text-white py-2.5 px-3">
                            <Link href="/tools/x-preview" className="flex items-center justify-between w-full group/item">
                                <span className="flex items-center gap-3 font-medium">
                                    <div className="w-8 h-8 rounded-lg bg-[#007AFF]/20 flex items-center justify-center border border-[#007AFF]/30">
                                        <Sparkles className="w-4 h-4 text-[#007AFF]" />
                                    </div>
                                    X Preview
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open("/tools/x-preview", "_blank");
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full"
                                >
                                    <ExternalLink className="w-4 h-4 text-white/50" />
                                </button>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                        href={username ? `/u/${username}` : "/onboarding"}
                        onMouseEnter={() => setHoveredItem("profile")}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                            "relative flex items-center h-10 transition-all duration-300 group rounded-full",
                            (username && pathname === `/u/${username}`)
                                ? "bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] px-4 shadow-[0_0_25px_rgba(155,114,203,0.5)]"
                                : "w-10 text-white/40 hover:text-white/80"
                        )}
                    >
                        <User className={cn("w-5 h-5", (username && pathname === `/u/${username}`) ? "text-white" : "transition-transform group-hover:scale-110")} />
                        <AnimatePresence>
                            {(username && pathname === `/u/${username}`) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: "auto" }}
                                    exit={{ opacity: 0, x: -10, width: 0 }}
                                    className="ml-2 text-sm font-medium text-white"
                                >
                                    Profile
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                        href={username ? `/u/${username}/settings` : "/onboarding"}
                        onMouseEnter={() => setHoveredItem("settings")}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                            "relative flex items-center h-10 transition-all duration-300 group rounded-full",
                            (username && pathname === `/u/${username}/settings`)
                                ? "bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] px-4 shadow-[0_0_25px_rgba(155,114,203,0.5)]"
                                : "w-10 text-white/40 hover:text-white/80"
                        )}
                    >
                        <Settings2 className={cn("w-5 h-5", (username && pathname === `/u/${username}/settings`) ? "text-white" : "transition-transform group-hover:scale-110")} />
                        <AnimatePresence>
                            {(username && pathname === `/u/${username}/settings`) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: "auto" }}
                                    exit={{ opacity: 0, x: -10, width: 0 }}
                                    className="ml-2 text-sm font-medium text-white"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
