
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };
  
  // Check browser compatibility on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      setIsLoading(false);
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support webcam recording.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  // Initialize webcam on mount
  useEffect(() => {
    if (!isBrowserSupported) return;
    
    let stream: MediaStream | null = null;
    
    const initWebcam = async () => {
      setIsLoading(true);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setHasPermission(false);
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isBrowserSupported, toast]);
  
  // Start/stop recording based on isRecording prop
  useEffect(() => {
    if (!hasPermission || !streamRef.current) return;
    
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
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    setPreviewUrl(null);
    
    try {
      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(videoBlob);
        setPreviewUrl(url);
        onRecordingStop(videoBlob);
      };
      
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error starting recording:", err);
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
      mediaRecorderRef.current.stop();
    }
  };
  
  const resetCapture = () => {
    setPreviewUrl(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Request camera permissions manually
  const requestCameraAccess = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setHasPermission(false);
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
    </div>
  );
};

export default WebcamCapture;
