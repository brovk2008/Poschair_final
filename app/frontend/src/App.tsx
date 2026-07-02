import React, { useState, useEffect, useRef } from 'react';
import { 
  Bluetooth, 
  BluetoothConnected, 
  Camera, 
  Activity, 
  Settings, 
  Award, 
  RefreshCw, 
  BatteryCharging, 
  ChevronRight, 
  Sliders, 
  Gamepad2, 
  Briefcase, 
  BookOpen, 
  Coffee,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { bleManager, DeviceStatus } from './bleManager';
import { poseDetector } from './poseDetector';
import { analyzePosture, PostureEvaluation, PostureMetrics } from './postureAnalyzer';
import { calculateTargetAngles, DecisionEngineConfig, IntensityMode } from './decisionEngine';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  // State variables
  const [bleStatus, setBleStatus] = useState<DeviceStatus>({
    connected: false,
    failsafeActive: false,
    batteryMv: 0,
    currentAngles: [90, 90, 90, 90, 90, 90]
  });

  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  // Calibration states
  const [calibration, setCalibration] = useState<PostureMetrics | undefined>(undefined);
  const [calibratingState, setCalibratingState] = useState<'none' | 'baseline' | 'correct'>('none');
  const [calibrationCountdown, setCalibrationCountdown] = useState(0);
  const calibrationFrames = useRef<PostureMetrics[]>([]);

  // User Profile
  const [profile, setProfile] = useState({
    username: 'default_user',
    heightCm: 175,
    chairType: 'Ergonomic Chair',
    supportLevel: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  // Decision & Mode settings
  const [mode, setMode] = useState<IntensityMode>('Office');
  const [targetAngles, setTargetAngles] = useState<number[]>([90, 90, 90, 90, 90, 90]);

  // Session Tracking
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [goodTime, setGoodTime] = useState(0);
  const [badTime, setBadTime] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<PostureEvaluation | null>(null);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastWriteTime = useRef<number>(0);

  // 1. Fetch user profile & calibration from API on startup
  useEffect(() => {
    async function loadData() {
      try {
        const profRes = await fetch(`${API_BASE_URL}/profile`);
        if (profRes.ok) {
          const profData = await profRes.json();
          setProfile({
            username: profData.username,
            heightCm: profData.height_cm || 175,
            chairType: profData.chair_type || 'Standard Office',
            supportLevel: profData.support_level as 'Low' | 'Medium' | 'High'
          });
        }

        const calRes = await fetch(`${API_BASE_URL}/calibration`);
        if (calRes.ok) {
          const calData = await calRes.json();
          if (calData.shoulder_tilt_baseline !== 0) {
            setCalibration({
              shoulderTilt: calData.shoulder_tilt_baseline,
              spineAngle: calData.spine_angle_baseline,
              neckAngle: calData.neck_angle_baseline,
              forwardHeadOffset: calData.forward_head_baseline,
              slouchFactor: calData.slouch_factor_baseline || calData.spine_angle_baseline || 1.3
            });
          }
        }

        const logsRes = await fetch(`${API_BASE_URL}/sessions`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setSessionLogs(logsData);
        }
      } catch (err) {
        console.warn("FastAPI backend is offline. Operating in local-only/mock database mode.", err);
      }
    }
    loadData();
  }, []);

  // 2. Subscribe to BLE updates
  useEffect(() => {
    const handleStatus = (status: DeviceStatus) => {
      setBleStatus(status);
    };
    bleManager.addStatusListener(handleStatus);
    return () => {
      bleManager.removeStatusListener(handleStatus);
    };
  }, []);

  // 3. Pose detection handler callback
  const handlePoseLandmarks = (result: any) => {
    if (!result || !result.landmarks || result.landmarks.length === 0) return;

    const landmarks = result.landmarks[0];
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Draw Skeleton on Overlay Canvas
    drawSkeleton(landmarks, canvas, video);

    // Compute Posture
    const evaluation = analyzePosture(landmarks, calibration);
    setCurrentEvaluation(evaluation);

    // If currently calibrating, accumulate metrics
    if (calibratingState !== 'none') {
      calibrationFrames.current.push(evaluation.metrics);
    }

    // Process closed-loop target angles
    if (sessionActive) {
      const config: DecisionEngineConfig = {
        mode,
        supportLevel: profile.supportLevel,
        neutralAngle: 90,
        maxPushAngle: 145,
        minRelaxAngle: 45
      };
      
      const newTargets = calculateTargetAngles(evaluation, config);
      setTargetAngles(newTargets);

      // Throttled BLE send (max 10Hz or 100ms interval)
      const now = performance.now();
      if (now - lastWriteTime.current >= 150) {
        lastWriteTime.current = now;
        if (bleManager.isConnected()) {
          bleManager.sendAngles(newTargets);
        }
      }
    }
  };

  // 4. Trigger Calibration process
  const startCalibration = (type: 'baseline' | 'correct') => {
    setCalibratingState(type);
    setCalibrationCountdown(5);
    calibrationFrames.current = [];
  };

  // Countdown timer for calibration
  useEffect(() => {
    if (calibrationCountdown <= 0) {
      if (calibratingState !== 'none') {
        saveCalibrationData();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCalibrationCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [calibrationCountdown, calibratingState]);

  const saveCalibrationData = async () => {
    const frames = calibrationFrames.current;
    if (frames.length === 0) {
      setCalibratingState('none');
      return;
    }

    // Calculate averages
    const avg = {
      shoulderTilt: frames.reduce((acc, f) => acc + f.shoulderTilt, 0) / frames.length,
      spineAngle: frames.reduce((acc, f) => acc + f.spineAngle, 0) / frames.length,
      neckAngle: frames.reduce((acc, f) => acc + f.neckAngle, 0) / frames.length,
      forwardHeadOffset: frames.reduce((acc, f) => acc + f.forwardHeadOffset, 0) / frames.length,
      slouchFactor: frames.reduce((acc, f) => acc + f.slouchFactor, 0) / frames.length,
    };

    if (calibratingState === 'baseline') {
      // Save slouch baseline
      const newCal = {
        ...calibration,
        shoulderTilt_baseline: avg.shoulderTilt,
        forwardHead_baseline: avg.forwardHeadOffset,
        spineAngle_baseline: avg.spineAngle,
        neckAngle_baseline: avg.neckAngle,
        slouchFactor_baseline: avg.slouchFactor
      } as any;
      setCalibration(prev => ({
        ...prev || { shoulderTilt: 0, spineAngle: 0, neckAngle: 0, forwardHeadOffset: 0, slouchFactor: 1.3 },
        ...avg
      }));
      postCalibrationToAPI(newCal);
    } else if (calibratingState === 'correct') {
      // Save target alignment
      const newCal = {
        ...calibration,
        shoulderTilt_correct: avg.shoulderTilt,
        forwardHead_correct: avg.forwardHeadOffset,
        spineAngle_correct: avg.spineAngle,
        neckAngle_correct: avg.neckAngle,
        slouchFactor_correct: avg.slouchFactor
      } as any;
      postCalibrationToAPI(newCal);
    }

    setCalibratingState('none');
  };

  const postCalibrationToAPI = async (cal: any) => {
    try {
      await fetch(`${API_BASE_URL}/calibration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shoulder_tilt_baseline: cal.shoulderTilt_baseline || 0,
          forward_head_baseline: cal.forwardHead_baseline || 0,
          spine_angle_baseline: cal.spineAngle_baseline || 0,
          neck_angle_baseline: cal.neckAngle_baseline || 0,
          shoulder_tilt_correct: cal.shoulderTilt_correct || 0,
          forward_head_correct: cal.forwardHead_correct || 0,
          spine_angle_correct: cal.spineAngle_correct || 0,
          neck_angle_correct: cal.neckAngle_correct || 0
        })
      });
    } catch (err) {
      console.warn("Backend unavailable to save calibration.");
    }
  };

  // 5. Track posture timer (good vs bad)
  useEffect(() => {
    if (!sessionActive || !currentEvaluation) return;

    const timer = setInterval(() => {
      if (currentEvaluation.overallScore >= 70) {
        setGoodTime(prev => prev + 1);
      } else {
        setBadTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionActive, currentEvaluation]);

  // 6. BLE Connect/Disconnect Actions
  const toggleBle = async () => {
    if (bleStatus.connected) {
      bleManager.disconnect();
    } else {
      try {
        setIsBleConnecting(true);
        await bleManager.connect();
      } catch (err) {
        alert("Failed to connect: " + (err as Error).message);
      } finally {
        setIsBleConnecting(false);
      }
    }
  };

  // 7. Toggle camera/MediaPipe
  const toggleCamera = async () => {
    if (cameraActive) {
      // Stop Camera
      poseDetector.stopDetectionLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCurrentEvaluation(null);
    } else {
      // Start Camera
      try {
        setIsModelLoading(true);
        await poseDetector.initialize();
        setModelLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
          poseDetector.registerCallback(handlePoseLandmarks);
          poseDetector.startDetectionLoop(videoRef.current);
        }
      } catch (err) {
        alert("Error enabling camera: " + (err as Error).message);
      } finally {
        setIsModelLoading(false);
      }
    }
  };

  // 8. Start/Stop Monitoring Session
  const toggleSession = async () => {
    if (sessionActive) {
      // Stop & log to API
      const duration = goodTime + badTime;
      const sessionData = {
        start_time: sessionStartTime?.toISOString() || new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: duration,
        good_posture_seconds: goodTime,
        bad_posture_seconds: badTime,
        slouch_count: currentEvaluation?.isSlouching ? 1 : 0, // Simplified counts
        forward_head_count: currentEvaluation?.isHeadForward ? 1 : 0,
        lean_left_right_count: (currentEvaluation?.isLeaningLeft || currentEvaluation?.isLeaningRight) ? 1 : 0,
        history_json: []
      };

      try {
        const res = await fetch(`${API_BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });
        if (res.ok) {
          const freshLogs = await fetch(`${API_BASE_URL}/sessions`);
          if (freshLogs.ok) {
            setSessionLogs(await freshLogs.json());
          }
        }
      } catch (err) {
        console.warn("Failed to log session data online.");
      }

      setSessionActive(false);
      // Reset angles to neutral
      if (bleManager.isConnected()) {
        bleManager.sendAngles([90, 90, 90, 90, 90, 90]);
      }
    } else {
      // Start
      setGoodTime(0);
      setBadTime(0);
      setSessionStartTime(new Date());
      setSessionActive(true);
    }
  };

  // Draw cyber skeleton points on canvas
  const drawSkeleton = (landmarks: any[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set scale based on actual canvas size
    const w = canvas.width;
    const h = canvas.height;

    // Helper to project landmark coordinates
    const project = (lm: any) => ({
      x: lm.x * w,
      y: lm.y * h
    });

    // Draw connection lines with glowing colors
    const drawLine = (lmA: any, lmB: any, color: string, width: number) => {
      const ptA = project(lmA);
      const ptB = project(lmB);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const nose = landmarks[0];
    const lEar = landmarks[7];
    const rEar = landmarks[8];
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];

    // Connections
    drawLine(lEar, rEar, 'hsla(190, 100%, 50%, 0.4)', 2);
    drawLine(lShoulder, rShoulder, 'hsl(190, 100%, 50%)', 4);
    drawLine(lHip, rHip, 'hsl(263, 100%, 65%)', 4);
    
    // Spine
    const midShoulder = { x: (lShoulder.x + rShoulder.x)/2, y: (lShoulder.y + rShoulder.y)/2 };
    const midHip = { x: (lHip.x + rHip.x)/2, y: (lHip.y + rHip.y)/2 };
    drawLine(midShoulder, midHip, 'linear-gradient(to bottom, #00e5ff, #a855f7)', 5);
    drawLine(nose, midShoulder, 'hsla(190, 100%, 50%, 0.8)', 3);

    // Draw node dots
    const drawNode = (lm: any, color: string, radius: number) => {
      const pt = project(lm);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    };

    drawNode(nose, 'hsl(350, 85%, 60%)', 6);
    drawNode(lShoulder, 'hsl(190, 100%, 50%)', 8);
    drawNode(rShoulder, 'hsl(190, 100%, 50%)', 8);
    drawNode(lHip, 'hsl(263, 100%, 65%)', 8);
    drawNode(rHip, 'hsl(263, 100%, 65%)', 8);
  };

  // Get color based on posture score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-cyan)';
    if (score >= 50) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header bar */}
      <header className="glass-panel" style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: '0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', color: 'var(--bg-dark)' }}>
            P
          </div>
          <div>
            <h1 style={{ fontSize: '20px', letterSpacing: '0.05em' }}>POS<span style={{ color: 'var(--accent-cyan)' }}>CHAIR</span></h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AI-Powered Spine Corrector</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Battery Status */}
          {bleStatus.connected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'hsla(222, 47%, 15%, 0.6)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
              <BatteryCharging size={14} className="pulsing-glow" style={{ color: 'var(--accent-green)' }} />
              <span>{Math.round(((bleStatus.batteryMv - 3300) / 900) * 100)}%</span>
            </div>
          )}

          {/* BLE connection badge */}
          <button onClick={toggleBle} className={`btn ${bleStatus.connected ? 'btn-success' : 'btn-secondary'}`} disabled={isBleConnecting}>
            {isBleConnecting ? (
              <RefreshCw size={16} className="pulsing-glow" style={{ animation: 'spin 2s linear infinite' }} />
            ) : bleStatus.connected ? (
              <BluetoothConnected size={16} />
            ) : (
              <Bluetooth size={16} />
            )}
            <span>
              {isBleConnecting ? "Connecting..." : bleStatus.connected ? "Connected" : "Connect Chair"}
            </span>
          </button>

          {/* Camera Button */}
          <button onClick={toggleCamera} className={`btn ${cameraActive ? 'btn-primary' : 'btn-secondary'}`} disabled={isModelLoading}>
            {isModelLoading ? (
              <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
            ) : (
              <Camera size={16} />
            )}
            <span>{cameraActive ? "Stop Camera" : "Enable Tracking"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Cam & Evaluation */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Video Feed Panel */}
          <div className="glass-panel" style={{ position: 'relative' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} style={{ color: 'var(--accent-cyan)' }} />
              Live Posture Camera
            </h3>
            
            <div className="camera-wrapper">
              {cameraActive ? (
                <>
                  <video ref={videoRef} className="camera-feed" muted playsInline />
                  <canvas ref={canvasRef} width="640" height="480" className="overlay-canvas" />
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                  <Camera size={48} />
                  <p>Click "Enable Tracking" to activate your camera and begin pose analysis.</p>
                </div>
              )}

              {/* Calibration overlay */}
              {calibratingState !== 'none' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(7, 13, 28, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', z-index: 10 }}>
                  <div style={{ border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', width: '48px', height: '48px', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <h2 style={{ fontSize: '24px', color: 'var(--accent-cyan)' }}>
                    Calibrating {calibratingState === 'baseline' ? 'Slouch Position' : 'Optimal Alignment'}...
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Maintain target posture. Capturing frame sample: {calibrationCountdown}s</p>
                </div>
              )}
            </div>

            {/* Calibration Controls */}
            {cameraActive && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <button onClick={() => startCalibration('baseline')} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  <RefreshCw size={16} />
                  <span>Calibrate Slouch (Baseline)</span>
                </button>
                <button onClick={() => startCalibration('correct')} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  <CheckCircle size={16} />
                  <span>Calibrate Perfect Alignment</span>
                </button>
              </div>
            )}
          </div>

          {/* Session Summary / Score Panel */}
          <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'center' }}>
            
            {/* Posture Score Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--color-border)', paddingRight: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Posture Integrity
              </span>
              <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsla(217, 30%, 20%, 0.5)" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke={getScoreColor(currentEvaluation?.overallScore || 100)} 
                    strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDasharray-offset={2 * Math.PI * 40 * (1 - (currentEvaluation?.overallScore || 100) / 100)}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (currentEvaluation?.overallScore || 100) / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                    {currentEvaluation ? currentEvaluation.overallScore : 100}
                  </span>
                </div>
              </div>
            </div>

            {/* Timers */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', borderRight: '1px solid var(--color-border)', paddingRight: '20px', paddingLeft: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session Clock
              </span>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {goodTime + badTime > 0 
                  ? `${Math.floor((goodTime+badTime)/60).toString().padStart(2,'0')}:${((goodTime+badTime)%60).toString().padStart(2,'0')}` 
                  : "00:00"
                }
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>Good: {goodTime}s</span>
                <span style={{ color: 'var(--accent-red)' }}>Bad: {badTime}s</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '10px' }}>
              <button 
                onClick={toggleSession} 
                className={`btn ${sessionActive ? 'btn-secondary' : 'btn-primary'}`} 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!cameraActive}
              >
                <Activity size={16} />
                <span>{sessionActive ? "Stop Session" : "Start Monitoring"}</span>
              </button>
              
              {currentEvaluation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: currentEvaluation.overallScore >= 70 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {currentEvaluation.overallScore >= 70 ? (
                    <>
                      <CheckCircle size={14} />
                      <span>Posture Aligned</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="pulsing-glow" />
                      <span>
                        {currentEvaluation.isSlouching ? "Slouching Detected" : currentEvaluation.isHeadForward ? "Forward Head Lean" : "Re-align Spine"}
                      </span>
                    </>
                  )}
                </div>
              )}
              {currentEvaluation && (currentEvaluation.isLeaningLeft || currentEvaluation.isLeaningRight) && (
                <div style={{ gridColumn: 'span 3', marginTop: '12px', background: 'hsla(32, 95%, 55%, 0.1)', border: '1px solid var(--accent-orange)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--accent-orange)' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Lateral Lean Detected:</strong> The mechanical spine has a single-column actuator stack to correct forward slumps. Please align yourself horizontally to center.
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Spine Visualizer & Config */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Digital Spine Visualizer */}
          <div className="glass-panel glass-panel-glow">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
              Spine Actuators
            </h3>
            
            <div className="spine-container">
              <div className="spine-backbone" />

              {/* Six mechanical modules */}
              {[
                { name: "Upper Thoracic (1)", idx: 0 },
                { name: "Lower Thoracic (2)", idx: 1 },
                { name: "Upper Lumbar (3)", idx: 2 },
                { name: "Lower Lumbar (4)", idx: 3 },
                { name: "Lumbar Flex (5)", idx: 4 },
                { name: "Pelvic Base (6)", idx: 5 }
              ].map((vertebra) => {
                const target = targetAngles[vertebra.idx];
                const current = bleStatus.connected ? bleStatus.currentAngles[vertebra.idx] : target;
                const percentage = Math.round(((target - 45) / 100) * 100);

                return (
                  <div key={vertebra.idx} className={`spine-vertebra ${target !== 90 ? 'active' : ''}`}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{vertebra.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Cmd: {target}° | Real: {current}°
                      </span>
                    </div>
                    <div className="vertebra-bar">
                      <div 
                        className="vertebra-fill" 
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} 
                      />
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Mode Configuration Settings */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: 'var(--accent-violet)' }} />
              Support Profile
            </h3>

            {/* Mode selection buttons */}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Target Mode
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { name: "Office", icon: <Briefcase size={14} /> },
                  { name: "Gaming", icon: <Gamepad2 size={14} /> },
                  { name: "Study", icon: <BookOpen size={14} /> },
                  { name: "Relax", icon: <Coffee size={14} /> }
                ].map((item) => (
                  <button 
                    key={item.name} 
                    onClick={() => setMode(item.name as IntensityMode)} 
                    className={`btn ${mode === item.name ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 12px', fontSize: '12px', justifyContent: 'center' }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Details Form */}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Profile Intensity
              </span>
              <select 
                value={profile.supportLevel} 
                onChange={(e) => setProfile(prev => ({ ...prev, supportLevel: e.target.value as any }))}
                style={{ width: '100%', background: 'hsla(222, 47%, 15%, 0.8)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '10px', fontSize: '13px', outline: 'none' }}
              >
                <option value="Low">Low Tension (Soft comfort)</option>
                <option value="Medium">Medium Tension (Balanced correction)</option>
                <option value="High">High Tension (Firm spinal correction)</option>
              </select>
            </div>
            
            {/* Calibration Alert */}
            {!calibration && (
              <div style={{ background: 'hsla(32, 95%, 55%, 0.1)', border: '1px solid var(--accent-orange)', borderRadius: '8px', padding: '12px', display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--accent-orange)' }}>
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Calibration Required:</strong> Position thresholds are uncalibrated. Complete calibration to activate posture correction triggers.
                </span>
              </div>
            )}

          </div>

        </div>
      </div>
      
      {/* Session History Analytics Table */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        <div className="glass-panel col-12">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent-cyan)' }} />
            Session History Log
          </h3>
          {sessionLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No session logs saved yet. Complete a monitoring session to save logs.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Total Duration</th>
                    <th style={{ padding: '12px' }}>Aligned Posture</th>
                    <th style={{ padding: '12px' }}>Slouches Detected</th>
                    <th style={{ padding: '12px' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionLogs.map((log) => {
                    const durationMin = Math.round(log.duration_seconds / 60);
                    const goodPct = log.duration_seconds > 0 ? Math.round((log.good_posture_seconds / log.duration_seconds) * 100) : 100;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid hsla(217, 30%, 15%, 0.6)' }}>
                        <td style={{ padding: '12px' }}>{new Date(log.start_time).toLocaleDateString()} {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '12px' }}>{durationMin} min ({log.duration_seconds}s)</td>
                        <td style={{ padding: '12px', color: goodPct >= 70 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>{goodPct}%</td>
                        <td style={{ padding: '12px' }}>{log.slouch_count}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{goodPct} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
