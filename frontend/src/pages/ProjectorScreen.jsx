import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users } from 'lucide-react';
import { getSocket } from '../utils/socket';
import { Avatar } from '../components/Avatar';
import { ChunkyTimer } from '../components/ChunkyTimer';
import { OPTION_STYLES, ShapeIcon } from '../components/AnswerButton';
import { soundFX } from '../utils/sound';

export function ProjectorScreen() {
  const { pin } = useParams();
  const socket = getSocket();

  const [status, setStatus] = useState('LOBBY');
  const [quizTitle, setQuizTitle] = useState('QUIZBLITZ ARENA');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [stats, setStats] = useState({ answeredCount: 0, totalConnected: 0, distribution: {} });
  const [revealData, setRevealData] = useState(null);
  const [podiumData, setPodiumData] = useState(null);
  const [paused, setPaused] = useState(false);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(0);
  const [reactions, setReactions] = useState([]);

  const joinUrl = `${window.location.origin}/play/${pin}`;

  useEffect(() => {
    socket.emit('projector:join', { pin });

    socket.on('room:state', (s) => {
      setStatus(s.status);
      setQuizTitle(s.quizTitle);
    });
    socket.on('lobby:players', ({ players: list }) => setPlayers(list));
    socket.on('question:start', (q) => {
      setStatus('QUESTION');
      setQuestion(q);
      setRevealData(null);
      setPaused(false);
      setStats({ answeredCount: 0, totalConnected: players.length, distribution: {} });
    });
    socket.on('stats:batch', (s) => setStats(s));
    socket.on('question:reveal', (r) => {
      setStatus('REVEAL');
      setRevealData(r);
      setPaused(false);
      soundFX.correct();
    });
    socket.on('game:paused', ({ remainingMs }) => {
      setPaused(true);
      setPausedRemainingMs(remainingMs);
    });
    socket.on('game:resumed', ({ endsAt }) => {
      setPaused(false);
      setQuestion((prev) => (prev ? { ...prev, endsAt } : prev));
    });
    socket.on('game:podium', (p) => {
      setStatus('PODIUM');
      setPodiumData(p);
      soundFX.podium();
    });
    socket.on('projector:reaction', (rx) => {
      setReactions((prev) => [...prev.slice(-18), { ...rx, x: 10 + Math.random() * 80 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((item) => item.id !== rx.id));
      }, 2600);
    });

    return () => {
      socket.off('room:state');
      socket.off('lobby:players');
      socket.off('question:start');
      socket.off('stats:batch');
      socket.off('question:reveal');
      socket.off('game:paused');
      socket.off('game:resumed');
      socket.off('game:podium');
      socket.off('projector:reaction');
    };
  }, [pin]);

  const maxCount = Math.max(1, ...Object.values(revealData?.distribution || stats.distribution || { a: 1 }));

  return (
    <div className="min-h-screen p-6 md:p-10 relative overflow-hidden flex flex-col justify-between max-w-7xl mx-auto">
      {/* Floating Emoji Reactions */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: '95vh', scale: 0.7 }}
              animate={{ opacity: 0, y: '10vh', scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
              style={{ left: `${r.x}%` }}
              className="absolute flex flex-col items-center"
            >
              <span className="text-5xl">{r.emoji}</span>
              <span className="bg-black text-white font-mono text-xs px-2 py-0.5">{r.nickname}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="bg-neo-yellow border-4 border-black shadow-neo px-6 py-3 sticker-tilt-left">
          <h1 className="font-display text-2xl md:text-4xl">{quizTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border-4 border-black shadow-neo px-5 py-2 flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="font-mono text-2xl font-bold">{players.length}</span>
          </div>
          <div className="bg-neo-cyan border-4 border-black shadow-neo px-6 py-2">
            <span className="font-mono text-xs block font-bold">JOIN PIN</span>
            <span className="font-mono text-3xl font-bold tracking-widest">{pin}</span>
          </div>
        </div>
      </header>

      {/* LOBBY VIEW */}
      {status === 'LOBBY' && (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-auto items-center">
          <div className="neo-card bg-white p-6 flex flex-col items-center text-center">
            <div className="border-4 border-black p-3 bg-white mb-4">
              <QRCodeSVG value={joinUrl} size={220} />
            </div>
            <p className="font-mono text-sm font-bold break-all bg-neo-yellow border-2 border-black px-3 py-1">
              {joinUrl}
            </p>
          </div>

          <div className="lg:col-span-2 neo-card bg-neo-cream p-6 min-h-[360px]">
            <h2 className="font-display text-2xl mb-4">PLAYER WALL</h2>
            {players.length === 0 ? (
              <p className="font-mono text-xl font-bold opacity-60">Waiting for challengers to join...</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {players.map((p) => (
                    <motion.div
                      key={p.sessionToken}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="neo-card-sm bg-white px-3 py-2 flex items-center gap-2"
                    >
                      <Avatar id={p.avatarId} size={36} />
                      <span className="font-bold text-lg">{p.nickname}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      )}

      {/* QUESTION & REVEAL VIEW */}
      {(status === 'QUESTION' || status === 'REVEAL') && question && (
        <main className="space-y-6 my-auto">
          {paused && (
            <div className="neo-card bg-neo-pink p-4 text-center font-display text-3xl">
              GAME PAUSED
            </div>
          )}

          <ChunkyTimer
            endsAt={question.endsAt}
            timeLimit={question.timeLimit}
            paused={paused || status === 'REVEAL'}
            pausedRemainingMs={status === 'REVEAL' ? 0 : pausedRemainingMs}
          />

          <div className="neo-card bg-white p-8 text-center space-y-4">
            <div className="flex justify-between items-center font-mono text-sm font-bold">
              <span>QUESTION {question.index + 1} / {question.total}</span>
              <span>ANSWERS: {stats.answeredCount} / {stats.totalConnected || players.length}</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-tight">{question.text}</h2>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question visual"
                className="max-h-60 mx-auto border-4 border-black shadow-neo-sm object-contain"
              />
            )}
          </div>

          {/* Distribution Bar Chart on Reveal (or Option Cards during Question) */}
          {question.type !== 'type_answer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => {
                const count = (revealData?.distribution || stats.distribution || {})[idx] || 0;
                const isCorrect =
                  revealData &&
                  (Array.isArray(revealData.correctAnswer)
                    ? revealData.correctAnswer.includes(idx)
                    : revealData.correctAnswer === idx);
                const style = OPTION_STYLES[idx % OPTION_STYLES.length];
                const barPct = Math.round((count / maxCount) * 100);

                return (
                  <div
                    key={idx}
                    className={`neo-card p-4 relative overflow-hidden ${
                      revealData ? (isCorrect ? 'bg-neo-lime' : 'bg-white opacity-60') : style.bg
                    }`}
                  >
                    {revealData && (
                      <div
                        className="absolute inset-y-0 left-0 bg-black/15 transition-all duration-300"
                        style={{ width: `${barPct}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center shrink-0">
                          <ShapeIcon index={idx} size={22} />
                        </span>
                        <span className="font-bold text-xl">{opt}</span>
                      </div>
                      {revealData && (
                        <span className="font-mono text-2xl font-bold bg-white border-2 border-black px-3 py-1">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top-5 Leaderboard */}
          {revealData?.top5 && (
            <div className="neo-card bg-neo-yellow p-6">
              <h3 className="font-display text-2xl mb-3">TOP 5 LEADERBOARD</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {revealData.top5.map((p) => (
                  <div key={p.sessionToken} className="neo-card-sm bg-white p-3 flex flex-col items-center text-center">
                    <span className="font-mono font-bold text-sm">#{p.rank}</span>
                    <Avatar id={p.avatarId} size={52} />
                    <span className="font-bold truncate w-full mt-1">{p.nickname}</span>
                    <span className="font-mono font-bold text-lg">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* FINAL PODIUM VIEW */}
      {status === 'PODIUM' && podiumData && (
        <main className="my-auto space-y-8">
          <div className="text-center">
            <div className="inline-block bg-neo-pink border-4 border-black shadow-neo px-8 py-3 sticker-tilt-right">
              <h2 className="font-display text-4xl md:text-5xl">FINAL PODIUM</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-8">
            {[1, 0, 2].map((pos) => {
              const p = podiumData.podium[pos];
              if (!p) return <div key={pos} />;
              const heights = ['min-h-[280px] bg-neo-yellow', 'min-h-[220px] bg-neo-cyan', 'min-h-[180px] bg-neo-orange'];
              return (
                <motion.div
                  key={p.sessionToken}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: pos * 0.15, type: 'spring', stiffness: 300 }}
                  className={`neo-card p-6 flex flex-col items-center justify-end text-center ${heights[pos]}`}
                >
                  <Crown className={`w-10 h-10 mb-2 ${pos === 0 ? 'fill-black' : ''}`} />
                  <Avatar id={p.avatarId} size={pos === 0 ? 104 : 84} />
                  <div className="font-mono font-bold text-2xl mt-2">#{p.rank}</div>
                  <div className="font-display text-2xl truncate w-full">{p.nickname}</div>
                  <div className="font-mono font-bold text-xl bg-white border-3 border-black px-4 py-1 mt-2">
                    {p.score} PTS
                  </div>
                </motion.div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
