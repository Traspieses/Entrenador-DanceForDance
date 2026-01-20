
import React, { useState } from 'react';
import { Routine, Exercise, PhaseType } from '../types';
import { EXERCISE_DATABASE } from '../exerciseDatabase';

interface Props {
  routine: Routine;
  onChange: (r: Routine) => void;
  highContrast: boolean;
}

type GenerationTarget = 'SUPERIOR' | 'INFERIOR' | 'FULL';

const RoutineSettings: React.FC<Props> = ({ routine, onChange, highContrast }) => {
  const [activeSubTab, setActiveSubTab] = useState<PhaseType>(PhaseType.WARMUP);
  const [defaultDuration, setDefaultDuration] = useState<number>(30);
  const [showGenerator, setShowGenerator] = useState(false);

  // Estados del Generador
  const [genTarget, setGenTarget] = useState<GenerationTarget>('FULL');
  const [genWarmupMin, setGenWarmupMin] = useState(5);
  const [genHiitMin, setGenHiitMin] = useState(15);
  const [genStretchMin, setGenStretchMin] = useState(5);
  
  // Parámetros HIIT específicos para el generador
  const [genRounds, setGenRounds] = useState(3);
  const [genWorkSec, setGenWorkSec] = useState(40);
  const [genRestExSec, setGenRestExSec] = useState(20);
  const [genRestRoundSec, setGenRestRoundSec] = useState(60);

  const updateWarmup = (exercises: Exercise[]) => onChange({ ...routine, warmup: exercises });
  const updateStretch = (exercises: Exercise[]) => onChange({ ...routine, stretch: exercises });
  const updateHiit = (hiit: any) => onChange({ ...routine, hiit });

  const addExercise = (phase: PhaseType) => {
    const newEx = { id: Math.random().toString(36), name: '', duration: defaultDuration };
    if (phase === PhaseType.WARMUP) updateWarmup([...routine.warmup, newEx]);
    else updateStretch([...routine.stretch, newEx]);
  };

  const removeExercise = (phase: PhaseType, id: string) => {
    if (phase === PhaseType.WARMUP) updateWarmup(routine.warmup.filter(e => e.id !== id));
    else updateStretch(routine.stretch.filter(e => e.id !== id));
  };

  const editExercise = (phase: PhaseType, id: string, field: 'name' | 'duration', value: any) => {
    const list = phase === PhaseType.WARMUP ? routine.warmup : routine.stretch;
    const newList = list.map(e => e.id === id ? { ...e, [field]: field === 'duration' ? parseInt(value) || 0 : value } : e);
    if (phase === PhaseType.WARMUP) updateWarmup(newList);
    else updateStretch(newList);
  };

  const calculateTotal = (list: Exercise[]) => list.reduce((a, b) => a + b.duration, 0);

  // Lógica de Autogeneración Mejorada y Corregida
  const handleAutoGenerate = () => {
    const categories = EXERCISE_DATABASE;
    
    const getExercisesByKeywords = (catLabel: string, keywords: string[], limit: number) => {
      const cat = categories.find(c => c.label === catLabel);
      if (!cat) return [];
      let pool = cat.exercises;
      if (genTarget !== 'FULL') {
        pool = pool.filter(ex => keywords.some(k => ex.toLowerCase().includes(k.toLowerCase())));
      }
      if (pool.length < limit) {
        pool = [...pool, ...cat.exercises.filter(ex => !pool.includes(ex))];
      }
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);
    };

    const superiorKeywords = ['brazo', 'hombro', 'pecho', 'flexión', 'tríceps', 'espalda', 'plancha', 'superior', 'muñeca', 'escápula'];
    const inferiorKeywords = ['pierna', 'sentadilla', 'zancada', 'glúteo', 'tobillo', 'cadera', 'pantorrilla', 'isquio', 'cuádriceps'];
    const activeKeywords = genTarget === 'SUPERIOR' ? superiorKeywords : (genTarget === 'INFERIOR' ? inferiorKeywords : []);

    const warmupCount = 6;
    const warmupDur = Math.floor((genWarmupMin * 60) / warmupCount);
    const warmupExs = getExercisesByKeywords('CALENTAMIENTO', activeKeywords, warmupCount).map(name => ({
      id: Math.random().toString(36),
      name,
      duration: warmupDur
    }));

    const totalTargetSec = genHiitMin * 60;
    const restRoundsTotal = (genRounds - 1) * genRestRoundSec;
    const timeAvailableForWorkAndRest = totalTargetSec - restRoundsTotal;
    const timePerRoundsAvailable = timeAvailableForWorkAndRest / genRounds;
    
    const exerciseCountNeeded = Math.max(1, Math.round((timePerRoundsAvailable + genRestExSec) / (genWorkSec + genRestExSec)));
    
    const hiitExercises = getExercisesByKeywords(
      genTarget === 'FULL' ? 'HIIT' : (genTarget === 'SUPERIOR' ? 'TREN SUPERIOR' : 'TREN INFERIOR'), 
      activeKeywords, 
      exerciseCountNeeded
    );
    
    const stretchCount = 6;
    const stretchDur = Math.floor((genStretchMin * 60) / stretchCount);
    const stretchExs = getExercisesByKeywords('ENFRIAMIENTO', activeKeywords, stretchCount).map(name => ({
      id: Math.random().toString(36),
      name,
      duration: stretchDur
    }));

    const newRoutine: Routine = {
      id: `gen-${Date.now()}`,
      name: `PROTOCOLO ${genTarget} ${genWarmupMin + genHiitMin + genStretchMin} MIN`,
      warmup: warmupExs,
      hiit: {
        rounds: genRounds,
        exercisesPerRound: hiitExercises,
        workDuration: genWorkSec,
        restBetweenExercises: genRestExSec,
        restBetweenRounds: genRestRoundSec
      },
      stretch: stretchExs
    };

    onChange(newRoutine);
    setShowGenerator(false);
  };

  return (
    <div className="space-y-8">
      <datalist id="exercise-options">
        {EXERCISE_DATABASE.map(category => (
          <React.Fragment key={category.label}>
            {category.exercises.map(ex => (
              <option key={ex} value={ex}>{category.label}</option>
            ))}
          </React.Fragment>
        ))}
      </datalist>

      <button 
        onClick={() => setShowGenerator(true)}
        className="w-full py-4 glass-panel border-cyan-400/50 rounded-2xl flex items-center justify-center gap-3 orbitron font-black text-cyan-400 hover:bg-cyan-400/10 transition-all group"
      >
        <span className="text-xl group-hover:animate-pulse">⚡</span>
        GENERAR PROTOCOLO IA
      </button>

      {showGenerator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowGenerator(false)}></div>
          <div className="relative w-full max-w-2xl glass-panel p-6 md:p-10 rounded-[2.5rem] border-cyan-400/30 shadow-[0_0_80px_rgba(0,255,255,0.15)] animate-in zoom-in-95 duration-300 my-8">
            <h2 className="text-2xl md:text-3xl orbitron font-black text-cyan-400 mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="p-2 bg-cyan-400/20 rounded-lg">⚙️</span>
              CONFIGURACIÓN IA PROTOCOLO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-8">
                <section className="space-y-4">
                  <label className="text-[10px] orbitron font-black text-cyan-400/60 tracking-[0.3em] uppercase">PASO 01: TREN DE ACCIÓN</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SUPERIOR', 'INFERIOR', 'FULL'] as GenerationTarget[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setGenTarget(t)}
                        className={`py-3 rounded-xl orbitron font-bold text-[10px] border-2 transition-all ${genTarget === t ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'border-white/5 text-white/40 hover:border-white/20'}`}
                      >
                        {t === 'FULL' ? 'COMPLETO' : t}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <label className="text-[10px] orbitron font-black text-magenta-400/60 tracking-[0.3em] uppercase">PASO 02: DURACIÓN SECCIONES (MIN)</label>
                  <div className="space-y-3">
                    {[
                      { label: 'CALENTAMIENTO', val: genWarmupMin, set: setGenWarmupMin },
                      { label: 'HIIT ESTÁNDAR', val: genHiitMin, set: setGenHiitMin },
                      { label: 'ENFRIAMIENTO', val: genStretchMin, set: setGenStretchMin }
                    ].map(f => (
                      <div key={f.label} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="orbitron text-[10px] font-bold text-white/60">{f.label}</span>
                        <input 
                          type="number" 
                          value={f.val} 
                          onChange={(e) => f.set(parseInt(e.target.value) || 1)}
                          className="w-12 bg-transparent text-center orbitron font-black text-magenta-400 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="space-y-4">
                  <label className="text-[10px] orbitron font-black text-yellow-400/60 tracking-[0.3em] uppercase">PASO 03: PARÁMETROS HIIT (SEG)</label>
                  <div className="space-y-3">
                    {[
                      { label: 'BUCLE RONDAS', val: genRounds, set: setGenRounds, unit: 'R' },
                      { label: 'RÁFAGA TRABAJO', val: genWorkSec, set: setGenWorkSec, unit: 'S' },
                      { label: 'BUFFER EJERCICIO', val: genRestExSec, set: setGenRestExSec, unit: 'S' },
                      { label: 'SINCRONÍA RONDA', val: genRestRoundSec, set: setGenRestRoundSec, unit: 'S' }
                    ].map(f => (
                      <div key={f.label} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="orbitron text-[10px] font-bold text-white/60">{f.label}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={f.val} 
                            onChange={(e) => f.set(parseInt(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center orbitron font-black text-yellow-400 outline-none"
                          />
                          <span className="text-[8px] orbitron text-yellow-400/30">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button 
                onClick={() => setShowGenerator(false)}
                className="flex-1 py-4 border-2 border-white/10 rounded-2xl orbitron font-bold text-white/40 hover:text-white hover:border-white/20 transition-all"
              >
                ABORTAR
              </button>
              <button 
                onClick={handleAutoGenerate}
                className="flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl orbitron font-black text-black shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                FORJAR PROTOCOLO
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-8 rounded-[2rem] border-white/5 flex flex-col gap-4 relative">
        <label className="text-xs orbitron font-black uppercase opacity-60 tracking-[0.2em] neon-text-cyan">ID PROTOCOLO</label>
        <input 
          type="text" 
          value={routine.name} 
          onChange={(e) => onChange({ ...routine, name: e.target.value })}
          className="text-3xl orbitron font-black bg-transparent border-b-2 border-white/10 focus:border-cyan-400 outline-none pb-2 text-white placeholder-white/20"
          placeholder="NOMBRE DE RUTINA..."
        />
      </div>

      <div className="flex gap-4 glass-panel p-2 rounded-2xl border-white/10">
        {[PhaseType.WARMUP, PhaseType.HIIT, PhaseType.STRETCH].map(p => (
          <button
            key={p}
            onClick={() => setActiveSubTab(p)}
            className={`flex-1 py-4 rounded-xl orbitron font-black transition-all border-2 ${activeSubTab === p ? 'bg-white/10 border-white/20 shadow-inner' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-8">
        {(activeSubTab === PhaseType.WARMUP || activeSubTab === PhaseType.STRETCH) && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
              <h3 className="text-2xl orbitron font-black neon-text-cyan">NODOS SECUENCIA</h3>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl border-white/10">
                   <label className="text-[10px] orbitron font-black text-white/50 whitespace-nowrap">DUR NODO BASE:</label>
                   <input 
                    type="number" 
                    value={defaultDuration} 
                    onChange={(e) => setDefaultDuration(parseInt(e.target.value) || 0)}
                    className="w-16 bg-transparent orbitron font-black text-cyan-400 text-center outline-none border-b border-cyan-400/30 focus:border-cyan-400"
                   />
                   <span className="text-[10px] orbitron text-cyan-400/40">S</span>
                </div>
                <div className="px-5 py-2 glass-panel border-cyan-400/30 text-cyan-400 rounded-full text-xs orbitron font-black shadow-[0_0_10px_rgba(0,255,255,0.1)] whitespace-nowrap">
                  DUR TOTAL: {calculateTotal(activeSubTab === PhaseType.WARMUP ? routine.warmup : routine.stretch)}s
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {(activeSubTab === PhaseType.WARMUP ? routine.warmup : routine.stretch).map(ex => (
                <div key={ex.id} className="flex gap-4 items-center glass-panel p-5 rounded-2xl border-white/5 hover:border-white/20 transition-all group">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      list="exercise-options"
                      value={ex.name} 
                      onChange={(e) => editExercise(activeSubTab, ex.id, 'name', e.target.value)}
                      placeholder="SELECCIONAR EJERCICIO..."
                      className="w-full orbitron font-bold outline-none bg-transparent text-white placeholder:opacity-30"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={ex.duration} 
                      onChange={(e) => editExercise(activeSubTab, ex.id, 'duration', e.target.value)}
                      className="w-20 p-2 bg-white/5 border border-white/10 rounded-lg text-center orbitron font-black text-cyan-400 focus:border-cyan-400 outline-none"
                    />
                    <span className="text-[10px] orbitron opacity-50">SEG</span>
                  </div>
                  <button onClick={() => removeExercise(activeSubTab, ex.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">✕</button>
                </div>
              ))}
              <button 
                onClick={() => addExercise(activeSubTab)}
                className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-white/30 orbitron font-black hover:border-cyan-400/50 hover:text-cyan-400 transition-all"
              >
                + INSERTAR NODO ({defaultDuration}s)
              </button>
            </div>
          </>
        )}

        {activeSubTab === PhaseType.HIIT && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-2xl orbitron font-black neon-text-magenta">SISTEMAS BASE</h3>
              <div className="space-y-6">
                {[
                  { label: 'BUCLE RONDAS', key: 'rounds', unit: '' },
                  { label: 'RAFAGA TRABAJO', key: 'workDuration', unit: 'S' },
                  { label: 'BUFFER EJERCICIO', key: 'restBetweenExercises', unit: 'S' },
                  { label: 'SINCRONIA RONDA', key: 'restBetweenRounds', unit: 'S' }
                ].map(field => (
                  <div key={field.key} className="flex justify-between items-center group">
                    <label className="orbitron font-bold opacity-60 uppercase text-sm tracking-widest">{field.label}</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={(routine.hiit as any)[field.key]} 
                        onChange={(e) => updateHiit({ ...routine.hiit, [field.key]: parseInt(e.target.value) || 0 })}
                        className="w-24 p-3 bg-white/5 border border-white/10 rounded-xl text-center orbitron font-black text-magenta-400 outline-none shadow-inner"
                      />
                      <span className="text-[10px] orbitron opacity-40">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl orbitron font-black neon-text-yellow">NODOS DE DATOS</h3>
                 <div className="flex items-center gap-2 glass-panel px-3 py-1 rounded-lg border-white/5">
                    <label className="text-[9px] orbitron font-black text-white/30">DUR DEF:</label>
                    <input 
                      type="number" 
                      value={defaultDuration} 
                      onChange={(e) => setDefaultDuration(parseInt(e.target.value) || 0)}
                      className="w-10 bg-transparent orbitron font-bold text-yellow-400 text-xs text-center outline-none border-b border-yellow-400/20"
                    />
                 </div>
               </div>
               <div className="space-y-3">
                 {routine.hiit.exercisesPerRound.map((ex, i) => (
                   <div key={i} className="flex gap-3 group">
                      <input 
                        list="exercise-options"
                        className="flex-grow p-4 glass-panel bg-white/5 rounded-xl border-white/10 orbitron font-bold text-white outline-none focus:border-yellow-400/50 transition-all placeholder:opacity-20"
                        value={ex}
                        placeholder="SELECCIONAR NODO..."
                        onChange={(e) => {
                          const newList = [...routine.hiit.exercisesPerRound];
                          newList[i] = e.target.value;
                          updateHiit({ ...routine.hiit, exercisesPerRound: newList });
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newList = routine.hiit.exercisesPerRound.filter((_, idx) => idx !== i);
                          updateHiit({ ...routine.hiit, exercisesPerRound: newList });
                        }}
                        className="px-4 text-red-500/50 hover:text-red-500 transition-colors"
                      >✕</button>
                   </div>
                 ))}
                 <button 
                  onClick={() => updateHiit({ ...routine.hiit, exercisesPerRound: [...routine.hiit.exercisesPerRound, ''] })}
                  className="w-full py-4 bg-yellow-400/10 text-yellow-400 rounded-xl orbitron font-black border border-yellow-400/20 hover:bg-yellow-400/20 transition-all"
                 >
                   + INYECTAR EN CICLO
                 </button>
                 <p className="text-[10px] orbitron text-white/20 text-center uppercase tracking-widest mt-2">Los nodos HIIT usan la Ráfaga de Trabajo configurada</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineSettings;
