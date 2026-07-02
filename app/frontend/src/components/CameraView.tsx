import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { LandmarkList, PoseDetector } from '../poseDetector';

interface CameraViewProps {
  isTracking: boolean;
  score: number;
  onLandmarks: (landmarks: LandmarkList) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ isTracking, score, onLandmarks }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (isTracking) {
        try {
          const detector = new PoseDetector();
          await detector.init();
          detectorRef.current = detector;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          console.error("Camera permissions / model failed to load", err);
        }
      } else {
        stopCamera();
      }
    }
    setupCamera();

    return () => stopCamera();
  }, [isTracking]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isTracking) return;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (video && canvas && detector && video.readyState >= 2) {
        const landmarks = detector.detect(video);
        if (landmarks) {
          onLandmarks(landmarks);
          drawOverlay(landmarks, canvas);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isTracking, onLandmarks]);

  const drawOverlay = (landmarks: LandmarkList, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    const project = (lm: any) => ({
      x: lm.x * w,
      y: lm.y * h,
    });

    const drawLine = (lmA: any, lmB: any, strokeColor: string, width: number) => {
      const ptA = project(lmA);
      const ptB = project(lmB);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const NOSE = 0, L_SHOULDER = 11, R_SHOULDER = 12, L_HIP = 23, R_HIP = 24;
    const nose = landmarks[NOSE];
    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const lHp = landmarks[L_HIP];
    const rHp = landmarks[R_HIP];

    const midShoulder = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
    const midHip = { x: (lHp.x + rHp.x) / 2, y: (lHp.y + rHp.y) / 2 };

    // Select color based on posture integrity score
    let color = 'hsl(142, 70%, 50%)'; // green
    if (score < 50) color = 'hsl(350, 85%, 60%)'; // red
    else if (score < 75) color = 'hsl(32, 95%, 55%)'; // yellow

    // Draw Skeleton Lines
    drawLine(lSh, rSh, 'rgba(255,255,255,0.3)', 2);
    drawLine(lHp, rHp, 'rgba(255,255,255,0.3)', 2);
    drawLine(midShoulder, midHip, color, 6);
    drawLine(nose, midShoulder, color, 3);

    // Draw Joint Nodes
    const drawNode = (lm: any, nodeColor: string, r: number) => {
      const pt = project(lm);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    };

    drawNode(nose, 'hsl(190, 100%, 50%)', 6);
    drawNode(lSh, 'hsl(190, 100%, 50%)', 7);
    drawNode(rSh, 'hsl(190, 100%, 50%)', 7);
    drawNode(lHp, 'hsl(263, 100%, 65%)', 7);
    drawNode(rHp, 'hsl(263, 100%, 65%)', 7);
  };

  return (
    <div className="glass-panel" style={{ position: 'relative' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={18} style={{ color: 'var(--accent-cyan)' }} />
        Live Posture Video
      </h3>

      <div className="camera-wrapper" style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
        {isTracking ? (
          <>
            <video ref={videoRef} className="camera-feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            <canvas ref={canvasRef} width="640" height="480" className="overlay-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(7, 13, 28, 0.7)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: score >= 75 ? 'var(--accent-cyan)' : score >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                {score}
              </span>
            </div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
            <Camera size={48} />
            <p>Click "Enable Tracking" to activate your camera.</p>
          </div>
        )}
      </div>
    </div>
  );
};
