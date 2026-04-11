const { AccessToken, RoomServiceClient, EgressClient, EncodedFileOutput, EncodedFileFormat, S3Upload } = require('livekit-server-sdk');

const livekitHost = process.env.LIVEKIT_HOST || 'http://localhost:7880';
const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
const egressClient = new EgressClient(livekitHost, apiKey, apiSecret);

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
  try {
    const rooms = await roomService.listRooms([roomName]);
    return { ok: true, room: rooms[0] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function deleteRoom(roomName) {
  try {
    await roomService.deleteRoom(roomName);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function listParticipants(roomName) {
  try {
    const participants = await roomService.listParticipants(roomName);
    return { ok: true, participants };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function removeParticipant(roomName, participantName) {
  try {
    await roomService.removeParticipant(roomName, participantName);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function muteParticipantAudio(roomName, participantName, mute) {
  try {
    const participants = await roomService.listParticipants(roomName);
    const p = participants.find(x => x.identity === participantName);
    if (!p) throw new Error('Participant not found');
    const track = p.tracks.find(t => t.type === 0);
    if (!track) return { ok: true, note: 'No audio track' };
    await roomService.mutePublishedTrack(roomName, participantName, track.sid, mute);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function muteParticipantVideo(roomName, participantName, mute) {
  try {
    const participants = await roomService.listParticipants(roomName);
    const p = participants.find(x => x.identity === participantName);
    if (!p) throw new Error('Participant not found');
    const track = p.tracks.find(t => t.type === 1);
    if (!track) return { ok: true, note: 'No video track' };
    await roomService.mutePublishedTrack(roomName, participantName, track.sid, mute);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function muteAllAudio(roomName, exceptIdentity) {
  try {
    const participants = await roomService.listParticipants(roomName);
    const results = participants
      .filter(p => p.identity !== exceptIdentity)
      .map(async p => {
        const track = p.tracks.find(t => t.type === 0);
        if (track) await roomService.mutePublishedTrack(roomName, p.identity, track.sid, true);
      });
    await Promise.all(results);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function startRoomCompositeEgress(roomName, outputFileName) {
  try {
    const s3Bucket = process.env.AWS_S3_BUCKET;
    const s3Region = process.env.AWS_REGION;
    const s3AccessKey = process.env.AWS_ACCESS_KEY_ID;
    const s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY;

    let output;
    if (s3Bucket && s3AccessKey && s3SecretKey) {
      output = new EncodedFileOutput({
        fileType: EncodedFileFormat.MP4,
        filepath: `recordings/${outputFileName}.mp4`,
        output: {
          case: 's3',
          value: new S3Upload({
            bucket: s3Bucket,
            region: s3Region || 'us-east-1',
            accessKey: s3AccessKey,
            secret: s3SecretKey,
          }),
        },
      });
    } else {
      // Local file fallback or error
      output = new EncodedFileOutput({
        fileType: EncodedFileFormat.MP4,
        filepath: `${outputFileName}.mp4`,
      });
    }

    const info = await egressClient.startRoomCompositeEgress(roomName, output, {
      layout: 'speaker-dark', // Standard LiveKit layout
    });
    return { ok: true, egressId: info.egressId };
  } catch (e) {
    console.error('[Egress] Start failed:', e.message);
    return { ok: false, error: e.message };
  }
}

async function stopEgress(egressId) {
  try {
    const info = await egressClient.stopEgress(egressId);
    return { ok: true, info };
  } catch (e) {
    console.error('[Egress] Stop failed:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = {
  isLivekitConfigured,
  createLivekitToken,
  getRoom,
  deleteRoom,
  listParticipants,
  removeParticipant,
  muteParticipantAudio,
  muteParticipantVideo,
  muteAllAudio,
  startRoomCompositeEgress,
  stopEgress,
};