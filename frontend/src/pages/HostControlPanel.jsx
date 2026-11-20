import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipForward, Eye, Square, Lock, Unlock,
  Monitor, UserX, Ban, ArrowLeft,
} from 'lucide-react';
import { getSocket } from '../utils/socket';
import { getHostToken } from '../utils/api';
import { Avatar } from '../components/Avatar';
import { ChunkyTimer } from '../components/ChunkyTimer';
import { JoinQRCode } from '../components/JoinQRCode';

export function HostControlPanel() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const socket = getSocket();

  const [roomState, setRoomState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [stats, setStats] = useState({ answeredCount: 0, totalConnected: 0 });
  const [revealData, setRevealData] = useState(null);
  const [paused, setPaused] = useState(false);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const token = getHostToken();
    if (!token) {
      navigate('/');
      return;
    }

    socket.emit('host:join_room', { pin, token });

    const onRoomState = (s) => {
      setRoomState(s);
      setPaused(s.status === 'PAUSED');
      setPausedRemainingMs(s.remainingMs || 0);
    };
    const onPlayers = ({ players: list }) => setPlayers(list);
    const onQStart = (q) => {
      setQuestion(q);
      setRevealData(null);
      setPaused(false);
      setStats({ answeredCount: 0, totalConnected: players.length });
      setRoomState((prev) => (prev ? { ...prev, status: 'QUESTION', currentQuestionIndex: q.index } : prev));
    };
    const onStats = (s) => setStats(s);
    const onReveal = (r) => {
      setRevealData(r);
      setPaused(false);
      setRoomState((prev) => (prev ? { ...prev, status: 'REVEAL' } : prev));
    };
    const onPaused = ({ remainingMs }) => {
      setPaused(true);
      setPausedRemainingMs(remainingMs);
      setRoomState((prev) => (prev ? { ...prev, status: 'PAUSED' } : prev));
    };
    const onResumed = ({ endsAt }) => {
      setPaused(false);
      setQuestion((prev) => (prev ? { ...prev, endsAt } : prev));
      setRoomState((prev) => (prev ? { ...prev, status: 'QUESTION' } : prev));
    };
    const onLocked = ({ locked }) => setRoomState((prev) => (prev ? { ...prev, locked } : prev));
    const onPodium = () => setRoomState((prev) => (prev ? { ...prev, status: 'PODIUM' } : prev));
    const onError = (e) => setToast(e.message);

    socket.on('room:state', onRoomState);
    socket.on('lobby:players', onPlayers);
    socket.on('question:start', onQStart);
    socket.on('stats:batch', onStats);
    socket.on('question:reveal', onReveal);
    socket.on('game:paused', onPaused);
    socket.on('game:resumed', onResumed);
    socket.on('room:locked', onLocked);
    socket.on('game:podium', onPodium);
    socket.on('error:toast', onError);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('lobby:players', onPlayers);
      socket.off('question:start', onQStart);
      socket.off('stats:batch', onStats);
      socket.off('question:reveal', onReveal);
      socket.off('game:paused', onPaused);
      socket.off('game:resumed', onResumed);
      socket.off('room:locked', onLocked);
      socket.off('game:podium', onPodium);
      socket.off('error:toast', onError);
    };
  }, [pin]);

  const status = roomState?.status || 'LOBBY';

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button type="button" onClick={() => navigate('/host')} className="neo-btn bg-white p-2.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-neo-yellow border-4 border-black shadow-neo-sm px-4 py-2">
            <span className="font-mono text-2xl font-bold">PIN: {pin}</span>
          </div>
          <span className="bg-neo-cyan border-3 border-black px-3 py-1.5 font-mono font-bold text-sm">
            {status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/projector/${pin}`}
            target="_blank"
            rel="noreferrer"
            className="neo-btn bg-neo-pink px-4 py-2 flex items-center gap-2 text-sm"
          >
            <Monitor className="w-4 h-4" /> OPEN PROJECTOR
          </a>
          <button
            type="button"
            onClick={() => socket.emit('host:lock_room', { pin, locked: !roomState?.locked })}
            className={`neo-btn px-4 py-2 flex items-center gap-2 text-sm ${
              roomState?.locked ? 'bg-neo-orange' : 'bg-white'
            }`}
          >
            {roomState?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {roomState?.locked ? 'UNLOCK ROOM' : 'LOCK ROOM'}
          </button>
        </div>
      </header>

      {/* Join QR Code & Shareable Link */}
      <JoinQRCode pin={pin} size={140} />

      {toast && <div className="neo-card-sm bg-neo-pink p-3 font-bold">{toast}</div>}

      {/* Primary Control Bar */}
      <section className="neo-card bg-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">{roomState?.quizTitle || 'LIVE SESSION'}</h1>
          <p className="font-mono text-sm font-bold">
            Players: {players.length} | Question {question ? question.index + 1 : 0} / {roomState?.totalQuestions || 0}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {status === 'LOBBY' && (
            <button
              type="button"
              onClick={() => socket.emit('host:start_game', { pin })}
              className="neo-btn bg-neo-lime px-6 py-3 flex items-center gap-2 text-lg font-display"
            >
              <Play className="w-5 h-5 fill-black" /> START GAME
            </button>
          )}

          {(status === 'QUESTION' || status === 'PAUSED') && (
            <>
              <button
                type="button"
                onClick={() => socket.emit(paused ? 'host:resume_game' : 'host:pause_game', { pin })}
                className="neo-btn bg-neo-yellow px-5 py-3 flex items-center gap-2"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
              <button
                type="button"
                onClick={() => socket.emit('host:reveal_answer', { pin })}
                className="neo-btn bg-neo-cyan px-5 py-3 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> REVEAL NOW
              </button>
              <button
                type="button"
                onClick={() => socket.emit('host:skip_question', { pin })}
                className="neo-btn bg-neo-orange px-5 py-3 flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" /> SKIP
              </button>
            </>
          )}

          {status === 'REVEAL' && (
            <button
              type="button"
              onClick={() => socket.emit('host:next_question', { pin })}
              className="neo-btn bg-neo-lime px-6 py-3 flex items-center gap-2 text-lg font-display"
            >
              <SkipForward className="w-5 h-5" /> NEXT QUESTION
            </button>
          )}

          {status !== 'PODIUM' && (
            <button
              type="button"
              onClick={() => socket.emit('host:end_game', { pin })}
              className="neo-btn bg-neo-pink px-4 py-3 flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-black" /> END GAME
            </button>
          )}
        </div>
      </section>

      {question && (status === 'QUESTION' || status === 'PAUSED') && (
        <section className="neo-card bg-neo-cream p-6 space-y-4">
          <ChunkyTimer
            endsAt={question.endsAt}
            timeLimit={question.timeLimit}
            paused={paused}
            pausedRemainingMs={pausedRemainingMs}
          />
          <h2 className="font-display text-2xl">{question.text}</h2>
          <p className="font-mono font-bold text-lg">
            ANSWERS RECEIVED: {stats.answeredCount} / {stats.totalConnected || players.length}
          </p>
        </section>
      )}

      {revealData && status === 'REVEAL' && (
        <section className="neo-card bg-neo-lime p-6">
          <h2 className="font-display text-xl mb-3">TOP 5 LEADERBOARD</h2>
          <div className="space-y-2">
            {revealData.top5?.map((p) => (
              <div key={p.sessionToken} className="neo-card-sm bg-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold">#{p.rank}</span>
                  <Avatar id={p.avatarId} size={36} />
                  <span className="font-bold">{p.nickname}</span>
                </div>
                <span className="font-mono font-bold">{p.score} PTS</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Player Management Roster */}
      <section className="neo-card bg-white p-6">
        <h2 className="font-display text-xl mb-4">PLAYERS ({players.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
          {players.map((p) => (
            <div
              key={p.sessionToken}
              className={`neo-card-sm p-3 flex items-center justify-between gap-2 ${
                p.connected ? 'bg-neo-cream' : 'bg-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar id={p.avatarId} size={36} />
                <div className="truncate">
                  <div className="font-bold truncate">{p.nickname}</div>
                  <div className="font-mono text-xs">{p.score} pts {!p.connected && '(offline)'}</div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  title="Kick player"
                  onClick={() => socket.emit('host:kick_player', { pin, sessionToken: p.sessionToken })}
                  className="neo-btn bg-neo-yellow p-1.5"
                >
                  <UserX className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Ban player"
                  onClick={() => socket.emit('host:ban_player', { pin, sessionToken: p.sessionToken })}
                  className="neo-btn bg-neo-pink p-1.5"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
