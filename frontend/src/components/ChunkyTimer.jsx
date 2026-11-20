import React, { useEffect, useState } from 'react';

export function ChunkyTimer({ endsAt, timeLimit = 20, paused = false, pausedRemainingMs = 0, onTick }) {
  const [remainingSec, setRemainingSec] = useState(timeLimit);

  useEffect(() => {
    if (paused) {
      setRemainingSec(Math.ceil((pausedRemainingMs || 0) / 1000));
      return;
    }
    if (!endsAt) return;

    const update = () => {
      const ms = Math.max(0, endsAt - Date.now());
      const sec = Math.ceil(ms / 1000);
      setRemainingSec(sec);
      if (onTick) onTick(sec);
    };

    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [endsAt, paused, pausedRemainingMs]);

  const totalSegments = 12;
  const ratio = Math.max(0, Math.min(1, remainingSec / Math.max(1, timeLimit)));
  const filledSegments = Math.ceil(ratio * totalSegments);

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 flex gap-1.5 bg-white border-4 border-black p-1.5 shadow-neo-sm">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const active = i < filledSegments;
          const color =
            remainingSec <= 5 ? 'bg-neo-pink' : remainingSec <= 10 ? 'bg-neo-orange' : 'bg-neo-lime';
          return (
            <div
              key={i}
              className={`h-6 flex-1 border-2 border-black transition-colors duration-100 ${
                active ? color : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
      <div
        className={`font-mono text-3xl md:text-4xl font-bold px-4 py-2 border-4 border-black shadow-neo-sm min-w-[84px] text-center ${
          remainingSec <= 5 ? 'bg-neo-pink text-black animate-pulse' : 'bg-neo-yellow text-black'
        }`}
      >
        {remainingSec}
      </div>
    </div>
  );
}
