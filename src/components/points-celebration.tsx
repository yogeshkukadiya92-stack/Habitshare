'use client';

import * as React from 'react';

interface PointsCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function PointsCelebration({ show, onComplete }: PointsCelebrationProps) {
  React.useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => {
      onComplete?.();
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [onComplete, show]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className="absolute top-0 block h-2.5 w-2.5 rounded-sm animate-[confettiFall_1.7s_ease-in_forwards]"
          style={{
            left: `${(index * 4.1 + 5) % 96}%`,
            background: index % 3 === 0 ? '#7c3aed' : index % 3 === 1 ? '#06b6d4' : '#f59e0b',
            animationDelay: `${(index % 8) * 0.05}s`,
            transform: `rotate(${index * 17}deg)`,
          }}
        />
      ))}
    </div>
  );
}
