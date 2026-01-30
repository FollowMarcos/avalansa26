export interface PostImage {
  id: string;
  url: string;
  alt: string;
}

export interface PostData {
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  images: PostImage[];
  stats: {
    likes: number;
    views: number;
    replies: number;
    reposts: number;
    bookmarks: number;
  };
  timestamp: string;
}

export type PreviewMode = "timeline" | "expanded";

export const DEFAULT_POST: PostData = {
  author: {
    name: "Your Name",
    handle: "yourhandle",
    avatar: "",
    verified: false,
  },
  content: "",
  images: [],
  stats: {
    likes: 0,
    views: 0,
    replies: 0,
    reposts: 0,
    bookmarks: 0,
  },
  timestamp: "now",
};
