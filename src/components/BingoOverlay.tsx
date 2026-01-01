import { useEffect } from 'react';

interface BingoOverlayProps {
  winnerName: string;
  onDismiss: () => void;
}

export function BingoOverlay({ winnerName, onDismiss }: BingoOverlayProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
      onClick={onDismiss}
    >
      {/* Sparkle/confetti effect - floating dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="text-center z-10">
        <div
          className="text-7xl md:text-9xl font-black text-yellow-400 animate-bounce"
          style={{
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.4)',
          }}
        >
          BINGO!
        </div>
        <div className="text-xl md:text-3xl text-white mt-6 font-semibold animate-pulse">
          {winnerName}
        </div>
        <div className="text-sm text-gray-300 mt-4">
          Tap anywhere to dismiss
        </div>
      </div>
    </div>
  );
}
