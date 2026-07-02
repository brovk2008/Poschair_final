const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function createProfile(name: string, heightCm: number, mode: string) {
  const r = await fetch(`${BASE}/profile/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, height_cm: heightCm, mode }),
  });
  return r.json();
}

export async function getProfile(userId: number) {
  return (await fetch(`${BASE}/profile/${userId}`)).json();
}

export async function saveCalibration(userId: number, spineAngle0: number, lateralAngle0: number, shoulderWidth: number) {
  const r = await fetch(`${BASE}/calibration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, spine_angle_0: spineAngle0, lateral_angle_0: lateralAngle0, shoulder_width: shoulderWidth }),
  });
  return r.json();
}

export async function getCalibration(userId: number) {
  return (await fetch(`${BASE}/calibration/${userId}`)).json();
}

export async function logSession(userId: number, scoreAvg: number, pctGood: number, pctBad: number, scoreHistory: object[]) {
  const r = await fetch(`${BASE}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, score_avg: scoreAvg, pct_good: pctGood, pct_bad: pctBad, score_history: scoreHistory }),
  });
  return r.json();
}

export async function getSessions(userId: number) {
  return (await fetch(`${BASE}/sessions/${userId}`)).json();
}
