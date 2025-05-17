
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceOrbProps {
  isListening: boolean;
  isInitializing: boolean;
  connectionAttempts: number;
  onStartConversation: () => void;
  onStopConversation: () => void;
}

export const VoiceOrb = ({ 
  isListening, 
  isInitializing, 
  connectionAttempts,
  onStartConversation,
  onStopConversation 
}: VoiceOrbProps) => {
  const [audioReactivity, setAudioReactivity] = useState(1);
  
  // Simulate audio reactivity when listening
  useEffect(() => {
    if (!isListening) return;
    
    let interval: number | NodeJS.Timeout;
    
    // Audio reactivity simulation
    const simulateAudioReactivity = () => {
      interval = setInterval(() => {
        // Random value between 1 and 1.75 to simulate voice intensity
        setAudioReactivity(1 + Math.random() * 0.75);
      }, 200);
    };
    
    simulateAudioReactivity();
    
    return () => {
      if (interval) clearInterval(interval);
      setAudioReactivity(1);
    };
  }, [isListening]);
  
  return (
    <div className="relative">
      {/* Core Orb Button */}
      <button 
        onClick={isListening ? onStopConversation : onStartConversation}
        disabled={connectionAttempts >= 5}
        className={cn(
          "relative h-24 w-24 rounded-full transition-all duration-300 outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isListening 
            ? "bg-gradient-to-br from-destructive/90 to-destructive/70"
            : isInitializing 
              ? "bg-primary/80"
              : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        )}
        aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center",
          isInitializing && "animate-pulse"
        )}>
          {isListening ? (
            <MicOff className="h-10 w-10 text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </div>
        
        {/* Center Pulse for Initialization */}
        {isInitializing && (
          <div className="absolute inset-0 rounded-full animate-voice-wave-pulse border border-primary/30"></div>
        )}
        
        {/* Animated Waves for Listening State - Multiple rings with different timings */}
        {isListening && (
          <>
            <div 
              className="absolute inset-0 rounded-full border border-destructive/40 animate-voice-wave-expand" 
              style={{
                animationDelay: '0ms',
                transform: `scale(${audioReactivity})`,
              }}
            ></div>
            <div 
              className="absolute inset-0 rounded-full border border-destructive/30 animate-voice-wave-expand" 
              style={{
                animationDelay: '400ms',
                transform: `scale(${audioReactivity * 0.9})`,
              }}
            ></div>
            <div 
              className="absolute inset-0 rounded-full border border-destructive/20 animate-voice-wave-expand" 
              style={{
                animationDelay: '800ms',
                transform: `scale(${audioReactivity * 0.8})`,
              }}
            ></div>
          </>
        )}
        
        {/* Idle State Subtle Waves */}
        {!isListening && !isInitializing && (
          <>
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-voice-wave-pulse" 
                 style={{animationDelay: '0ms'}}></div>
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-voice-wave-pulse" 
                 style={{animationDelay: '700ms'}}></div>
          </>
        )}
      </button>
      
      {/* Status Text */}
      <div 
        className={cn(
          "absolute -bottom-8 mt-4 text-sm font-medium transition-all duration-300 w-full text-center",
          isListening 
            ? "text-destructive" 
            : isInitializing 
              ? "text-muted-foreground animate-pulse" 
              : "text-primary"
        )}
      >
        {isInitializing 
          ? "Connecting..." 
          : isListening 
            ? "Recording..." 
            : "Tap to Start"
        }
      </div>
      
      {/* Connection Attempts Indicator */}
      {connectionAttempts > 0 && connectionAttempts < 5 && (
        <div className="absolute -bottom-16 w-full text-center">
          <p className="text-sm text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full inline-block">
            Reconnecting: {connectionAttempts}/5
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
