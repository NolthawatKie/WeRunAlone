export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  note?: string;
}

export interface Session {
  type: 'warmup' | 'run' | 'strength' | 'plyometrics' | 'cooldown' | 'rest';
  duration: number;
  exercises?: Exercise[];
  runType?: string;
  distance?: number;
  zone?: string;
  effort?: string;
  description?: string;
  pace?: string; // single value based on user's level
}

export interface Day {
  dayName: string;
  type: 'run' | 'strength' | 'plyometrics' | 'rest';
  sessions: Session[];
}

export interface Phase {
  phaseNumber: number;
  phaseName: string;
  repeatWeeks: number;
  weekRange: string;
  days: Day[];
}

export interface TrainingPlan {
  planName: string;
  totalWeeks: number;
  phases: Phase[];
}

export interface WeekConfig {
  min: number;
  max: number;
  default: number;
  warnBelow: number;
}

export interface RaceEntry {
  distance: number;
  label: string;
  count: number;
  prH: number; // PR time hours (0 = no PR entered)
  prM: number; // PR time minutes (0 = no PR entered)
  actualDistance?: number; // only for "Under 10 km" — the specific distance raced (e.g. 5, 8)
}

export interface FormInputs {
  target: string;
  targetLabel: string;
  targetDistance: number;
  level: string;
  weeks: number;
  days: string[];
  hrMax: number | null;
}
