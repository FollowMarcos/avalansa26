"use client";

import * as React from "react";
import { useXPreview } from "./x-preview-context";
import { ImageGrid } from "./image-grid";
import {
  ReplyIcon,
  RepostIcon,
  LikeIcon,
  ViewsIcon,
  BookmarkIcon,
  ShareIcon,
  VerifiedIcon,
} from "./icons";
import { cn } from "@/lib/utils";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(): string {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${timeFormatter.format(now)} · ${dateFormatter.format(now)}`;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  hoverColor: string;
  label: string;
}

function ActionButton({ icon, count, hoverColor, label }: ActionButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 text-[#71767b] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full p-1 -m-1",
        hoverColor
      )}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[13px]">{formatNumber(count)}</span>
      )}
    </button>
  );
}

function TimelineView() {
  const { post } = useXPreview();
  const { author, content, images, stats } = post;

  return (
    <div className="flex gap-3 p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#2f3336] overflow-hidden">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#71767b] text-lg font-semibold">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[15px]">
          <span className="font-bold text-[#e7e9ea] truncate">
            {author.name || "Your Name"}
          </span>
          {author.verified && <VerifiedIcon size={18} />}
          <span className="text-[#71767b] truncate">
            @{author.handle || "handle"}
          </span>
          <span className="text-[#71767b]">·</span>
          <span className="text-[#71767b]">now</span>
        </div>

        {content && (
          <div className="mt-1 text-[15px] text-[#e7e9ea] whitespace-pre-wrap break-words">
            {content}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-3">
            <ImageGrid images={images} variant="timeline" />
          </div>
        )}

        <div className="flex items-center justify-between mt-3 max-w-[425px]">
          <ActionButton
            icon={<ReplyIcon size={18} />}
            count={stats.replies}
            hoverColor="hover:text-[#1d9bf0]"
            label="Reply"
          />
          <ActionButton
            icon={<RepostIcon size={18} />}
            count={stats.reposts}
            hoverColor="hover:text-[#00ba7c]"
            label="Repost"
          />
          <ActionButton
            icon={<LikeIcon size={18} />}
            count={stats.likes}
            hoverColor="hover:text-[#f91880]"
            label="Like"
          />
          <ActionButton
            icon={<ViewsIcon size={18} />}
            count={stats.views}
            hoverColor="hover:text-[#1d9bf0]"
            label="Views"
          />
          <ActionButton
            icon={<BookmarkIcon size={18} />}
            count={stats.bookmarks}
            hoverColor="hover:text-[#1d9bf0]"
            label="Bookmark"
          />
          <ActionButton
            icon={<ShareIcon size={18} />}
            hoverColor="hover:text-[#1d9bf0]"
            label="Share"
          />
        </div>
      </div>
    </div>
  );
}

function ExpandedView() {
  const { post } = useXPreview();
  const { author, content, images, stats } = post;

  return (
    <div className="flex flex-col">
      {/* Top nav area for expanded view */}
      <div className="flex items-center gap-8 p-4 border-b border-[#2f3336]">
        <button className="text-[#e7e9ea] hover:bg-[#eff3f41a] p-2 rounded-full transition-colors" aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#e7e9ea]">Post</h2>
      </div>

      <div className="p-4">
        {/* Author info */}
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#2f3336] overflow-hidden flex-shrink-0">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#71767b] text-lg font-semibold">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[#e7e9ea] hover:underline cursor-pointer">
                {author.name || "Your Name"}
              </span>
              {author.verified && <VerifiedIcon size={18} />}
            </div>
            <div className="text-[#71767b]">@{author.handle || "handle"}</div>
          </div>
        </div>

        {/* Content */}
        {content && (
          <div className="text-[17px] leading-6 text-[#e7e9ea] mb-3 whitespace-pre-wrap break-words">
            {content}
          </div>
        )}

        {/* Images - stacked vertically in expanded view */}
        {images.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="rounded-2xl overflow-hidden border border-[#2f3336]"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-auto block"
                />
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and views */}
        <div className="py-4 border-b border-[#2f3336] text-[#71767b] text-[15px]">
          {formatDate()}
          {stats.views > 0 && (
            <>
              {" · "}
              <span className="text-[#e7e9ea] font-bold">
                {formatNumber(stats.views)}
              </span>{" "}
              <span className="text-[#71767b]">Views</span>
            </>
          )}
        </div>

        {/* Stats row */}
        {(stats.reposts > 0 || stats.likes > 0 || stats.bookmarks > 0) && (
          <div className="py-4 border-b border-[#2f3336] flex gap-5 text-[15px]">
            {stats.reposts > 0 && (
              <span className="text-[#e7e9ea] hover:underline cursor-pointer">
                <strong>{formatNumber(stats.reposts)}</strong>{" "}
                <span className="text-[#71767b]">Reposts</span>
              </span>
            )}
            {stats.likes > 0 && (
              <span className="text-[#e7e9ea] hover:underline cursor-pointer">
                <strong>{formatNumber(stats.likes)}</strong>{" "}
                <span className="text-[#71767b]">Likes</span>
              </span>
            )}
            {stats.bookmarks > 0 && (
              <span className="text-[#e7e9ea] hover:underline cursor-pointer">
                <strong>{formatNumber(stats.bookmarks)}</strong>{" "}
                <span className="text-[#71767b]">Bookmarks</span>
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="py-2 border-b border-[#2f3336] flex items-center justify-around">
          <ActionButton
            icon={<ReplyIcon size={22} />}
            hoverColor="hover:text-[#1d9bf0]"
            label="Reply"
          />
          <ActionButton
            icon={<RepostIcon size={22} />}
            hoverColor="hover:text-[#00ba7c]"
            label="Repost"
          />
          <ActionButton
            icon={<LikeIcon size={22} />}
            hoverColor="hover:text-[#f91880]"
            label="Like"
          />
          <ActionButton
            icon={<BookmarkIcon size={22} />}
            hoverColor="hover:text-[#1d9bf0]"
            label="Bookmark"
          />
          <ActionButton
            icon={<ShareIcon size={22} />}
            hoverColor="hover:text-[#1d9bf0]"
            label="Share"
          />
        </div>
      </div>
    </div>
  );
}

export function PreviewFrame() {
  const { previewMode } = useXPreview();

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-[#2f3336]">
      {previewMode === "timeline" ? <TimelineView /> : <ExpandedView />}
    </div>
  );
}
