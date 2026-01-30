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
            <div className="flex items-center gap-1 p-1.5 rounded-full bg-background/80 border border-border shadow-xl backdrop-blur-2xl">
                {/* Home / Logo */}
                <Link
                    href="/"
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
                        pathname === "/"
                            ? "bg-foreground text-background shadow-md scale-110"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-label="Home"
                >
                    <div className="relative w-5 h-5">
                        <Image
                            src="/aw.svg"
                            alt="Logo"
                            fill
                            className={cn(
                                "object-contain transition-all",
                                pathname === "/" ? "invert dark:invert-0" : "opacity-70 group-hover:opacity-100"
                            )}
                        />
                    </div>
                    <span className="absolute -top-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        Home
                    </span>
                </Link>

                {/* Other Nav Items */}
                {NAV_ITEMS.slice(1).map((item) => {
                    const isImagine = item.id === "imagine";
                    const isActive = pathname === item.href || (isImagine && isImaginePage && isInputVisible);

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={(e) => handleItemClick(e, item)}
                            className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
                                isActive
                                    ? "bg-foreground text-background shadow-md scale-110"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            aria-label={item.label}
                        >
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span className="absolute -top-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* Tools Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group text-muted-foreground hover:bg-muted hover:text-foreground",
                                pathname.startsWith("/tools") && "bg-muted text-foreground"
                            )}
                            aria-label="Tools"
                        >
                            <Hammer className="w-5 h-5" />
                            <span className="absolute -top-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                Tools
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" className="mb-2 min-w-[160px] p-2 bg-background/80 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                            <Link href="/tools/x-preview" className="flex items-center justify-between w-full group/item">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    X Preview
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open("/tools/x-preview", "_blank");
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 hover:text-primary transition-opacity"
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
                        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
                        pathname.startsWith("/u/")
                            ? "bg-foreground text-background shadow-md scale-110"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-label="Profile"
                >
                    <User className="w-5 h-5" />
                    <span className="absolute -top-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        Profile
                    </span>
                </Link>

                {/* Settings button */}
                <button className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group relative">
                    <Settings className="w-5 h-5" />
                    <span className="absolute -top-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        Settings
                    </span>
                </button>
            </div>
        </div>
    );
}

