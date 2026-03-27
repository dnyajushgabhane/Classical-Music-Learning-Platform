// We use relative paths for API calls to proxy them correctly via Nginx (in prod/docker) or Vite (in local dev)
export const API_BASE = '/api';

/**
 * Socket.io and backend API are served on the same host natively, 
 * accessed securely via Nginx or Vite Proxy using the current origin.
 */
export function getSocketOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function getLiveKitURL(backendProvidedUrl) {
  if (backendProvidedUrl) return backendProvidedUrl;
  return import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7881';
}
