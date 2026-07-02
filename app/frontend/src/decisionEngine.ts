import type { PostureData } from './postureAnalyzer';

export type Mode = 'office' | 'gaming' | 'study' | 'relax';

// ── Servo index → grid position ────────────────────────────────────────
// Index 0: Upper-Left  (UL)
// Index 1: Upper-Right (UR)
// Index 2: Mid-Left    (ML)
// Index 3: Mid-Right   (MR)
// Index 4: Lower-Left  (LL)
// Index 5: Lower-Right (LR)

// ── Mode scaling factors ───────────────────────────────────────────────
const MODE_SCALE: Record<Mode, number> = {
  office: 1.0,
  gaming: 1.2,
  study:  0.9,
  relax:  0.5,
};

// ── Forward lean angle table ───────────────────────────────────────────
// deviation: deviation from calibrated neutral, degrees
// Returns angle for each row (upper/mid/lower). Symmetric left/right when no lateral lean.
// Pre-curved strips: 0° = pre-curve resting (~20mm bulge). 55° = max (~45–50mm).
function forwardAngles(deviation: number): { upper: number; mid: number; lower: number } {
  if (deviation <= 3)  return { upper: 0,  mid: 0,  lower: 0  };
  if (deviation <= 8)  return { upper: 0,  mid: 15, lower: 8  };
  if (deviation <= 15) return { upper: 10, mid: 30, lower: 20 };
  if (deviation <= 22) return { upper: 20, mid: 45, lower: 35 };
  return               { upper: 30, mid: 55, lower: 45 };
}

// ── Lateral lean modifier ──────────────────────────────────────────────
// lateralDeviation: positive = leaning right (right shoulder lower)
//   → push LEFT column more (user's body needs right-side support to re-centre)
// Returns { leftBoost, rightBoost } — added to forward angles
function lateralModifier(lateralDeviation: number): { leftBoost: number; rightBoost: number } {
  const abs = Math.abs(lateralDeviation);
  const boost = abs <= 3  ? 0
              : abs <= 7  ? 10
              : abs <= 12 ? 20
              : 30;

  // Lean RIGHT → push LEFT side more → leftBoost > 0, rightBoost = 0
  // Lean LEFT  → push RIGHT side more → rightBoost > 0, leftBoost = 0
  if (lateralDeviation > 3)  return { leftBoost: boost,  rightBoost: 0 };
  if (lateralDeviation < -3) return { leftBoost: 0,      rightBoost: boost };
  return { leftBoost: 0, rightBoost: 0 };
}

// ── Main export ────────────────────────────────────────────────────────
export function computeTargetAngles(posture: PostureData, mode: Mode): number[] {
  const scale = MODE_SCALE[mode];

  // Forward deviation: use calibrated deviation if available, else raw angle
  const fwd = Math.max(0, posture.spineDeviation ?? posture.spineAngleDeg);
  const lat = posture.lateralDeviation ?? posture.lateralLeanDeg;

  const fwdAngles = forwardAngles(fwd);
  const latMod    = lateralModifier(lat);

  // Compute per-module angles
  // Index: 0=UL, 1=UR, 2=ML, 3=MR, 4=LL, 5=LR
  const raw = [
    fwdAngles.upper + latMod.leftBoost,   // UL (index 0)
    fwdAngles.upper + latMod.rightBoost,  // UR (index 1)
    fwdAngles.mid   + latMod.leftBoost,   // ML (index 2)
    fwdAngles.mid   + latMod.rightBoost,  // MR (index 3)
    fwdAngles.lower + latMod.leftBoost,   // LL (index 4)
    fwdAngles.lower + latMod.rightBoost,  // LR (index 5)
  ];

  // Apply mode scale and clamp to 0–55
  return raw.map(a => Math.min(55, Math.max(0, Math.round(a * scale))));
}

// Helpers used by UI
export function isLateralLean(p: PostureData): boolean {
  return Math.abs(p.lateralDeviation ?? p.lateralLeanDeg) > 3;
}

export function lateralLeanDirection(p: PostureData): 'left' | 'right' | null {
  const lat = p.lateralDeviation ?? p.lateralLeanDeg;
  if (lat > 3)  return 'right';
  if (lat < -3) return 'left';
  return null;
}
