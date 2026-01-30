'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X, Cat } from 'lucide-react';
import { DefaultAvatar } from '@/components/ui/default-avatar';
import { toast } from 'sonner';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl: string | null;
    onAvatarUpdate: (newUrl: string | null) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarUpload({
    userId,
    currentAvatarUrl,
    onAvatarUpdate,
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

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG, PNG, GIF).');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB.');
            return;
        }

        uploadAvatar(file);
    };

    const uploadAvatar = async (file: File) => {
        setIsUploading(true);
        const supabase = createClient();

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profile in DB
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) {
                throw updateError;
            }

            onAvatarUpdate(publicUrl);
            router.refresh();
            toast.success('Profile picture updated!');

        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload avatar. Please try again.');
        } finally {
            setIsUploading(false);
            // Clear input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

    const handleSetCatAvatar = async () => {
        setIsUploading(true);
        const supabase = createClient();

        try {
            // We'll use a string identifier or a Data URI. 
            // Since our system expects a URL, let's use a special string or just the Data URI of the cat SVG.
            // For simplicity and since it's small, a Data URI is fine, or we could just set it to 'DEFAULT_CAT'
            // and handle it in the components. But 'avatar_url' in profiles table might be limited.
            // Let's use the actual SVG converted to Data URI to ensure it works everywhere without special logic.

            const catSvg = `data:image/svg+xml;base64,${btoa('<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect width="16" height="16" fill="#f4f4f5" /><rect x="2" y="1" width="2" height="3" fill="#18181b" /><rect x="3" y="1" width="1" height="1" fill="#18181b" /><rect x="12" y="1" width="2" height="3" fill="#18181b" /><rect x="12" y="1" width="1" height="1" fill="#18181b" /><rect x="3" y="2" width="1" height="1" fill="#fda4af" /><rect x="12" y="2" width="1" height="1" fill="#fda4af" /><rect x="1" y="4" width="1" height="6" fill="#18181b" /><rect x="14" y="4" width="1" height="6" fill="#18181b" /><rect x="2" y="3" width="1" height="1" fill="#18181b" /><rect x="13" y="3" width="1" height="1" fill="#18181b" /><rect x="2" y="10" width="1" height="1" fill="#18181b" /><rect x="13" y="10" width="1" height="1" fill="#18181b" /><rect x="3" y="11" width="2" height="1" fill="#18181b" /><rect x="11" y="11" width="2" height="1" fill="#18181b" /><rect x="5" y="12" width="6" height="1" fill="#18181b" /><rect x="2" y="4" width="12" height="6" fill="#fafafa" /><rect x="3" y="10" width="10" height="1" fill="#fafafa" /><rect x="5" y="11" width="6" height="1" fill="#fafafa" /><rect x="2" y="4" width="3" height="2" fill="#18181b" /><rect x="11" y="4" width="3" height="2" fill="#18181b" /><rect x="6" y="3" width="4" height="2" fill="#18181b" /><rect x="4" y="6" width="2" height="2" fill="#22c55e" /><rect x="10" y="6" width="2" height="2" fill="#22c55e" /><rect x="5" y="6" width="1" height="1" fill="#18181b" /><rect x="10" y="6" width="1" height="1" fill="#18181b" /><rect x="4" y="6" width="1" height="1" fill="#bbf7d0" /><rect x="11" y="7" width="1" height="1" fill="#bbf7d0" /><rect x="7" y="8" width="2" height="1" fill="#fda4af" /><rect x="7" y="9" width="1" height="1" fill="#18181b" /><rect x="8" y="9" width="1" height="1" fill="#18181b" /><rect x="6" y="10" width="1" height="1" fill="#18181b" /><rect x="9" y="10" width="1" height="1" fill="#18181b" /><rect x="1" y="7" width="2" height="1" fill="#a1a1aa" /><rect x="1" y="9" width="2" height="1" fill="#a1a1aa" /><rect x="13" y="7" width="2" height="1" fill="#a1a1aa" /><rect x="13" y="9" width="2" height="1" fill="#a1a1aa" /></svg>')} `;

            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: catSvg })
                .eq('id', userId);

            if (error) throw error;

            onAvatarUpdate(catSvg);
            router.refresh();
            toast.success('Changed to Cat avatar!');
        } catch (error) {
            console.error('Error setting cat avatar:', error);
            toast.error('Failed to set cat avatar.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`flex flex-col gap-6 ${className}`}>
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Avatar className={`${sizeClasses[size]} border-4 border-background ring-1 ring-primary/5`}>
                        <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
                        <AvatarFallback className="bg-muted text-2xl font-bold">U</AvatarFallback>
                    </Avatar>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
                        aria-label="Update profile picture"
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" aria-hidden="true" />
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>

                <div className="space-y-1">
                    <h2 className="font-vt323 text-xl text-primary text-balance">Profile Picture</h2>
                    <p className="text-sm text-muted-foreground font-lato text-pretty">
                        PNG, JPG or GIF. Max 2MB.
                    </p>
                    <div className="flex gap-2 mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full font-lato h-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            Upload
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full font-lato h-8 text-primary"
                            onClick={handleSetCatAvatar}
                            disabled={isUploading}
                        >
                            <Cat className="h-3.5 w-3.5 mr-1.5" />
                            Use Cat
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full font-lato h-8 text-destructive"
                            onClick={handleRemoveAvatar}
                            disabled={isUploading || !currentAvatarUrl}
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
