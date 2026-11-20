import React from 'react';

export const AVATAR_LIST = [
  { id: 1, name: 'Grumpy Cat', bg: '#FFE500' },
  { id: 2, name: 'Robot Bolt', bg: '#00E5FF' },
  { id: 3, name: 'Sleepy Panda', bg: '#FFFFFF' },
  { id: 4, name: 'Chili Pepper', bg: '#FF3B30' },
  { id: 5, name: 'Cool Cactus', bg: '#4CD964' },
  { id: 6, name: 'Ghost Boo', bg: '#D8B4FE' },
  { id: 7, name: 'Pizza Slice', bg: '#FF7A00' },
  { id: 8, name: 'Alien Zorp', bg: '#B6FF00' },
  { id: 9, name: 'Fox Blaze', bg: '#FF7A00' },
  { id: 10, name: 'Cloud Nimbus', bg: '#7DD3FC' },
];

export function Avatar({ id = 1, size = 64, mood = 'happy', className = '' }) {
  const numId = Math.min(10, Math.max(1, Number(id) || 1));
  const isSad = mood === 'sad';

  const renderFace = (eyeY = 62, mouthY = 82) => (
    <>
      {isSad ? (
        <>
          <path d={`M38 ${eyeY - 4} L48 ${eyeY + 2} M48 ${eyeY - 4} L38 ${eyeY + 2}`} stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d={`M72 ${eyeY - 4} L82 ${eyeY + 2} M82 ${eyeY - 4} L72 ${eyeY + 2}`} stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d={`M45 ${mouthY + 6} Q60 ${mouthY - 8} 75 ${mouthY + 6}`} fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="43" cy={eyeY} r="5.5" fill="#000" />
          <circle cx="77" cy={eyeY} r="5.5" fill="#000" />
          <circle cx="45" cy={eyeY - 2} r="1.8" fill="#FFF" />
          <circle cx="79" cy={eyeY - 2} r="1.8" fill="#FFF" />
          <path d={`M45 ${mouthY - 2} Q60 ${mouthY + 12} 75 ${mouthY - 2}`} fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}
    </>
  );

  const renderCharacter = () => {
    switch (numId) {
      case 1: // Grumpy Cat (yellow)
        return (
          <>
            <polygon points="22,42 30,14 50,32" fill="#FFE500" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <polygon points="98,42 90,14 70,32" fill="#FFE500" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="60" cy="66" r="38" fill="#FFE500" stroke="#000" strokeWidth="4.5" />
            <path d="M34 52 L50 58 M86 52 L70 58" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            <circle cx="43" cy="64" r="5" fill="#000" />
            <circle cx="77" cy="64" r="5" fill="#000" />
            <polygon points="55,73 65,73 60,79" fill="#FF4D8D" stroke="#000" strokeWidth="2.5" />
            {isSad ? (
              <path d="M46 90 Q60 78 74 90" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <path d="M48 84 Q60 92 72 84" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            )}
          </>
        );
      case 2: // Robot Bolt (cyan)
        return (
          <>
            <line x1="60" y1="12" x2="60" y2="28" stroke="#000" strokeWidth="4.5" />
            <circle cx="60" cy="12" r="6" fill="#FFE500" stroke="#000" strokeWidth="4" />
            <rect x="22" y="28" width="76" height="72" rx="10" fill="#00E5FF" stroke="#000" strokeWidth="4.5" />
            <rect x="12" y="52" width="10" height="22" rx="3" fill="#FF7A00" stroke="#000" strokeWidth="3.5" />
            <rect x="98" y="52" width="10" height="22" rx="3" fill="#FF7A00" stroke="#000" strokeWidth="3.5" />
            <rect x="34" y="46" width="18" height="16" rx="3" fill="#FFF" stroke="#000" strokeWidth="3.5" />
            <rect x="68" y="46" width="18" height="16" rx="3" fill="#FFF" stroke="#000" strokeWidth="3.5" />
            <circle cx="43" cy="54" r="4" fill="#000" />
            <circle cx="77" cy="54" r="4" fill="#000" />
            <rect x="38" y="76" width="44" height="12" rx="3" fill={isSad ? '#FF4D8D' : '#B6FF00'} stroke="#000" strokeWidth="3.5" />
          </>
        );
      case 3: // Sleepy Panda (white/black)
        return (
          <>
            <circle cx="30" cy="32" r="14" fill="#000" stroke="#000" strokeWidth="4" />
            <circle cx="90" cy="32" r="14" fill="#000" stroke="#000" strokeWidth="4" />
            <circle cx="60" cy="65" r="38" fill="#FFFFFF" stroke="#000" strokeWidth="4.5" />
            <ellipse cx="42" cy="62" rx="11" ry="9" transform="rotate(-15 42 62)" fill="#000" />
            <ellipse cx="78" cy="62" rx="11" ry="9" transform="rotate(15 78 62)" fill="#000" />
            <circle cx="42" cy="62" r="3" fill="#FFF" />
            <circle cx="78" cy="62" r="3" fill="#FFF" />
            <ellipse cx="60" cy="73" rx="6" ry="4" fill="#000" />
            {isSad ? (
              <path d="M48 88 Q60 78 72 88" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <path d="M48 82 Q60 91 72 82" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            )}
          </>
        );
      case 4: // Chili Pepper (red)
        return (
          <>
            <path d="M58 14 Q68 12 72 26" fill="none" stroke="#4CD964" strokeWidth="6" strokeLinecap="round" />
            <path d="M42 28 C25 48 32 95 68 106 C86 110 92 94 82 72 C76 58 84 36 62 28 Z" fill="#FF3B30" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            {renderFace(58, 76)}
          </>
        );
      case 5: // Cool Cactus with sunglasses (green)
        return (
          <>
            <rect x="20" y="54" width="18" height="28" rx="9" fill="#4CD964" stroke="#000" strokeWidth="4" />
            <rect x="82" y="48" width="18" height="28" rx="9" fill="#4CD964" stroke="#000" strokeWidth="4" />
            <rect x="36" y="20" width="48" height="86" rx="24" fill="#4CD964" stroke="#000" strokeWidth="4.5" />
            <rect x="38" y="44" width="20" height="13" rx="2" fill="#000" />
            <rect x="62" y="44" width="20" height="13" rx="2" fill="#000" />
            <line x1="58" y1="49" x2="62" y2="49" stroke="#000" strokeWidth="4" />
            {isSad ? (
              <path d="M48 78 Q60 68 72 78" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <path d="M48 72 Q60 82 72 72" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            )}
          </>
        );
      case 6: // Ghost Boo (lavender)
        return (
          <>
            <path d="M24 100 L24 54 A36 36 0 0 1 96 54 L96 100 L82 90 L70 102 L60 90 L50 102 L38 90 Z" fill="#D8B4FE" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            {renderFace(56, 74)}
          </>
        );
      case 7: // Pizza Slice (orange)
        return (
          <>
            <polygon points="60,18 18,98 102,98" fill="#FFE500" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <rect x="16" y="88" width="88" height="14" rx="7" fill="#FF7A00" stroke="#000" strokeWidth="4.5" />
            <circle cx="46" cy="76" r="5" fill="#FF3B30" stroke="#000" strokeWidth="2.5" />
            <circle cx="76" cy="74" r="5" fill="#FF3B30" stroke="#000" strokeWidth="2.5" />
            {renderFace(56, 70)}
          </>
        );
      case 8: // Alien Zorp (lime)
        return (
          <>
            <line x1="42" y1="28" x2="34" y2="12" stroke="#000" strokeWidth="4" />
            <line x1="78" y1="28" x2="86" y2="12" stroke="#000" strokeWidth="4" />
            <circle cx="34" cy="12" r="5" fill="#FF4D8D" stroke="#000" strokeWidth="3" />
            <circle cx="86" cy="12" r="5" fill="#FF4D8D" stroke="#000" strokeWidth="3" />
            <ellipse cx="60" cy="64" rx="38" ry="34" fill="#B6FF00" stroke="#000" strokeWidth="4.5" />
            <circle cx="60" cy="52" r="11" fill="#FFF" stroke="#000" strokeWidth="3.5" />
            <circle cx="60" cy="52" r="5" fill="#000" />
            {isSad ? (
              <path d="M46 82 Q60 72 74 82" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <path d="M46 76 Q60 88 74 76" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            )}
          </>
        );
      case 9: // Fox Blaze (orange/white)
        return (
          <>
            <polygon points="22,44 26,14 48,32" fill="#FF7A00" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <polygon points="98,44 94,14 72,32" fill="#FF7A00" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <polygon points="60,102 20,56 36,30 84,30 100,56" fill="#FF7A00" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            <polygon points="60,102 26,64 60,72 94,64" fill="#FFF" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
            {renderFace(54, 78)}
            <circle cx="60" cy="96" r="5" fill="#000" />
          </>
        );
      case 10: // Cloud Nimbus (sky blue)
      default:
        return (
          <>
            <path d="M32 88 A18 18 0 0 1 28 54 A24 24 0 0 1 74 42 A20 20 0 0 1 94 64 A16 16 0 0 1 88 88 Z" fill="#7DD3FC" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
            {renderFace(62, 76)}
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label={AVATAR_LIST[numId - 1]?.name || 'Avatar'}
    >
      {renderCharacter()}
    </svg>
  );
}
