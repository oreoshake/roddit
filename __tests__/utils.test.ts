import {formatRelativeTime, formatScore} from '../src/utils/time';
import {buildOAuthUrl, parseCallbackUrl, decodeHtmlEntities} from '../src/utils/reddit';

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  const NOW = 1_700_000_000; // a fixed "now" in seconds
  const nowMs = NOW * 1000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(nowMs);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns "just now" for very recent timestamps', () => {
    expect(formatRelativeTime(NOW - 30)).toBe('just now');
  });

  it('formats minutes ago', () => {
    expect(formatRelativeTime(NOW - 60 * 5)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 3)).toBe('3h ago');
  });

  it('formats days ago', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 24 * 2)).toBe('2d ago');
  });

  it('formats months ago', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 24 * 35)).toBe('1mo ago');
  });

  it('formats years ago', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 24 * 400)).toBe('1y ago');
  });
});

// ─── formatScore ─────────────────────────────────────────────────────────────

describe('formatScore', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatScore(42)).toBe('42');
    expect(formatScore(999)).toBe('999');
  });

  it('returns k-notation for thousands', () => {
    expect(formatScore(1000)).toBe('1k');
    expect(formatScore(1200)).toBe('1.2k');
    expect(formatScore(12_000)).toBe('12k');
  });

  it('returns m-notation for millions', () => {
    expect(formatScore(1_000_000)).toBe('1m');
    expect(formatScore(1_500_000)).toBe('1.5m');
  });

  it('handles negative scores', () => {
    expect(formatScore(-50)).toBe('-50');
    expect(formatScore(-1500)).toBe('-1.5k');
  });
});

// ─── buildOAuthUrl ────────────────────────────────────────────────────────────

describe('buildOAuthUrl', () => {
  it('builds a valid Reddit OAuth URL', () => {
    const url = buildOAuthUrl('myClientId', 'myapp://callback', ['read', 'identity'], 'teststate');
    expect(url).toContain('client_id=myClientId');
    expect(url).toContain('redirect_uri=myapp%3A%2F%2Fcallback');
    expect(url).toContain('scope=read+identity');
    expect(url).toContain('state=teststate');
    expect(url).toContain('response_type=code');
    expect(url).toContain('duration=permanent');
  });
});

// ─── parseCallbackUrl ─────────────────────────────────────────────────────────

describe('parseCallbackUrl', () => {
  it('extracts code and state from a valid callback URL', () => {
    const url = 'roddit://oauth/callback?code=abc123&state=xyz';
    expect(parseCallbackUrl(url)).toEqual({code: 'abc123', state: 'xyz'});
  });

  it('returns null when error param is present', () => {
    const url = 'roddit://oauth/callback?error=access_denied&state=xyz';
    expect(parseCallbackUrl(url)).toBeNull();
  });

  it('returns null when code is missing', () => {
    const url = 'roddit://oauth/callback?state=xyz';
    expect(parseCallbackUrl(url)).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseCallbackUrl('not-a-url')).toBeNull();
  });
});

// ─── decodeHtmlEntities ───────────────────────────────────────────────────────

describe('decodeHtmlEntities', () => {
  it('decodes &amp; to &', () => {
    expect(decodeHtmlEntities('https://example.com?a=1&amp;b=2')).toBe(
      'https://example.com?a=1&b=2',
    );
  });

  it('decodes other entities', () => {
    expect(decodeHtmlEntities('a &lt; b &gt; c &quot;d&quot; &#39;e&#39;')).toBe(
      "a < b > c \"d\" 'e'",
    );
  });
});
