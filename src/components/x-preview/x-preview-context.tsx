"use client";

import * as React from "react";
import { PostData, PreviewMode, DEFAULT_POST, PostImage } from "./types";

interface XPreviewContextType {
  post: PostData;
  setPost: React.Dispatch<React.SetStateAction<PostData>>;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  addImages: (files: FileList) => void;
  removeImage: (id: string) => void;
  moveImage: (id: string, direction: "left" | "right") => void;
}

const XPreviewContext = React.createContext<XPreviewContextType | undefined>(
  undefined
);

export function XPreviewProvider({ children }: { children: React.ReactNode }) {
  const [post, setPost] = React.useState<PostData>(DEFAULT_POST);
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>("timeline");

  const addImages = React.useCallback((files: FileList) => {
    const newImages: PostImage[] = [];
    const maxImages = 4;

    setPost((prev) => {
      const availableSlots = maxImages - prev.images.length;
      const filesToAdd = Array.from(files).slice(0, availableSlots);

      filesToAdd.forEach((file) => {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: crypto.randomUUID(),
          url,
          alt: file.name,
        });
      });

      return {
        ...prev,
        images: [...prev.images, ...newImages],
      };
    });
  }, []);

  const removeImage = React.useCallback((id: string) => {
    setPost((prev) => {
      const imageToRemove = prev.images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return {
        ...prev,
        images: prev.images.filter((img) => img.id !== id),
      };
    });
  }, []);

  const moveImage = React.useCallback(
    (id: string, direction: "left" | "right") => {
      setPost((prev) => {
        const index = prev.images.findIndex((img) => img.id === id);
        if (index === -1) return prev;

        const newIndex = direction === "left" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.images.length) return prev;

        const newImages = [...prev.images];
        [newImages[index], newImages[newIndex]] = [
          newImages[newIndex],
          newImages[index],
        ];

        return { ...prev, images: newImages };
      });
    },
    []
  );

  const value = React.useMemo(
    () => ({
      post,
      setPost,
      previewMode,
      setPreviewMode,
      addImages,
      removeImage,
      moveImage,
    }),
    [
      post,
      previewMode,
      addImages,
      removeImage,
      moveImage,
    ]
  );

  return (
    <XPreviewContext.Provider value={value}>
      {children}
    </XPreviewContext.Provider>
  );
}

export function useXPreview() {
  const context = React.useContext(XPreviewContext);
  if (context === undefined) {
    throw new Error("useXPreview must be used within an XPreviewProvider");
  }
  return context;
}
