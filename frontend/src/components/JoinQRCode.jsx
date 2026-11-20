import React from 'react';
import QRCode from 'qrcode.react';

export function JoinQRCode({ pin, size = 160 }) {
  // Get the current origin (works in both dev and production)
  const joinUrl = `${window.location.origin}/join/${pin}`;

  return (
    <div className="neo-card bg-white p-6 space-y-4 text-center">
      <h3 className="font-display text-lg">Share to Join</h3>

      {/* QR Code */}
      <div className="flex justify-center">
        <QRCode
          value={joinUrl}
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Join URL */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold block text-neo-gray">Join URL</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={joinUrl}
            className="neo-input flex-1 text-sm font-mono bg-neo-cream"
            title="Click to copy"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(joinUrl).then(() => {
              // Visual feedback could be added here
            })}
            className="neo-btn bg-neo-cyan px-3 py-2 text-sm font-mono shrink-0"
            title="Copy to clipboard"
          >
            COPY
          </button>
        </div>
      </div>

      {/* Short PIN display */}
      <div className="bg-neo-yellow border-3 border-black p-3">
        <p className="font-mono text-xs font-bold text-neo-gray">OR ENTER PIN MANUALLY</p>
        <p className="font-display text-3xl font-bold tracking-widest">{pin}</p>
      </div>

      <p className="font-mono text-xs text-neo-gray">
        Players can open the link or scan the QR code to join instantly
      </p>
    </div>
  );
}