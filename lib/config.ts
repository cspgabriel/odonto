// lib/config.ts
// ============================================
// CareNova — Environment Configuration
// Single source of truth for all URLs and
// environment-dependent values.
//
// HOW TO USE:
// - Local dev:   set NEXT_PUBLIC_SITE_URL in .env.local
// - Production:  set NEXT_PUBLIC_SITE_URL in Vercel
//                Environment Variables dashboard
//
// NEVER hardcode localhost or domain strings
// anywhere else — always import from this file.
// ============================================

// Determine base URL automatically (evaluated at read time so serverless gets correct env):
// 1. NEXT_PUBLIC_SITE_URL if explicitly set
// 2. Vercel automatic URL in preview deployments
// 3. localhost fallback for local development
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  // ─── Base URL (getter so env is read at request time) ───
  get url(): string {
    return getSiteUrl();
  },

  // ─── App Info ──────────────────────────────
  name: "CareNova",
  version: "1.0.0",

  // ─── Auth Redirect URLs (getters so env is read at request time) ───
  auth: {
    get confirmUrl(): string {
      return `${getSiteUrl()}/auth/confirm`;
    },
    get resetPasswordUrl(): string {
      return `${getSiteUrl()}/auth/reset-password`;
    },
    get afterLoginUrl(): string {
      return `${getSiteUrl()}/dashboard`;
    },
    get afterLogoutUrl(): string {
      return `${getSiteUrl()}/login`;
    },
    get callbackUrl(): string {
      return `${getSiteUrl()}/auth/callback`;
    },
  },

  // ─── Environment Flags ─────────────────────
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
  isVercel: !!process.env.VERCEL_URL,

  // ─── Debug ─────────────────────────────────
  debug: process.env.CARENOVA_DEBUG === "1",
};

// Convenience exports (evaluated when imported; for client use set NEXT_PUBLIC_SITE_URL at build time)
export const SITE_URL = siteConfig.url;
export const AUTH_CALLBACK_URL = siteConfig.auth.callbackUrl;
export const IS_DEV = siteConfig.isDev;
export const IS_PROD = siteConfig.isProd;
