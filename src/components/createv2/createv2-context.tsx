"use client";

import * as React from "react";
import type { ApiConfig } from "@/types/api-config";
import type { ChatMessage, ChatImageAttachment } from "@/types/chat";
import type { AspectRatio, ImageSize } from "@/components/create/create-context";
import { useChat } from "./use-chat";

export interface CreateV2Settings {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  outputCount: number;
  negativePrompt: string;
}

const defaultSettings: CreateV2Settings = {
  aspectRatio: "1:1",
  imageSize: "2K",
  outputCount: 1,
  negativePrompt: "",
};

interface CreateV2ContextType {
  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string, attachedImages?: string[]) => Promise<void>;
  stopStreaming: () => void;
  clearChat: () => void;

  // Gallery
  galleryImages: ChatImageAttachment[];
  selectedGalleryImage: ChatImageAttachment | null;
  setSelectedGalleryImage: (image: ChatImageAttachment | null) => void;
  lightboxOpen: boolean;
  setLightboxOpen: (open: boolean) => void;

  // Settings
  settings: CreateV2Settings;
  updateSettings: (partial: Partial<CreateV2Settings>) => void;

  // API selection
  availableApis: ApiConfig[];
  selectedApiId: string | null;
  setSelectedApiId: (id: string | null) => void;
  isLoadingApis: boolean;

  // UI state
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: (open: boolean) => void;
  mobileTab: "chat" | "gallery" | "settings";
  setMobileTab: (tab: "chat" | "gallery" | "settings") => void;
}

const CreateV2Context = React.createContext<CreateV2ContextType | null>(null);

export function useCreateV2(): CreateV2ContextType {
  const ctx = React.useContext(CreateV2Context);
  if (!ctx) throw new Error("useCreateV2 must be used within CreateV2Provider");
  return ctx;
}

export function CreateV2Provider({ children }: { children: React.ReactNode }) {
  // API selection
  const [availableApis, setAvailableApis] = React.useState<ApiConfig[]>([]);
  const [selectedApiId, setSelectedApiId] = React.useState<string | null>(null);
  const [isLoadingApis, setIsLoadingApis] = React.useState(true);

  // Settings
  const [settings, setSettings] = React.useState<CreateV2Settings>(defaultSettings);

  // Gallery
  const [selectedGalleryImage, setSelectedGalleryImage] = React.useState<ChatImageAttachment | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  // UI
  const [settingsPanelOpen, setSettingsPanelOpen] = React.useState(true);
  const [mobileTab, setMobileTab] = React.useState<"chat" | "gallery" | "settings">("chat");

  // Chat hook
  const chat = useChat({
    apiId: selectedApiId,
    settings,
  });

  const updateSettings = React.useCallback((partial: Partial<CreateV2Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // Load APIs on mount
  React.useEffect(() => {
    async function loadApis() {
      try {
        const { getAccessibleApiConfigs } = await import("@/utils/supabase/api-configs.server");
        const apis = await getAccessibleApiConfigs();
        setAvailableApis(apis);
        if (apis.length > 0) {
          // Prefer a Gemini image model
          const geminiApi = apis.find(
            (a) => a.model_id?.includes("gemini") && a.model_id?.includes("image")
          );
          setSelectedApiId(geminiApi?.id || apis[0].id);
        }
      } catch (err) {
        console.error("Failed to load APIs:", err);
      } finally {
        setIsLoadingApis(false);
      }
    }
    loadApis();
  }, []);

  const value = React.useMemo<CreateV2ContextType>(
    () => ({
      // Chat
      messages: chat.messages,
      isStreaming: chat.isStreaming,
      sendMessage: chat.sendMessage,
      stopStreaming: chat.stopStreaming,
      clearChat: chat.clearChat,

      // Gallery
      galleryImages: chat.galleryImages,
      selectedGalleryImage,
      setSelectedGalleryImage,
      lightboxOpen,
      setLightboxOpen,

      // Settings
      settings,
      updateSettings,

      // API
      availableApis,
      selectedApiId,
      setSelectedApiId,
      isLoadingApis,

      // UI
      settingsPanelOpen,
      setSettingsPanelOpen,
      mobileTab,
      setMobileTab,
    }),
    [
      chat.messages, chat.isStreaming, chat.sendMessage, chat.stopStreaming,
      chat.clearChat, chat.galleryImages,
      selectedGalleryImage, lightboxOpen,
      settings, updateSettings,
      availableApis, selectedApiId, isLoadingApis,
      settingsPanelOpen, mobileTab,
    ]
  );

  return (
    <CreateV2Context.Provider value={value}>
      {children}
    </CreateV2Context.Provider>
  );
}
