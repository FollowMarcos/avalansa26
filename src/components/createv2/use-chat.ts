"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ChatImageAttachment, ChatSSEEvent } from "@/types/chat";

interface UseChatOptions {
  apiId: string | null;
  settings: {
    aspectRatio: string;
    imageSize: string;
    outputCount: number;
    negativePrompt: string;
    referenceImagePaths?: string[];
  };
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string, attachedImages?: string[]) => Promise<void>;
  stopStreaming: () => void;
  clearChat: () => void;
  galleryImages: ChatImageAttachment[];
}

export function useChat({ apiId, settings }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive gallery images from all messages
  const galleryImages: ChatImageAttachment[] = messages.flatMap(
    (msg) => msg.images.filter((img) => img.isGenerated)
  );

  const sendMessage = useCallback(
    async (text: string, attachedImages?: string[]) => {
      if (!apiId || isStreaming) return;
      if (!text.trim() && (!attachedImages || attachedImages.length === 0)) return;

      const userMessageId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const modelMessageId = `model-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      // Build user message
      const userImages: ChatImageAttachment[] = (attachedImages || []).map((url, i) => ({
        id: `attach-${Date.now()}-${i}`,
        url,
        isGenerated: false,
        timestamp: Date.now(),
      }));

      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: text,
        images: userImages,
        isStreaming: false,
        timestamp: Date.now(),
      };

      // Create placeholder model message
      const modelMessage: ChatMessage = {
        id: modelMessageId,
        role: "model",
        content: "",
        images: [],
        isStreaming: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, modelMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Build message history for the API (limit to last 20 messages)
        const historyMessages = [...messages, userMessage].slice(-20).map((msg) => ({
          role: msg.role,
          content: msg.content,
          images: msg.images
            .filter((img) => !img.isGenerated)
            .map((img) => img.url)
            .filter((url) => url.startsWith("data:")),
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyMessages,
            settings: {
              apiId,
              aspectRatio: settings.aspectRatio,
              imageSize: settings.imageSize,
              outputCount: settings.outputCount,
              negativePrompt: settings.negativePrompt || undefined,
              referenceImagePaths: settings.referenceImagePaths,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Request failed" }));
          throw new Error(errData.error || `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event: ChatSSEEvent = JSON.parse(jsonStr);

              switch (event.type) {
                case "text":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? { ...msg, content: msg.content + event.content }
                        : msg
                    )
                  );
                  break;

                case "image_generation_start":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? { ...msg, isGenerating: true, generationPrompt: event.prompt }
                        : msg
                    )
                  );
                  break;

                case "image_generation_complete":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? {
                            ...msg,
                            isGenerating: false,
                            images: [
                              ...msg.images,
                              ...event.images.map((img) => ({
                                id: img.id,
                                url: img.url,
                                isGenerated: true,
                                generationPrompt: img.prompt,
                                timestamp: Date.now(),
                              })),
                            ],
                          }
                        : msg
                    )
                  );
                  break;

                case "image_generation_error":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? {
                            ...msg,
                            isGenerating: false,
                            content: msg.content + `\n\n_Image generation failed: ${event.error}_`,
                          }
                        : msg
                    )
                  );
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? {
                            ...msg,
                            isStreaming: false,
                            content: msg.content || `Error: ${event.error}`,
                          }
                        : msg
                    )
                  );
                  break;

                case "done":
                  break;
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled
        } else {
          const errorMsg = err instanceof Error ? err.message : "Something went wrong";
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelMessageId
                ? { ...msg, content: msg.content || errorMsg }
                : msg
            )
          );
        }
      } finally {
        // Mark model message as done streaming
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId
              ? { ...msg, isStreaming: false, isGenerating: false }
              : msg
          )
        );
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [apiId, isStreaming, messages, settings]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
    galleryImages,
  };
}
