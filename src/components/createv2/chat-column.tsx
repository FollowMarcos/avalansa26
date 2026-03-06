"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2 } from "lucide-react";
import { useCreateV2 } from "./createv2-context";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatColumn() {
  const {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
    isLoadingApis,
    selectedApiId,
    setSelectedGalleryImage,
    setLightboxOpen,
    galleryImages,
  } = useCreateV2();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageClick = React.useCallback(
    (imageUrl: string) => {
      const img = galleryImages.find((g) => g.url === imageUrl);
      if (img) {
        setSelectedGalleryImage(img);
        setLightboxOpen(true);
      }
    },
    [galleryImages, setSelectedGalleryImage, setLightboxOpen]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">AI Chat</h2>
        </div>
        {messages.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={clearChat}
                  disabled={isStreaming}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-4 p-4 min-h-full">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                Describe what you want to create and I&apos;ll generate it for you.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onImageClick={handleImageClick}
            />
          ))}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onStop={stopStreaming}
        disabled={isLoadingApis || !selectedApiId}
      />
    </div>
  );
}
