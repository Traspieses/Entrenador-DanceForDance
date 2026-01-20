
import React from 'react';

interface Props {
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrev: () => void;
  highContrast: boolean;
}

const Controls: React.FC<Props> = ({ isActive, onToggle, onReset, onNext, onPrev, highContrast }) => {
  return (
    <div className="flex items-center gap-6">
      <button 
        onClick={onPrev}
        className="w-10 h-10 rounded-xl glass-btn flex items-center justify-center text-white/70"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button 
        onClick={onToggle}
        className="w-16 h-16 rounded-2xl glass-btn flex items-center justify-center text-white relative"
      >
        <div className="absolute inset-0 bg-[#00E5FF]/5 rounded-[inherit] animate-pulse-glow"></div>
        {isActive ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button 
        onClick={onNext}
        className="w-10 h-10 rounded-xl glass-btn flex items-center justify-center text-white/70"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button 
        onClick={onReset}
        className="flex items-center justify-center w-8 h-8 rounded-lg glass-btn text-red-500/40 hover:text-red-500 ml-1"
        title="Reset"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default Controls;
