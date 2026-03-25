/**
 * LiveKit integration without require('livekit-server-sdk'):
 * - Token: jsonwebtoken (same claims shape as livekit-server-sdk AccessToken)
 * - Room admin: dynamic import() of ESM RoomServiceClient only (avoids broken index.cjs on Node 23+)
 */
const path = require('path');
const { pathToFileURL } = require('url');
const jwt = require('jsonwebtoken');

function getHttpUrlFromWs(wsUrl) {
  if (!wsUrl) return '';
  return wsUrl.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
}

function isConfigured() {
  return !!(
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET &&
    process.env.LIVEKIT_URL
  );
}

function getWsUrl() {
  return process.env.LIVEKIT_URL || '';
}

/** Cached ESM submodule loads (never use package main / index.cjs — breaks on Node 23) */
let roomClientModulePromise = null;
let protocolModulePromise = null;

function loadRoomServiceClientModule() {
  if (!roomClientModulePromise) {
    const file = path.join(__dirname, '..', 'node_modules', 'livekit-server-sdk', 'dist', 'RoomServiceClient.js');
    roomClientModulePromise = import(pathToFileURL(path.resolve(file)).href);
  }
  return roomClientModulePromise;
}

function loadProtocolModule() {
  if (!protocolModulePromise) {
    protocolModulePromise = import('@livekit/protocol');
  }
  return protocolModulePromise;
}

/**
 * @param {string} identity stable id e.g. uid:<mongoId>
 * @param {string} name display name
 * @param {string} roomName session.roomId
 * @param {{ canPublish?: boolean }} opts
 */
function createParticipantToken(identity, name, roomName, opts = {}) {
  if (!isConfigured()) {
    const err = new Error('LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.');
    err.statusCode = 503;
    throw err;
  }

  const { canPublish = true } = opts;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  const payload = {
    name: name || identity,
    metadata: JSON.stringify({ identity, name: name || identity }),
    video: {
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  return jwt.sign(payload, apiSecret, {
    algorithm: 'HS256',
    issuer: apiKey,
    subject: identity,
    expiresIn: '6h',
  });
}

async function getRoomService() {
  if (!isConfigured()) return null;
  const { RoomServiceClient } = await loadRoomServiceClientModule();
  const host = process.env.LIVEKIT_HTTP_URL || getHttpUrlFromWs(getWsUrl());
  return new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

async function muteParticipantAudio(roomName, identity, mute) {
  const svc = await getRoomService();
  if (!svc) return { ok: false, error: 'LiveKit not configured' };
  const { TrackSource } = await loadProtocolModule();
  const participants = await svc.listParticipants(roomName);
  const participant = participants.find((p) => p.identity === identity);
  if (!participant) return { ok: false, error: 'Participant not found' };
  const audioPub = participant.tracks.find((t) => t.source === TrackSource.MICROPHONE);
  if (!audioPub || !audioPub.sid) return { ok: false, error: 'No microphone track' };
  await svc.mutePublishedTrack(roomName, identity, audioPub.sid, mute);
  return { ok: true };
}

async function muteParticipantVideo(roomName, identity, mute) {
  const svc = await getRoomService();
  if (!svc) return { ok: false, error: 'LiveKit not configured' };
  const { TrackSource } = await loadProtocolModule();
  const participants = await svc.listParticipants(roomName);
  const participant = participants.find((p) => p.identity === identity);
  if (!participant) return { ok: false, error: 'Participant not found' };
  const camPub = participant.tracks.find((t) => t.source === TrackSource.CAMERA);
  if (!camPub || !camPub.sid) return { ok: false, error: 'No camera track' };
  await svc.mutePublishedTrack(roomName, identity, camPub.sid, mute);
  return { ok: true };
}

async function muteAllAudio(roomName, exceptIdentity) {
  const svc = await getRoomService();
  if (!svc) return { ok: false, error: 'LiveKit not configured' };
  const { TrackSource } = await loadProtocolModule();
  const participants = await svc.listParticipants(roomName);
  for (const p of participants) {
    if (p.identity === exceptIdentity) continue;
    const audioPub = p.tracks.find((t) => t.source === TrackSource.MICROPHONE);
    if (audioPub?.sid) {
      try {
        await svc.mutePublishedTrack(roomName, p.identity, audioPub.sid, true);
      } catch (e) {
        console.error('muteAllAudio', p.identity, e.message);
      }
    }
  }
  return { ok: true };
}

async function removeParticipant(roomName, identity) {
  const svc = await getRoomService();
  if (!svc) return { ok: false, error: 'LiveKit not configured' };
  await svc.removeParticipant(roomName, identity);
  return { ok: true };
}

module.exports = {
  isConfigured,
  getWsUrl,
  createParticipantToken,
  getRoomService,
  muteParticipantAudio,
  muteParticipantVideo,
  muteAllAudio,
  removeParticipant,
};
