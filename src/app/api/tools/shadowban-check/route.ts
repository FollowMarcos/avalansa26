import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CheckStatus = 'clean' | 'banned' | 'unknown';

interface ShadowbanResult {
  searchSuggestionBan: CheckStatus;
  searchBan: CheckStatus;
  ghostBan: CheckStatus;
  replyDeboosting: CheckStatus;
}

interface ApiResponse {
  success: boolean;
  username?: string;
  results?: ShadowbanResult;
  error?: string;
  cached?: boolean;
}

// ---------------------------------------------------------------------------
// X API constants
// ---------------------------------------------------------------------------
const X_BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
const X_API = 'https://api.twitter.com';

// ---------------------------------------------------------------------------
// Caches (module-level, survives warm serverless invocations)
// ---------------------------------------------------------------------------
let guestTokenCache: { token: string; expiresAt: number } | null = null;

const resultsCache = new Map<string, { result: ShadowbanResult; cachedAt: number }>();
const RESULTS_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS_CACHE = 500;

// ---------------------------------------------------------------------------
// Rate limiter (per IP, 5 checks/min)
// ---------------------------------------------------------------------------
const rateMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;
const MAX_RATE_MAP = 5000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup
  if (rateMap.size > MAX_RATE_MAP) {
    for (const [key, entry] of rateMap.entries()) {
      if (now > entry.resetTime) rateMap.delete(key);
    }
  }

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function validateUsername(raw: string): string | null {
  const username = raw.replace(/^@/, '').trim();
  if (/^[A-Za-z0-9_]{1,15}$/.test(username)) return username;
  return null;
}

