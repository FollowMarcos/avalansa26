"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Library, Sparkles, FlaskConical, Settings, User, ChevronUp, ExternalLink, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
    { id: "home", label: "Home", href: "/", icon: null }, // Icon replaced by logo
    { icon: Library, id: "library", label: "Library", href: "/library" },
    { icon: Sparkles, id: "imagine", label: "Imagine", href: "/imagine" },
    { icon: FlaskConical, id: "labs", label: "Labs", href: "/labs" },
];

export function SiteDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [username, setUsername] = React.useState<string | null>(null);

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

    // On the imagine page, we have special behavior for the sparkles button
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

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-2 p-2 rounded-[24px] bg-background/80 border border-border shadow-2xl backdrop-blur-2xl">
                {/* Home / Logo */}
                <Link
                    href="/"
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm",
                        "bg-white dark:bg-zinc-100",
                        pathname === "/" ? "scale-110 shadow-lg ring-2 ring-white/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Home"
                >
                    <div className="relative w-6 h-6">
                        <Image
                            src="/ab.svg"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </Link>

                {/* Library */}
                <Link
                    href="/library"
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-[#007AFF]",
                        pathname === "/library" ? "scale-110 shadow-lg ring-2 ring-[#007AFF]/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Library"
                >
                    <Library className="w-5 h-5 text-white" />
                </Link>

                {/* Imagine */}
                <Link
                    href="/imagine"
                    onClick={(e) => handleItemClick(e, { id: "imagine", label: "Imagine", href: "/imagine", icon: Sparkles })}
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                        (pathname === "/imagine" || (isImaginePage && isInputVisible)) ? "scale-110 shadow-lg ring-2 ring-[#AF52DE]/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Imagine"
                >
                    <Sparkles className="w-5 h-5 text-white" />
                </Link>

                {/* Labs */}
                <Link
                    href="/labs"
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-[#FF9500]",
                        pathname === "/labs" ? "scale-110 shadow-lg ring-2 ring-[#FF9500]/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Labs"
                >
                    <FlaskConical className="w-5 h-5 text-white" />
                </Link>

                {/* Tools Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-[#FF2D55]",
                                pathname.startsWith("/tools") ? "scale-110 shadow-lg ring-2 ring-[#FF2D55]/50" : "hover:scale-105 active:scale-95"
                            )}
                            aria-label="Tools"
                        >
                            <Hammer className="w-5 h-5 text-white" />
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
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open("/tools/x-preview", "_blank");
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 hover:text-primary transition-opacity p-1"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Profile Link */}
                <Link
                    href={username ? `/u/${username}` : "/onboarding"}
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-[#34C759]",
                        pathname === `/u/${username}` ? "scale-110 shadow-lg ring-2 ring-[#34C759]/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Profile"
                >
                    <User className="w-5 h-5 text-white" />
                </Link>

                {/* Settings link */}
                <Link
                    href={username ? `/u/${username}/settings` : "/onboarding"}
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-[11px] transition-all duration-300 group overflow-hidden shadow-sm bg-[#8E8E93]",
                        (username && pathname === `/u/${username}/settings`) ? "scale-110 shadow-lg ring-2 ring-[#8E8E93]/50" : "hover:scale-105 active:scale-95"
                    )}
                    aria-label="Settings"
                >
                    <Settings className="w-5 h-5 text-white" />
                </Link>
            </div>
        </div>
    );
}

