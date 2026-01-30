'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Upload,
    Download,
    Trash2,
    Grid,
    List,
    MessageCircle,
    Repeat2,
    Heart,
    Bookmark,
    Share,
    MoreHorizontal,
    Plus,
    X as XIcon,
    Image as ImageIcon,
    BarChart3,
    Settings2,
    Type,
    User as UserIcon,
    Timer,
    Eye,
    Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { toast } from 'sonner';

// --- Types ---

interface SlicedImage {
    id: string;
    url: string;
    blob: Blob;
}

// --- Icons (Accurate X style) ---

const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const VerifiedBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" className={cn("text-[#1d9bf0]", className)} fill="currentColor">
        <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" /></g>
    </svg>
);

const GrokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 33 32" aria-hidden="true" className={className} fill="currentColor">
        <g><path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466"></path></g>
    </svg>
);

// --- Component ---

export default function XPreviewTool() {
    // Post Details
    const [name, setName] = useState('albert');
    const [handle, setHandle] = useState('albert12798');
    const [avatar, setAvatar] = useState('https://pbs.twimg.com/profile_images/1872343986532212736/pj5OapGF_bigger.jpg');
    const [content, setContent] = useState('Tap this to see a Dream');
    const [time, setTime] = useState('2:50 AM');
    const [date, setDate] = useState('Jan 28, 2026');
    const [views, setViews] = useState('1.1M');
    const [replies, setReplies] = useState('58');
    const [reposts, setReposts] = useState('14');
    const [likes, setLikes] = useState('1.1K');
    const [bookmarks, setBookmarks] = useState('200');

    // Multi-Image State
    const [slices, setSlices] = useState<SlicedImage[]>([]);
    const [isSlicing, setIsSlicing] = useState(false);
    const [previewTab, setPreviewTab] = useState<'timeline' | 'open' | 'compose'>('timeline');

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Handlers ---

    const handleSliceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSlicing(true);
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const sliceHeight = img.height / 4;
            const newSlices: SlicedImage[] = [];

            // We need to collect all slices and then set state
            const processSlices = async () => {
                for (let i = 0; i < 4; i++) {
                    canvas.width = img.width;
                    canvas.height = sliceHeight;
                    ctx.drawImage(img, 0, i * sliceHeight, img.width, sliceHeight, 0, 0, img.width, sliceHeight);

                    await new Promise<void>((resolve) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                newSlices.push({
                                    id: `slice-${i}`,
                                    url: URL.createObjectURL(blob),
                                    blob
                                });
                            }
                            resolve();
                        }, 'image/png');
                    });
                }
                setSlices(newSlices);
                setIsSlicing(false);
                toast.success('Image sliced successfully!');
            };

            processSlices();
        };
    };

    const downloadAll = () => {
        slices.forEach((slice, index) => {
            const link = document.createElement('a');
            link.href = slice.url;
            link.download = `x-slice-${index + 1}.png`;
            link.click();
        });
        toast.success('Downloading all slices...');
    };

    const removeSlices = () => {
        setSlices([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Render Sub-sections ---

    const renderTimelinePost = () => (
        <div className="bg-black text-[#e7e9ea] p-3 max-w-[500px] w-full border border-[#2f3336] font-sans selection:bg-[#1d9cf040]">
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1 leading-tight mb-0.5">
                        <span className="font-bold truncate text-[15px]">{name}</span>
                        <VerifiedBadge className="w-[18px] h-[18px] flex-shrink-0" />
                        <span className="text-[#71767b] truncate text-[15px]">@{handle}</span>
                        <span className="text-[#71767b] text-[15px]">·</span>
                        <span className="text-[#71767b] whitespace-nowrap text-[15px]">{date.split(',')[0]}</span>
                        <div className="ml-auto flex items-center gap-2">
                            <GrokIcon className="w-[18px] h-[18px] text-[#71767b]" />
                            <MoreHorizontal className="w-[18px] h-[18px] text-[#71767b]" />
                        </div>
                    </div>

                    <div className="text-[15px] leading-normal mb-3 whitespace-pre-wrap break-words">
                        {content}
                    </div>

                    {/* Image Grid */}
                    {slices.length === 4 ? (
                        <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-[#2f3336]">
                            {slices.map((slice, i) => (
                                <div key={slice.id} className="aspect-square relative bg-[#16181c]">
                                    <img src={slice.url} className="w-full h-full object-cover" alt={`Slice ${i}`} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="aspect-video bg-[#16181c] rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#2f3336] gap-2 p-4 text-center">
                            <ImageIcon className="w-8 h-8 opacity-20" />
                            <p className="text-[#71767b] text-sm italic">Upload & slice to preview the 2x2 grid</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between text-[#71767b] mt-3 max-w-[425px]">
                        <div className="flex items-center group cursor-pointer hover:text-[#1d9bf0]">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px]">{replies}</span>
                        </div>
                        <div className="flex items-center group cursor-pointer hover:text-[#00ba7c]">
                            <div className="p-2 rounded-full group-hover:bg-[#00ba7c15]">
                                <Repeat2 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px]">{reposts}</span>
                        </div>
                        <div className="flex items-center group cursor-pointer hover:text-[#f91880]">
                            <div className="p-2 rounded-full group-hover:bg-[#f9188015]">
                                <Heart className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px]">{likes}</span>
                        </div>
                        <div className="flex items-center group cursor-pointer hover:text-[#1d9bf0]">
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                                <BarChart3 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px]">{views}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer">
                                <Bookmark className="w-[18px] h-[18px]" />
                            </div>
                            <div className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer">
                                <Share className="w-[18px] h-[18px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOpenPost = () => (
        <div className="bg-black text-[#e7e9ea] p-4 max-w-[500px] w-full border border-[#2f3336] font-sans selection:bg-[#1d9cf040]">
            <div className="flex items-center gap-3 mb-4">
                <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px]">{name}</span>
                        <VerifiedBadge className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[#71767b] text-[15px]">@{handle}</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <GrokIcon className="w-[20px] h-[20px] text-[#71767b]" />
                    <MoreHorizontal className="w-[20px] h-[20px] text-[#71767b]" />
                </div>
            </div>

            <div className="text-[17px] leading-normal mb-4 whitespace-pre-wrap break-words">
                {content}
            </div>

            {/* Image Stack */}
            {slices.length === 4 ? (
                <div className="space-y-4 mb-4">
                    {slices.map((slice, i) => (
                        <div key={slice.id} className="rounded-2xl overflow-hidden border border-[#2f3336] bg-[#16181c]">
                            <img src={slice.url} className="w-full object-contain" alt={`Slice ${i}`} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="aspect-video bg-[#16181c] rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#2f3336] gap-2 p-4 text-center mb-4">
                    <ImageIcon className="w-8 h-8 opacity-20" />
                    <p className="text-[#71767b] text-sm italic">Upload & slice to preview the vertical stack</p>
                </div>
            )}

            <div className="py-4 border-b border-[#2f3336] text-[15px] text-[#71767b] flex gap-1 items-center">
                <span>{time}</span>
                <span>·</span>
                <span>{date}</span>
                <span>·</span>
                <span className="text-white font-bold ml-1">{views}</span>
                <span>Views</span>
            </div>

            <div className="flex items-center justify-between text-[#71767b] pt-2">
                <div className="flex items-center group cursor-pointer hover:text-[#1d9bf0]">
                    <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                        <MessageCircle className="w-[22px] h-[22px]" />
                    </div>
                    <span className="text-[13px] mt-0.5">{replies}</span>
                </div>
                <div className="flex items-center group cursor-pointer hover:text-[#00ba7c]">
                    <div className="p-2 rounded-full group-hover:bg-[#00ba7c15]">
                        <Repeat2 className="w-[22px] h-[22px]" />
                    </div>
                    <span className="text-[13px] mt-0.5">{reposts}</span>
                </div>
                <div className="flex items-center group cursor-pointer hover:text-[#f91880]">
                    <div className="p-2 rounded-full group-hover:bg-[#f9188015]">
                        <Heart className="w-[22px] h-[22px]" />
                    </div>
                    <span className="text-[13px] mt-0.5">{likes}</span>
                </div>
                <div className="flex items-center group cursor-pointer hover:text-[#1d9bf0]">
                    <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                        <Bookmark className="w-[22px] h-[22px]" />
                    </div>
                    <span className="text-[13px] mt-0.5">{bookmarks}</span>
                </div>
                <div className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer">
                    <Share className="w-[22px] h-[22px]" />
                </div>
            </div>
        </div>
    );

    const renderComposeView = () => (
        <div className="bg-black text-[#e7e9ea] p-4 max-w-[600px] w-full border border-[#2f3336] rounded-2xl font-sans relative">
            <div className="flex items-center justify-between mb-4">
                <XIcon className="w-5 h-5 cursor-pointer" />
                <span className="text-[#1d9bf0] font-bold text-sm">Drafts</span>
            </div>

            <div className="flex gap-3">
                <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                <div className="flex-1 flex flex-col">
                    <div className="h-10 flex items-center mb-1">
                        <span className="text-[#1d9bf0] border border-[#2f3336] rounded-full px-3 py-0.5 text-xs font-bold leading-relaxed flex items-center gap-1">
                            Everyone <XIcon className="w-3 h-3" />
                        </span>
                    </div>

                    <div className="text-[20px] text-[#71767b] py-2 mb-2 font-light">
                        {content || "What's happening?"}
                    </div>

                    {/* Slices in Composer */}
                    {slices.length === 4 ? (
                        <div className="relative mb-4 group/composer">
                            {/* Layout Toggle Mock */}
                            <div className="absolute top-2 left-2 z-10 flex gap-2">
                                <div className="bg-black/60 backdrop-blur-sm p-1.5 rounded-full border border-white/20">
                                    <Grid className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 text-xs font-bold">
                                    Edit
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-[#2f3336]">
                                {slices.map((slice, i) => (
                                    <div key={slice.id} className="aspect-square relative bg-[#16181c]">
                                        <img src={slice.url} className="w-full h-full object-cover" alt={`Slice ${i}`} />
                                        <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1 border border-white/20">
                                            <XIcon className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-video bg-[#16181c] rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#2f3336] gap-2 p-4 text-center mb-4 cursor-pointer hover:bg-[#1d9cf005]" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="w-10 h-10 opacity-20" />
                            <p className="text-[#71767b] text-sm">Add photos to preview alignment in composer</p>
                        </div>
                    )}

                    <div className="flex items-center text-[#1d9bf0] text-sm font-bold gap-1 mb-4">
                        <Share className="w-4 h-4" /> <span>Everyone can reply</span>
                    </div>

                    <div className="pt-3 border-t border-[#2f3336] flex items-center justify-between">
                        <div className="flex gap-2">
                            <ImageIcon className="w-5 h-5 text-[#1d9bf0]" />
                            <div className="w-5 h-5 rounded border border-[#1d9bf0] flex items-center justify-center text-[8px] font-bold">GIF</div>
                            <Repeat2 className="w-5 h-5 text-[#1d9bf0]" />
                            <Smile className="w-5 h-5 text-[#1d9bf0]" />
                            <Calendar className="w-5 h-5 text-[#1d9bf0]" />
                            <MapPin className="w-5 h-5 text-[#1d9bf0] opacity-50" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-[#2f3336]" />
                            <div className="w-[1px] h-6 bg-[#2f3336]" />
                            <div className="w-6 h-6 rounded-full border border-[#2f3336] flex items-center justify-center text-[#1d9bf0]">
                                <Plus className="w-4 h-4" />
                            </div>
                            <Button className="bg-[#eff3f4] text-black hover:bg-[#d7dbdc] rounded-full px-5 py-0 h-9 font-bold text-[15px]">
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <PageShell contentClassName="bg-[#0f172a]/20">
            <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">

                {/* Header Block */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <XLogo className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-vt323 tracking-tight text-primary uppercase">X // Multi-Image Laboratory</h1>
                        </div>
                        <p className="font-lato text-muted-foreground text-lg italic opacity-80 max-w-2xl">
                            Upload a vertical image and slice it perfectly for X. Preview how it looks in the timeline, composer, and expanded view to ensure pixel-perfect alignment.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={removeSlices}
                            disabled={slices.length === 0}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            className="rounded-full font-vt323 text-lg h-11 px-8 shadow-lg shadow-primary/20"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSlicing}
                        >
                            {isSlicing ? <Timer className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {isSlicing ? 'Slicing...' : 'Upload Image'}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleSliceImage}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Controls & Slices Column */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Post Details Form */}
                        <div className="p-6 rounded-[2rem] bg-card border border-border/50 shadow-xl space-y-6">
                            <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Settings2 className="w-5 h-5" /> Identity & Metadata
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Display Name</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="rounded-xl pl-10 border-primary/10 bg-primary/[0.02] focus:bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Username Handle</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 font-bold">@</span>
                                        <Input
                                            value={handle}
                                            onChange={e => setHandle(e.target.value)}
                                            className="rounded-xl pl-8 border-primary/10 bg-primary/[0.02] focus:bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Avatar URL</Label>
                                    <div className="relative">
                                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                                        <Input
                                            value={avatar}
                                            onChange={e => setAvatar(e.target.value)}
                                            className="rounded-xl pl-10 border-primary/10 bg-primary/[0.02] focus:bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Post Text</Label>
                                    <Textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        placeholder="What's happening?"
                                        className="rounded-xl border-primary/10 bg-primary/[0.02] focus:bg-background min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slices Gallery */}
                        {slices.length > 0 && (
                            <div className="p-6 rounded-[2rem] bg-card border border-border/50 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider">
                                        Slices Generated
                                    </h2>
                                    <Button variant="ghost" size="sm" onClick={downloadAll} className="text-primary hover:text-primary/80 font-vt323 text-lg h-8">
                                        <Download className="w-3.5 h-3.5 mr-2" /> Save All
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {slices.map((slice, i) => (
                                        <div key={slice.id} className="group relative rounded-xl overflow-hidden border border-border bg-[#000]/20">
                                            <img src={slice.url} className="w-full h-full object-contain" alt={`Slice ${i}`} />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-white hover:scale-110"
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = slice.url;
                                                        link.download = `slice-${i + 1}.png`;
                                                        link.click();
                                                    }}
                                                >
                                                    <Download className="w-5 h-5" />
                                                </Button>
                                            </div>
                                            <div className="absolute bottom-1 right-2 text-[8px] font-black italic opacity-30 text-white">#0{i + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="relative">
                            {/* Custom Tab Switcher */}
                            <div className="flex p-1.5 bg-card border border-border/50 rounded-2xl w-fit mx-auto mb-10 shadow-2xl relative z-20">
                                {[
                                    { id: 'timeline', icon: Grid, label: 'Timeline' },
                                    { id: 'open', icon: List, label: 'Open Post' },
                                    { id: 'compose', icon: Plus, label: 'Compose' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPreviewTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300",
                                            previewTab === tab.id ? "bg-primary text-primary-foreground shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Preview Display */}
                            <div className="flex justify-center min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={previewTab}
                                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.02, y: -10 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className="w-full flex justify-center"
                                    >
                                        {previewTab === 'timeline' ? renderTimelinePost() :
                                            previewTab === 'open' ? renderOpenPost() :
                                                renderComposeView()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Explanation / Footer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 space-y-3">
                                <h3 className="font-vt323 text-[22px] text-primary uppercase leading-tight">Timeline Strategy</h3>
                                <p className="font-lato text-sm text-muted-foreground leading-relaxed">
                                    X defaults to a 2x2 grid for 4 images. If you use horizontal slices, the timeline will look fragmented. This is often used for "surprise" reveals where the full image is only visible when opened.
                                </p>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 space-y-3">
                                <h3 className="font-vt323 text-[22px] text-primary uppercase leading-tight">Infinite Alignment</h3>
                                <p className="font-lato text-sm text-muted-foreground leading-relaxed">
                                    In the "Open Post" view, images can be stacked vertically. Use this preview to ensure your horizontal slices align perfectly at the seams, creating a seamless high-definition vertical scroll.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-50 overflow-hidden">
                <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[5%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px]" />
            </div>
        </PageShell>
    );
}
