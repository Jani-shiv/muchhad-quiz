import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFX } from '../utils/sound';

export function TopBarControls({ lang, setLang }) {
  const [muted, setMuted] = useState(soundFX.muted);

  const handleMute = () => {
    const next = soundFX.toggleMute();
    setMuted(next);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex border-3 border-black bg-white shadow-neo-sm">
        {[
          { code: 'en', label: 'EN' },
          { code: 'hi', label: 'हिं' },
          { code: 'gu', label: 'ગુજ' },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLang(item.code)}
            className={`px-2.5 py-1 text-xs font-bold border-r-2 last:border-r-0 border-black ${
              lang === item.code ? 'bg-neo-yellow' : 'bg-white hover:bg-neo-cream'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleMute}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        className="neo-btn bg-white p-2 flex items-center justify-center"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
