// Decision Engine for PosChair target angle mapping
import { PostureEvaluation } from "./postureAnalyzer";

export type IntensityMode = "Office" | "Gaming" | "Study" | "Relax";

export interface DecisionEngineConfig {
  mode: IntensityMode;
  supportLevel: "Low" | "Medium" | "High";
  neutralAngle: number; // Defaults to 90
  maxPushAngle: number;  // Max compression (e.g. 140)
  minRelaxAngle: number; // Min relaxation (e.g. 60)
}

// Translate posture metrics and evaluation to 6 servo target angles
export function calculateTargetAngles(
  evaluation: PostureEvaluation,
  config: DecisionEngineConfig
): number[] {
  const { neutralAngle, maxPushAngle, minRelaxAngle } = config;
  const { metrics, isSlouching, isHeadForward } = evaluation;

  // Start with all servos at neutral (90 deg / flat)
  const targets = Array(6).fill(neutralAngle);

  // Set multipliers based on intensity modes
  let modeFactor = 1.0;
  switch (config.mode) {
    case "Relax":
      modeFactor = 0.5; // Very soft corrections
      break;
    case "Study":
      modeFactor = 0.8; // Gentle, steady support
      break;
    case "Office":
      modeFactor = 1.0; // Balanced standard
      break;
    case "Gaming":
      modeFactor = 1.3; // Responsive, firm correction
      break;
  }

  // Set multipliers based on support preference level
  let supportFactor = 1.0;
  switch (config.supportLevel) {
    case "Low":
      supportFactor = 0.7;
      break;
    case "Medium":
      supportFactor = 1.0;
      break;
    case "High":
      supportFactor = 1.4;
      break;
  }

  const finalFactor = modeFactor * supportFactor;

  // Let's analyze and correct each spine zone:
  
  // 1. Upper Thoracic (Module 1 - Index 0) & Lower Thoracic (Module 2 - Index 1)
  // Corrects forward head / rounded shoulders.
  // Pushes out thoracic support to encourage shoulder retraction and neck alignment.
  if (isHeadForward) {
    const headDeviation = Math.max(0, evaluation.metrics.forwardHeadOffset);
    // Push upper modules forward
    const correction1 = headDeviation * 40 * finalFactor;
    targets[0] = Math.min(maxPushAngle, neutralAngle + correction1);
    
    const correction2 = headDeviation * 30 * finalFactor;
    targets[1] = Math.min(maxPushAngle, neutralAngle + correction2);
  }

  // 2. Mid Lumbar (Modules 3 & 4 - Indices 2 & 3)
  // Corrects general back slouch/rounding.
  if (isSlouching) {
    // Slouch score indicates how compressed the spine is.
    // Scale correction by how far the slouch goes
    const slouchAmount = Math.max(0, 100 - evaluation.overallScore);
    const correction = (slouchAmount / 100) * 45 * finalFactor;

    targets[2] = Math.min(maxPushAngle, neutralAngle + correction);
    targets[3] = Math.min(maxPushAngle, neutralAngle + correction);
  }

  // 3. Lower Lumbar & Pelvic support (Modules 5 & 6 - Indices 4 & 5)
  // Continual base lumbar support depending on user-selected comfort profile,
  // flexing slightly more if slouching persists.
  let baselineLumbarSupport = 0;
  if (config.supportLevel === "Low") baselineLumbarSupport = 5;
  if (config.supportLevel === "Medium") baselineLumbarSupport = 12;
  if (config.supportLevel === "High") baselineLumbarSupport = 22;

  targets[4] = neutralAngle + (baselineLumbarSupport * modeFactor);
  targets[5] = neutralAngle + ((baselineLumbarSupport / 2) * modeFactor);

  if (isSlouching) {
    // Add additional support active flex under slouching
    targets[4] = Math.min(maxPushAngle, targets[4] + (15 * finalFactor));
    targets[5] = Math.min(maxPushAngle, targets[5] + (10 * finalFactor));
  }

  // Ensure all values are integer rounded and clamped to safe mechanical limits
  return targets.map(val => {
    const clamped = Math.max(minRelaxAngle, Math.min(maxPushAngle, val));
    return Math.round(clamped);
  });
}
