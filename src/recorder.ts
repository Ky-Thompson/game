import { uploadVideo } from './firebase';

interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: integer): MediaStream;
}

enum MediaTypes {
  WebM = 'video/webm',
  WebM_VP9 = 'video/webm,codecs=vp9',
  VP8 = 'video/vp8',
  WebM_VP8 = 'video/webm;codecs=vp8',
  WebM_Daala = 'video/webm;codecs=daala',
  H264 = 'video/webm;codecs=h264',
  MPEG = 'video/mpeg',
}

interface MediaRecorderOptions {
  mimeType: MediaTypes;
  videoBitsPerSecond: integer;
}

declare class MediaRecorder {
  static isTypeSupported(type: MediaTypes): boolean;

  constructor(stream: MediaStream, options?: MediaRecorderOptions);

  start(timeSlice?: integer): void;
  stop(): void;

  onstop: () => void;
  ondataavailable: (event) => void;
}

class CanvasRecorder {
  private static readonly VIDEO_BITS_PER_SECOND = 6000000; // 6Mbps
  private static readonly FPS = 30;
  private static readonly TIME_SLICE = 100;

  private stream: MediaStream;
  private video: HTMLVideoElement;
  private type: MediaTypes;
  private mediaRecorder: MediaRecorder;
  private recordedBlobs: BlobPart[];
  private recording: boolean;

  constructor(canvas: CanvasElement, audioContext?: AudioContext) {
    // Get the stream
    try {
      this.stream = canvas.captureStream(CanvasRecorder.FPS);
    } catch (e) {
      return;
    }

    // Generate the video
    this.video = document.createElement('video');
    this.video.style.display = 'none';

    // Get supported type
    for (let key in MediaTypes) {
      const type: MediaTypes = MediaTypes[key] as MediaTypes;
      if (MediaRecorder.isTypeSupported(type)) {
        this.type = type;
        break;
      }
    }

    if (!this.type) {
      return;
    }

    // Add audio track

    try {
      const audioDest: MediaStreamAudioDestinationNode = audioContext.createMediaStreamDestination();
      const audioTrack: MediaStreamTrack = audioDest.stream.getAudioTracks()[0];

      if (audioTrack) {
        // this.stream.addTrack(audioTrack);
      }
    } catch (e) {}

    // Get the media recorder
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.type,
        videoBitsPerSecond: CanvasRecorder.VIDEO_BITS_PER_SECOND,
      });

      this.mediaRecorder.ondataavailable = (event) => this.handleDataAvailable(event);
    } catch (e) {
      return;
    }
  }

  private handleDataAvailable(event: any) {
    if (event.data && event.data.size > 0) {
      this.recordedBlobs.push(event.data);
    }
  }

  get blob(): Blob {
    return new Blob(this.recordedBlobs, { type: this.type });
  }

  start() {
    if (!this.mediaRecorder || this.recording) {
      return;
    }

    this.recordedBlobs = [];
    this.mediaRecorder.start(CanvasRecorder.TIME_SLICE);
    this.recording = true;
  }

  stop() {
    if (!this.mediaRecorder || !this.recording) {
      return;
    }

    this.mediaRecorder.stop();
    this.recording = false;
  }

  download(filename: string = 'recording.webm') {
    if (!this.mediaRecorder) {
      return;
    }

    this.stop();

    const url = window.URL.createObjectURL(this.blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

let recorder: CanvasRecorder;

export function createMediaRecorder(parentId: string, audioContext?: AudioContext) {
  recorder = new CanvasRecorder(document.querySelector(`#${parentId} canvas`) as CanvasElement, audioContext);
}

export function startRecording() {
  if (!recorder) {
    return;
  }

  recorder.start();
}

export function stopRecording() {
  if (!recorder) {
    return;
  }

  recorder.stop();
}

export async function uploadRecording(displayName: string) {
  if (!recorder) {
    return;
  }

  recorder.stop();
  uploadVideo(displayName, recorder.blob);
}
