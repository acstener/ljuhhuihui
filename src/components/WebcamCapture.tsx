
import { useEffect, useRef, useState } from "react";
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
}

export const WebcamCapture = ({
  isRecording,
  onRecordingStart,
  onRecordingStop,
  size = "md",
  className
}: WebcamCaptureProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoElementReady, setVideoElementReady] = useState(false);
  
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };
  
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

  // Ensure the video element is ready before accessing it
  useEffect(() => {
    // Add a small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      setVideoElementReady(true);
      console.log("WebcamCapture: Video element ready check", !!videoRef.current);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize webcam when video element is ready
  useEffect(() => {
    if (!isBrowserSupported || !videoElementReady) return;
    
    console.log("WebcamCapture: Initializing webcam");
    let stream: MediaStream | null = null;
    
    const initWebcam = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        console.log("WebcamCapture: Requesting camera access");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        console.log("WebcamCapture: Camera access granted", stream);
        
        if (videoRef.current) {
          console.log("WebcamCapture: Setting video source");
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasPermission(true);
        } else {
          console.error("WebcamCapture: Video ref is null");
          setErrorMessage("Video element not available");
          toast({
            title: "Camera Error",
            description: "Could not initialize video element. Please refresh the page.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("WebcamCapture: Error accessing webcam:", err);
        setHasPermission(false);
        setErrorMessage(err instanceof Error ? err.message : "Unknown error accessing camera");
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to record video.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initWebcam();
    
    // Cleanup
    return () => {
      console.log("WebcamCapture: Cleaning up");
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log("WebcamCapture: Stopping track", track.kind);
          track.stop();
        });
      }
    };
  }, [isBrowserSupported, toast, videoElementReady]);
  
  // Start/stop recording based on isRecording prop
  useEffect(() => {
    if (!hasPermission || !streamRef.current) return;
    
    console.log("WebcamCapture: Recording state changed", isRecording);
    
    if (isRecording) {
      startRecording();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      stopRecording();
    }
  }, [isRecording, hasPermission]);
  
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
  
  const startRecording = () => {
    if (!streamRef.current) {
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
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
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
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else {
      console.warn("WebcamCapture: Can't reset capture, missing video ref or stream");
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
      } else {
        console.error("WebcamCapture: Video ref is null on manual request");
      }
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
            : "Camera ready"}
      </p>
      
      {/* Error message */}
      {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};

export default WebcamCapture;
