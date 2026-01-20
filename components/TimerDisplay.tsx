
import React from 'react';
import { TimerState, ActivityType } from '../types';

interface Props {
  state: TimerState;
  currentStep: any;
  totalTime: number;
  highContrast: boolean;
}

const TimerDisplay: React.FC<Props> = ({ state, currentStep, totalTime, highContrast }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingTotalTime = totalTime - state.totalTimeElapsed - (currentStep.duration - state.timeLeft);
  const totalPercentage = Math.max(0, Math.min(100, (remainingTotalTime / totalTime) * 100));

  const getDynamicColorClass = () => {
    if (totalPercentage > 66) return 'neon-text-cyan';
    if (totalPercentage > 33) return 'text-purple-400';
    return 'text-magenta-500';
  };

  const stepProgress = 100 - (state.timeLeft / currentStep.duration) * 100;
  const totalProgress = ((totalTime - Math.max(0, remainingTotalTime)) / totalTime) * 100;

  const getRingColor = () => {
    if (state.subPhase === ActivityType.REST) return 'stroke-[#00E5FF]';
    if (state.subPhase === ActivityType.READY) return 'stroke-[#ffff00]';
    return 'stroke-[#ff00ff]';
  };

  // Valores optimizados para el ancho fijo de 450px
  const radius = 100; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stepProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full h-full max-h-[82dvh] p-4 rounded-3xl glass-panel relative overflow-hidden border-white/10 justify-start">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00E5FF]/5 blur-[60px] rounded-full pointer-events-none"></div>
      
      {/* Global Clock */}
      <div className={`absolute top-4 right-6 text-2xl orbitron font-black transition-all duration-500 z-20 ${getDynamicColorClass()}`}>
        {formatTime(Math.max(0, remainingTotalTime))}
      </div>

      {/* Phase Label */}
      <div className="text-[14px] orbitron uppercase font-black tracking-[0.2em] opacity-90 self-start text-[#00E5FF] h-6 mt-2 ml-2 z-20">
        {state.currentPhase} {state.roundIndex > 0 && `// RND ${state.roundIndex}`}
      </div>

      {/* Central Neon Clock */}
      <div className="relative flex items-center justify-center shrink-0 mt-4 mb-2 scale-110 z-10">
        <svg className="w-64 h-64 drop-shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          <circle className="stroke-white/5" strokeWidth="4" fill="transparent" r={radius} cx="50%" cy="50%" />
          <circle
            className={`progress-ring ${getRingColor()}`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50%"
            cy="50%"
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset: offset,
              filter: 'drop-shadow(0 0 12px currentColor)'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl orbitron font-black timer-main-text tabular-nums leading-none">
            {formatTime(state.timeLeft)}
          </span>
          <span className={`text-[12px] orbitron font-black uppercase tracking-[0.4em] mt-3 ${state.subPhase === ActivityType.WORK ? 'text-magenta-400' : 'text-[#00E5FF]'}`}>
            {state.subPhase}
          </span>
        </div>
      </div>

      {/* Adaptive Text Frame */}
      <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 overflow-hidden py-2 min-h-[220px] z-20">
        {/* Current Exercise */}
        <div className="w-full text-center h-28 flex items-center justify-center px-4 overflow-hidden" style={{ containerType: 'inline-size' }}>
          <h2 
            className="orbitron font-black uppercase tracking-tighter leading-[0.9] text-balance transition-all"
            style={{ 
              fontSize: 'clamp(1.8rem, 15cqw, 3.8rem)',
              color: '#00E5FF',
              textShadow: '0 0 15px rgba(0, 229, 255, 0.7), 0 0 30px rgba(0, 229, 255, 0.5)'
            }}
          >
            {currentStep.name}
          </h2>
        </div>
        
        {/* Next Exercise */}
        <div className="w-full flex flex-col items-center shrink-0 mt-4">
           <span className="text-[10px] orbitron font-black text-white/40 uppercase tracking-[0.3em]">SIGUIENTE:</span>
           <div className="h-24 flex items-center justify-center w-full overflow-hidden px-4" style={{ containerType: 'inline-size' }}>
             <h3 
               className="orbitron font-bold uppercase tracking-tighter text-center transition-all leading-tight text-balance"
               style={{ 
                 fontSize: 'clamp(1.2rem, 10cqw, 2.5rem)',
                 color: '#FFA500',
                 textShadow: '0 0 10px rgba(255, 165, 0, 0.6)'
               }}
             >
                {(currentStep.nextName || "FIN PROTOCOLO").replace(/_/g, ' ')}
             </h3>
           </div>
        </div>
      </div>

      {/* Progress Sync - Bottom */}
      <div className="w-full shrink-0 mt-auto pb-2">
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.5)] transition-all duration-1000"
            style={{ width: `${Math.min(100, totalProgress)}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full mt-2 text-[10px] orbitron font-bold opacity-40 tracking-widest">
          <span>PROGRESO TOTAL: {Math.floor(totalProgress)}%</span>
          <span>SYSTEM LINK v3.2</span>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
