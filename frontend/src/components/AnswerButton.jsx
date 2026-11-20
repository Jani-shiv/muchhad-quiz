import React from 'react';
import { motion } from 'framer-motion';

export const OPTION_STYLES = [
  { bg: 'bg-neo-pink', label: 'Triangle' },
  { bg: 'bg-neo-cyan', label: 'Square' },
  { bg: 'bg-neo-yellow', label: 'Circle' },
  { bg: 'bg-neo-lime', label: 'Star' },
  { bg: 'bg-neo-orange', label: 'Diamond' },
  { bg: 'bg-white', label: 'Hex' },
];

export function ShapeIcon({ index, size = 28 }) {
  switch (index % 4) {
    case 0: // Triangle
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <polygon points="16,4 28,27 4,27" fill="#000" />
        </svg>
      );
    case 1: // Square
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect x="5" y="5" width="22" height="22" fill="#000" />
        </svg>
      );
    case 2: // Circle
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#000" />
        </svg>
      );
    case 3: // Star
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <polygon
            points="16,3 20,11 29,12 22,19 24,28 16,23 8,28 10,19 3,12 12,11"
            fill="#000"
          />
        </svg>
      );
  }
}

export function AnswerButton({ index, text, selected, disabled, dimmed, isCorrect, revealed, onClick }) {
  const style = OPTION_STYLES[index % OPTION_STYLES.length];

  let ringClass = '';
  if (revealed) {
    ringClass = isCorrect ? 'ring-4 ring-black bg-neo-lime' : 'opacity-45';
  } else if (selected) {
    ringClass = 'translate-x-[3px] translate-y-[3px] shadow-none bg-white';
  }

  return (
    <motion.button
      type="button"
      disabled={disabled || dimmed}
      onClick={onClick}
      whileTap={!disabled && !dimmed ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.15 }}
      className={`neo-btn w-full min-h-[76px] p-4 flex items-center gap-4 text-left text-black ${
        style.bg
      } ${ringClass} ${dimmed ? 'opacity-20 pointer-events-none line-through' : ''}`}
    >
      <span className="w-11 h-11 bg-white border-3 border-black flex items-center justify-center shrink-0">
        <ShapeIcon index={index} size={24} />
      </span>
      <span className="font-sans font-bold text-lg md:text-xl leading-snug break-words flex-1">
        {text}
      </span>
    </motion.button>
  );
}
