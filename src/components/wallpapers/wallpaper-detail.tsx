'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Download,
  Heart,
  Eye,
  Share2,
  Calendar,
  Monitor,
  HardDrive,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  getResolutionCategory,
  computeAspectRatio,
  formatFileSize,
} from '@/utils/wallpaper-validation';
import type { WallpaperWithDetails } from '@/types/wallpaper';
import { toast } from 'sonner';

interface WallpaperDetailProps {
  wallpaper: WallpaperWithDetails;
  isLiked?: boolean;
  isOwner?: boolean;
  onLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function WallpaperDetail({
  wallpaper,
  isLiked = false,
  isOwner = false,
  onLike,
  onEdit,
  onDelete,
  onClose,
  isModal = false,
}: WallpaperDetailProps) {
  const resolution = getResolutionCategory(wallpaper.width, wallpaper.height);
  const ratio = wallpaper.aspect_ratio || computeAspectRatio(wallpaper.width, wallpaper.height);

  const handleDownload = () => {
    window.open(`/api/wallpapers/${wallpaper.id}/download`, '_blank');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/wallpapers/w/${wallpaper.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card rounded-3xl overflow-hidden border border-border/50',
        isModal && 'max-h-[90vh] overflow-y-auto'
      )}
    >
      {/* Close button for modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Image Preview */}
      <div className="relative w-full aspect-video bg-black">
        <Image
          src={wallpaper.image_url}
          alt={wallpaper.title}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 80vw"
          priority
        />
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-vt323 text-3xl text-foreground uppercase tracking-tight">
              {wallpaper.title}
            </h1>
            {wallpaper.description && (
              <p className="font-lato text-sm text-muted-foreground leading-relaxed">
                {wallpaper.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleDownload}
              className="rounded-xl gap-2 font-vt323 text-lg uppercase"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'rounded-xl',
                isLiked && 'text-red-500 border-red-500/30 hover:text-red-600'
              )}
              onClick={onLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={onEdit}
                  aria-label="Edit wallpaper"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                  aria-label="Delete wallpaper"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {wallpaper.tags && wallpaper.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {wallpaper.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/wallpapers?tag=${tag.slug}`}
                className="px-3 py-1 rounded-xl bg-primary/5 border border-primary/10 text-primary font-vt323 text-sm lowercase hover:bg-primary hover:text-primary-foreground transition-all"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetaStat
            icon={<Monitor className="w-4 h-4" />}
            label="Resolution"
            value={`${wallpaper.width}x${wallpaper.height}`}
            sub={`${resolution} \u00B7 ${ratio}`}
          />
          <MetaStat
            icon={<HardDrive className="w-4 h-4" />}
            label="File Size"
            value={formatFileSize(wallpaper.file_size)}
            sub={wallpaper.mime_type.split('/')[1]?.toUpperCase()}
          />
          <MetaStat
            icon={<Calendar className="w-4 h-4" />}
            label="Uploaded"
            value={new Date(wallpaper.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          />
          <MetaStat
            icon={<Eye className="w-4 h-4" />}
            label="Stats"
            value={`${wallpaper.view_count.toLocaleString()} views`}
            sub={`${wallpaper.download_count.toLocaleString()} downloads \u00B7 ${wallpaper.like_count.toLocaleString()} likes`}
          />
        </div>

        {/* Uploader Info */}
        {wallpaper.user && (
          <div className="pt-4 border-t border-border/50">
            <Link
              href={`/u/${wallpaper.user.username}/wallpapers`}
              className="flex items-center gap-3 group/user"
            >
              <Avatar className="w-10 h-10">
                {wallpaper.user.avatar_url ? (
                  <AvatarImage src={wallpaper.user.avatar_url} alt={wallpaper.user.name || wallpaper.user.username} />
                ) : null}
                <AvatarFallback className="font-vt323 text-lg">
                  {(wallpaper.user.name || wallpaper.user.username)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-lato font-medium text-sm text-foreground group-hover/user:text-primary transition-colors">
                  {wallpaper.user.name || wallpaper.user.username}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  u/{wallpaper.user.username}
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MetaStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-primary/[0.02] border border-primary/5 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-vt323 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-mono text-sm text-foreground">{value}</p>
      {sub && (
        <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
