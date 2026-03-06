export type ChatRole = "user" | "model";

export interface ChatImageAttachment {
  id: string;
  /** Data URL for local preview, or remote URL after upload */
  url: string;
  /** Storage path after upload to R2 */
  storagePath?: string;
  /** Whether this was generated inline by the AI */
  isGenerated: boolean;
  /** Prompt that generated this image (if AI-generated) */
  generationPrompt?: string;
  /** Timestamp */
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Images attached to or generated in this message */
  images: ChatImageAttachment[];
  /** Whether the message is still streaming */
  isStreaming: boolean;
  /** Whether image generation is in progress for this message */
  isGenerating?: boolean;
  /** Generation prompt if the model decided to generate */
  generationPrompt?: string;
  timestamp: number;
}

/** Request body sent to /api/chat */
export interface ChatRequest {
  messages: Array<{
    role: "user" | "model";
    content: string;
    images?: string[]; // base64 data URLs for user-attached images
  }>;
  settings: {
    apiId: string;
    aspectRatio: string;
    imageSize: string;
    outputCount: number;
    negativePrompt?: string;
    referenceImagePaths?: string[];
  };
}

/** SSE event types streamed from /api/chat */
export type ChatSSEEvent =
  | { type: "text"; content: string }
  | { type: "image_generation_start"; prompt: string }
  | { type: "image_generation_complete"; images: Array<{ id: string; url: string; prompt: string }> }
  | { type: "image_generation_error"; error: string }
  | { type: "done" }
  | { type: "error"; error: string };
