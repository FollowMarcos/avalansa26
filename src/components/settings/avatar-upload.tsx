'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X, Plus, History, Sparkles } from 'lucide-react';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { PRESET_AVATARS, getPresetAsDataUri } from '@/components/ui/preset-avatars';
import { getSanitizedSvgHtml } from '@/utils/svg-sanitizer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl: string | null;
    onAvatarUpdate: (newUrl: string | null) => void;
    avatarHistory?: string[];
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarUpload({
    userId,
    currentAvatarUrl,
    onAvatarUpdate,
    avatarHistory = [],
    className = '',
    size = 'lg',
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Enhanced security validation with magic byte checking
        const { validateImageFile, MAX_AVATAR_SIZE } = await import('@/utils/image-validation');
        const validation = await validateImageFile(file, MAX_AVATAR_SIZE);

        if (!validation.valid) {
            toast.error(validation.error || 'Invalid image file');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        uploadAvatar(file);
    };

    const updateHistory = async (newUrl: string, currentHistory: string[]) => {
        const supabase = createClient();
        // Keep unique URLs, max 10
        const updatedHistory = [newUrl, ...currentHistory.filter(url => url !== newUrl)].slice(0, 10);

        await supabase
            .from('profiles')
            .update({ avatar_history: updatedHistory })
            .eq('id', userId);

        return updatedHistory;
    };

    const uploadAvatar = async (file: File) => {
        setIsUploading(true);
        const supabase = createClient();

        try {
            // Get presigned URL from our API
            const presignResponse = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: 'avatars',
                    contentType: file.type || 'image/jpeg',
                    fileSize: file.size,
                }),
            });

            if (!presignResponse.ok) {
                const err = await presignResponse.json();
                throw new Error(err.error || 'Failed to get upload URL');
            }

            const { presignedUrl, publicUrl } = await presignResponse.json();

            // Upload directly to R2 via presigned URL
            const uploadResponse = await fetch(presignedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type || 'image/jpeg' },
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            await updateHistory(publicUrl, avatarHistory);

            onAvatarUpdate(publicUrl);
            router.refresh();
            toast.success('Profile picture updated!');

        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload avatar.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSetAvatar = async (url: string) => {
        if (url === currentAvatarUrl) return;

        setIsUploading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', userId);

            if (error) throw error;

            await updateHistory(url, avatarHistory);

            onAvatarUpdate(url);
            router.refresh();
            toast.success('Avatar updated!');
        } catch (error) {
            console.error('Error setting avatar:', error);
            toast.error('Failed to update avatar.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!currentAvatarUrl) return;
        if (!confirm('Are you sure you want to remove your profile picture?')) return;

        setIsUploading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (error) throw error;

            onAvatarUpdate(null);
            router.refresh();
            toast.success('Profile picture removed.');
        } catch (error) {
            console.error('Error removing avatar:', error);
            toast.error('Failed to remove avatar.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("space-y-8", className)}>
            <div className="flex items-center gap-8">
                <div className="relative group">
                    <div className={cn(
                        "rounded-full overflow-hidden border-4 border-background ring-1 ring-primary/10",
                        sizeClasses[size]
                    )}>
                        {currentAvatarUrl ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={currentAvatarUrl}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    unoptimized={currentAvatarUrl.startsWith('data:')}
                                />
                            </div>
                        ) : (
                            <DefaultAvatar size={size === 'xl' ? 128 : 96} className="w-full h-full" />
                        )}
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100 disabled:cursor-not-allowed"
                        aria-label="Update profile picture"
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </div>

                <div className="space-y-1">
                    <h2 className="font-vt323 text-2xl text-primary uppercase tracking-tight">Identity // Avatar</h2>
                    <p className="text-sm text-muted-foreground font-lato">
                        Upload a photo or choose a pixel-art preset.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-9 px-4 font-lato"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload New
                        </Button>
                        {currentAvatarUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full h-9 px-4 font-lato text-destructive hover:bg-destructive/5"
                                onClick={handleRemoveAvatar}
                                disabled={isUploading}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Presets & History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Preset Avatars
                    </h3>
                </div>

                <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                    <div className="flex w-max space-x-4 p-1">
                        {PRESET_AVATARS.map((preset) => {
                            const dataUri = getPresetAsDataUri(preset.svg);
                            const isActive = currentAvatarUrl === dataUri;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => handleSetAvatar(dataUri)}
                                    disabled={isUploading}
                                    className={cn(
                                        "group relative flex flex-col items-center gap-2 transition-all p-2 rounded-xl",
                                        isActive ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"
                                    )}
                                >
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group-hover:border-primary/30 transition-colors">
                                        <div
                                            className="w-full h-full"
                                            dangerouslySetInnerHTML={getSanitizedSvgHtml(preset.svg)}
                                        />
                                        {isActive && (
                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                                    <Plus className="w-3 h-3 rotate-45" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground group-hover:text-primary">
                                        {preset.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {avatarHistory.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Recently Used
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {avatarHistory.map((url, idx) => {
                            const isActive = currentAvatarUrl === url;
                            return (
                                <button
                                    key={`${url}-${idx}`}
                                    onClick={() => handleSetAvatar(url)}
                                    disabled={isUploading || isActive}
                                    className={cn(
                                        "relative w-14 h-14 rounded-xl overflow-hidden border transition-all",
                                        isActive ? "border-primary ring-2 ring-primary/20 scale-105" : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <Image
                                        src={url}
                                        alt="Past Avatar"
                                        fill
                                        className="object-cover"
                                        unoptimized={url.startsWith('data:')}
                                    />
                                    {isActive && (
                                        <div className="absolute inset-x-0 bottom-0 bg-primary text-[8px] text-primary-foreground font-bold uppercase text-center py-0.5">
                                            Active
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
