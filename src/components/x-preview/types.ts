export interface PostImage {
  id: string;
  url: string;
  alt: string;
}

export interface PostData {
  images: PostImage[];
}

export type PreviewMode = "timeline" | "expanded";

export const DEFAULT_POST: PostData = {
  images: [],
};
