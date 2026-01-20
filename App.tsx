
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PhaseType, ActivityType, Exercise, Routine, TimerState } from './types';
import RoutineSettings from './components/RoutineSettings';
import TimerDisplay from './components/TimerDisplay';
import Controls from './components/Controls';
import RoutineManager from './components/RoutineManager';

const DEFAULT_ROUTINE: Routine = {
  id: 'default',
  name: 'PROTOCOLO INICIAL',
  warmup: [
    { id: 'w1', name: 'Jumping Jacks', duration: 30 },
    { id: 'w2', name: 'Rotación de brazos', duration: 20 },
    { id: 'w3', name: 'Rodillas altas', duration: 30 },
  ],
  hiit: {
    rounds: 3,
    exercisesPerRound: ['Burpees', 'Sentadillas', 'Flexiones clásicas', 'Escaladores'],
    workDuration: 40,
    restBetweenExercises: 20,
    restBetweenRounds: 60,
  },
  stretch: [
    { id: 's1', name: 'Estiramiento de cuádriceps', duration: 30 },
    { id: 's2', name: 'Estiramiento de isquiotibiales', duration: 30 },
    { id: 's3', name: 'Estiramiento de hombros', duration: 20 },
  ],
};

const App: React.FC = () => {
  const [routine, setRoutine] = useState<Routine>(DEFAULT_ROUTINE);
  const [activeTab, setActiveTab] = useState<'settings' | 'timer' | 'routines'>('settings');
  const [highContrast, setHighContrast] = useState(false);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState("");

  const [timerState, setTimerState] = useState<TimerState>({
    currentPhase: PhaseType.WARMUP,
    exerciseIndex: 0,
    roundIndex: 0,
    subPhase: ActivityType.READY,
    timeLeft: 10,
    isActive: false,
    totalTimeElapsed: 0,
  });

  const timerRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playHornBeep = (freq: number, duration: number, volume = 1.0) => {
    if (muted) return;
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      
      osc.type = 'square'; 
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      
      gain.gain.setValueAtTime(volume, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
      
      osc.start();
      osc.stop(audioContext.current.currentTime + duration);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const triggerTransition = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    playHornBeep(1500, 0.6, 1.0); 
  };

  const sequence = useMemo(() => {
    const steps: { phase: PhaseType; name: string; duration: number; type: ActivityType; round?: number; nextName?: string; cumulativeTimeBefore: number }[] = [];
    let total = 0;
    
    steps.push({ phase: PhaseType.WARMUP, name: 'INICIANDO...', duration: 5, type: ActivityType.READY, nextName: routine.warmup[0]?.name, cumulativeTimeBefore: 0 });
    total = 5;

    routine.warmup.forEach((ex, idx) => {
      steps.push({ 
        phase: PhaseType.WARMUP, 
        name: ex.name || 'SIN NOMBRE', 
        duration: ex.duration, 
        type: ActivityType.WORK,
        nextName: routine.warmup[idx + 1]?.name || routine.hiit.exercisesPerRound[0] || 'HIIT',
        cumulativeTimeBefore: total
      });
      total += ex.duration;
    });

    for (let r = 0; r < routine.hiit.rounds; r++) {
      routine.hiit.exercisesPerRound.forEach((exName, exIdx) => {
        steps.push({ 
          phase: PhaseType.HIIT, 
          name: exName || 'EJERCICIO HIIT', 
          duration: routine.hiit.workDuration, 
          type: ActivityType.WORK, 
          round: r + 1,
          nextName: (exIdx < routine.hiit.exercisesPerRound.length - 1) ? 'DESCANSO' : (r < routine.hiit.rounds - 1 ? 'PAUSA RONDA' : routine.stretch[0]?.name || 'ESTIRAMIENTO'),
          cumulativeTimeBefore: total
        });
        total += routine.hiit.workDuration;

        if (exIdx < routine.hiit.exercisesPerRound.length - 1) {
          steps.push({ phase: PhaseType.HIIT, name: 'DESCANSO', duration: routine.hiit.restBetweenExercises, type: ActivityType.REST, round: r + 1, nextName: routine.hiit.exercisesPerRound[exIdx + 1], cumulativeTimeBefore: total });
          total += routine.hiit.restBetweenExercises;
        } else if (r < routine.hiit.rounds - 1) {
          steps.push({ phase: PhaseType.HIIT, name: 'PAUSA RONDA', duration: routine.hiit.restBetweenRounds, type: ActivityType.REST, round: r + 1, nextName: routine.hiit.exercisesPerRound[0], cumulativeTimeBefore: total });
          total += routine.hiit.restBetweenRounds;
        }
      });
    }

    routine.stretch.forEach((ex, idx) => {
      steps.push({ 
        phase: PhaseType.STRETCH, 
        name: ex.name || 'SIN NOMBRE', 
        duration: ex.duration, 
        type: ActivityType.WORK,
        nextName: routine.stretch[idx + 1]?.name || 'COMPLETADO',
        cumulativeTimeBefore: total
      });
      total += ex.duration;
    });

    return steps;
  }, [routine]);

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = sequence[stepIndex];

  useEffect(() => {
    if (timerState.isActive && timerState.timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerState(prev => {
          const nextTime = prev.timeLeft - 1;
          if (nextTime <= 3 && nextTime > 0) {
            playHornBeep(1200, 0.35, 1.0); 
          }
          return { 
            ...prev, 
            timeLeft: nextTime,
            totalTimeElapsed: prev.totalTimeElapsed + 1
          };
        });
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isActive) {
      if (stepIndex < sequence.length - 1) {
        triggerTransition();
        nextStep();
      } else {
        setTimerState(prev => ({ ...prev, isActive: false }));
        playHornBeep(800, 1.2, 1.0); 
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerState.isActive, timerState.timeLeft, stepIndex, sequence]);

  const toggleTimer = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setTimerState(prev => ({ ...prev, isActive: !prev.isActive }));
  };
  
  const resetTimer = () => {
    setStepIndex(0);
    const start = sequence[0];
    setTimerState({
      currentPhase: start.phase,
      exerciseIndex: 0,
      roundIndex: 0,
      subPhase: start.type,
      timeLeft: start.duration,
      isActive: false,
      totalTimeElapsed: 0,
    });
  };

  const syncStateWithStep = (idx: number) => {
    const step = sequence[idx];
    setTimerState(prev => ({
      ...prev,
      currentPhase: step.phase,
      subPhase: step.type,
      timeLeft: step.duration,
      roundIndex: step.round || 0,
      totalTimeElapsed: step.cumulativeTimeBefore
    }));
    setStepIndex(idx);
  };

  const nextStep = () => {
    if (stepIndex < sequence.length - 1) {
      syncStateWithStep(stepIndex + 1);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      syncStateWithStep(stepIndex - 1);
    }
  };

  const quickSave = () => {
    const fileName = `${(routine.name || 'MI RUTINA HIIT').replace(/\s+/g, '_')}.json`;
    const jsonStr = JSON.stringify(routine, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSaveIndicator("EXPORTADO");
    setTimeout(() => setSaveIndicator(""), 2000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.warmup && json.hiit && json.stretch) {
          setRoutine(json);
          playHornBeep(1000, 0.3, 0.5);
          setSaveIndicator("SINCRO");
          setTimeout(() => setSaveIndicator(""), 3000);
          setActiveTab('settings');
        }
      } catch (err) { alert("ERROR"); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalRoutineTime = useMemo(() => sequence.reduce((acc, s) => acc + s.duration, 0), [sequence]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${flash ? 'flash-active' : ''}`}>
      <header className="p-2 shrink-0 glass-panel mx-2 mt-2 rounded-2xl border-white/10 flex justify-between items-center z-50">
        <div className="flex flex-col">
          <h1 className="text-xs md:text-sm orbitron font-black text-white leading-tight">
            NEON <span className="text-[#00E5FF]">HIIT</span> v3
          </h1>
          <span className="text-[6px] md:text-[7px] orbitron uppercase tracking-[0.2em] text-[#00E5FF] opacity-60">Neural Link</span>
        </div>
        <div className="flex gap-1 items-center">
          {saveIndicator && <span className="text-[7px] orbitron text-[#00E5FF] animate-pulse uppercase font-black mr-1">{saveIndicator}</span>}
          <button onClick={() => setMuted(!muted)} className="p-1 rounded-md glass-btn text-[10px]">{muted ? '🔇' : '🔊'}</button>
          <button onClick={() => setHighContrast(!highContrast)} className="p-1 rounded-md glass-btn text-[10px]">🌓</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden relative">
        {activeTab === 'timer' && (
          <div className="w-full flex flex-col items-center justify-start h-full animate-in fade-in duration-300">
             <TimerDisplay 
              state={timerState} 
              currentStep={currentStep} 
              totalTime={totalRoutineTime}
              highContrast={highContrast}
            />
            <div className="shrink-0 mb-2 mt-auto">
              <Controls 
                isActive={timerState.isActive} 
                onToggle={toggleTimer} 
                onReset={resetTimer}
                onNext={nextStep}
                onPrev={prevStep}
                highContrast={highContrast}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="w-full h-full overflow-y-auto no-scrollbar py-1 px-2 animate-in slide-in-from-bottom-2">
            <RoutineSettings routine={routine} onChange={setRoutine} highContrast={highContrast} />
          </div>
        )}

        {activeTab === 'routines' && (
          <div className="w-full h-full overflow-y-auto no-scrollbar py-1 px-2 animate-in slide-in-from-bottom-2">
            <RoutineManager currentRoutine={routine} onLoad={setRoutine} highContrast={highContrast} />
          </div>
        )}
      </main>

      <nav className="shrink-0 mb-2 px-2 z-50">
        <div className="flex gap-1 p-1 glass-panel rounded-xl border-white/10 justify-center max-w-full">
          {[
            { id: 'settings', label: 'CFG' },
            { id: 'import', label: 'IMP' },
            { id: 'export', label: 'EXP' },
            { id: 'timer', label: 'START', main: true },
            { id: 'routines', label: 'LIB' }
          ].map((btn) => (
            <button 
              key={btn.id}
              onClick={() => {
                if (btn.id === 'import') fileInputRef.current?.click();
                else if (btn.id === 'export') quickSave();
                else if (btn.id === 'timer') {
                   setActiveTab('timer');
                   if (stepIndex === 0 && !timerState.isActive) resetTimer();
                } else setActiveTab(btn.id as any);
              }}
              className={`flex-1 py-1.5 rounded-lg orbitron font-bold text-[7px] md:text-[9px] glass-btn ${activeTab === btn.id ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'text-white/50'} ${btn.main ? 'flex-[1.2] bg-magenta-500/10 border-magenta-500/30 text-magenta-400' : ''}`}
            >
              {btn.label}
            </button>
          ))}
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </nav>
    </div>
  );
};

export default App;
