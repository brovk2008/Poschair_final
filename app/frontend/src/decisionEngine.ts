import type { PostureData } from './postureAnalyzer';

export type Mode = 'office' | 'gaming' | 'study' | 'relax';

export const MODULE_LABELS = [
  'Upper-Left',
  'Upper-Right',
  'Mid-Left',
  'Mid-Right',
  'Lower-Left',
  'Lower-Right',
];

const MODE_SCALE: Record<Mode, number> = {
  office: 1.0,
  gaming: 1.2,
  study: 0.85,
  relax: 0.5,
};

export const CONFIDENCE_THRESHOLD = 0.65;
const MIN_POSITION_CHANGE = 3;

function forwardPositions(deviation: number): { upper: number; mid: number; lower: number } {
  const d = Math.max(0, deviation);
  return {
    upper: Math.min(100, d * 2.0),
    mid: Math.min(100, d * 3.5),
    lower: Math.min(100, d * 2.8),
  };
}

function velocityBonus(velocitySpine: number): number {
  if (velocitySpine < 1) return 0;
  if (velocitySpine < 3) return 5;
  if (velocitySpine < 6) return 12;
  return 18;
}

function lateralSplit(lateralDeviation: number): { leftBonus: number; rightBonus: number } {
  const boost = Math.min(40, Math.abs(lateralDeviation) * 3.0);
  if (lateralDeviation > 2) return { leftBonus: boost, rightBonus: 0 };
  if (lateralDeviation < -2) return { leftBonus: 0, rightBonus: boost };
  return { leftBonus: 0, rightBonus: 0 };
}

let prevPositions = [0, 0, 0, 0, 0, 0];

export function computeTargetPositions(posture: PostureData, mode: Mode): number[] {
  if (posture.confidence < CONFIDENCE_THRESHOLD) return prevPositions;

  const scale = MODE_SCALE[mode];
  const fwd = Math.max(0, posture.spineDeviation ?? posture.spineAngleDeg);
  const lat = posture.lateralDeviation ?? posture.lateralLeanDeg;
  const fwdPos = forwardPositions(fwd + velocityBonus(posture.velocitySpine) / scale);
  const latMod = lateralSplit(lat);

  const raw = [
    fwdPos.upper + latMod.leftBonus,
    fwdPos.upper + latMod.rightBonus,
    fwdPos.mid + latMod.leftBonus,
    fwdPos.mid + latMod.rightBonus,
    fwdPos.lower + latMod.leftBonus,
    fwdPos.lower + latMod.rightBonus,
  ].map((value) => Math.min(100, Math.max(0, Math.round(value * scale))));

  const result = raw.map((value, index) =>
    Math.abs(value - prevPositions[index]) >= MIN_POSITION_CHANGE ? value : prevPositions[index]
  );
  prevPositions = result;
  return result;
}

export function isLateralLean(posture: PostureData): boolean {
  return Math.abs(posture.lateralDeviation ?? posture.lateralLeanDeg) > 3;
}

export function lateralLeanDirection(posture: PostureData): 'left' | 'right' | null {
  const lat = posture.lateralDeviation ?? posture.lateralLeanDeg;
  if (lat > 3) return 'right';
  if (lat < -3) return 'left';
  return null;
}

export function getPostureLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}
