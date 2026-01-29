"use client";

import { motion } from "motion/react";
import {
    Sparkles,
    Layers,
    Share2,
    Video,
    Image as ImageIcon,
    Box,
    FileText,
    Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "AI Workspace",
        description: "One command center for images, video, 3D, and text. Integrated with the world's best models.",
        icon: Sparkles,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        className: "md:col-span-2 md:row-span-2",
    },
    {
        title: "Prompt Forge",
        description: "Store, version, and share your most powerful AI prompts.",
        icon: FileText,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        title: "Portfolio",
        description: "A premium home for your AI-native creations.",
        icon: Palette,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        title: "Community",
        description: "Connect with builders pushing the limits of latent space.",
        icon: Share2,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
    },
    {
        title: "Multimodal",
        description: "Text2Video, Image2Video, and 3D generation tools.",
        icon: Video,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
    }
];

export function FeatureGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl px-4 lg:px-0">
            {features.map((feature, i) => (
                <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                        "group relative overflow-hidden rounded-[24px] border border-border/50 bg-card p-8 transition-all hover:border-primary/20",
                        feature.className
                    )}
                >
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl", feature.bg)}>
                                <feature.icon className={cn("h-6 w-6", feature.color)} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">{feature.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                        </div>

                        {feature.className?.includes("md:col-span-2") && (
                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: ImageIcon, label: "Image" },
                                    { icon: Video, label: "Video" },
                                    { icon: Box, label: "3D" },
                                    { icon: FileText, label: "Text" }
                                ].map((tool, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-foreground/[0.03] border border-border/20 group-hover:bg-foreground/[0.05] transition-colors">
                                        <tool.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">{tool.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Removed hover blur */}
                </motion.div>
            ))}
        </div>
    );
}
