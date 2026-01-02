import { useState, useRef, useCallback, useEffect } from 'react';

interface SlideToConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  label?: string;
}

export function SlideToConfirm({ onConfirm, onCancel, label = 'Slide to clear' }: SlideToConfirmProps) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);

  const THUMB_SIZE = 44;
  const THRESHOLD = 0.85;

  const handleStart = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    trackWidthRef.current = rect.width - THUMB_SIZE;
    startXRef.current = clientX;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    const newProgress = Math.max(0, Math.min(1, delta / trackWidthRef.current));
    setProgress(newProgress);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (progress >= THRESHOLD) {
      onConfirm();
    } else {
      setProgress(0);
    }
  }, [isDragging, progress, onConfirm]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Click outside to cancel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    // Delay adding listener to prevent immediate cancel
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const thumbX = progress * trackWidthRef.current || 0;

  return (
    <div
      ref={trackRef}
      className="relative h-10 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden cursor-grab select-none"
      style={{ minWidth: '180px' }}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0 bg-red-200 dark:bg-red-800/50 transition-all duration-75"
        style={{ width: `${progress * 100}%` }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-red-600 dark:text-red-400 text-sm font-medium pl-10">
          {progress >= THRESHOLD ? '✓ Release!' : `→ ${label}`}
        </span>
      </div>

      {/* Thumb */}
      <div
        className={`absolute top-1 left-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md transition-transform ${isDragging ? 'scale-110' : ''}`}
        style={{ transform: `translateX(${thumbX}px)` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-white text-sm">→</span>
      </div>
    </div>
  );
}
