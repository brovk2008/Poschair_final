import {
  PoseLandmarker,
  FilesetResolver,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type LandmarkList = { x: number; y: number; z: number; visibility?: number }[];

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  }

  detect(video: HTMLVideoElement): LandmarkList | null {
    if (!this.landmarker || video.readyState < 2) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;

    const result: PoseLandmarkerResult = this.landmarker.detectForVideo(
      video,
      performance.now()
    );
    return result.landmarks?.[0] ?? null;
  }
}
