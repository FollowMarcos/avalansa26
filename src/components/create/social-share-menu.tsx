"use client";

import * as React from "react";
import { Share2, Twitter, Link2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SocialShareMenuProps {
  imageUrl: string;
  prompt?: string;
  className?: string;
}

// Platform configurations
const PLATFORMS = [
  {
    id: "twitter" as const,
    name: "X (Twitter)",
    icon: Twitter,
    getShareUrl: (imageUrl: string, text: string) => {
      const shareText = text.length > 240
        ? text.slice(0, 237) + "..."
        : text;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(imageUrl)}`;
    },
  },
  {
    id: "pinterest" as const,
    name: "Pinterest",
    icon: ({ className }: { className?: string }) => (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
    ),
    getShareUrl: (imageUrl: string, description: string) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(description)}`,
  },
];

export function SocialShareMenu({
  imageUrl,
  prompt,
  className,
}: SocialShareMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [includeWatermark, setIncludeWatermark] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  // Generate watermarked image URL
  const getProcessedImageUrl = (platform?: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      image: imageUrl,
      watermark: includeWatermark.toString(),
    });
    if (platform) {
      params.set("platform", platform);
    }
    return `${baseUrl}/api/share?${params.toString()}`;
  };

  const handleShare = async (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return;

    setIsLoading(platformId);

    try {
      // Generate the processed image URL
      const processedUrl = getProcessedImageUrl(platformId);

      // Get the share URL for this platform
      const shareText = prompt
        ? `${prompt}\n\nCreated with AVALANSA`
        : "Created with AVALANSA";
      const shareUrl = platform.getShareUrl(processedUrl, shareText);

      // Open in new window
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Failed to share");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      const processedUrl = getProcessedImageUrl();
      await navigator.clipboard.writeText(processedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-4">
          {/* Watermark option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="watermark"
              checked={includeWatermark}
              onCheckedChange={(checked) =>
                setIncludeWatermark(checked === true)
              }
            />
            <Label
              htmlFor="watermark"
              className="text-sm font-normal cursor-pointer"
            >
              Add AVALANSA.COM watermark
            </Label>
          </div>

          {/* Social platforms */}
          <div className="space-y-1">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform.id)}
                disabled={isLoading !== null}
                aria-label={`Share on ${platform.name}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  "hover:bg-muted transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading === platform.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <platform.icon className="size-4" />
                )}
                <span>{platform.name}</span>
              </button>
            ))}

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              aria-label="Copy image link to clipboard"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                "hover:bg-muted transition-colors"
              )}
            >
              {copied ? (
                <Check className="size-4 text-green-500" aria-hidden="true" />
              ) : (
                <Link2 className="size-4" aria-hidden="true" />
              )}
              <span>{copied ? "Copied!" : "Copy Image Link"}</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {includeWatermark
              ? "Image will include watermark"
              : "Share without watermark"}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
