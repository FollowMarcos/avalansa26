'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/utils/supabase/profiles.client';
import { resizeImage } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PRESET_AVATARS, getPresetAsDataUri } from '@/components/ui/preset-avatars';

interface AvatarFormProps {
    initialAvatarUrl?: string | null;
}

export function AvatarForm({ initialAvatarUrl }: AvatarFormProps) {
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            setIsUploading(true);

            // Client-side Resize
            // 300x300px, 0.8 quality JPEG
            const resizedBlob = await resizeImage(file, 300, 300, 0.8);
            const resizedFile = new File([resizedBlob], "avatar.jpg", { type: 'image/jpeg' });

            // Upload to Supabase
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const filePath = `${user.id}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, resizedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            toast.success('Image processed & uploaded');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePresetSelect = (presetSvg: string) => {
        const dataUri = getPresetAsDataUri(presetSvg);
        setAvatarUrl(dataUri);
    };

    const handleContinue = () => {
        startTransition(async () => {
            if (avatarUrl) {
                const result = await updateProfile({ avatar_url: avatarUrl });
                if (!result) {
                    toast.error('Failed to save avatar');
                    return;
                }
            }
            router.push('/onboarding/bio');
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary/10 transition-transform group-hover:scale-105">
                        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-muted">
                            {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8 opacity-50" />}
                        </AvatarFallback>
                    </Avatar>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isSaving}
                        className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        title="Upload photo"
                        aria-label="Upload custom profile photo"
                    >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>

                <div className="text-center space-y-1">
                    <h3 className="font-medium text-sm text-foreground">Set your profile picture</h3>
                    <p className="text-xs text-muted-foreground">Upload a photo or choose a preset</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Presets</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {PRESET_AVATARS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset.svg)}
                            disabled={isUploading || isSaving}
                            className={cn(
                                "aspect-square rounded-xl p-2 border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-center relative overflow-hidden",
                                avatarUrl === getPresetAsDataUri(preset.svg) && "border-primary bg-primary/5 ring-1 ring-primary/20"
                            )}
                            title={preset.label}
                            aria-label={`Select ${preset.label} avatar`}
                        >
                            <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: preset.svg }}
                                aria-hidden="true"
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <Button
                    onClick={handleContinue}
                    disabled={isUploading || isSaving}
                    className="w-full"
                    size="lg"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {avatarUrl ? 'Continue' : 'Skip for now'}
                </Button>
            </div>
        </motion.div>
    );
}
