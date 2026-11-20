import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Zap, Download, Flame } from 'lucide-react';
import { getSocket } from '../utils/socket';
import { Avatar, AVATAR_LIST } from '../components/Avatar';
import { AnswerButton } from '../components/AnswerButton';
import { ChunkyTimer } from '../components/ChunkyTimer';
import { TopBarControls } from '../components/TopBarControls';
import { useT } from '../i18n/translations';
import { soundFX } from '../utils/sound';
import { downloadResultCardPNG } from '../utils/exportUtils';

const STORAGE_KEY = 'qb_player_session';

export function PlayerApp({ lang, setLang }) {
  const { pin: routePin } = useParams();
  const t = useT(lang);
  const socket = getSocket();

  const [pin, setPin] = useState(routePin || '');
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [joined, setJoined] = useState(false);

  const [phase, setPhase] = useState('JOIN'); // JOIN | LOBBY | QUESTION | LOCKED | FEEDBACK | PODIUM
  const [question, setQuestion] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hiddenIndices, setHiddenIndices] = useState([]);
  const [used5050, setUsed5050] = useState(false);
  const [usedDouble, setUsedDouble] = useState(false);
  const [doubleActive, setDoubleActive] = useState(false);
  const [settings, setSettings] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [finalRank, setFinalRank] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [paused, setPaused] = useState(false);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-reconnect from localStorage if same PIN
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && (!routePin || saved.pin === routePin)) {
        setPin(saved.pin);
        setNickname(saved.nickname);
        setAvatarId(saved.avatarId);
        socket.emit('player:join', {
          pin: saved.pin,
          nickname: saved.nickname,
          avatarId: saved.avatarId,
          sessionToken: saved.sessionToken,
        });
      }
    } catch {
      // ignore storage parse error
    }
  }, [routePin]);

  useEffect(() => {
    socket.on('player:joined', (data) => {
      setJoined(true);
      setNickname(data.nickname);
      setAvatarId(data.avatarId);
      setUsed5050(data.used5050);
      setUsedDouble(data.usedDouble);
      setQuizTitle(data.quizTitle);
      setSettings(data.settings || {});
      setErrorMsg('');
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pin: pin || routePin,
          sessionToken: data.sessionToken,
          nickname: data.nickname,
          avatarId: data.avatarId,
        })
      );
      if (data.roomStatus === 'LOBBY') setPhase('LOBBY');
    });

    socket.on('question:start', (q) => {
      setQuestion(q);
      setSelectedIndices([]);
      setTypedAnswer('');
      setHiddenIndices([]);
      setDoubleActive(false);
      setFeedback(null);
      setPaused(false);
      setPhase(q.alreadyAnswered ? 'LOCKED' : 'QUESTION');
    });

    socket.on('player:powerup_result', (res) => {
      if (res.type === '50_50') {
        setUsed5050(true);
        setHiddenIndices(res.hiddenIndices || []);
      } else if (res.type === 'double_points') {
        setUsedDouble(true);
        setDoubleActive(true);
      }
    });

    socket.on('player:answer_ack', ({ locked }) => {
      soundFX.click();
      if (locked) setPhase('LOCKED');
    });

    socket.on('player:feedback', (fb) => {
      setFeedback(fb);
      setPhase('FEEDBACK');
      if (fb.correct) soundFX.correct();
      else if (!fb.isPoll) soundFX.wrong();
    });

    socket.on('game:paused', ({ remainingMs }) => {
      setPaused(true);
      setPausedRemainingMs(remainingMs);
    });

    socket.on('game:resumed', ({ endsAt }) => {
      setPaused(false);
      setQuestion((prev) => (prev ? { ...prev, endsAt } : prev));
    });

    socket.on('player:final_rank', (fr) => {
      setFinalRank(fr);
      setPhase('PODIUM');
      soundFX.podium();
    });

    socket.on('player:kicked', ({ reason }) => {
      localStorage.removeItem(STORAGE_KEY);
      setJoined(false);
      setPhase('JOIN');
      setErrorMsg(reason || 'Removed from game.');
    });

    socket.on('error:toast', (err) => {
      setErrorMsg(err.message);
    });

    return () => {
      socket.off('player:joined');
      socket.off('question:start');
      socket.off('player:powerup_result');
      socket.off('player:answer_ack');
      socket.off('player:feedback');
      socket.off('game:paused');
      socket.off('game:resumed');
      socket.off('player:final_rank');
      socket.off('player:kicked');
      socket.off('error:toast');
    };
  }, [pin, routePin]);

  const handleJoin = (e) => {
    e.preventDefault();
    soundFX.click();
    setErrorMsg('');
    socket.emit('player:join', { pin: pin.trim(), nickname: nickname.trim(), avatarId });
  };

  const submitChoice = (idx) => {
    if (!question || paused) return;
    if (question.type === 'multiple_choice') {
      setSelectedIndices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
      return;
    }
    setSelectedIndices([idx]);
    socket.emit('player:answer', { pin, questionIndex: question.index, answer: idx });
  };

  const submitMultiOrText = (e) => {
    if (e) e.preventDefault();
    if (!question || paused) return;
    const payload = question.type === 'type_answer' ? typedAnswer : selectedIndices;
    socket.emit('player:answer', { pin, questionIndex: question.index, answer: payload });
  };

  const sendReaction = (emoji) => {
    soundFX.click();
    socket.emit('player:reaction', { pin, emoji });
  };

  return (
    <div className="min-h-screen p-4 flex flex-col max-w-lg mx-auto justify-between">
      <header className="flex items-center justify-between gap-2 mb-4">
        <div className="bg-neo-yellow border-3 border-black shadow-neo-sm px-3 py-1 font-display text-lg">
          {t('appTitle')}
        </div>
        <TopBarControls lang={lang} setLang={setLang} />
      </header>

      {errorMsg && (
        <div className="neo-card-sm bg-neo-pink p-3 mb-4 font-bold text-sm">{errorMsg}</div>
      )}

      {/* JOIN SCREEN */}
      {phase === 'JOIN' && (
        <form onSubmit={handleJoin} className="neo-card bg-white p-5 space-y-5 my-auto">
          <div>
            <label className="font-mono text-xs font-bold block mb-1">{t('enterPin')}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="neo-input w-full text-center font-mono text-2xl tracking-widest"
              required
            />
          </div>

          <div>
            <label className="font-mono text-xs font-bold block mb-1">{t('enterNickname')}</label>
            <input
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="neo-input w-full text-lg"
              required
            />
          </div>

          <div>
            <label className="font-mono text-xs font-bold block mb-2">{t('pickAvatar')}</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={`p-1.5 border-3 border-black flex items-center justify-center ${
                    avatarId === av.id ? 'bg-neo-yellow shadow-neo-sm -translate-y-0.5' : 'bg-neo-cream'
                  }`}
                >
                  <Avatar id={av.id} size={44} />
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="neo-btn w-full bg-neo-lime py-4 text-xl font-display">
            {t('joinNow')} →
          </button>
        </form>
      )}

      {/* LOBBY SCREEN */}
      {phase === 'LOBBY' && joined && (
        <div className="neo-card bg-neo-cyan p-8 text-center space-y-4 my-auto">
          <Avatar id={avatarId} size={96} className="mx-auto" />
          <h1 className="font-display text-3xl">{nickname}</h1>
          <p className="font-bold bg-white border-3 border-black p-3">{t('waitingLobby')}</p>
        </div>
      )}

      {/* QUESTION SCREEN */}
      {phase === 'QUESTION' && question && (
        <div className="space-y-4 my-auto">
          {paused && (
            <div className="neo-card-sm bg-neo-pink p-3 text-center font-display">{t('pausedByHost')}</div>
          )}
          <ChunkyTimer
            endsAt={question.endsAt}
            timeLimit={question.timeLimit}
            paused={paused}
            pausedRemainingMs={pausedRemainingMs}
          />
          <div className="neo-card bg-white p-4">
            <div className="font-mono text-xs font-bold mb-1">
              {t('question')} {question.index + 1} / {question.total}
            </div>
            <h2 className="font-display text-xl">{question.text}</h2>
          </div>

          {/* Power-Ups */}
          {settings.enablePowerUps && question.type !== 'poll' && (
            <div className="flex gap-2">
              {question.type === 'single_choice' && (
                <button
                  type="button"
                  disabled={used5050}
                  onClick={() => socket.emit('player:use_powerup', { pin, questionIndex: question.index, type: '50_50' })}
                  className="neo-btn flex-1 bg-neo-yellow py-2 text-xs flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-4 h-4" /> {t('powerUp5050')}
                </button>
              )}
              <button
                type="button"
                disabled={usedDouble || doubleActive}
                onClick={() => socket.emit('player:use_powerup', { pin, questionIndex: question.index, type: 'double_points' })}
                className={`neo-btn flex-1 py-2 text-xs flex items-center justify-center gap-1 ${
                  doubleActive ? 'bg-neo-lime' : 'bg-neo-orange'
                }`}
              >
                <Zap className="w-4 h-4" /> {doubleActive ? '2X ACTIVE!' : t('powerUpDouble')}
              </button>
            </div>
          )}

          {question.type === 'type_answer' ? (
            <form onSubmit={submitMultiOrText} className="space-y-3">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder={t('typeAnswerPlaceholder')}
                className="neo-input w-full text-lg"
                required
              />
              <button type="submit" className="neo-btn w-full bg-neo-lime py-4 font-display text-lg">
                {t('submitAnswer')}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <AnswerButton
                  key={idx}
                  index={idx}
                  text={opt}
                  selected={selectedIndices.includes(idx)}
                  dimmed={hiddenIndices.includes(idx)}
                  disabled={paused}
                  onClick={() => submitChoice(idx)}
                />
              ))}
              {question.type === 'multiple_choice' && (
                <button
                  type="button"
                  onClick={submitMultiOrText}
                  disabled={selectedIndices.length === 0}
                  className="neo-btn w-full bg-black text-neo-yellow py-4 font-display text-lg"
                >
                  {t('submitAnswer')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* LOCKED SCREEN */}
      {phase === 'LOCKED' && (
        <div className="neo-card bg-neo-yellow p-8 text-center space-y-4 my-auto">
          <Avatar id={avatarId} size={88} />
          <h2 className="font-display text-2xl">{t('lockedIn')}</h2>
        </div>
      )}

      {/* FEEDBACK SCREEN */}
      {phase === 'FEEDBACK' && feedback && (
        <div
          className={`neo-card p-6 text-center space-y-4 my-auto ${
            feedback.isPoll ? 'bg-neo-cyan' : feedback.correct ? 'bg-neo-lime' : 'bg-neo-pink'
          }`}
        >
          <Avatar id={avatarId} size={96} mood={feedback.correct || feedback.isPoll ? 'happy' : 'sad'} />
          <h2 className="font-display text-3xl">
            {feedback.isPoll ? t('pollRecorded') : feedback.correct ? t('correct') : t('wrong')}
          </h2>
          {!feedback.isPoll && (
            <div className="font-mono text-2xl font-bold bg-white border-3 border-black py-2">
              {feedback.pointsEarned >= 0 ? `+${feedback.pointsEarned}` : feedback.pointsEarned} {t('points')}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 font-mono font-bold">
            <div className="bg-white border-3 border-black p-3">
              <div className="text-xs">{t('streak')}</div>
              <div className="text-2xl flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-neo-orange" /> {feedback.streak}
              </div>
            </div>
            <div className="bg-white border-3 border-black p-3">
              <div className="text-xs">{t('rank')}</div>
              <div className="text-2xl">#{feedback.rank} / {feedback.totalPlayers}</div>
            </div>
          </div>
        </div>
      )}

      {/* FINAL RESULT CARD */}
      {phase === 'PODIUM' && finalRank && (
        <div className="neo-card bg-neo-yellow p-6 text-center space-y-4 my-auto">
          <Avatar id={avatarId} size={104} mood={finalRank.rank <= 3 ? 'happy' : 'happy'} />
          <h2 className="font-display text-3xl">{nickname}</h2>
          <div className="grid grid-cols-2 gap-3 font-mono font-bold">
            <div className="bg-neo-cyan border-3 border-black p-3">
              <div className="text-xs">FINAL RANK</div>
              <div className="text-3xl">#{finalRank.rank}</div>
            </div>
            <div className="bg-neo-lime border-3 border-black p-3">
              <div className="text-xs">SCORE</div>
              <div className="text-3xl">{finalRank.score}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadResultCardPNG({
                nickname,
                rank: finalRank.rank,
                totalPlayers: finalRank.totalPlayers,
                score: finalRank.score,
                correctCount: finalRank.correctCount,
                totalQuestions: finalRank.totalQuestions,
                quizTitle,
              })
            }
            className="neo-btn w-full bg-white py-3.5 flex items-center justify-center gap-2 font-display"
          >
            <Download className="w-5 h-5" /> {t('downloadCard')}
          </button>
        </div>
      )}

      {/* Emoji Reaction Bar */}
      {joined && settings.enableReactions && phase !== 'JOIN' && (
        <div className="mt-4 flex justify-center gap-2">
          {['🔥', '🎉', '🤯', '😂', '👏', '💀'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendReaction(emoji)}
              className="neo-btn bg-white text-2xl px-3 py-1.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
