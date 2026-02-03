import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // Simplified LLM response for testing - can be enhanced later
    // TODO: Integrate with Google Gemini or OpenAI properly
    return NextResponse.json({
      success: true,
      text: `Generated response for: ${prompt}`,
    });
  } catch (error) {
    console.error('Create-lab LLM error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
