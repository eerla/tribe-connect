/**
 * Application-wide constants and configuration values
 */

export const APP_CONFIG = {
  name: 'TribeVibe',
  tagline: 'Find Your Tribe, Feel the Vibe',
  supportEmail: 'bentyler60@gmail.com',
  siteUrl: 'https://tribe-connect-two.vercel.app',
} as const;

export const SOCIAL_LINKS = {
  twitter: '',
  facebook: '',
  instagram: '',
  linkedin: '',
} as const;

export const LIMITS = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxBannerSize: 5 * 1024 * 1024, // 5MB
  minPasswordLength: 8,
  maxTitleLength: 100,
  maxDescriptionLength: 5000,
} as const;
