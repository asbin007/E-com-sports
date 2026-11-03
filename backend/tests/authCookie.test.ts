import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from "../src/services/authCookie.js";

interface CookieCall {
  name: string;
  value?: string;
  options: Record<string, unknown>;
}

/** Minimal Express-ish res double — records what would be sent. */
const makeRes = () => {
  const calls: CookieCall[] = [];
  const res = {
    cookie(name: string, value: string, options: Record<string, unknown>) {
      calls.push({ name, value, options });
      return res;
    },
    clearCookie(name: string, options: Record<string, unknown>) {
      calls.push({ name, options });
      return res;
    },
  };
  return { res: res as never, calls };
};

type EnvKey = "NODE_ENV" | "COOKIE_SAMESITE";

/** Run `body` with env overrides, then put the environment back. */
const withEnv = (overrides: Partial<Record<EnvKey, string>>, body: () => void) => {
  const keys: EnvKey[] = ["NODE_ENV", "COOKIE_SAMESITE"];
  const previous = keys.map((key) => [key, process.env[key]] as const);
  const apply = (key: EnvKey, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  keys.forEach((key) => apply(key, overrides[key]));
  try {
    body();
  } finally {
    previous.forEach(([key, value]) => apply(key, value));
  }
};

test("refresh cookie is httpOnly, auth-scoped and lax by default", () => {
  withEnv({ NODE_ENV: "development" }, () => {
    const { res, calls } = makeRes();
    setRefreshCookie(res, "refresh-jwt");

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.name, REFRESH_COOKIE_NAME);
    assert.equal(calls[0]?.value, "refresh-jwt");
    assert.equal(calls[0]?.options.httpOnly, true);
    assert.equal(calls[0]?.options.sameSite, "lax");
    assert.equal(calls[0]?.options.path, "/api/v1/auth");
    assert.equal(calls[0]?.options.maxAge, 7 * 24 * 60 * 60 * 1000);
    // No HTTPS in local development, so the cookie must not be Secure there.
    assert.equal(calls[0]?.options.secure, false);
  });
});

test("production is always secure", () => {
  withEnv({ NODE_ENV: "production" }, () => {
    const { res, calls } = makeRes();
    setRefreshCookie(res, "refresh-jwt");
    assert.equal(calls[0]?.options.secure, true);
  });
});

test("cross-site deployments get SameSite=None, which forces Secure", () => {
  withEnv({ NODE_ENV: "development", COOKIE_SAMESITE: "none" }, () => {
    const { res, calls } = makeRes();
    setRefreshCookie(res, "refresh-jwt");
    assert.equal(calls[0]?.options.sameSite, "none");
    // Browsers reject SameSite=None without Secure, cookie and session gone.
    assert.equal(calls[0]?.options.secure, true);
  });
});

test("an unknown COOKIE_SAMESITE falls back to lax", () => {
  withEnv({ COOKIE_SAMESITE: "nonsense" }, () => {
    const { res, calls } = makeRes();
    setRefreshCookie(res, "refresh-jwt");
    assert.equal(calls[0]?.options.sameSite, "lax");
  });
});

test("clear uses the same name and path, or the browser keeps the cookie", () => {
  withEnv({ COOKIE_SAMESITE: "strict" }, () => {
    const { res, calls } = makeRes();
    setRefreshCookie(res, "refresh-jwt");
    clearRefreshCookie(res);

    const [set, cleared] = calls;
    assert.equal(cleared?.name, set?.name);
    assert.equal(cleared?.options.path, set?.options.path);
    assert.equal(cleared?.options.sameSite, "strict");
    assert.equal(cleared?.options.httpOnly, true);
  });
});
