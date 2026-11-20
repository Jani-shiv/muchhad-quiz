import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Monitor, UserCheck } from 'lucide-react';
import { apiFetch, setHostToken } from '../utils/api';
import { useT } from '../i18n/translations';
import { TopBarControls } from '../components/TopBarControls';
import { soundFX } from '../utils/sound';

export function HomePage({ lang, setLang }) {
  const t = useT(lang);
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlayerJoin = (e) => {
    e.preventDefault();
    soundFX.click();
    const clean = pin.replace(/\D/g, '').slice(0, 6);
    if (clean.length === 6) {
      navigate(`/play/${clean}`);
    }
  };

  const handleHostAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });
      setHostToken(data.token);
      navigate('/host');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col justify-between max-w-6xl mx-auto">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-neo-yellow border-4 border-black shadow-neo-sm px-4 py-2 sticker-tilt-left">
            <span className="font-display text-2xl md:text-3xl tracking-tight flex items-center gap-2">
              <Zap className="w-7 h-7 fill-black" />
              {t('appTitle')}
            </span>
          </div>
        </div>
        <TopBarControls lang={lang} setLang={setLang} />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start my-auto">
        {/* Player Join Card */}
        <section className="neo-card bg-neo-cyan p-6 md:p-8">
          <div className="inline-block bg-black text-neo-yellow font-mono text-xs font-bold px-3 py-1 mb-4">
            PLAYERS // NO SIGNUP REQUIRED
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-4">{t('joinGame')}</h1>
          <form onSubmit={handlePlayerJoin} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder={t('enterPin')}
              className="neo-input w-full text-center font-mono text-3xl tracking-[0.25em]"
              required
            />
            <button
              type="submit"
              disabled={pin.length !== 6}
              className="neo-btn w-full bg-neo-yellow py-4 text-xl font-display"
            >
              {t('joinNow')} →
            </button>
          </form>
          <div className="mt-6 pt-4 border-t-3 border-black flex items-center justify-between text-sm font-bold">
            <span>Got a projector?</span>
            <button
              type="button"
              onClick={() => pin.length === 6 && navigate(`/projector/${pin}`)}
              className="neo-btn bg-white px-3 py-1.5 flex items-center gap-1.5 text-xs"
            >
              <Monitor className="w-4 h-4" /> OPEN PROJECTOR
            </button>
          </div>
        </section>

        {/* Host Studio Auth Card */}
        <section className="neo-card bg-white p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-neo-pink border-2 border-black font-mono text-xs font-bold px-3 py-1">
              HOSTS // QUIZ STUDIO
            </span>
            <button
              type="button"
              onClick={() => navigate('/host')}
              className="text-xs font-bold underline flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" /> Already signed in?
            </button>
          </div>
          <h2 className="font-display text-2xl md:text-3xl mb-4">{t('hostLogin')}</h2>

          <div className="flex border-3 border-black mb-4">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 font-bold border-r-3 border-black ${
                authMode === 'login' ? 'bg-neo-yellow' : 'bg-neo-cream'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 font-bold ${
                authMode === 'register' ? 'bg-neo-yellow' : 'bg-neo-cream'
              }`}
            >
              REGISTER
            </button>
          </div>

          {error && (
            <div className="bg-neo-pink border-3 border-black p-3 mb-4 font-bold text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleHostAuth} className="space-y-3">
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="neo-input w-full"
                required
              />
            )}
            <input
              type="email"
              placeholder="Host Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neo-input w-full"
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-input w-full"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="neo-btn w-full bg-neo-lime py-3.5 text-lg font-display"
            >
              {loading ? 'LOADING...' : authMode === 'login' ? 'ENTER STUDIO' : 'CREATE HOST ACCOUNT'}
            </button>
          </form>
        </section>
      </main>

      <footer className="mt-8 text-center font-mono text-xs font-bold opacity-75">
        BUILT FOR 150+ CONCURRENT PLAYERS • SERVER-AUTHORITATIVE • NEO-BRUTALIST EDITION
      </footer>
    </div>
  );
}
