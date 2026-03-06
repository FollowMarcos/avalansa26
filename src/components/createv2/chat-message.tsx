"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Loader2, ImageIcon } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onImageClick?: (imageUrl: string) => void;
}

export function ChatMessage({ message, onImageClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* User attached images */}
        {isUser && message.images.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.images.map((img) => (
              <div
                key={img.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => onImageClick?.(img.url)}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={cn(
              "px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
              isUser
                ? "bg-foreground text-background rounded-2xl rounded-br-md"
                : "text-foreground"
            )}
          >
            {message.content}
          </div>
        )}

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && !message.isGenerating && (
          <div className="flex items-center gap-1.5 px-1 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Image generation in progress */}
        {message.isGenerating && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Generating image{"\u2026"}</span>
          </div>
        )}

        {/* AI generated images */}
        {!isUser && message.images.length > 0 && (
          <div
            className={cn(
              "grid gap-2 mt-1",
              message.images.length === 1 ? "grid-cols-1" :
              message.images.length === 2 ? "grid-cols-2" :
              "grid-cols-2"
            )}
          >
            {message.images
              .filter((img) => img.isGenerated)
              .map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-muted"
                  onClick={() => onImageClick?.(img.url)}
                >
                  <Image
                    src={img.url}
                    alt={img.generationPrompt || "Generated image"}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-white/90">
                      <ImageIcon className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Generated</span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
