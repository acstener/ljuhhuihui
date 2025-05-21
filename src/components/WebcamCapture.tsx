
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Webcam, Slash, CheckCircle, XCircle, AlertCircle, Video, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WebcamCaptureProps {
  isRecording: boolean;
  onRecordingStart: () => void;
  onRecordingStop: (videoBlob: Blob | null) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  onStatusChange?: (isWorking: boolean) => void;
}

export const WebcamCapture = ({
  isRecording,
  onRecordingStart,
  onRecordingStop,
  size = "md",
  className,
  onStatusChange
}: WebcamCaptureProps) => {
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Track media stream separately from video element
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Track if video is actually playing and stable
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const stableRef = useRef(false);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };
  
  // Report webcam status to parent
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isVideoPlaying && hasPermission === true && !!mediaStream);
    }
  }, [isVideoPlaying, hasPermission, mediaStream, onStatusChange]);
  
  // Check browser compatibility on mount
  useEffect(() => {
    console.log("WebcamCapture: Checking browser compatibility");
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      console.error("WebcamCapture: Browser not supported");
      setIsBrowserSupported(false);
      setIsLoading(false);
      setErrorMessage("Your browser doesn't support webcam recording");
      
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support webcam recording.",
        variant: "destructive"
      });
    } else {
      console.log("WebcamCapture: Browser supports webcam recording");
    }
  }, [toast]);

  // EFFECT 1: Request camera permissions and acquire MediaStream
  useEffect(() => {
    if (!isBrowserSupported) {
      console.log("WebcamCapture: Skipping stream acquisition - browser not supported");
      return;
    }
    
    // Don't request camera access again if we already have a working stream
    if (mediaStream && mediaStream.active && hasPermission === true) {
      console.log("WebcamCapture: Using existing active media stream");
      setIsLoading(false);
      return;
    }
    
    console.log("WebcamCapture: Attempting to acquire MediaStream");
    setIsLoading(true);
    setErrorMessage(null);
    
    const acquireStream = async () => {
      try {
        console.log("WebcamCapture: Requesting camera access");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        console.log("WebcamCapture: Camera access granted", stream);
        setMediaStream(stream);
        setHasPermission(true);
        setInitializationAttempts(0); // Reset attempts on success
      } catch (err) {
        console.error("WebcamCapture: Error accessing webcam:", err);
        setHasPermission(false);
        setMediaStream(null);
        setErrorMessage(err instanceof Error ? err.message : "Unknown error accessing camera");
        
        // Increment attempts counter for potential auto-retry
        setInitializationAttempts(prev => prev + 1);
        
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to record video.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    acquireStream();
    
    // Cleanup function to stop all tracks when this effect is re-run or component unmounts
    return () => {
      if (mediaStream) {
        console.log("WebcamCapture: Cleaning up stream from acquisition effect");
        mediaStream.getTracks().forEach(track => {
          console.log(`WebcamCapture: Stopping track ${track.kind}`);
          track.stop();
        });
      }
    };
  }, [isBrowserSupported, toast, initializationAttempts]);
  
  // EFFECT 2: Apply MediaStream to Video Element when both are available
  useEffect(() => {
    if (!videoRef.current || !mediaStream) {
      console.log("WebcamCapture: Waiting for video element and stream", { 
        hasVideoElement: !!videoRef.current, 
        hasMediaStream: !!mediaStream 
      });
      return;
    }
    
    console.log("WebcamCapture: Both video element and media stream are available, connecting");
    console.log("WebcamCapture: Video element mounted", videoRef.current, mediaStream);
    
    // Check if the video element is still in the document
    if (document.body.contains(videoRef.current)) {
      console.log("WebcamCapture: Video element is in DOM, setting srcObject");
      
      // Only set srcObject if it's different
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Setup video playing event
      const playingHandler = () => {
        console.log("WebcamCapture: Video is now playing");
        setIsVideoPlaying(true);
        stableRef.current = true;
      };
      
      // Setup error handler
      const errorHandler = (err: Event) => {
        console.error("WebcamCapture: Video playback error:", err);
        setIsVideoPlaying(false);
        stableRef.current = false;
      };
      
      // Add event listeners
      videoRef.current.addEventListener('playing', playingHandler);
      videoRef.current.addEventListener('error', errorHandler);
      
      // Ensure the video plays after metadata loads
      videoRef.current.onloadedmetadata = () => {
        console.log("WebcamCapture: Video metadata loaded, attempting to play");
        videoRef.current?.play().catch(err => {
          console.error("WebcamCapture: Error playing video:", err);
          setIsVideoPlaying(false);
          stableRef.current = false;
        });
      };
      
      // If metadata already loaded, play immediately
      if (videoRef.current.readyState >= 2) {
        console.log("WebcamCapture: Video already has metadata, playing now");
        videoRef.current.play().catch(err => {
          console.error("WebcamCapture: Error playing video:", err);
          setIsVideoPlaying(false);
          stableRef.current = false;
        });
      }
      
      // Clean up event listeners
      return () => {
        console.log("WebcamCapture: Stream application effect cleanup");
        if (videoRef.current) {
          videoRef.current.removeEventListener('playing', playingHandler);
          videoRef.current.removeEventListener('error', errorHandler);
        }
      };
    } else {
      console.error("WebcamCapture: Video element is not in the DOM");
      setErrorMessage("Video element not connected to DOM");
    }
  }, [videoRef, mediaStream]);
  
  // EFFECT 3: Component unmount cleanup
  useEffect(() => {
    return () => {
      console.log("WebcamCapture: Component unmounting");
      setIsVideoPlaying(false);
      stableRef.current = false;
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          console.log(`WebcamCapture: Stopping track ${track.kind} on unmount`);
          track.stop();
        });
      }
    };
  }, []);
  
  // Start/stop recording based on isRecording prop
  useEffect(() => {
    if (!hasPermission || !mediaStream || !videoRef.current) return;
    
    console.log("WebcamCapture: Recording state changed", isRecording);
    
    if (isRecording) {
      startRecording();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      stopRecording();
    }
  }, [isRecording, hasPermission, mediaStream]);
  
  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      const interval = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [isRecording]);
  
  // Auto retry if initialization fails
  useEffect(() => {
    if (initializationAttempts > 0 && initializationAttempts < 3 && hasPermission !== true) {
      // Try again after a delay, but only up to 3 attempts
      const retryTimeout = setTimeout(() => {
        console.log(`WebcamCapture: Auto-retrying initialization (attempt ${initializationAttempts + 1})`);
        // Just bumping this will trigger the initialization effect
        setInitializationAttempts(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [initializationAttempts, hasPermission]);
  
  const startRecording = () => {
    if (!mediaStream) {
      console.error("WebcamCapture: No stream available for recording");
      return;
    }
    
    console.log("WebcamCapture: Starting recording");
    chunksRef.current = [];
    setPreviewUrl(null);
    
    try {
      // Try different mime types if the preferred one isn't supported
      let options;
      const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType };
          console.log(`WebcamCapture: Using mime type: ${mimeType}`);
          break;
        }
      }
      
      console.log("WebcamCapture: Creating MediaRecorder with options:", options);
      mediaRecorderRef.current = new MediaRecorder(mediaStream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`WebcamCapture: Received data chunk: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log("WebcamCapture: Recording stopped");
        const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log(`WebcamCapture: Created video blob: ${videoBlob.size} bytes`);
        const url = URL.createObjectURL(videoBlob);
        setPreviewUrl(url);
        onRecordingStop(videoBlob);
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error("WebcamCapture: MediaRecorder error:", event);
        setErrorMessage("Recording error occurred");
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      console.log("WebcamCapture: Recording started");
      onRecordingStart();
    } catch (err) {
      console.error("WebcamCapture: Error starting recording:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to start recording");
      toast({
        title: "Recording Error",
        description: "Failed to start video recording.",
        variant: "destructive"
      });
      onRecordingStop(null);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("WebcamCapture: Stopping recording");
      mediaRecorderRef.current.stop();
    } else {
      console.log("WebcamCapture: No active recording to stop");
    }
  };
  
  const resetCapture = () => {
    console.log("WebcamCapture: Resetting capture");
    setPreviewUrl(null);
    setErrorMessage(null);
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    } else {
      console.warn("WebcamCapture: Can't reset capture, missing video element or stream");
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Request camera permissions manually
  const requestCameraAccess = async () => {
    console.log("WebcamCapture: Manually requesting camera access");
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log("WebcamCapture: Camera access granted on manual request");
      setMediaStream(stream);
      setHasPermission(true);
    } catch (err) {
      console.error("WebcamCapture: Error accessing webcam on manual request:", err);
      setHasPermission(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to access camera");
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record video.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // If browser is not supported
  if (!isBrowserSupported) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className={cn("relative rounded-full bg-gray-200 flex items-center justify-center", sizeClasses[size])}>
          <Slash className="h-8 w-8 text-gray-500" />
        </div>
        <p className="mt-2 text-xs text-gray-500">Browser not supported</p>
        {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className={cn("relative rounded-full bg-gray-200 flex items-center justify-center animate-pulse", sizeClasses[size])}>
          <Webcam className="h-8 w-8 text-gray-500 animate-pulse" />
        </div>
        <p className="mt-2 text-xs text-gray-500">Initializing camera...</p>
      </div>
    );
  }
  
  // Permission denied
  if (hasPermission === false) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className={cn("relative rounded-full bg-gray-200 flex items-center justify-center", sizeClasses[size])}>
          <AlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <p className="mt-2 text-xs text-gray-500">Camera access denied</p>
        {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 text-xs"
          onClick={requestCameraAccess}
        >
          Allow Camera
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "relative rounded-full overflow-hidden",
        sizeClasses[size],
        isRecording && "ring-4 ring-destructive animate-pulse"
      )}>
        {/* Video preview or recorded clip */}
        {previewUrl ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={previewUrl}
            autoPlay
            playsInline
            loop
            muted
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover transform scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-1 right-1 bg-destructive text-white text-[10px] px-1 rounded">
            {formatTime(recordingDuration)}
          </div>
        )}
        
        {/* Preview controls */}
        {previewUrl && !isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 bg-white/20 hover:bg-white/40"
              onClick={resetCapture}
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Status text */}
      <p className={cn(
        "mt-2 text-xs",
        isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"
      )}>
        {previewUrl 
          ? "Preview" 
          : isRecording 
            ? "Recording..." 
            : hasPermission === true
              ? isVideoPlaying ? "Camera ready" : "Preparing camera..."
              : "Waiting for camera..."}
      </p>
      
      {/* Error message */}
      {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};

export default WebcamCapture;
