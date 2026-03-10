'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { Download, Heart, Eye, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getResolutionCategory, formatFileSize } from '@/utils/wallpaper-validation';
import type { WallpaperWithDetails } from '@/types/wallpaper';

interface WallpaperCardProps {
  wallpaper: WallpaperWithDetails;
  isLiked?: boolean;
  isOwner?: boolean;
  onLike?: (id: string) => void;
  onDownload?: (id: string) => void;
  onEdit?: (wallpaper: WallpaperWithDetails) => void;
  onDelete?: (wallpaper: WallpaperWithDetails) => void;
  onClick?: (wallpaper: WallpaperWithDetails) => void;
}

export function WallpaperCard({
  wallpaper,
  isLiked = false,
  isOwner = false,
  onLike,
  onDownload,
  onEdit,
  onDelete,
  onClick,
}: WallpaperCardProps) {
  const resolution = getResolutionCategory(wallpaper.width, wallpaper.height);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 cursor-pointer"
      onClick={() => onClick?.(wallpaper)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={wallpaper.image_url}
          alt={wallpaper.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Resolution Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white border-0 font-vt323 text-sm">
              {resolution}
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 left-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(wallpaper.id);
              }}
              className="p-2 rounded-xl bg-black/60 text-white hover:bg-primary/80 transition-colors"
              aria-label="Download wallpaper"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(wallpaper.id);
              }}
              className={cn(
                'p-2 rounded-xl bg-black/60 transition-colors',
                isLiked ? 'text-red-500 hover:bg-red-500/20' : 'text-white hover:bg-primary/80'
              )}
              aria-label={isLiked ? 'Unlike wallpaper' : 'Like wallpaper'}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </button>
            {isOwner && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(wallpaper);
                  }}
                  className="p-2 rounded-xl bg-black/60 text-white hover:bg-primary/80 transition-colors"
                  aria-label="Edit wallpaper"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(wallpaper);
                  }}
                  className="p-2 rounded-xl bg-black/60 text-red-400 hover:bg-red-500/30 transition-colors"
                  aria-label="Delete wallpaper"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-lato font-semibold text-white text-sm truncate">
              {wallpaper.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-white/70 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {wallpaper.view_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {wallpaper.download_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {wallpaper.like_count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3">
        <h3 className="font-lato font-medium text-sm truncate text-foreground">
          {wallpaper.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground font-mono">
            {wallpaper.width}x{wallpaper.height}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatFileSize(wallpaper.file_size)}
          </span>
        </div>
        {wallpaper.tags && wallpaper.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {wallpaper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-md bg-primary/5 text-primary/80 text-[10px] font-vt323 uppercase"
              >
                {tag.name}
              </span>
            ))}
            {wallpaper.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                +{wallpaper.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