function buildHeaders(guestToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${X_BEARER_TOKEN}`,
    'x-guest-token': guestToken,
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
  };
}

// ---------------------------------------------------------------------------
// Guest token
// ---------------------------------------------------------------------------
async function getGuestToken(): Promise<string> {
  const now = Date.now();
  if (guestTokenCache && guestTokenCache.expiresAt > now + 5 * 60 * 1000) {
    return guestTokenCache.token;
  }

  const res = await fetch(`${X_API}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${X_BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Guest token request failed: ${res.status}`);
  }

  const data = await res.json();
  const token: string = data.guest_token;

  guestTokenCache = { token, expiresAt: now + 2.5 * 60 * 60 * 1000 };
  return token;
}

// ---------------------------------------------------------------------------
// Check 1: Search Suggestion Ban
// ---------------------------------------------------------------------------
async function checkSearchSuggestionBan(
  username: string,
  guestToken: string
): Promise<CheckStatus> {
  const url = `${X_API}/1.1/search/typeahead.json?q=${encodeURIComponent('@' + username)}&src=search_box&result_type=users`;

  const res = await fetch(url, {
    headers: buildHeaders(guestToken),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return 'unknown';

  const data = await res.json();
  const users: Array<{ screen_name: string }> = data?.users ?? [];
  const found = users.some(
    (u) => u.screen_name.toLowerCase() === username.toLowerCase()
  );

  return found ? 'clean' : 'banned';
}

// ---------------------------------------------------------------------------
// Check 2: Search Ban
// ---------------------------------------------------------------------------
async function checkSearchBan(
  username: string,
  guestToken: string
): Promise<CheckStatus> {
  const query = encodeURIComponent(`from:@${username}`);
  const url = `${X_API}/2/search/adaptive.json?q=${query}&count=1&query_source=typed_query`;

  const res = await fetch(url, {
    headers: buildHeaders(guestToken),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return 'unknown';

  const data = await res.json();
  const tweetCount = Object.keys(data?.globalObjects?.tweets ?? {}).length;

  return tweetCount > 0 ? 'clean' : 'banned';
}

// ---------------------------------------------------------------------------
// Check 3 + 4: Ghost Ban & Reply Deboosting
// ---------------------------------------------------------------------------
interface TimelineTweet {
  id_str: string;
  in_reply_to_status_id_str: string | null;
  in_reply_to_screen_name: string | null;
}

async function checkGhostAndReplyBans(
  username: string,
  guestToken: string
): Promise<{ ghostBan: CheckStatus; replyDeboosting: CheckStatus }> {
  const unknown = { ghostBan: 'unknown' as CheckStatus, replyDeboosting: 'unknown' as CheckStatus };

  // Step 1: get user timeline to find a recent reply
  const timelineUrl = `${X_API}/1.1/statuses/user_timeline.json?screen_name=${username}&count=40&exclude_replies=false&include_rts=false`;

  const tlRes = await fetch(timelineUrl, {
    headers: buildHeaders(guestToken),
    signal: AbortSignal.timeout(8000),
  });

  if (!tlRes.ok) return unknown;

  const tweets: TimelineTweet[] = await tlRes.json();

  // Find a reply to someone else (not a self-thread)
  const replyTweet = tweets.find(
    (t) =>
      t.in_reply_to_status_id_str &&
      t.in_reply_to_screen_name?.toLowerCase() !== username.toLowerCase()
  );

  if (!replyTweet?.in_reply_to_status_id_str) return unknown;

  // Step 2: fetch the parent conversation as guest
  const parentId = replyTweet.in_reply_to_status_id_str;
  const convUrl = `https://twitter.com/i/api/2/timeline/conversation/${parentId}.json?count=20&include_reply_count=1&tweet_mode=extended`;

  const convRes = await fetch(convUrl, {
    headers: buildHeaders(guestToken),
    signal: AbortSignal.timeout(10000),
  });

  if (!convRes.ok) return unknown;

  const convData = await convRes.json();

  // Step 3: check if our reply is visible in the conversation
  const globalTweets: Record<string, unknown> = convData?.globalObjects?.tweets ?? {};
  const tweetVisible = replyTweet.id_str in globalTweets;

  if (!tweetVisible) {
    return { ghostBan: 'banned', replyDeboosting: 'unknown' };
  }

  // Step 4: check if reply is deboosted (behind "Show more replies")
  let isDeboosted = false;

  const instructions: Array<{ addEntries?: { entries?: Array<{ entryId?: string }> } }> =
    convData?.timeline?.instructions ?? [];

  for (const instruction of instructions) {
    const entries = instruction?.addEntries?.entries ?? [];
    for (const entry of entries) {
      if (entry.entryId?.startsWith('show-more-threads') || entry.entryId?.startsWith('conversationThread-show-more')) {
        isDeboosted = true;
        break;
      }
    }
    if (isDeboosted) break;
  }

  return {
    ghostBan: 'clean',
    replyDeboosting: isDeboosted ? 'banned' : 'clean',
  };
}

// ---------------------------------------------------------------------------
// Results cache helpers
// ---------------------------------------------------------------------------
function getCached(username: string): ShadowbanResult | null {
  const key = username.toLowerCase();
  const entry = resultsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > RESULTS_TTL) {
    resultsCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(username: string, result: ShadowbanResult): void {
  if (resultsCache.size >= MAX_RESULTS_CACHE) {
    const oldestKey = resultsCache.keys().next().value;
    if (oldestKey) resultsCache.delete(oldestKey);
  }
  resultsCache.set(username.toLowerCase(), { result, cachedAt: Date.now() });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const username = validateUsername(body?.username ?? '');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Invalid username. Use 1-15 alphanumeric characters or underscores.' },
        { status: 400 }
      );
    }

    // Check cache
    const cached = getCached(username);
    if (cached) {
      return NextResponse.json({ success: true, username, results: cached, cached: true });
    }

    // Get guest token
    let guestToken: string;
    try {
      guestToken = await getGuestToken();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unable to connect to X. Please try again later.' },
        { status: 502 }
      );
    }

    // Run all 4 checks in parallel
    const [searchSuggestionBan, searchBan, ghostReply] = await Promise.all([
      checkSearchSuggestionBan(username, guestToken).catch(
        (): CheckStatus => 'unknown'
      ),
      checkSearchBan(username, guestToken).catch(
        (): CheckStatus => 'unknown'
      ),
      checkGhostAndReplyBans(username, guestToken).catch(() => ({
        ghostBan: 'unknown' as CheckStatus,
        replyDeboosting: 'unknown' as CheckStatus,
      })),
    ]);

    const results: ShadowbanResult = {
      searchSuggestionBan,
      searchBan,
      ghostBan: ghostReply.ghostBan,
      replyDeboosting: ghostReply.replyDeboosting,
    };

    setCache(username, results);

    return NextResponse.json({ success: true, username, results, cached: false });
  } catch (error) {
    console.error('[Shadowban Check] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
