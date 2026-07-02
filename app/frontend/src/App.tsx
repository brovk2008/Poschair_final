import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bluetooth, RefreshCw, Activity, Award, Sliders, CheckCircle, AlertTriangle } from 'lucide-react';
import { createBLEManager, StatusData } from './bleManager';
import { LandmarkList } from './poseDetector';
import { analyzePose, CalibrationBaseline, PostureData } from './postureAnalyzer';
import { computeTargetAngles, isLateralLean, Mode } from './decisionEngine';
import { 
  getProfile, 
  createProfile, 
  getSessions, 
  getCalibration, 
  saveCalibration as saveCalToApi, 
  logSession 
} from './apiClient';

// Import components
import { CameraView } from './components/CameraView';
import { SpineVisualizer } from './components/SpineVisualizer';
import { CalibrationModal } from './components/CalibrationModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BLEStatusBar } from './components/BLEStatusBar';
import { ModeSelector } from './components/ModeSelector';
import { LateralLeanAlert } from './components/LateralLeanAlert';

export default function App() {
  const [userId, setUserId] = useState<number | null>(1);
  const [mode, setMode] = useState<Mode>('office');
  
  // BLE states
  const [bleConnected, setBleConnected] = useState(false);
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [bleStatus, setBleStatus] = useState<StatusData | null>(null);
  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null);
  
  // System states
  const [isTracking, setIsTracking] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [baseline, setBaseline] = useState<CalibrationBaseline | null>(null);
  const [latestPosture, setLatestPosture] = useState<PostureData | null>(null);
  const [targetAngles, setTargetAngles] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [currentLandmarks, setCurrentLandmarks] = useState<LandmarkList | null>(null);

  // Session stats
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionScoreHistory, setSessionScoreHistory] = useState<{ t: number; score: number }[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  // Instantiate BLE manager
  const bleManager = useMemo(() => createBLEManager(), []);

  // Hook BLE status listeners
  useEffect(() => {
    bleManager.onStatus = (status) => {
      setBleStatus(status);
      setBleConnected(true);
      setLastPacketTime(Date.now());
    };
    bleManager.onDisconnect = () => {
      setBleConnected(false);
      setBleStatus(null);
    };
  }, [bleManager]);

  // Load user data on startup
  useEffect(() => {
    async function loadData() {
      try {
        let user = await getProfile(1);
        if (!user || user.detail) {
          user = await createProfile("User", 175, "office");
        }
        setUserId(user.id);
        setMode(user.mode as Mode);

        // Fetch past sessions
        const logs = await getSessions(user.id);
        setPastSessions(logs || []);

        // Fetch calibration
        const cal = await getCalibration(user.id);
        if (cal && !cal.detail) {
          setBaseline({
            spineAngle0: cal.spine_angle_0,
            shoulderWidth: cal.shoulder_width
          });
        }
      } catch (err) {
        console.warn("FastAPI backend is offline. Using local storage / fallback values.");
      }
    }
    loadData();
  }, []);

  // Frame processing
  const lastSendTime = useRef<number>(0);
  const handleLandmarks = (landmarks: LandmarkList) => {
    setCurrentLandmarks(landmarks);
    
    // Analyze pose relative to baseline
    const posture = analyzePose(landmarks, baseline);
    setLatestPosture(posture);

    // Compute target angles for the 6 actuators
    const angles = computeTargetAngles(posture, mode);
    setTargetAngles(angles);

    // Throttled BLE send
    const now = Date.now();
    if (now - lastSendTime.current >= 100) {
      lastSendTime.current = now;
      if (bleConnected) {
        bleManager.sendAngles(angles);
      }
    }

    // Capture score history if session is active
    if (sessionStartTime) {
      setSessionScoreHistory(prev => {
        const next = [...prev, { t: Date.now(), score: posture.postureScore }];
        return next.slice(-60); // Keep last 60 samples
      });
    }
  };

  const handleCalibrated = async (newBaseline: CalibrationBaseline) => {
    setBaseline(newBaseline);
    if (userId) {
      try {
        await saveCalToApi(userId, newBaseline.spineAngle0, newBaseline.shoulderWidth);
      } catch (err) {
        console.warn("Unable to save calibration to backend database.");
      }
    }
  };

  const toggleBLE = async () => {
    if (bleConnected) {
      bleManager.disconnect();
    } else {
      try {
        setIsBleConnecting(true);
        await bleManager.connect();
      } catch (err) {
        alert("Web Bluetooth connection failed: " + (err as Error).message);
      } finally {
        setIsBleConnecting(false);
      }
    }
  };

  const startSession = () => {
    setSessionStartTime(Date.now());
    setSessionScoreHistory([]);
  };

  const endSession = async () => {
    if (!sessionStartTime || sessionScoreHistory.length === 0) {
      setSessionStartTime(null);
      return;
    }

    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    const scores = sessionScoreHistory.map(h => h.score);
    const avgScore = scores.reduce((s, val) => s + val, 0) / scores.length;
    const goodCount = scores.filter(s => s >= 75).length;
    const goodPct = (goodCount / scores.length) * 100;

    if (userId) {
      try {
        await logSession(userId, avgScore, goodPct, 100 - goodPct, sessionScoreHistory);
        const refreshed = await getSessions(userId);
        setPastSessions(refreshed || []);
      } catch (err) {
        console.warn("Backend logs write failed.");
      }
    }

    setSessionStartTime(null);
    setSessionScoreHistory([]);
    setTargetAngles([0, 0, 0, 0, 0, 0]);
    if (bleConnected) {
      bleManager.sendAngles([0, 0, 0, 0, 0, 0]);
    }
  };

  const handleManualAngleChange = (idx: number, val: number) => {
    const next = [...targetAngles];
    next[idx] = val;
    setTargetAngles(next);
    if (bleConnected) {
      bleManager.sendAngles(next);
    }
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
          {bleConnected && bleStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--accent-green)' }}>Battery: {Math.max(0, Math.min(100, Math.round(((bleStatus.batteryMv - 3000) / 1200) * 100)))}%</span>
            </div>
          )}

          {/* Connect button */}
          <button onClick={toggleBLE} className={`btn ${bleConnected ? 'btn-success' : 'btn-secondary'}`} disabled={isBleConnecting}>
            {isBleConnecting ? (
              <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
            ) : (
              <Bluetooth size={16} />
            )}
            <span>{isBleConnecting ? "Connecting..." : bleConnected ? "Connected" : "Connect Chair"}</span>
          </button>

          {/* Camera Button */}
          <button onClick={() => setIsTracking(!isTracking)} className={`btn ${isTracking ? 'btn-primary' : 'btn-secondary'}`}>
            <span>{isTracking ? "Stop Camera" : "Enable Tracking"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <CameraView 
            isTracking={isTracking} 
            score={latestPosture ? latestPosture.postureScore : 100} 
            onLandmarks={handleLandmarks} 
          />

          <LateralLeanAlert posture={latestPosture} />

          {/* Calibration & Session Clock Controls */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCalibrating(true)} className="btn btn-secondary" disabled={!isTracking}>
                Calibrate Baseline
              </button>
              
              <button 
                onClick={sessionStartTime ? endSession : startSession} 
                className={`btn ${sessionStartTime ? 'btn-secondary' : 'btn-primary'}`}
                disabled={!isTracking}
              >
                {sessionStartTime ? "End Monitoring" : "Start Session"}
              </button>
            </div>

            {sessionStartTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} className="pulsing-glow" style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Session Clock Activeing</span>
              </div>
            )}
          </div>

          <AnalyticsDashboard 
            sessionScoreHistory={sessionScoreHistory} 
            pastSessions={pastSessions} 
          />

        </div>

        {/* Right Column */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <SpineVisualizer 
            targetAngles={targetAngles} 
            currentAngles={bleConnected && bleStatus ? bleStatus.currentAngles : targetAngles} 
          />

          <ModeSelector 
            currentMode={mode} 
            onChange={(m) => setMode(m)} 
          />

          {/* Manual controls override when tracking is off */}
          {!isTracking && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--accent-cyan)' }} />
                Manual Servos Command
              </h3>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Module {idx + 1} angle</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="70" 
                    value={targetAngles[idx] || 0}
                    onChange={(e) => handleManualAngleChange(idx, parseInt(e.target.value))}
                    className="custom-range" 
                  />
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      <BLEStatusBar 
        bleConnected={bleConnected} 
        bleStatus={bleStatus} 
        lastPacketTime={lastPacketTime} 
      />

      <CalibrationModal 
        isOpen={calibrating} 
        onClose={() => setCalibrating(false)} 
        currentPosture={latestPosture} 
        currentLandmarks={currentLandmarks} 
        onCalibrated={handleCalibrated} 
      />

    </div>
  );
}
