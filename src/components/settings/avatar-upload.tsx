'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
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
            toast.success('Profile picture removed.');
        } catch (error) {
            console.error('Error removing avatar:', error);
            toast.error('Failed to remove avatar.');
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
