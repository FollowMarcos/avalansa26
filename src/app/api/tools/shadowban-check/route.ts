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
// Constants
// ---------------------------------------------------------------------------
// Two known public bearer tokens from X's web/mobile apps
const BEARER_TOKENS = [
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
  'AAAAAAAAAAAAAAAAAAAAAFXzAwAAAAAAMHCxpeSDG1gLNLghVe8d74hl6k4%3DRUMF4xAQLsbeBhTSRrCiQpJtxoGWeyHrDb5te2jpGskWDFW82F',
];

const X_API = 'https://api.twitter.com';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Caches
// ---------------------------------------------------------------------------
let guestTokenCache: { token: string; bearer: string; expiresAt: number } | null = null;

const resultsCache = new Map<string, { result: ShadowbanResult; cachedAt: number }>();
const RESULTS_TTL = 5 * 60 * 1000;
const MAX_RESULTS_CACHE = 500;

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------
const rateMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;
const MAX_RATE_MAP = 5000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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

function buildHeaders(guestToken: string, bearer: string): HeadersInit {
  return {
    Authorization: `Bearer ${bearer}`,
    'x-guest-token': guestToken,
    'Content-Type': 'application/json',
    'User-Agent': BROWSER_UA,
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
  };
}

// ---------------------------------------------------------------------------
// Guest token acquisition (multi-method, multi-bearer)
// ---------------------------------------------------------------------------
function cacheGuestToken(token: string, bearer: string): void {
  guestTokenCache = { token, bearer, expiresAt: Date.now() + 2 * 60 * 60 * 1000 };
}

async function tryActivate(bearer: string): Promise<string | null> {
  try {
    const res = await fetch(`${X_API}/1.1/guest/activate.json`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.guest_token) return data.guest_token;
    }
  } catch { /* */ }
  return null;
}

async function tryOnboardingFlow(bearer: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${X_API}/1.1/onboarding/task.json?flow_name=welcome`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearer}`,
          'Content-Type': 'application/json',
          'User-Agent': BROWSER_UA,
        },
        body: JSON.stringify({
          input_flow_data: {
            flow_context: {
              debug_overrides: {},
              start_location: { location: 'splash_screen' },
            },
          },
          subtask_versions: {},
        }),
        signal: AbortSignal.timeout(6000),
      }
    );
    const gt = res.headers.get('x-guest-token');
    if (gt) return gt;
  } catch { /* */ }
  return null;
}

