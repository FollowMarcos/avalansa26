import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Toggle like via RPC function
    const { data: liked, error } = await supabase.rpc('toggle_wallpaper_like', {
      p_wallpaper_id: id,
    });

    if (error) {
      console.error('Like toggle error:', error.message);
      return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }

    // Get updated count
    const { data: wallpaper } = await supabase
      .from('wallpapers')
      .select('like_count')
      .eq('id', id)
      .single();

    return NextResponse.json({
      liked,
      like_count: wallpaper?.like_count ?? 0,
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
