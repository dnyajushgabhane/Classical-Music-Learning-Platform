// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, the Vite proxy handles /api and /socket.io via localhost:5001.
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

/**
 * Returns the Socket.IO server origin.
 * - Production (Vercel): use VITE_API_URL (the Render backend URL)
 * - Local dev: use localhost:5001 (proxied by Vite)
 */
export function getSocketOrigin() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5001';
}

export function getLiveKitURL(backendProvidedUrl) {
  if (backendProvidedUrl) return backendProvidedUrl;
  return import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7881';
}

