
export enum PhaseType {
  WARMUP = 'CALENTAMIENTO',
  HIIT = 'HIIT',
  STRETCH = 'ESTIRAMIENTO'
}

export enum ActivityType {
  WORK = 'TRABAJO',
  REST = 'DESCANSO',
  READY = 'PREPÁRATE'
}

export interface Exercise {
  id: string;
  name: string;
  duration: number; // seconds
}

export interface HiitConfig {
  rounds: number;
  exercisesPerRound: string[];
  workDuration: number;
  restBetweenExercises: number;
  restBetweenRounds: number;
}

export interface Routine {
  id: string;
  name: string;
  warmup: Exercise[];
  hiit: HiitConfig;
  stretch: Exercise[];
}

export interface TimerState {
  currentPhase: PhaseType;
  exerciseIndex: number;
  roundIndex: number; // Only for HIIT
  subPhase: ActivityType; // Work or Rest
  timeLeft: number;
  isActive: boolean;
  totalTimeElapsed: number;
}
