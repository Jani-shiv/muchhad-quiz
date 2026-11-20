import ws from 'k6/ws';
import { check, sleep } from 'k6';

/**
 * Simulates 200 concurrent players connecting over WebSocket (Engine.IO v4 / Socket.IO),
 * joining a live room PIN, waiting for `question:start`, and submitting an answer within 3s.
 *
 * Usage:
 *   k6 run -e PIN=123456 -e WS_URL=ws://localhost:8080/socket.io/?EIO=4&transport=websocket k6/load-test.js
 */
export const options = {
  scenarios: {
    players_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 200 },
        { duration: '25s', target: 200 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    checks: ['rate>0.95'],
  },
};

const PIN = __ENV.PIN || '123456';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/socket.io/?EIO=4&transport=websocket';

export default function () {
  const playerIdx = __VU;
  const nickname = `Bot_${playerIdx}`;
  const avatarId = (playerIdx % 10) + 1;

  const res = ws.connect(WS_URL, {}, function (socket) {
    let answeredQ = -1;

    socket.on('open', () => {
      // Engine.IO open -> Socket.IO connect packet ("40")
      socket.send('40');
    });

    socket.on('message', (msg) => {
      // Engine.IO ping ("2") -> pong ("3")
      if (msg === '2') {
        socket.send('3');
        return;
      }

      // Socket.IO connected ("40{...}") -> emit player:join
      if (msg.startsWith('40')) {
        const joinPacket = `42${JSON.stringify([
          'player:join',
          { pin: PIN, nickname, avatarId },
        ])}`;
        socket.send(joinPacket);
        return;
      }

      // Socket.IO event ("42[...]")
      if (msg.startsWith('42')) {
        try {
          const [eventName, payload] = JSON.parse(msg.slice(2));
          if (eventName === 'question:start' && payload.index !== answeredQ) {
            answeredQ = payload.index;
            // Random human-like reaction delay between 0.2s and 2.8s (within 3s)
            const delaySec = 0.2 + Math.random() * 2.6;
            socket.setTimeout(() => {
              const choice = Math.floor(Math.random() * Math.max(1, (payload.options || []).length));
              socket.send(
                `42${JSON.stringify([
                  'player:answer',
                  { pin: PIN, questionIndex: payload.index, answer: choice },
                ])}`
              );
            }, delaySec * 1000);
          }
        } catch {
          // ignore non-JSON frames
        }
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, 28000);
  });

  check(res, { 'WebSocket connected (101)': (r) => r && r.status === 101 });
  sleep(1);
}