async function tryScrapePage(): Promise<{ token: string; bearer: string } | null> {
  try {
    const pageRes = await fetch('https://x.com/', {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    // Check Set-Cookie for gt=
    const setCookieHeader = pageRes.headers.get('set-cookie') ?? '';
    const cookieMatch = setCookieHeader.match(/\bgt=(\d{15,22})/);
    if (cookieMatch) {
      return { token: cookieMatch[1], bearer: BEARER_TOKENS[0] };
    }

    // Check response body
    const body = await pageRes.text();
    const patterns = [
      /document\.cookie\s*=\s*["'][^"']*gt=(\d{15,22})/,
      /"gt"\s*:\s*"?(\d{15,22})/,
      /gt=(\d{15,22})/,
    ];
    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return { token: match[1], bearer: BEARER_TOKENS[0] };
      }
    }
  } catch { /* */ }
  return null;
}

async function getGuestToken(): Promise<{ token: string; bearer: string }> {
  const now = Date.now();
  if (guestTokenCache && guestTokenCache.expiresAt > now + 5 * 60 * 1000) {
    return { token: guestTokenCache.token, bearer: guestTokenCache.bearer };
  }

  // Try each bearer token with each method
  for (const bearer of BEARER_TOKENS) {
    // Method 1: activate endpoint
    const activated = await tryActivate(bearer);
    if (activated) {
      cacheGuestToken(activated, bearer);
      return { token: activated, bearer };
    }

    // Method 2: onboarding flow
    const onboarded = await tryOnboardingFlow(bearer);
    if (onboarded) {
      cacheGuestToken(onboarded, bearer);
      return { token: onboarded, bearer };
    }
  }

  // Method 3: scrape homepage
  const scraped = await tryScrapePage();
  if (scraped) {
    cacheGuestToken(scraped.token, scraped.bearer);
    return scraped;
  }

  throw new Error('All guest token methods failed');
}

// ---------------------------------------------------------------------------
// Syndication fallback (no auth needed — uses X's embed infrastructure)
// ---------------------------------------------------------------------------
async function syndicationProfileExists(username: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
      {
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function syndicationTweetVisible(tweetId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`,
      {
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.text;
  } catch {
    return false;
  }
}

// Extract tweet IDs from syndication profile HTML
async function syndicationGetTweetIds(username: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
      {
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const html = await res.text();
    // Extract tweet IDs from status URLs in the HTML
    const ids = [...html.matchAll(/\/status\/(\d{15,22})/g)].map((m) => m[1]);
    return [...new Set(ids)].slice(0, 10);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Check 1: Search Suggestion Ban (guest token required)
// ---------------------------------------------------------------------------
async function checkSearchSuggestionBan(
  username: string,
  guestToken: string,
  bearer: string
): Promise<CheckStatus> {
  const url = `${X_API}/1.1/search/typeahead.json?q=${encodeURIComponent('@' + username)}&src=search_box&result_type=users`;

  const res = await fetch(url, {
    headers: buildHeaders(guestToken, bearer),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return 'unknown';

  const data = await res.json();
  const users: Array<{ screen_name: string }> = data?.users ?? [];
  return users.some(
    (u) => u.screen_name.toLowerCase() === username.toLowerCase()
  )
    ? 'clean'
    : 'banned';
}

// ---------------------------------------------------------------------------
// Check 2: Search Ban (guest token required)
// Searches "from:@username" — if no tweets found, account is search-banned
// ---------------------------------------------------------------------------
async function checkSearchBan(
  username: string,
  guestToken: string,
  bearer: string
): Promise<CheckStatus> {
  const query = encodeURIComponent(`from:@${username}`);
  const url = `${X_API}/2/search/adaptive.json?q=${query}&count=1&query_source=typed_query`;

  const res = await fetch(url, {
    headers: buildHeaders(guestToken, bearer),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return 'unknown';

  const data = await res.json();
  const tweetCount = Object.keys(data?.globalObjects?.tweets ?? {}).length;
  return tweetCount > 0 ? 'clean' : 'banned';
}

// ---------------------------------------------------------------------------
// Check 3+4: Ghost Ban & Reply Deboosting (guest token required)
// Finds a reply to another user, fetches the parent conversation as guest,
// checks if the reply is visible and whether it's behind "Show more replies"
// ---------------------------------------------------------------------------
interface TimelineTweet {
  id_str: string;
  in_reply_to_status_id_str: string | null;
  in_reply_to_screen_name: string | null;
}

async function checkGhostAndReplyBans(
  username: string,
  guestToken: string,
  bearer: string
): Promise<{ ghostBan: CheckStatus; replyDeboosting: CheckStatus }> {
  const unknown = {
    ghostBan: 'unknown' as CheckStatus,
    replyDeboosting: 'unknown' as CheckStatus,
  };

  // Get user timeline to find a reply
  const timelineUrl = `${X_API}/1.1/statuses/user_timeline.json?screen_name=${username}&count=40&exclude_replies=false&include_rts=false`;

  const tlRes = await fetch(timelineUrl, {
    headers: buildHeaders(guestToken, bearer),
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

  // Fetch the parent conversation as guest
  const parentId = replyTweet.in_reply_to_status_id_str;
  const convUrl = `https://twitter.com/i/api/2/timeline/conversation/${parentId}.json?count=20&include_reply_count=1&tweet_mode=extended`;

  const convRes = await fetch(convUrl, {
    headers: buildHeaders(guestToken, bearer),
    signal: AbortSignal.timeout(10000),
  });

  if (!convRes.ok) return unknown;

  const convData = await convRes.json();

  // Check if our reply is visible
  const globalTweets: Record<string, unknown> =
    convData?.globalObjects?.tweets ?? {};
  const tweetVisible = replyTweet.id_str in globalTweets;

  if (!tweetVisible) {
    return { ghostBan: 'banned', replyDeboosting: 'unknown' };
  }

  // Check if reply is deboosted (behind "Show more replies" cursor)
  let isDeboosted = false;
  const instructions: Array<{
    addEntries?: { entries?: Array<{ entryId?: string }> };
  }> = convData?.timeline?.instructions ?? [];

  for (const instruction of instructions) {
    const entries = instruction?.addEntries?.entries ?? [];
    for (const entry of entries) {
      if (
        entry.entryId?.includes('show-more-threads') ||
        entry.entryId?.includes('cursor-showmorethreadsprompt')
      ) {
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
// Syndication-based fallback checks (no guest token needed)
// Less precise but works when X blocks API access
// ---------------------------------------------------------------------------
async function runSyndicationChecks(
  username: string
): Promise<ShadowbanResult> {
  const profileExists = await syndicationProfileExists(username);
  if (!profileExists) {
    return {
      searchSuggestionBan: 'unknown',
      searchBan: 'unknown',
      ghostBan: 'unknown',
      replyDeboosting: 'unknown',
    };
  }

  // Get recent tweet IDs from syndication profile
  const tweetIds = await syndicationGetTweetIds(username);

  // If we got tweet IDs, check if they're individually accessible
  // (syndication embed endpoints don't require auth)
  let tweetsVisible = false;
  if (tweetIds.length > 0) {
    // Check first 3 tweets
    const checks = await Promise.all(
      tweetIds.slice(0, 3).map((id) => syndicationTweetVisible(id))
    );
    tweetsVisible = checks.some(Boolean);
  }

  return {
    // Can't check typeahead without guest token
    searchSuggestionBan: 'unknown',
    // If profile loads via syndication and tweets render, likely not search-banned
    // (imprecise — syndication ≠ search index, but it's a signal)
    searchBan: tweetsVisible ? 'clean' : 'unknown',
    // Can't check thread visibility without guest token
    ghostBan: 'unknown',
    replyDeboosting: 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Results cache
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

    const body = await request.json();
    const username = validateUsername(body?.username ?? '');

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid username. Use 1-15 alphanumeric characters or underscores.',
        },
        { status: 400 }
      );
    }

    const cached = getCached(username);
    if (cached) {
      return NextResponse.json({
        success: true,
        username,
        results: cached,
        cached: true,
      });
    }

    // Try full guest-token approach first
    let results: ShadowbanResult;

    try {
      const { token, bearer } = await getGuestToken();

      const [searchSuggestionBan, searchBan, ghostReply] = await Promise.all([
        checkSearchSuggestionBan(username, token, bearer).catch(
          (): CheckStatus => 'unknown'
        ),
        checkSearchBan(username, token, bearer).catch(
          (): CheckStatus => 'unknown'
        ),
        checkGhostAndReplyBans(username, token, bearer).catch(() => ({
          ghostBan: 'unknown' as CheckStatus,
          replyDeboosting: 'unknown' as CheckStatus,
        })),
      ]);

      results = {
        searchSuggestionBan,
        searchBan,
        ghostBan: ghostReply.ghostBan,
        replyDeboosting: ghostReply.replyDeboosting,
      };
    } catch {
      // Guest token failed — fall back to syndication-based checks
      // (less precise but doesn't need auth)
      console.warn('[Shadowban Check] Guest token unavailable, using syndication fallback');
      results = await runSyndicationChecks(username);
    }

    setCache(username, results);

    return NextResponse.json({
      success: true,
      username,
      results,
      cached: false,
    });
  } catch (error) {
    console.error('[Shadowban Check] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
