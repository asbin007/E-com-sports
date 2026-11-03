import { randomBytes } from "node:crypto";

/**
 * One-time authorization codes for the OAuth redirect.
 *
 * The Google callback used to put the JWTs straight into the redirect URL
 * (`?token=...&refreshToken=...`), which leaks them into browser history,
 * proxy/access logs and any analytics on the callback page. Instead we hand
 * the browser a short-lived opaque code and let it POST that code back to
 * exchange for the real tokens.
 *
 * ponytail: in-memory store, single-instance only (same ceiling as the rate
 * limiter). Move to Redis if the API is ever run as multiple processes.
 */

export interface IssuedTokens {
  token: string;
  refreshToken: string;
}

interface Entry extends IssuedTokens {
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60 * 1000;

export class AuthCodeStore {
  private readonly codes = new Map<string, Entry>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS, private readonly now: () => number = Date.now) {}

  /** Store tokens and return the opaque code the browser will carry. */
  issue(tokens: IssuedTokens): string {
    this.sweep();
    const code = randomBytes(32).toString("base64url");
    this.codes.set(code, { ...tokens, expiresAt: this.now() + this.ttlMs });
    return code;
  }

  /** Redeem a code exactly once. Returns null if unknown, expired or reused. */
  redeem(code: string): IssuedTokens | null {
    const entry = this.codes.get(code);
    if (!entry) return null;
    this.codes.delete(code);
    if (entry.expiresAt <= this.now()) return null;
    return { token: entry.token, refreshToken: entry.refreshToken };
  }

  get size(): number {
    return this.codes.size;
  }

  private sweep(): void {
    const now = this.now();
    for (const [code, entry] of this.codes) {
      if (entry.expiresAt <= now) this.codes.delete(code);
    }
  }
}

export const authCodeStore = new AuthCodeStore();
