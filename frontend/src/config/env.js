const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_BASE = raw;

/** Socket.io & LiveKit token API live on same host as API */
export function getSocketOrigin() {
  try {
    const u = new URL(API_BASE);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'http://localhost:5000';
  }
}
