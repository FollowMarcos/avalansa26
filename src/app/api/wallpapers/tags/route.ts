import { NextRequest, NextResponse } from 'next/server';
import { getWallpaperTags, searchWallpaperTags } from '@/utils/supabase/wallpapers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.searchParams.get('search');

  const tags = search
    ? await searchWallpaperTags(search)
    : await getWallpaperTags();

  return NextResponse.json({ tags });
}
