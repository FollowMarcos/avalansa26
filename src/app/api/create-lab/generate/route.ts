import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, prompt, model, aspectRatio, resolution } = body;

    // Transform to existing API format
    const apiRequest = {
      apiId: process.env.NEXT_PUBLIC_CREATE_LAB_DEFAULT_API_ID || 'default-google-api',
      prompt: prompt || '',
      negativePrompt: '',
      aspectRatio: aspectRatio || '1:1',
      imageSize: resolution || '2K',
      outputCount: 1,
      referenceImagePaths: [], // TODO: Convert base64 to Supabase storage if needed
      mode: 'fast' as const,
    };

    // Forward to existing /api/generate
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform response to workflow format (base64 data URL)
    return NextResponse.json({
      success: data.success,
      image: data.images?.[0]?.url, // Return first image
      error: data.error,
    });
  } catch (error) {
    console.error('Create-lab generate error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
