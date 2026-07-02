import type { LandmarkList } from './poseDetector';

export interface PostureData {
  spineAngleDeg: number;       // raw forward/back lean; positive = leaning forward
  lateralLeanDeg: number;      // raw left/right tilt; positive = leaning right (user's right)
  forwardHeadRatio: number;    // nose offset normalized by shoulder width; >0.15 = forward head
  
  // Deviation from calibrated baseline (null if not calibrated)
  spineDeviation: number | null;
  lateralDeviation: number | null;
  
  // Overall score
  postureScore: number;        // 0–100, higher = better
}

export interface CalibrationBaseline {
  spineAngle0: number;
  lateralAngle0: number;
  shoulderWidth: number;
}

// Landmark indices per MediaPipe Pose
const NOSE = 0, L_SHOULDER = 11, R_SHOULDER = 12, L_HIP = 23, R_HIP = 24;

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function analyzePose(
  lm: LandmarkList,
  baseline: CalibrationBaseline | null
): PostureData {
  const midShoulder = {
    x: (lm[L_SHOULDER].x + lm[R_SHOULDER].x) / 2,
    y: (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2,
  };
  const midHip = {
    x: (lm[L_HIP].x + lm[R_HIP].x) / 2,
    y: (lm[L_HIP].y + lm[R_HIP].y) / 2,
  };

  // Spine angle (forward/back lean): angle of shoulder-to-hip vector from vertical
  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;
  const spineAngleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);

  // Lateral lean: angle of shoulder line from horizontal
  const lateralDx = lm[R_SHOULDER].x - lm[L_SHOULDER].x;
  const lateralDy = lm[R_SHOULDER].y - lm[L_SHOULDER].y;
  const lateralLeanDeg = Math.atan2(lateralDy, lateralDx) * (180 / Math.PI);

  // Forward head
  const shoulderWidth = baseline?.shoulderWidth ?? dist(lm[L_SHOULDER], lm[R_SHOULDER]);
  const forwardHeadRatio = (lm[NOSE].x - midShoulder.x) / (shoulderWidth || 1);

  // Deviation from baseline
  const spineDeviation   = baseline ? spineAngleDeg   - baseline.spineAngle0   : null;
  const lateralDeviation = baseline ? lateralLeanDeg  - baseline.lateralAngle0 : null;

  // Score (0–100): penalize each deviation
  const spinePenalty   = Math.min(50, Math.abs(spineDeviation   ?? spineAngleDeg)   * 2.5);
  const lateralPenalty = Math.min(25, Math.abs(lateralDeviation ?? lateralLeanDeg)  * 3.0);
  const headPenalty    = Math.min(25, Math.abs(forwardHeadRatio) * 50);
  const postureScore   = Math.max(0, Math.min(100, 100 - spinePenalty - lateralPenalty - headPenalty));

  return { spineAngleDeg, lateralLeanDeg, forwardHeadRatio, spineDeviation, lateralDeviation, postureScore };
}

export function captureCalibrationBaseline(frames: PostureData[], lmFrames: LandmarkList[]): CalibrationBaseline {
  const avgSpine = frames.reduce((s, f) => s + f.spineAngleDeg, 0) / frames.length;
  const avgLateral = frames.reduce((s, f) => s + f.lateralLeanDeg, 0) / frames.length;
  const avgShoulderWidth = lmFrames.reduce((s, lm) => {
    return s + dist(lm[11], lm[12]);
  }, 0) / lmFrames.length;
  return { spineAngle0: avgSpine, lateralAngle0: avgLateral, shoulderWidth: avgShoulderWidth };
}
