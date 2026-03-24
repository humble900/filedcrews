/**
 * SEO Configuration
 *
 * AFTER connecting your production domain, update VITE_SITE_URL
 * in your .env file (or environment settings) to your final domain.
 *
 * Example: VITE_SITE_URL=https://yourdomain.com
 */
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || "https://staff-tracker-buddy.lovable.app";

export const SITE_NAME = "Staff Tracker";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png?v=3`;
