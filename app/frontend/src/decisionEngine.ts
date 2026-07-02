import type { PostureData } from './postureAnalyzer';

export type Mode = 'office' | 'gaming' | 'study' | 'relax';

// Module index → anatomical zone
// 0: Upper Thoracic, 1: Lower Thoracic, 2: Mid Lumbar Upper
// 3: Mid Lumbar Lower, 4: Lower Lumbar, 5: Pelvis

interface AngleRow { thoracic: number; lumbar: number; pelvis: number; }

// Base table (Mode: "office"). Other modes scale the output.
// Deviation is spineAngleDeg from calibrated baseline.
function baseAngles(deviation: number): AngleRow {
  if (deviation <= 5)  return { thoracic: 0,  lumbar: 0,  pelvis: 0  };
  if (deviation <= 12) return { thoracic: 0,  lumbar: 20, pelvis: 10 };
  if (deviation <= 20) return { thoracic: 20, lumbar: 40, pelvis: 25 };
  return               { thoracic: 30, lumbar: 60, pelvis: 40 };
}

// Mode scaling factors
const MODE_SCALE: Record<Mode, number> = {
  office: 1.0,
  gaming: 1.2,  // slightly more aggressive
  study:  0.9,  // slightly gentler
  relax:  0.5,  // very gentle
};

export function computeTargetAngles(posture: PostureData, mode: Mode): number[] {
  const deviation = Math.max(0, posture.spineAngleDeg); // only forward lean triggers correction
  const base  = baseAngles(deviation);
  const scale = MODE_SCALE[mode];

  const angles: number[] = [
    Math.round(base.thoracic * scale),  // module 0: upper thoracic
    Math.round(base.thoracic * scale),  // module 1: lower thoracic
    Math.round(base.lumbar   * scale),  // module 2: mid lumbar upper
    Math.round(base.lumbar   * scale),  // module 3: mid lumbar lower
    Math.round(base.lumbar   * scale),  // module 4: lower lumbar
    Math.round(base.pelvis   * scale),  // module 5: pelvis
  ];

  // Clamp to max safe angle
  return angles.map(a => Math.min(70, Math.max(0, a)));
}

export function isLateralLean(posture: PostureData): boolean {
  return Math.abs(posture.lateralLeanDeg) > 5;
}

export function lateralLeanDirection(posture: PostureData): 'left' | 'right' | null {
  if (!isLateralLean(posture)) return null;
  return posture.lateralLeanDeg > 0 ? 'right' : 'left';
}
