import type { Exercise } from '@/types/plan';

export interface WorkoutTemplate {
  warmup: Exercise[];
  cooldown: Exercise[];
}

// Map targetLabel to key: 'Fun Run' → 'fun_run', 'Mini Marathon' → 'mini_marathon', etc.
// Map level 'intermediate' → 'intermediate', anything else → 'beginner'

const TEMPLATES: Record<string, WorkoutTemplate> = {
  fun_run_beginner: {
    warmup: [
      { name: 'Leg Swing', sets: 2, reps: 10, note: 'each leg, forward & back' },
      { name: 'Hip Circle', sets: 1, reps: 10, note: 'each direction' },
      { name: 'High Knee March', sets: 1, reps: 20, note: 'slow, controlled' },
      { name: 'Ankle Roll', sets: 1, reps: 10, note: 'each ankle' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 1, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Standing Hamstring Stretch', sets: 1, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Calf Stretch (wall)', sets: 1, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Seated Forward Fold', sets: 1, reps: 1, note: 'Hold 45 sec, breathe deeply' },
    ],
  },
  fun_run_intermediate: {
    warmup: [
      { name: 'Leg Swing', sets: 2, reps: 15, note: 'each leg, forward & side' },
      { name: 'Hip Circle', sets: 2, reps: 10, note: 'each direction' },
      { name: 'High Knee March', sets: 1, reps: 30, note: 'build pace over reps' },
      { name: 'Butt Kick', sets: 1, reps: 20, note: 'walk forward, slow' },
      { name: 'Dynamic Lunge Walk', sets: 1, reps: 8, note: 'each leg, long stride' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Hamstring Stretch (standing)', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Calf Stretch (wall)', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 1, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Glute Cross-Body Stretch', sets: 1, reps: 1, note: 'Hold 30 sec each side' },
    ],
  },
  mini_marathon_beginner: {
    warmup: [
      { name: 'Leg Swing', sets: 2, reps: 15, note: 'each leg, forward & back' },
      { name: 'Hip Circle', sets: 1, reps: 10, note: 'each direction, loosen hips' },
      { name: 'High Knee March', sets: 1, reps: 30, note: 'tall posture, arms swing' },
      { name: 'Butt Kick', sets: 1, reps: 20, note: 'walk forward' },
      { name: 'Ankle Roll', sets: 1, reps: 10, note: 'each ankle, both directions' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Standing Hamstring Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Calf Stretch (wall)', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 1, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Seated Forward Fold', sets: 1, reps: 1, note: 'Hold 45 sec' },
    ],
  },
  mini_marathon_intermediate: {
    warmup: [
      { name: 'Leg Swing (forward & lateral)', sets: 2, reps: 15, note: 'each leg' },
      { name: 'Hip Circle', sets: 2, reps: 10, note: 'each direction' },
      { name: 'High Knee Jog', sets: 1, reps: 30, note: 'increase pace each set' },
      { name: 'Butt Kick', sets: 1, reps: 30, note: 'quick tempo' },
      { name: 'Dynamic Lunge Walk', sets: 2, reps: 10, note: 'each leg' },
      { name: 'Ankle Roll & Hop', sets: 1, reps: 10, note: 'each ankle then small hop' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Hamstring Stretch (seated)', sets: 2, reps: 1, note: 'Hold 30 sec each leg' },
      { name: 'Calf Stretch (wall)', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Glute Cross-Body Stretch', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Seated Forward Fold', sets: 1, reps: 1, note: 'Hold 45 sec, deep breaths' },
    ],
  },
  half_marathon_beginner: {
    warmup: [
      { name: 'Leg Swing (forward)', sets: 2, reps: 15, note: 'each leg, hold wall for balance' },
      { name: 'Leg Swing (lateral)', sets: 2, reps: 12, note: 'each leg, controlled' },
      { name: 'Hip Circle', sets: 2, reps: 10, note: 'each direction, hands on hips' },
      { name: 'High Knee March', sets: 1, reps: 30, note: 'drive knees to chest' },
      { name: 'Butt Kick', sets: 1, reps: 30, note: 'walk forward, heels to glutes' },
      { name: 'Dynamic Lunge Walk', sets: 2, reps: 8, note: 'each leg, reach arms overhead' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each leg' },
      { name: 'Seated Hamstring Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each leg' },
      { name: 'Calf Stretch (bent + straight knee)', sets: 2, reps: 1, note: 'Hold 30 sec each position each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: 'Glute Cross-Body Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: "Child's Pose", sets: 1, reps: 1, note: 'Hold 60 sec, breathe into hips' },
    ],
  },
  half_marathon_intermediate: {
    warmup: [
      { name: 'Leg Swing (forward & lateral)', sets: 2, reps: 20, note: 'each leg, increase range of motion' },
      { name: 'Hip Circle (deep)', sets: 2, reps: 12, note: 'each direction, controlled' },
      { name: 'High Knee Jog', sets: 2, reps: 20, note: 'build pace, arms pump' },
      { name: 'Butt Kick Jog', sets: 2, reps: 20, note: 'quick tempo, forward movement' },
      { name: 'Dynamic Lunge Walk with Twist', sets: 2, reps: 10, note: 'each leg, rotate toward front knee' },
      { name: 'A-Skip Drill', sets: 2, reps: 20, note: 'each leg, exaggerate knee drive' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each leg' },
      { name: 'Seated Hamstring Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each leg' },
      { name: 'Calf Stretch (bent + straight knee)', sets: 2, reps: 1, note: 'Hold 30 sec each position' },
      { name: 'Hip Flexor Lunge Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: 'Pigeon Pose (floor)', sets: 2, reps: 1, note: 'Hold 60 sec each side' },
      { name: 'IT Band Stretch (cross-leg)', sets: 2, reps: 1, note: 'Hold 30 sec each side' },
      { name: 'Seated Spinal Twist', sets: 1, reps: 1, note: 'Hold 30 sec each side' },
    ],
  },
  full_marathon_beginner: {
    warmup: [
      { name: 'Leg Swing (forward)', sets: 3, reps: 15, note: 'each leg, increase range each set' },
      { name: 'Leg Swing (lateral)', sets: 2, reps: 15, note: 'each leg' },
      { name: 'Hip Circle (deep)', sets: 2, reps: 12, note: 'each direction' },
      { name: 'High Knee March → Jog', sets: 2, reps: 20, note: 'start slow, build pace' },
      { name: 'Butt Kick Walk → Jog', sets: 2, reps: 20, note: 'transition into slow jog' },
      { name: 'Dynamic Lunge Walk', sets: 2, reps: 10, note: 'each leg, long stride' },
      { name: 'Ankle Roll & Calf Raise', sets: 1, reps: 15, note: 'each ankle, then 15 calf raises' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each leg' },
      { name: 'Seated Hamstring Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each leg' },
      { name: 'Calf Stretch — straight knee', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: 'Calf Stretch — bent knee (soleus)', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each side' },
      { name: 'Glute Cross-Body Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each side' },
      { name: "Child's Pose", sets: 1, reps: 1, note: 'Hold 60 sec, breathe into lower back' },
    ],
  },
  full_marathon_intermediate: {
    warmup: [
      { name: 'Leg Swing (3-plane)', sets: 3, reps: 15, note: 'each leg, forward, lateral & rotational' },
      { name: 'Hip Circle (deep)', sets: 2, reps: 15, note: 'each direction, increase range' },
      { name: 'High Knee Jog', sets: 2, reps: 30, note: 'build to 70% pace' },
      { name: 'Butt Kick Jog', sets: 2, reps: 30, note: 'quick turnover, forward movement' },
      { name: 'Dynamic Lunge Walk with Twist', sets: 2, reps: 12, note: 'each leg' },
      { name: 'A-Skip Drill', sets: 2, reps: 30, note: 'each leg' },
      { name: 'B-Skip Drill', sets: 2, reps: 20, note: 'each leg, extend leg forward' },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each leg' },
      { name: 'Seated Hamstring Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each leg' },
      { name: 'Calf Stretch — straight + bent knee', sets: 2, reps: 1, note: 'Hold 40 sec each position each side' },
      { name: 'Pigeon Pose', sets: 2, reps: 1, note: 'Hold 60 sec each side' },
      { name: 'Hip Flexor Lunge Stretch', sets: 2, reps: 1, note: 'Hold 45 sec each side' },
      { name: 'IT Band Cross-Leg Stretch', sets: 2, reps: 1, note: 'Hold 40 sec each side' },
      { name: 'Seated Spinal Twist', sets: 2, reps: 1, note: 'Hold 45 sec each side' },
      { name: 'Supine Glute Stretch (Figure-4)', sets: 2, reps: 1, note: 'Hold 60 sec each side' },
    ],
  },
};

export function getWorkoutTemplate(targetLabel: string, level: string): WorkoutTemplate {
  const targetKey = targetLabel.toLowerCase().replace(/\s+/g, '_');
  const levelKey = level === 'intermediate' ? 'intermediate' : 'beginner';
  const key = `${targetKey}_${levelKey}`;
  return TEMPLATES[key] ?? TEMPLATES['fun_run_beginner'];
}
