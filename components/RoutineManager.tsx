
import React, { useState, useEffect, useRef } from 'react';
import { Routine } from '../types';

interface Props {
  currentRoutine: Routine;
  onLoad: (r: Routine) => void;
  highContrast: boolean;
}

const RoutineManager: React.FC<Props> = ({ currentRoutine, onLoad, highContrast }) => {
  const [savedRoutines, setSavedRoutines] = useState<Routine[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const data = localStorage.getItem('pastel_flow_routines');
    if (data) setSavedRoutines(JSON.parse(data));
  }, []);

  const saveCurrent = () => {
    const exists = savedRoutines.find(r => r.id === currentRoutine.id);
    let newList: Routine[];
    if (exists) {
      newList = savedRoutines.map(r => r.id === currentRoutine.id ? { ...currentRoutine } : r);
    } else {
      const newRoutine = { ...currentRoutine, id: Math.random().toString(36) };
      newList = [...savedRoutines, newRoutine];
      onLoad(newRoutine);
    }
    setSavedRoutines(newList);
    localStorage.setItem('pastel_flow_routines', JSON.stringify(newList));
  };

  const deleteRoutine = (id: string) => {
    if (!confirm('¿CONFIRMAR ELIMINACIÓN DE DATOS?')) return;
    const newList = savedRoutines.filter(r => r.id !== id);
    setSavedRoutines(newList);
    localStorage.setItem('pastel_flow_routines', JSON.stringify(newList));
  };

  const renameRoutine = (id: string, newName: string) => {
    const newList = savedRoutines.map(r => r.id === id ? { ...r, name: newName } : r);
    setSavedRoutines(newList);
    localStorage.setItem('pastel_flow_routines', JSON.stringify(newList));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.warmup && json.hiit && json.stretch) {
          const newRoutine = { ...json, id: Math.random().toString(36) };
          const newList = [...savedRoutines, newRoutine];
          setSavedRoutines(newList);
          localStorage.setItem('pastel_flow_routines', JSON.stringify(newList));
          onLoad(newRoutine);
          alert('PROTOCOLO SINCRONIZADO EXITOSAMENTE');
        } else {
          alert('ERROR FORMATO: Estructura de protocolo no reconocida.');
        }
      } catch (err) {
        alert('ERROR LECTURA: El archivo no es un JSON válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calculateDuration = (r: Routine) => {
    const w = r.warmup.reduce((a, b) => a + b.duration, 0);
    const s = r.stretch.reduce((a, b) => a + b.duration, 0);
    const exCount = r.hiit.exercisesPerRound.length;
    const hiit = (exCount * r.hiit.workDuration + (exCount - 1) * r.hiit.restBetweenExercises) * r.hiit.rounds + (r.hiit.rounds - 1) * r.hiit.restBetweenRounds;
    const total = w + s + hiit;
    return `${Math.floor(total / 60)}m ${total % 60}s`;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-4xl orbitron font-black neon-text-cyan uppercase">BASE DE DATOS</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-6 py-4 glass-panel border-cyan-400/30 rounded-2xl orbitron font-black text-cyan-400 hover:bg-cyan-400/10 transition-all flex items-center gap-3"
          >
            <span className="text-xl">📥</span>
            IMPORTAR JSON
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={saveCurrent}
            className="flex-1 md:flex-none px-8 py-4 bg-magenta-500 text-black rounded-2xl orbitron font-black shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] hover:scale-105 transition-all"
          >
            REGISTRAR ACTUAL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {savedRoutines.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel border-white/5 rounded-[2rem] opacity-40 orbitron font-black uppercase tracking-widest italic">
            BASE VACÍA // NO SE DETECTA SINCRONIZACIÓN
          </div>
        )}
        {savedRoutines.map(r => (
          <div key={r.id} className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-5 border-white/5 hover:border-cyan-400/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-all"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl orbitron font-black text-white group-hover:neon-text-cyan transition-all uppercase">{r.name}</h3>
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] orbitron uppercase opacity-50 font-black tracking-[0.2em] px-2 py-1 bg-white/5 rounded">
                    DUR: {calculateDuration(r)}
                  </span>
                  <span className="text-[10px] orbitron uppercase opacity-50 font-black tracking-[0.2em] px-2 py-1 bg-white/5 rounded">
                    CICLOS: {r.hiit.rounds}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteRoutine(r.id)}
                className="p-3 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >✕</button>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => onLoad(r)}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl orbitron font-black text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all"
              >
                DESPLEGAR
              </button>
              <button 
                onClick={() => {
                  const name = prompt('NUEVA ID:', r.name);
                  if (name) renameRoutine(r.id, name);
                }}
                className="px-5 py-4 border border-white/5 rounded-xl orbitron font-bold text-white/50 hover:text-white transition-all"
              >
                RENOMBRAR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutineManager;
