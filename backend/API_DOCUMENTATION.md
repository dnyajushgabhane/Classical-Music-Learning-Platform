# Video Conferencing System API Documentation

## Overview

This backend provides a comprehensive video conferencing system with LiveKit integration, supporting room management, participant controls, recording, and meeting history.

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header.

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Live session operations: 30 requests per minute

## Endpoints

### Room Management

#### Create Live Session
```
POST /api/live-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Piano Masterclass",
  "description": "Advanced techniques",
  "course": "course_id", // optional
  "scheduledStart": "2024-01-15T10:00:00Z", // optional
  "scheduledEnd": "2024-01-15T11:00:00Z", // optional
  "waitingRoomEnabled": true
}
```

#### Get Live Sessions
```
GET /api/live-sessions
Authorization: Bearer <token>
```

#### Get Session Details
```
GET /api/live-sessions/:id
Authorization: Bearer <token>
```

#### Update Session Status
```
PUT /api/live-sessions/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "live" // "scheduled", "live", "ended"
}
```

#### Update Session Settings
```
PUT /api/live-sessions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "locked": false,
  "waitingRoomEnabled": true,
  "scheduledStart": "2024-01-15T10:00:00Z",
  "scheduledEnd": "2024-01-15T11:00:00Z",
  "spotlightIdentity": "uid:user_id"
}
```

#### Update Session Settings (Enhanced)
```
PUT /api/live-sessions/:id/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "allowRaiseHand": true,
  "allowChat": true,
  "allowScreenShare": true,
  "maxParticipants": 50,
  "recordingEnabled": false
}
```

### Invite Links

#### Create Invite Link
```
POST /api/live-sessions/:sessionId/invite-links
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiresAt": "2024-01-20T10:00:00Z", // optional
  "maxUses": 10, // optional, null for unlimited
  "permissions": {
    "canPublish": true,
    "canSubscribe": true,
    "canPublishData": true,
    "role": "participant" // "participant" or "moderator"
  }
}
```

#### Get Invite Links
```
GET /api/live-sessions/:sessionId/invite-links
Authorization: Bearer <token>
```

#### Deactivate Invite Link
```
DELETE /api/live-sessions/:sessionId/invite-links/:linkId
Authorization: Bearer <token>
```

#### Join via Invite Link
```
POST /api/live-sessions/join/:code
Authorization: Bearer <token>
```

### LiveKit Integration

#### Get LiveKit Token
```
POST /api/live-sessions/:id/token
Authorization: Bearer <token>
```

Response:
```json
{
  "token": "jwt_token",
  "url": "wss://livekit.example.com",
  "roomName": "room_uuid",
  "identity": "uid:user_id",
  "isTeacher": true,
  "livekitConfigured": true
}
```

### Participant Management

#### Get Session Participants
```
GET /api/live-sessions/:sessionId/participants
Authorization: Bearer <token>
```

#### Mute/Unmute Participant Audio
```
POST /api/live-sessions/:sessionId/participants/audio
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": "uid:user_id",
  "mute": true
}
```

#### Mute/Unmute Participant Video
```
POST /api/live-sessions/:sessionId/participants/video
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": "uid:user_id",
  "mute": true
}
```

#### Remove Participant
```
DELETE /api/live-sessions/:sessionId/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": "uid:user_id"
}
```

#### Update Participant Permissions
```
POST /api/live-sessions/:sessionId/participants/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": "uid:user_id",
  "permissions": {
    "canPublishAudio": true,
    "canPublishVideo": true,
    "canPublishData": true
  }
}
```

### Interactive Features

#### Raise Hand
```
POST /api/live-sessions/:sessionId/raise-hand
Authorization: Bearer <token>
```

#### Lower Hand (Host Only)
```
POST /api/live-sessions/:sessionId/lower-hand
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": "uid:user_id"
}
```

### Recording

#### Start Recording
```
POST /api/live-sessions/:id/recording/start
Authorization: Bearer <token>
```

#### Stop Recording
```
POST /api/live-sessions/:id/recording/stop
Authorization: Bearer <token>
```

### Chat

#### Get Session Messages
```
GET /api/live-sessions/:id/messages
Authorization: Bearer <token>
```

### Meeting History

#### Get Meeting History
```
GET /api/live-sessions/history/meetings?page=1&limit=10
Authorization: Bearer <token>
```

### Waiting Room

#### Join Waiting Room
```
POST /api/live-sessions/:id/waiting
Authorization: Bearer <token>
```

#### Admit User (Host Only)
```
POST /api/live-sessions/:id/admit
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id"
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('/live', {
  auth: { token: 'jwt_token' }
});
```

### Room Events
```javascript
// Join room
socket.emit('room:join', { roomId: 'room_uuid' });

// Leave room
socket.emit('room:leave', { roomId: 'room_uuid' });
```

### Chat Events
```javascript
// Send group message
socket.emit('chat:group', { roomId: 'room_uuid', text: 'Hello!' });

// Send private message
socket.emit('chat:private', {
  roomId: 'room_uuid',
  text: 'Private message',
  recipientUserId: 'user_id'
});
```

### Interactive Events
```javascript
// Raise hand
socket.emit('hand:raise', { roomId: 'room_uuid' });

// Send reaction
socket.emit('reaction', { roomId: 'room_uuid', emoji: '👏' });
```

### Host Controls
```javascript
// Mute participant audio
socket.emit('host:mute-audio', { roomId: 'room_uuid', targetIdentity: 'uid:user_id' });

// Mute participant video
socket.emit('host:mute-video', { roomId: 'room_uuid', targetIdentity: 'uid:user_id' });

// Mute all participants
socket.emit('host:mute-all', { roomId: 'room_uuid' });

// Remove participant
socket.emit('host:remove', { roomId: 'room_uuid', targetIdentity: 'uid:user_id' });
```

### Whiteboard Events
```javascript
// Send stroke
socket.emit('whiteboard:stroke', { roomId: 'room_uuid', stroke: strokeData });

// Clear whiteboard (host only)
socket.emit('whiteboard:clear', { roomId: 'room_uuid' });
```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/classicalmusic

# JWT
JWT_SECRET=your_jwt_secret

# LiveKit
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_HTTP_URL=https://your-livekit-server.com

# CORS
CLIENT_ORIGIN=http://localhost:3000

# Server
PORT=5001
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message",
      "value": "invalid_value"
    }
  ]
}
```

## Security Features

- JWT authentication on all endpoints
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- MongoDB injection protection

## Production Considerations

- Configure LiveKit Egress for recording storage
- Set up monitoring and logging
- Configure reverse proxy (nginx) for production
- Set up SSL/TLS certificates
- Configure database indexes for performance
- Implement backup strategies for MongoDB
- Set up monitoring for LiveKit server health