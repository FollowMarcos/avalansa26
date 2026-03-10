import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  // Get the wallpaper
  const { data: wallpaper } = await supabase
    .from('wallpapers')
    .select('image_url, title, is_public')
    .eq('id', id)
    .single();

  if (!wallpaper || !wallpaper.is_public) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Increment download count
  await supabase.rpc('increment_wallpaper_download', { wallpaper_uuid: id });

  // Redirect to R2 URL
  return NextResponse.redirect(wallpaper.image_url, { status: 302 });
}
