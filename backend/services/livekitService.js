const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const livekitHost = process.env.LIVEKIT_HOST || 'http://localhost:7880';
const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

function isLivekitConfigured() {
  return !!process.env.LIVEKIT_API_KEY;
}

async function createLivekitToken(roomName, participantName) {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });
  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
  return await at.toJwt();
}

async function getRoom(roomName) {
  return roomService.listRooms([roomName]);
}

async function deleteRoom(roomName) {
  return roomService.deleteRoom(roomName);
}

async function listParticipants(roomName) {
  return roomService.listParticipants(roomName);
}

async function removeParticipant(roomName, participantName) {
  return roomService.removeParticipant(roomName, participantName);
}

async function muteParticipant(roomName, participantName, mute) {
  return roomService.mutePublishedTrack(roomName, participantName, 'camera', mute);
}

module.exports = {
  isLivekitConfigured,
  createLivekitToken,
  getRoom,
  deleteRoom,
  listParticipants,
  removeParticipant,
  muteParticipant,
};