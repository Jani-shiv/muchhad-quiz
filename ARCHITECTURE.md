# QuizBlitz — System Architecture & Socket.IO Event Contract

## 1. High-Level Architecture

```
                     ┌──────────────────────────────┐
                     │        Nginx Reverse Proxy   │
                     │  HTTP/2 + WebSocket Upgrade  │
                     │   (/api/*, /socket.io/*, /)  │
                     └──────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│   Node.js + Express +     │               │   Node.js + Express +     │
│   Socket.IO (Instance 1)  │               │   Socket.IO (Instance 2)  │
│  - REST API (Host Auth,   │               │  - Horizontal Scale Ready │
│    Quiz CRUD, History)    │               │  - Per-socket Rate Limit  │
│  - Authoritative Timers   │               │  - 250ms Batched Broadcast│
└─────────────┬─────────────┘               └─────────────┬─────────────┘
              │                                           │
              ├───────────────────┬───────────────────────┤
              ▼                   ▼                       ▼
┌──────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  Redis (Pub/Sub +    │ │  Redis (State)  │ │      PostgreSQL 16      │
│  Socket.IO Adapter)  │ │  - Room Hash    │ │  - users (hosts)        │
│  - Cross-node room   │ │  - Players Hash │ │  - quizzes & questions  │
│    broadcasts        │ │  - Answers Hash │ │  - game_sessions        │
│  - Horizontal scale  │ │  - Banned Set   │ │  - session_results      │
└──────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### Key Design Decisions
1. **Server-Authoritative State**: The backend owns the question timer (`questionStartedAt`, `questionEndsAt`), answer validation, streak tracking, and score calculation. The client **never** receives `correctAnswer` or `correctIndices` until the `question:reveal` phase.
2. **Redis Room State + Socket.IO Redis Adapter**: All live game state (`room:{pin}`, `room:{pin}:players`, `room:{pin}:answers:{qIdx}`, `room:{pin}:banned`) lives in Redis with a 6-hour TTL so rooms survive restarts and scale across multiple Node.js instances via `@socket.io/redis-adapter`.
3. **250ms Batched Broadcasts**: At 150–1,000 concurrent players, broadcasting a leaderboard or stats update on every `player:answer` would cause `O(N^2)` fan-out. Instead, answers increment Redis counters and mark the room `dirty`; a 250ms ticker flushes at most 4 `stats:batch` updates per second.
4. **Anonymous Player Persistence**: Players receive a cryptographically random `sessionToken` stored in `localStorage`. On disconnect/refresh, `player:join` with `{ pin, sessionToken }` restores their exact identity, avatar, score, streak, and rank.
5. **Host Disconnect Auto-Pause & Reclaim**: If the host socket disconnects during an active question, the server automatically pauses the timer (`game:paused`) and allows the authenticated host (via JWT) to reclaim control on reconnect.

---

## 2. Socket.IO Event Contract

Every socket joins room `pin:{PIN}`. Hosts also join `host:{PIN}`. Projectors join `projector:{PIN}`.

### A. Host Events (Client → Server, requires valid Host JWT + room ownership)

| Event | Payload | Description |
|---|---|---|
| `host:join_room` | `{ pin, token }` | Authenticates host JWT, binds socket to `host:{pin}`, sends full host state snapshot (without leaking future answers to players). |
| `host:start_game` | `{ pin }` | Transitions room from `LOBBY` → `QUESTION` (index 0) and starts server timer. |
| `host:next_question` | `{ pin }` | Advances from `REVEAL`/`LEADERBOARD` to next question, or `PODIUM` if last question. |
| `host:pause_game` | `{ pin }` | Pauses active question countdown and records `remainingMs`. |
| `host:resume_game` | `{ pin }` | Resumes countdown from `remainingMs`. |
| `host:skip_question` | `{ pin }` | Immediately ends current question timer and triggers `question:reveal`. |
| `host:reveal_answer` | `{ pin }` | Manually reveals answer if waiting. |
| `host:end_game` | `{ pin }` | Ends session early, computes final podium, persists results to PostgreSQL. |
| `host:lock_room` | `{ pin, locked: boolean }` | Toggles room lock to prevent new players from joining. |
| `host:kick_player` | `{ pin, sessionToken }` | Disconnects player and removes them from lobby/active list. |
| `host:ban_player` | `{ pin, sessionToken }` | Kicks player and adds `sessionToken` to Redis `room:{pin}:banned` set. |

### B. Projector Events (Client → Server)

| Event | Payload | Description |
|---|---|---|
| `projector:join` | `{ pin }` | Joins `pin:{pin}` and `projector:{pin}`; receives sanitized room state (no correct answers during active question). |

### C. Player Events (Client → Server, rate-limited per socket)

| Event | Payload | Description |
|---|---|---|
| `player:join` | `{ pin, nickname, avatarId, sessionToken? }` | Joins or reconnects to room. Server sanitizes nickname, applies profanity filter, appends suffix on duplicate, returns `player:joined`. |
| `player:answer` | `{ pin, questionIndex, answer, powerUp? }` | Submits answer (`number`, `number[]`, or `string`). `powerUp` can be `'double_points'` if enabled & unused. Server computes score from `Date.now()`. |
| `player:use_powerup` | `{ pin, questionIndex, type: '50_50' \| 'double_points' }` | Requests a 50/50 option elimination (server returns 2 wrong indices to hide) or activates double points. |
| `player:reaction` | `{ pin, emoji }` | Sends emoji reaction (`🔥`, `🎉`, `🤯`, `😂`, `👏`, `💀`), rate-limited to 1 per 1.5s, forwarded to projector. |

### D. Server → Client Broadcasts

| Event | Target | Payload | Description |
|---|---|---|---|
| `room:state` | Socket / Room | `{ status, pin, quizTitle, settings, currentQuestionIndex, totalQuestions, playerCount, locked }` | Authoritative room state snapshot. |
| `lobby:players` | Room | `{ players: [{ sessionToken, nickname, avatarId, connected, score }] }` | Updated player list in lobby. |
| `question:start` | Room | `{ index, total, type, text, imageUrl, options (no isCorrect!), timeLimit, pointsMode, startedAt, endsAt }` | Broadcasts question **without** correct answer. |
| `stats:batch` | Room / Projector | `{ answeredCount, totalConnected, distribution: { [opt]: count } }` | Batched max once per 250ms while question is active. |
| `question:reveal` | Room | `{ index, correctAnswer, distribution, top5, explanation? }` | Sent when timer expires or host skips; unlocks correct answer & top-5. |
| `player:feedback` | Player Socket | `{ correct, pointsEarned, totalScore, streak, rank, totalPlayers, isPoll }` | Personal instant feedback after reveal (or immediate ack on submit). |
| `game:paused` | Room | `{ remainingMs, reason }` | Notifies all clients timer is paused (e.g. host action or host disconnect). |
| `game:resumed` | Room | `{ endsAt, remainingMs }` | Resumes countdown with synchronized server `endsAt`. |
| `game:podium` | Room | `{ podium: [...top3], leaderboard: [...top20], sessionId }` | Final game results & ranks. |
| `projector:reaction` | Projector | `{ id, emoji, nickname }` | Floating emoji reaction on projector screen. |
| `player:kicked` | Player Socket | `{ banned: boolean, reason }` | Notifies kicked/banned player. |
| `error:toast` | Socket | `{ code, message }` | Validation or rate-limit error. |

---

## 3. Edge Cases Handled

1. **Player Reconnect / Page Refresh**: `localStorage` stores `{ pin, sessionToken, nickname, avatarId }`. Re-emitting `player:join` with `sessionToken` restores their score, streak, connected flag, and current question state without creating a duplicate player.
2. **Host Disconnect / Auto-Pause**: If the host's socket drops during `QUESTION`, the server clears the active timeout, saves `remainingMs`, broadcasts `game:paused` (`reason: 'host_disconnected'`), and lets the host reclaim via `host:join_room` with their JWT.
3. **Late Join**: Players joining mid-game (when room is unlocked) are added with `score: 0, streak: 0` and immediately receive the active `question:start` payload (with remaining time) or `REVEAL` state.
4. **Duplicate Answer / Race Condition**: Redis `HSETNX` (or atomic check) prevents double-scoring. If `allowAnswerChange` is false, a second submission returns `ALREADY_ANSWERED`. If true, the previous answer is overwritten before timer expiry.
5. **Clock Drift**: All countdowns use server `endsAt - serverNow` synced via `serverTime` in `question:start` and `game:resumed`. Scoring uses **only** server `Date.now()` at receipt time (`timeLeft = Math.max(0, (endsAt - receivedAt) / 1000)`).
6. **Duplicate / Profane Nicknames**: Nicknames are trimmed, HTML-stripped, checked against a profanity word list, and deduplicated with `_2`, `_3` suffixes atomically.
