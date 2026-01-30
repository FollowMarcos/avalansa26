"use client";

import * as React from "react";
import { PostImage } from "./types";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: PostImage[];
  variant?: "timeline" | "expanded";
  className?: string;
}

export function ImageGrid({
  images,
  variant = "timeline",
  className,
}: ImageGridProps) {
  if (images.length === 0) return null;

  const baseImageClass =
    "object-cover w-full h-full bg-muted transition-opacity hover:opacity-90";

  if (images.length === 1) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border",
          variant === "timeline" ? "aspect-video" : "aspect-[4/3]",
          className
        )}
      >
        <img
          src={images[0].url}
          alt={images[0].alt}
          className={baseImageClass}
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-border",
          variant === "timeline" ? "aspect-video" : "aspect-[4/3]",
          className
        )}
      >
        {images.map((image) => (
          <div key={image.id} className="relative overflow-hidden">
            <img src={image.url} alt={image.alt} className={baseImageClass} />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-border",
          variant === "timeline" ? "aspect-video" : "aspect-[4/3]",
          className
        )}
      >
        <div className="relative overflow-hidden">
          <img
            src={images[0].url}
            alt={images[0].alt}
            className={baseImageClass}
          />
        </div>
        <div className="grid grid-rows-2 gap-0.5">
          {images.slice(1).map((image) => (
            <div key={image.id} className="relative overflow-hidden">
              <img src={image.url} alt={image.alt} className={baseImageClass} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl border border-border",
        variant === "timeline" ? "aspect-video" : "aspect-[4/3]",
        className
      )}
    >
      {images.map((image) => (
        <div key={image.id} className="relative overflow-hidden">
          <img src={image.url} alt={image.alt} className={baseImageClass} />
        </div>
      ))}
    </div>
  );
}
