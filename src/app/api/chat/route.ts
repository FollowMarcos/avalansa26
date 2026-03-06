import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { uploadGeneratedImage } from '@/utils/supabase/storage.server';
import { saveGeneration } from '@/utils/supabase/generations.server';
import type { ChatRequest, ChatSSEEvent } from '@/types/chat';

export const maxDuration = 300;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const CHAT_MODEL = 'gemini-2.5-flash-preview-05-20';

const SYSTEM_INSTRUCTION = `You are a creative AI assistant specializing in image generation. You help users brainstorm, refine, and create images.

CAPABILITIES:
- You can generate images by calling the generate_image function when the user asks you to create, draw, make, or generate an image.
- You can help users refine their prompts for better results.
- You can suggest creative ideas and artistic directions.
- You can discuss art styles, composition, color theory, and visual concepts.

GUIDELINES:
- When generating images, craft detailed, descriptive prompts that will produce high-quality results.
- Include specifics about style, lighting, composition, mood, and important details.
- If the user's request is vague, ask clarifying questions OR make creative decisions and explain them.
- Keep text responses concise and helpful. Don't be overly verbose.
- When you generate an image, briefly describe what you're creating and why.`;

const GENERATE_IMAGE_TOOL = {
  functionDeclarations: [{
    name: 'generate_image',
    description: 'Generate an image based on a detailed prompt. Use this when the user asks you to create, generate, draw, make, design, or produce an image or visual.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        prompt: {
          type: 'STRING' as const,
          description: 'A detailed image generation prompt describing the desired image. Include style, composition, lighting, mood, and specific visual details.',
        },
        negative_prompt: {
          type: 'STRING' as const,
          description: 'What to avoid in the generated image. Optional.',
        },
      },
      required: ['prompt'],
    },
  }],
};

function sseEncode(event: ChatSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, settings } = body;

  if (!settings.apiId) {
    return new Response(JSON.stringify({ error: 'API ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get API key
  const apiKey = await getDecryptedApiKey(settings.apiId);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve API credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get API config for model info
  const apiConfig = await getApiConfig(settings.apiId);
  const imageModelId = apiConfig?.model_id || 'gemini-2.0-flash-exp';

  // Build Gemini contents from message history
  const contents = messages.map((msg) => {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    // Add attached images as inline data
    if (msg.images && msg.images.length > 0) {
      for (const imageData of msg.images) {
        const mimeMatch = imageData.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const data = mimeMatch ? imageData.replace(/^data:[^;]+;base64,/, '') : imageData;
        parts.push({ inlineData: { mimeType, data } });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: '' });
    }

    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Call Gemini streaming API with function calling
        const chatRequestBody = {
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents,
          tools: [GENERATE_IMAGE_TOOL],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        };

        const response = await fetch(
          `${GEMINI_BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatRequestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Chat] Gemini API error:', errorText);
          controller.enqueue(encoder.encode(sseEncode({ type: 'error', error: 'Failed to get AI response. Please try again.' })));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(sseEncode({ type: 'error', error: 'No response stream' })));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let functionCallDetected = false;
        let functionCallArgs: { prompt: string; negative_prompt?: string } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const chunk = JSON.parse(jsonStr);
              const candidates = chunk.candidates;
              if (!candidates || candidates.length === 0) continue;

              const content = candidates[0].content;
              if (!content || !content.parts) continue;

              for (const part of content.parts) {
                // Text content
                if (part.text) {
                  controller.enqueue(encoder.encode(sseEncode({ type: 'text', content: part.text })));
                }

                // Function call
                if (part.functionCall) {
                  functionCallDetected = true;
                  const args = part.functionCall.args || {};
                  functionCallArgs = {
                    prompt: args.prompt || '',
                    negative_prompt: args.negative_prompt,
                  };
                }
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        // Handle function call (image generation)
        if (functionCallDetected && functionCallArgs && functionCallArgs.prompt) {
          controller.enqueue(encoder.encode(sseEncode({
            type: 'image_generation_start',
            prompt: functionCallArgs.prompt,
          })));

          try {
            const images = await generateImageForChat({
              apiKey,
              modelId: imageModelId,
              prompt: functionCallArgs.prompt,
              negativePrompt: functionCallArgs.negative_prompt || settings.negativePrompt,
              aspectRatio: settings.aspectRatio,
              imageSize: settings.imageSize,
              outputCount: settings.outputCount,
              userId: user.id,
            });

            controller.enqueue(encoder.encode(sseEncode({
              type: 'image_generation_complete',
              images: images.map((img) => ({
                id: img.id,
                url: img.url,
                prompt: functionCallArgs!.prompt,
              })),
            })));
          } catch (err) {
            console.error('[Chat] Image generation error:', err);
            controller.enqueue(encoder.encode(sseEncode({
              type: 'image_generation_error',
              error: err instanceof Error ? err.message : 'Image generation failed',
            })));
          }
        }

        controller.enqueue(encoder.encode(sseEncode({ type: 'done' })));
        controller.close();
      } catch (err) {
        console.error('[Chat] Stream error:', err);
        controller.enqueue(encoder.encode(sseEncode({ type: 'error', error: 'An unexpected error occurred' })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Image generation using Gemini (reuses the same pattern as /api/generate)
interface ChatGenerateParams {
  apiKey: string;
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  imageSize: string;
  outputCount: number;
  userId: string;
}

async function generateImageForChat(params: ChatGenerateParams): Promise<Array<{ id: string; url: string }>> {
  const { apiKey, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount, userId } = params;

  const fullPrompt = negativePrompt ? `${prompt}\n\nAvoid: ${negativePrompt}` : prompt;

  const parts: Array<{ text: string }> = [{ text: fullPrompt }];

  const model = modelId || 'gemini-2.0-flash-exp';
  const supportsImageConfig = model.includes('gemini-3') || model.includes('image-preview');

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['IMAGE', 'TEXT'],
  };

  if (supportsImageConfig) {
    const imageConfig: Record<string, string> = {};
    if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
    if (imageSize) imageConfig.imageSize = imageSize;
    if (Object.keys(imageConfig).length > 0) {
      generationConfig.imageConfig = imageConfig;
    }
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig,
  };

  const apiEndpoint = `${GEMINI_BASE_URL}/${model}:generateContent`;
  const REQUEST_TIMEOUT = 180000;

  const results: Array<{ id: string; url: string }> = [];

  // Generate images in parallel
  const promises = Array.from({ length: Math.min(outputCount, 4) }, async (_, i) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Chat Gen] Request ${i + 1} failed:`, errorText);
        throw new Error(`Generation failed (${response.status})`);
      }

      const data = await response.json();
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No image generated');
      }

      // Extract image from response
      for (const candidate of candidates) {
        if (!candidate.content?.parts) continue;
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const { mimeType, data: base64Data } = part.inlineData;
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            // Upload to R2
            const uploaded = await uploadGeneratedImage(dataUrl, userId, mimeType);
            if (uploaded.url) {
              const imageId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

              // Save to generation history
              await saveGeneration({
                user_id: userId,
                prompt,
                negative_prompt: params.negativePrompt || null,
                image_url: uploaded.url,
                image_path: uploaded.path || null,
                api_config_id: null,
                settings: {
                  aspectRatio,
                  imageSize,
                  outputCount,
                  source: 'chatv2',
                },
              });

              return { id: imageId, url: uploaded.url };
            }
          }
        }
      }

      throw new Error('No image data in response');
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  }

  if (results.length === 0) {
    throw new Error('All image generation attempts failed');
  }

  return results;
}
