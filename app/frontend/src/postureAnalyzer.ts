import type { LandmarkList } from './poseDetector';

export interface PostureData {
  spineAngleDeg: number;       // 0 = upright, positive = leaning forward
  forwardHeadRatio: number;    // normalized by shoulder width; >0.15 = forward head
  lateralLeanDeg: number;      // positive = leaning right, negative = leaning left
  postureScore: number;        // 0–100, higher = better
}

export interface CalibrationBaseline {
  spineAngle0: number;
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

  // Spine angle: angle of shoulder-to-hip vector from vertical
  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;
  const rawSpineAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
  const spineAngleDeg = baseline
    ? rawSpineAngle - baseline.spineAngle0
    : rawSpineAngle;

  // Forward head
  const shoulderWidth = baseline?.shoulderWidth ?? dist(lm[L_SHOULDER], lm[R_SHOULDER]);
  const forwardHeadRatio = (lm[NOSE].x - midShoulder.x) / (shoulderWidth || 1);

  // Lateral lean: angle of shoulder line from horizontal
  const lateralDx = lm[R_SHOULDER].x - lm[L_SHOULDER].x;
  const lateralDy = lm[R_SHOULDER].y - lm[L_SHOULDER].y;
  const lateralLeanDeg = Math.atan2(lateralDy, lateralDx) * (180 / Math.PI);

  // Score (0–100): penalize each deviation
  let score = 100;
  score -= Math.min(40, Math.abs(spineAngleDeg) * 2);     // forward lean penalty
  score -= Math.min(20, Math.abs(forwardHeadRatio) * 40); // forward head penalty
  score -= Math.min(20, Math.abs(lateralLeanDeg) * 3);    // lateral lean penalty
  score = Math.max(0, Math.min(100, score));

  return { spineAngleDeg, forwardHeadRatio, lateralLeanDeg, postureScore: score };
}

export function captureCalibrationBaseline(frames: PostureData[], lmFrames: LandmarkList[]): CalibrationBaseline {
  // Average spine angle over captured frames
  const avgSpine = frames.reduce((s, f) => s + f.spineAngleDeg, 0) / frames.length;
  // Average shoulder width over captured frames
  const avgShoulderWidth = lmFrames.reduce((s, lm) => {
    return s + dist(lm[11], lm[12]);
  }, 0) / lmFrames.length;
  return { spineAngle0: avgSpine, shoulderWidth: avgShoulderWidth };
}
