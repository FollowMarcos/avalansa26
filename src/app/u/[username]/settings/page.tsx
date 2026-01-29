"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getCurrentProfile, updateCurrentProfile } from "@/utils/supabase/profiles";
import type { Profile } from "@/types/database";
import {
    User,
    Settings,
    Bell,
    Shield,
    Palette,
    Globe,
    ArrowLeft,
    Camera,
    Check,
    Loader2,
    Monitor
} from "lucide-react";
import { useTheme } from "next-themes";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const usernameFromUrl = params.username as string;

    // Auth & Profile State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState("");
    const [userBio, setUserBio] = useState("");
    const [website, setWebsite] = useState(""); // Currently not in schema, will be mock
    const [discoverable, setDiscoverable] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const data = await getCurrentProfile();
            if (data) {
                // Security check: ensure user is viewing their own settings
                if (data.username && data.username.toLowerCase() !== usernameFromUrl.toLowerCase()) {
                    router.push('/dashboard');
                    return;
                }

                setProfile(data);
                setDisplayName(data.name || "");
                setUserBio(data.bio || "");
                // website is not in the current DB schema based on types/database.ts
                // discoverable corresponds to onboarding_completed or a new field? 
                // Let's assume discoverable is a mock for now or use a metadata field if we had one.
            } else {
                router.push('/');
            }
            setIsLoading(false);
        }
        loadProfile();
    }, [usernameFromUrl, router]);

    const handleSave = async () => {
        if (!profile) return;

        setIsSaving(true);

        try {
            const success = await updateCurrentProfile({
                name: displayName,
                bio: userBio,
            });

            if (success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Failed to save profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-background text-foreground selection:bg-primary/10 relative overflow-hidden flex flex-col">
            {/* Analog Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-multiply bg-noise"></div>

            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95">
                <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="Go back to profile">
                            <Link href={`/u/${usernameFromUrl}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="font-vt323 text-2xl tracking-tight text-primary uppercase">User // Settings</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-full min-w-[100px]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <Check className="h-4 w-4 mr-2" /> : null}
                            {isSaving ? "Saving…" : saved ? "Saved" : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container max-w-6xl mx-auto px-6 py-10 relative z-10">
                <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-12">
                    {/* Sidebar navigation */}
                    <div className="md:w-64 shrink-0">
                        <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                            {[
                                { id: "profile", label: "Profile", icon: User },
                                { id: "account", label: "Account", icon: Settings },
                                { id: "notifications", label: "Notifications", icon: Bell },
                                { id: "appearance", label: "Appearance", icon: Palette },
                                { id: "privacy", label: "Privacy & Security", icon: Shield },
                                { id: "language", label: "Language", icon: Globe },
                            ].map((item) => (
                                <TabsTrigger
                                    key={item.id}
                                    value={item.id}
                                    className="w-full justify-start gap-3 px-4 py-3 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all duration-300 font-lato"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <TabsContent value="profile" className="mt-0 space-y-8 focus-visible:outline-none">
                                <section className="space-y-6">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative group">
                                                <Avatar className="size-24 border-4 border-background ring-1 ring-primary/5">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-muted text-2xl font-bold">U</AvatarFallback>
                                                </Avatar>
                                                <button
                                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                    aria-label="Update profile picture"
                                                >
                                                    <Camera className="h-6 w-6 text-white" aria-hidden="true" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="font-vt323 text-xl text-primary text-balance">Profile Picture</h2>
                                                <p className="text-sm text-muted-foreground font-lato text-pretty">
                                                    PNG, JPG or GIF. Max 2MB.
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <Button variant="outline" size="sm" className="rounded-full font-lato h-8">Upload</Button>
                                                    <Button variant="ghost" size="sm" className="rounded-full font-lato h-8 text-destructive">Remove</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-primary/5" />

                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="display-name" className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Display Name</Label>
                                                <Input
                                                    id="display-name"
                                                    placeholder="Your name"
                                                    className="rounded-xl bg-primary/[0.02] border-primary/10 focus:bg-background transition-all h-12"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="username" className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                                                <div className="flex items-center">
                                                    <span className="px-3 py-2 bg-muted/50 border border-r-0 rounded-l-xl text-muted-foreground font-mono text-sm h-12 flex items-center">u/</span>
                                                    <Input id="username" placeholder="username" className="rounded-l-none rounded-r-xl bg-primary/[0.02] border-primary/10 focus:bg-background transition-all h-12" defaultValue={profile?.username || usernameFromUrl} disabled aria-describedby="username-hint" spellCheck={false} />
                                                </div>
                                                <p id="username-hint" className="text-[11px] text-muted-foreground font-lato italic text-pretty">Your public profile will be at avalansa.com/u/{profile?.username || usernameFromUrl}</p>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="bio" className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                                                <Textarea
                                                    id="bio"
                                                    placeholder="Tell the world about your creative space..."
                                                    className="rounded-xl bg-primary/[0.02] border-primary/10 focus:bg-background transition-all min-h-[120px] resize-none"
                                                    value={userBio}
                                                    onChange={(e) => setUserBio(e.target.value.slice(0, 160))}
                                                    aria-describedby="bio-counter"
                                                />
                                                <p id="bio-counter" className="text-[11px] text-muted-foreground text-right font-lato tabular-nums">{userBio.length} / 160 characters</p>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="website" className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Portfolio/Website</Label>
                                                <Input
                                                    id="website"
                                                    type="url"
                                                    placeholder="https://..."
                                                    className="rounded-xl bg-primary/[0.02] border-primary/10 focus:bg-background transition-all h-12"
                                                    value={website}
                                                    onChange={(e) => setWebsite(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <Separator className="bg-primary/5" />

                                <section className="space-y-4 pt-4">
                                    <h2 className="font-vt323 text-xl text-primary">Discoverability</h2>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/[0.02] border border-primary/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold font-lato text-balance">Public Profile</Label>
                                            <p className="text-xs text-muted-foreground font-lato text-pretty">
                                                Allow anyone to see your collection and creations.
                                            </p>
                                        </div>
                                        <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="account" className="mt-0 space-y-8 focus-visible:outline-none">
                                <section className="space-y-6">
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email-display" className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                                            <div className="flex gap-2">
                                                <Input id="email-display" disabled value="john.doe@gmail.com" className="rounded-xl bg-muted h-12 opacity-60 flex-1" />
                                                <Badge variant="outline" className="rounded-full bg-primary/5 border-primary/10 px-4 h-12">Verified</Badge>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-lato">Primary email used for your Google Login.</p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="font-lato font-semibold text-xs uppercase tracking-wider text-muted-foreground">Account Status</Label>
                                            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/5 bg-primary/[0.01]">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-sm font-medium font-lato">Active Member — Pro Plan</span>
                                                <Badge className="ml-auto bg-primary text-primary-foreground rounded-full">Pro</Badge>
                                            </div>
                                        </div>

                                        <Separator className="bg-primary/5" />

                                        <div className="space-y-4">
                                            <h2 className="font-vt323 text-xl text-primary">Connected Accounts</h2>
                                            <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/10 bg-background hover:bg-primary/[0.01] transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-full border border-primary/10 flex items-center justify-center bg-white">
                                                        <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /><path fill="none" d="M0 0h48v48H0z" /></svg>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-semibold font-lato">Google Account</p>
                                                        <p className="text-xs text-muted-foreground font-lato">Connected as john.doe@gmail.com</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">Manage</Badge>
                                            </div>
                                        </div>

                                        <Separator className="bg-primary/5" />

                                        <div className="space-y-4">
                                            <h2 className="font-vt323 text-xl text-primary">Danger Zone</h2>
                                            <Card className="border-destructive/20 bg-destructive/[0.01] rounded-2xl overflow-hidden">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="text-sm font-semibold font-lato text-destructive">Delete Account</CardTitle>
                                                    <CardDescription className="text-xs font-lato">
                                                        Permanently remove all your collections, creations, and data. This action cannot be undone.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardFooter className="bg-destructive/5 py-3 px-6">
                                                    <Button variant="destructive" size="sm" className="rounded-full font-lato">Delete Account</Button>
                                                </CardFooter>
                                            </Card>
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="appearance" className="mt-0 space-y-8 focus-visible:outline-none">
                                <section className="space-y-6">
                                    <h2 className="font-vt323 text-xl text-primary">Interface Customization</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <button
                                            onClick={() => setTheme("light")}
                                            className={cn(
                                                "group relative aspect-video rounded-2xl border-2 overflow-hidden transition-all",
                                                theme === "light" ? "border-primary" : "border-transparent hover:border-primary/20"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-[#FFFDF7]"></div>
                                            <div className="absolute bottom-2 left-2 right-2 h-4 bg-primary/10 rounded-lg"></div>
                                            <div className="absolute top-2 left-2 w-8 h-2 bg-primary/20 rounded-lg"></div>
                                            {theme === "light" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                                                    <Check className="h-6 w-6 text-primary" />
                                                </div>
                                            )}
                                            <p className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-widest text-primary">E-Paper</p>
                                        </button>

                                        <button
                                            onClick={() => setTheme("dark")}
                                            className={cn(
                                                "group relative aspect-video rounded-2xl border-2 overflow-hidden transition-all",
                                                theme === "dark" ? "border-primary" : "border-transparent hover:border-primary/20"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-[#09090b]"></div>
                                            <div className="absolute bottom-2 left-2 right-2 h-4 bg-white/10 rounded-lg"></div>
                                            <div className="absolute top-2 left-2 w-8 h-2 bg-white/20 rounded-lg"></div>
                                            {theme === "dark" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                                    <Check className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                            <p className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-widest text-white">Onyx</p>
                                        </button>

                                        <button
                                            onClick={() => setTheme("system")}
                                            className={cn(
                                                "group relative aspect-video rounded-2xl border-2 overflow-hidden transition-all",
                                                theme === "system" ? "border-primary" : "border-transparent hover:border-primary/20"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF7] to-[#09090b]"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Monitor className={cn("h-6 w-6", theme === "system" ? "text-primary" : "text-white/40")} />
                                            </div>
                                            <p className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-widest text-white/60">System</p>
                                        </button>
                                    </div>
                                </section>
                            </TabsContent>
                        </motion.div>
                    </div>
                </Tabs>
            </main>

            {/* Footer Background Effect */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent pointer-events-none z-0"></div>
        </div>
    );
}
