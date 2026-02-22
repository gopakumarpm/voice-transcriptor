export interface AudioFile {
  id: string;
  name: string;
  blob: Blob;
  mimeType: string;
  size: number;
  duration: number;
  sampleRate?: number;
  channels?: number;
  createdAt: number;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2 | 2.5 | 3;
