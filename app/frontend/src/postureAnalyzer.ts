// Posture Analyzer Geometry Math for PosChair

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PostureMetrics {
  shoulderTilt: number;     // Left/right shoulder offset (degrees)
  spineAngle: number;       // Spine lean relative to vertical (degrees)
  neckAngle: number;        // Head position relative to shoulders (degrees)
  forwardHeadOffset: number; // Distance nose is forward of shoulders
  slouchFactor: number;     // Normalized vertical distance from shoulder to hip (compression)
}

export interface PostureEvaluation {
  metrics: PostureMetrics;
  isSlouching: boolean;
  isHeadForward: boolean;
  isLeaningLeft: boolean;
  isLeaningRight: boolean;
  overallScore: number;     // 0 (terrible) to 100 (excellent)
}

// Convert radians to degrees
const radToDeg = (rad: number) => (rad * 180) / Math.PI;

export function analyzePosture(
  landmarks: Landmark3D[],
  calibration?: PostureMetrics // User's calibrated baseline for comparison
): PostureEvaluation {
  // Landmark indices:
  // Nose = 0
  // Left Ear = 7, Right Ear = 8
  // Left Shoulder = 11, Right Shoulder = 12
  // Left Hip = 23, Right Hip = 24

  const nose = landmarks[0];
  const lEar = landmarks[7];
  const rEar = landmarks[8];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];

  // Calculate midpoints
  const midShoulder = {
    x: (lShoulder.x + rShoulder.x) / 2,
    y: (lShoulder.y + rShoulder.y) / 2,
    z: (lShoulder.z + rShoulder.z) / 2,
  };

  const midHip = {
    x: (lHip.x + rHip.x) / 2,
    y: (lHip.y + rHip.y) / 2,
    z: (lHip.z + rHip.z) / 2,
  };

  const midEar = {
    x: (lEar.x + rEar.x) / 2,
    y: (lEar.y + rEar.y) / 2,
    z: (lEar.z + rEar.z) / 2,
  };

  // 1. Shoulder Tilt (Left/Right lean of the shoulder line)
  // Horizontal is y-diff = 0
  const dxShoulder = lShoulder.x - rShoulder.x;
  const dyShoulder = lShoulder.y - rShoulder.y;
  const shoulderTilt = radToDeg(Math.atan2(dyShoulder, dxShoulder));

  // 2. Spine Angle (Left/Right leaning of mid-shoulder relative to mid-hip)
  // Vertical line is x-diff = 0
  const dxSpine = midShoulder.x - midHip.x;
  const dySpine = midHip.y - midShoulder.y; // Positive going up
  const spineAngle = radToDeg(Math.atan2(dxSpine, dySpine));

  // 3. Neck Angle (Angle from mid-shoulder to ears/nose relative to vertical)
  // Measures forward head shift or drop
  const dxNeck = nose.x - midShoulder.x;
  const dyNeck = midShoulder.y - nose.y; // Positive going up
  const neckAngle = radToDeg(Math.atan2(dxNeck, dyNeck));

  // 4. Forward Head Offset (Horizontal offset in x/z coordinates, normalized by shoulder width)
  const shoulderWidth = Math.sqrt(
    Math.pow(lShoulder.x - rShoulder.x, 2) + Math.pow(lShoulder.y - rShoulder.y, 2)
  );
  // Nose distance in coordinate space normalized by shoulder width to handle different camera distances
  const forwardHeadOffset = (nose.x - midShoulder.x) / (shoulderWidth || 1);

  // 5. Slouch Factor (Shoulder-to-hip vertical distance normalized by shoulder width)
  // Lower values mean the spine is compressed/slouching
  const spineHeight = Math.abs(midShoulder.y - midHip.y);
  const slouchFactor = spineHeight / (shoulderWidth || 1);

  const metrics: PostureMetrics = {
    shoulderTilt,
    spineAngle,
    neckAngle,
    forwardHeadOffset,
    slouchFactor,
  };

  // If no calibration was provided, evaluate against default absolute ranges
  const baseline = calibration || {
    shoulderTilt: 0.0,
    spineAngle: 0.0,
    neckAngle: 0.0,
    forwardHeadOffset: 0.0,
    slouchFactor: 1.5, // Default expectation
  };

  // Compare actual measurements against user calibration baseline
  const shoulderDev = Math.abs(metrics.shoulderTilt - baseline.shoulderTilt);
  const spineDev = Math.abs(metrics.spineAngle - baseline.spineAngle);
  const neckDev = Math.abs(metrics.neckAngle - baseline.neckAngle);
  const headDev = metrics.forwardHeadOffset - baseline.forwardHeadOffset; // Positive is forward
  
  // Slouch deviation is a decrease in vertical spine length relative to the baseline height
  const slouchDev = baseline.slouchFactor > 0 
    ? Math.max(0, (baseline.slouchFactor - metrics.slouchFactor) / baseline.slouchFactor) 
    : 0;

  // Thresholds for alerts (in degrees/offsets)
  const isLeaningLeft = metrics.spineAngle - baseline.spineAngle < -6.0;
  const isLeaningRight = metrics.spineAngle - baseline.spineAngle > 6.0;
  const isSlouching = slouchDev > 0.12; // 12% or more compression in shoulder-to-hip height
  const isHeadForward = headDev > 0.15 || neckDev > 10.0; // Significant forward tilt or neck angle

  // Calculate scores (out of 100)
  // 1. Slouch score (weight: 40%)
  const slouchScore = Math.max(0, 100 - (slouchDev * 500)); // 20% slouch = 0 points
  
  // 2. Head alignment score (weight: 35%)
  const headScore = Math.max(0, 100 - (Math.max(0, headDev) * 400) - (Math.max(0, neckDev - 10) * 4));
  
  // 3. Spine leaning score (weight: 25%)
  const spineScore = Math.max(0, 100 - (shoulderDev * 5) - (spineDev * 6));

  const overallScore = Math.round(
    slouchScore * 0.40 + 
    headScore * 0.35 + 
    spineScore * 0.25
  );

  return {
    metrics,
    isSlouching,
    isHeadForward,
    isLeaningLeft,
    isLeaningRight,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };
}
