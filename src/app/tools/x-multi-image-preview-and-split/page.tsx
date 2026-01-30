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
    Camera,
    Smile,
    Calendar,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { toast } from 'sonner';

interface SlicedImage {
    id: string;
    url: string;
    blob: Blob;
}

interface HistoryItem {
    id: string;
    timestamp: number;
    originalName: string;
    slices: { blob: Blob; url: string }[];
}

// --- Icons (Accurate X style) ---

const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-label="X Logo" role="img" className={className} fill="currentColor">
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
    const [name, setName] = useState('Ethereal');
    const [handle, setHandle] = useState('ethereal_lab');
    const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=60');
    const [content, setContent] = useState('Exploring the intersection of geometry and light. 💎✨');
    const [time, setTime] = useState('11:11 PM');
    const [date, setDate] = useState('Jan 30, 2026');
    const [views, setViews] = useState('2.4M');
    const [replies, setReplies] = useState('124');
    const [reposts, setReposts] = useState('89');
    const [likes, setLikes] = useState('4.2K');
    const [bookmarks, setBookmarks] = useState('512');

    // Multi-Image State
    const [slices, setSlices] = useState<SlicedImage[]>([]);
    const [isSlicing, setIsSlicing] = useState(false);
    const [previewTab, setPreviewTab] = useState<'timeline' | 'open'>('timeline');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- IndexedDB Logic ---
    const initDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('XMultiImageStore', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('history')) {
                    db.createObjectStore('history', { keyPath: 'id' });
                }
            };
        });
    };

    const loadHistory = async () => {
        try {
            const db = await initDB();
            const transaction = db.transaction('history', 'readonly');
            const store = transaction.objectStore('history');
            const request = store.getAll();
            request.onsuccess = () => {
                const items = request.result.sort((a: any, b: any) => b.timestamp - a.timestamp);
                // Create URLs for existing blobs
                const itemsWithUrls = items.map((item: any) => ({
                    ...item,
                    slices: item.slices.map((s: any) => ({
                        ...s,
                        url: URL.createObjectURL(s.blob)
                    }))
                }));
                setHistory(itemsWithUrls);
            };
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    const saveToHistory = async (originalName: string, newSlices: SlicedImage[]) => {
        try {
            const db = await initDB();
            const transaction = db.transaction('history', 'readwrite');
            const store = transaction.objectStore('history');
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                originalName,
                slices: newSlices.map(s => ({ blob: s.blob, url: '' }))
            };
            store.add(newItem);
            loadHistory();
        } catch (err) {
            console.error('Failed to save to history', err);
        }
    };

    const clearHistory = async () => {
        const db = await initDB();
        const transaction = db.transaction('history', 'readwrite');
        const store = transaction.objectStore('history');
        store.clear();
        setHistory([]);
        toast.success('Archives purged…');
    };

    const restoreFromHistory = (item: HistoryItem) => {
        const restoredSlices = item.slices.map((s, i) => ({
            id: `slice-${i}`,
            url: s.url,
            blob: s.blob
        }));
        setSlices(restoredSlices);
        toast.success(`Restored: ${item.originalName}`);
    };

    React.useEffect(() => {
        loadHistory();
    }, []);

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    const handleSliceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // --- File Size Check ---
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large (Max 20MB)');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

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
                const slicePromises = Array.from({ length: 4 }).map((_, i) => {
                    return new Promise<SlicedImage>((resolve) => {
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d')!;
                        tempCanvas.width = img.width;
                        tempCanvas.height = sliceHeight;
                        tempCtx.drawImage(img, 0, i * sliceHeight, img.width, sliceHeight, 0, 0, img.width, sliceHeight);

                        tempCanvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    id: `slice-${i}`,
                                    url: URL.createObjectURL(blob),
                                    blob
                                });
                            }
                        }, 'image/png');
                    });
                });

                const results = await Promise.all(slicePromises);
                setSlices(results);
                setIsSlicing(false);
                saveToHistory(file.name, results);
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
        toast.success('Downloading all slices…');
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
                            <button className="rounded-full hover:bg-[#71767b15] p-1 transition-colors" aria-label="More options">
                                <MoreHorizontal className="w-[18px] h-[18px] text-[#71767b]" />
                            </button>
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

                    <div className="flex items-center justify-between text-[#71767b] mt-3 max-w-[425px]">
                        <button className="flex items-center group cursor-pointer hover:text-[#1d9bf0] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#1d9bf0] rounded-full" aria-label={`${replies} replies`}>
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] tabular-nums">{replies}</span>
                        </button>
                        <button className="flex items-center group cursor-pointer hover:text-[#00ba7c] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#00ba7c] rounded-full" aria-label={`${reposts} reposts`}>
                            <div className="p-2 rounded-full group-hover:bg-[#00ba7c15]">
                                <Repeat2 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] tabular-nums">{reposts}</span>
                        </button>
                        <button className="flex items-center group cursor-pointer hover:text-[#f91880] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#f91880] rounded-full" aria-label={`${likes} likes`}>
                            <div className="p-2 rounded-full group-hover:bg-[#f9188015]">
                                <Heart className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] tabular-nums">{likes}</span>
                        </button>
                        <button className="flex items-center group cursor-pointer hover:text-[#1d9bf0] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#1d9bf0] rounded-full" aria-label={`${views} views`}>
                            <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                                <BarChart3 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] tabular-nums">{views}</span>
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer transition-colors" aria-label="Bookmark">
                                <Bookmark className="w-[18px] h-[18px]" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer transition-colors" aria-label="Share">
                                <Share className="w-[18px] h-[18px]" />
                            </button>
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
                    <MoreHorizontal className="w-[20px] h-[20px] text-[#71767b]" aria-label="More options" />
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
                <span className="text-white font-bold ml-1 tabular-nums">{views}</span>
                <span>Views</span>
            </div>

            <div className="flex items-center justify-between text-[#71767b] pt-2">
                <button className="flex items-center group cursor-pointer hover:text-[#1d9bf0] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#1d9bf0] rounded-full" aria-label={`${replies} replies`}>
                    <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                        <MessageCircle className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[13px] tabular-nums">{replies}</span>
                </button>
                <button className="flex items-center group cursor-pointer hover:text-[#00ba7c] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#00ba7c] rounded-full" aria-label={`${reposts} reposts`}>
                    <div className="p-2 rounded-full group-hover:bg-[#00ba7c15]">
                        <Repeat2 className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[13px] tabular-nums">{reposts}</span>
                </button>
                <button className="flex items-center group cursor-pointer hover:text-[#f91880] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#f91880] rounded-full" aria-label={`${likes} likes`}>
                    <div className="p-2 rounded-full group-hover:bg-[#f9188015]">
                        <Heart className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[13px] tabular-nums">{likes}</span>
                </button>
                <button className="flex items-center group cursor-pointer hover:text-[#1d9bf0] bg-transparent border-none p-0 outline-none focus-visible:ring-2 ring-[#1d9bf0] rounded-full" aria-label={`${views} views`}>
                    <div className="p-2 rounded-full group-hover:bg-[#1d9bf015]">
                        <BarChart3 className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[13px] tabular-nums">{views}</span>
                </button>
                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer" aria-label="Bookmark">
                        <Bookmark className="w-[18px] h-[18px]" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-[#1d9bf015] hover:text-[#1d9bf0] cursor-pointer" aria-label="Share">
                        <Share className="w-[18px] h-[18px]" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderComposeView = () => null;

    return (
        <PageShell contentClassName="bg-transparent">
            <div className="min-h-dvh pt-16 pb-12 px-6 max-w-7xl mx-auto">

                {/* Header Block */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl" aria-hidden="true">
                                <XLogo className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-vt323 tracking-tight text-primary uppercase text-balance">X // Multi-Image Laboratory</h1>
                        </div>
                        <p className="font-lato text-muted-foreground text-lg italic opacity-80 max-w-2xl text-pretty">
                            Upload a vertical image and slice it perfectly for X. Preview how it looks in the timeline and expanded view to ensure pixel-perfect alignment. (Max 20MB)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={removeSlices}
                            disabled={slices.length === 0}
                        >
                            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            Reset
                        </Button>
                        {slices.length > 0 && (
                            <Button
                                variant="outline"
                                className="rounded-full font-vt323 text-lg h-11 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                onClick={downloadAll}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Save All
                            </Button>
                        )}
                        <Button
                            className="rounded-full font-vt323 text-lg h-11 px-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSlicing}
                        >
                            {isSlicing ? <Timer className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4 mr-2" aria-hidden="true" />}
                            {isSlicing ? 'Slicing…' : 'Upload Image'}
                        </Button>
                        <input
                            id="x-image-upload"
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            aria-label="Upload image to slice"
                            onChange={handleSliceImage}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Controls & Slices Column */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Post Details Form */}
                        <div className="p-6 rounded-[2rem] bg-card border border-border/50 space-y-6">
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 font-bold" aria-hidden="true">@</span>
                                        <Input
                                            value={handle}
                                            onChange={e => setHandle(e.target.value)}
                                            spellCheck={false}
                                            autoComplete="off"
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
                                        spellCheck={true}
                                        className="rounded-xl border-primary/10 bg-primary/[0.02] focus:bg-background min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slices Gallery */}
                        {slices.length > 0 && (
                            <div className="p-6 rounded-[2rem] bg-card border border-border/50 space-y-4">
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
                                                    aria-label={`Download slice ${i + 1}`}
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
                            <div className="flex p-1.5 bg-card border border-border/50 rounded-2xl w-fit mx-auto mb-10 relative z-20">
                                {[
                                    { id: 'timeline', icon: Grid, label: 'Timeline' },
                                    { id: 'open', icon: List, label: 'Open Post' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPreviewTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300",
                                            previewTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 space-y-3">
                                <h3 className="font-vt323 text-[22px] text-primary uppercase leading-tight">Timeline Strategy</h3>
                                <p className="font-lato text-sm text-muted-foreground leading-relaxed">
                                    X defaults to a 2x2 grid for 4 images. If you use horizontal slices, the timeline will look fragmented. This is often used for "surprise" reveals where the full image is only visible when opened.
                                </p>
                            </div>

                            {/* History Section */}
                            <div className="p-6 rounded-[2rem] bg-card border border-border/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-vt323 text-xl text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Timer className="w-5 h-5" /> Laboratory Archives
                                    </h3>
                                    {history.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive/80 text-xs uppercase font-bold tracking-widest">
                                            Purge
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {history.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic opacity-50 text-center py-8">No records found in local memory</p>
                                    ) : (
                                        history.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => restoreFromHistory(item)}
                                                className="w-full group flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-all text-left outline-none focus-visible:ring-2 ring-primary/30"
                                                aria-label={`Restore archive: ${item.originalName}`}
                                            >
                                                <div className="grid grid-cols-2 gap-0.5 w-10 h-10 rounded-md overflow-hidden bg-black/5 flex-shrink-0" aria-hidden="true">
                                                    {item.slices.slice(0, 4).map((s, idx) => (
                                                        <img key={idx} src={s.url} className="w-full h-full object-cover" alt="" />
                                                    ))}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate opacity-80">{item.originalName}</p>
                                                    <p className="text-[10px] opacity-40 uppercase tracking-tighter">
                                                        {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <Repeat2 className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" aria-hidden="true" />
                                            </button>
                                        ))
                                    )}
                                </div>
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
