import type { CookieOptions, Response } from "express";

/**
 * The refresh token lives here and nowhere else: an httpOnly cookie no script
 * on the page can read, scoped to the auth endpoints so it is never attached
 * to ordinary API calls. It is never put in a JSON body.
 *
 * COOKIE_SAMESITE: keep the "lax" default when the site and the API share a
 * registrable domain (localhost:2000 -> localhost:1000, shop.example.com ->
 * api.example.com). A deployment where they sit on *different* registrable
 * domains (shop.example.com + api.other-host.net) must set
 * COOKIE_SAMESITE=none and serve both over HTTPS, otherwise the browser drops
 * the cookie on the cross-site /auth/refresh call and every reload signs the
 * user out. SameSite=None without Secure is rejected outright, which is why
 * "none" forces secure here regardless of NODE_ENV.
 */
export const REFRESH_COOKIE_NAME = "bsh_rt";

/** Must match jwtRefreshExpiration (JWT_REFRESH_EXPIRE_IN, default 7d). */
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const sameSite = (): "lax" | "strict" | "none" => {
  const configured = process.env.COOKIE_SAMESITE;
  return configured === "strict" || configured === "none" ? configured : "lax";
};

/**
 * Attributes shared by set and clear. A browser only drops a cookie when the
 * clear carries the same name and path, so these must not drift apart.
 */
const cookieOptions = (): CookieOptions => {
  const policy = sameSite();
  return {
    httpOnly: true,
    sameSite: policy,
    secure: process.env.NODE_ENV === "production" || policy === "none",
    path: "/api/v1/auth",
  };
};

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: REFRESH_MAX_AGE_MS });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());
};
