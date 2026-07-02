import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type PoseCallback = (results: PoseLandmarkerResult) => void;

class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private activeCallbacks: PoseCallback[] = [];
  private animationFrameId: number | null = null;

  public async initialize(): Promise<void> {
    if (this.poseLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    console.log("Loading MediaPipe WASM and Pose Model...");

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      console.log("MediaPipe Pose Landmarker successfully initialized.");
    } catch (error) {
      console.error("Failed to load MediaPipe Pose landmarker:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  public registerCallback(callback: PoseCallback) {
    this.activeCallbacks.push(callback);
  }

  public unregisterCallback(callback: PoseCallback) {
    this.activeCallbacks = this.activeCallbacks.filter(cb => cb !== callback);
  }

  public startDetectionLoop(videoElement: HTMLVideoElement) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!this.poseLandmarker || videoElement.paused || videoElement.ended) {
        this.animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const timestamp = performance.now();
      
      // Only detect if a new video frame is available
      if (videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;
        
        try {
          const result = this.poseLandmarker.detectForVideo(videoElement, timestamp);
          this.activeCallbacks.forEach(cb => cb(result));
        } catch (err) {
          console.error("Error during pose frame detection:", err);
        }
      }

      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  public stopDetectionLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public isLoaded(): boolean {
    return this.poseLandmarker !== null;
  }
}

export const poseDetector = new PoseDetector();
