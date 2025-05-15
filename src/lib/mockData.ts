
import { v4 as uuidv4 } from 'uuid';

export type Clip = {
  id: string;
  video_id: string;
  start_s: number;
  end_s: number;
  snippet: string;
  clip_url: string | null;
  status: "pending" | "rendering" | "complete" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

// Generate a few mock clips for testing
export const generateMockClips = (videoId: string): Clip[] => {
  return [
    {
      id: uuidv4(),
      video_id: videoId,
      start_s: 12,
      end_s: 42,
      snippet: "This is the first interesting segment of the video",
      clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      status: "complete",
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      video_id: videoId,
      start_s: 78,
      end_s: 120,
      snippet: "Here's another great point from this content",
      clip_url: null,
      status: "rendering",
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      video_id: videoId,
      start_s: 180,
      end_s: 210,
      snippet: "This part failed during processing",
      clip_url: null,
      status: "error",
      error_message: "Rendering failed: timeout exceeded",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

// Mock function to simulate a video status fetch
export const fetchVideoStatus = async (videoId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'complete' };
};

// Mock function to simulate clip retry
export const retryClipGeneration = async (clipId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

// Mock function to process video
export const processVideo = async ({ uploadFile, youtubeUrl }: { uploadFile?: File; youtubeUrl?: string }) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { videoId: uuidv4() };
};
