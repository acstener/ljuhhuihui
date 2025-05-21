import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Zap, MessageCircle, Video, VideoOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useElevenConversation } from "@/hooks/use-eleven-conversation";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceOrb } from "@/components/VoiceOrb";
import { WebcamCapture } from "@/components/WebcamCapture";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";

const Studio = () => {
  // Use the dedicated hook for ElevenLabs conversation
  const {
    transcript,
    userInput,
    setUserInput,
    isListening,
    isConnected,
    isInitializing,
    connectionAttempts,
    startConversation,
    stopConversation,
    sendTextMessage,
  } = useElevenConversation();
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Navigation
  const navigate = useNavigate();
  
  // Session ID for the current session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Webcam state
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  
  // Keep a stable instance identifier
  const componentId = useRef(`studio-${Date.now()}`).current;
  
  // Save a copy of transcript for navigation
  const transcriptRef = useRef(transcript);
  
  // Auto-save transcript when it changes and we have a session ID
  useEffect(() => {
    transcriptRef.current = transcript;

    if (sessionId && user && transcript.trim()) {
      const saveTranscript = async () => {
        try {
          await supabase
            .from('sessions')
            .update({ 
              transcript: transcript,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        } catch (error) {
          console.error("Failed to auto-save transcript:", error);
        }
      };
      
      // Use a debounce to avoid too many saves
      const timeoutId = setTimeout(saveTranscript, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [transcript, sessionId, user]);
  
  // Create a new session when starting conversation
  useEffect(() => {
    if (isListening && !sessionId && user) {
      const createSession = async () => {
        try {
          const { data, error } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              title: `Session ${new Date().toLocaleString()}`,
              transcript: ''
            })
            .select();
            
          if (error) throw error;
          if (data && data.length > 0) {
            console.log("Created new session:", data[0].id);
            setSessionId(data[0].id);
          }
        } catch (error) {
          console.error("Failed to create session:", error);
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "Failed to create new session. Please try again."
          });
        }
      };
      
      createSession();
    }
  }, [isListening, sessionId, user, toast]);
  
  // Toggle webcam recording with voice recording
  useEffect(() => {
    if (isListening && isVideoEnabled && !isVideoRecording) {
      setIsVideoRecording(true);
    } else if (!isListening && isVideoRecording) {
      setIsVideoRecording(false);
    }
  }, [isListening, isVideoEnabled, isVideoRecording]);
  
  // Parse transcript into conversation format
  const parseTranscript = () => {
    if (!transcript.trim()) return [];
    
    // Replace AI: with Studio: for display
    const formattedText = transcript.replace(/^AI:/gm, "Studio:");
    
    // Split by double line breaks
    const parts = formattedText.split(/\n\n+/);
    const messages = [];
    
    for (const part of parts) {
      if (part.trim()) {
        if (part.startsWith("You:")) {
          messages.push({
            type: "user",
            content: part.substring(4).trim()
          });
        } else if (part.startsWith("Studio:")) {
          messages.push({
            type: "studio",
            content: part.substring(7).trim()
          });
        } else {
          // Handle messages with no prefix as Studio messages
          messages.push({
            type: "studio",
            content: part.trim()
          });
        }
      }
    }
    
    return messages;
  };
  
  const conversationMessages = parseTranscript();
  
  // Handle video recording events
  const handleVideoStart = () => {
    console.log("Video recording started");
  };
  
  const handleVideoStop = async (blob: Blob | null) => {
    if (!blob) {
      console.error("No video recorded");
      return;
    }
    
    console.log("Video recording stopped, blob size:", blob.size);
    setVideoBlob(blob);
    
    // Upload to Supabase if we have a session ID
    if (sessionId && user) {
      await uploadVideoToSupabase(blob, sessionId);
    }
  };
  
  const uploadVideoToSupabase = async (blob: Blob, sid: string) => {
    if (!user) return;
    
    setIsVideoUploading(true);
    try {
      const fileName = `${sid}_${Date.now()}.webm`;
      const filePath = `${user.id}/${fileName}`;
      
      // Get video dimensions before uploading
      const videoDimensions = await getVideoDimensions(blob);
      
      // Upload video to storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'video/webm'
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      if (!publicUrlData) throw new Error("Failed to get public URL");
      
      // Update session with video URL
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ 
          video_url: publicUrlData.publicUrl,
          video_duration: Math.round(await getVideoDuration(blob)),
          video_dimensions: videoDimensions
        })
        .eq('id', sid);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Video saved",
        description: "Your video has been saved successfully.",
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload video. Please try again."
      });
    } finally {
      setIsVideoUploading(false);
    }
  };
  
  // Helper functions to get video metadata
  const getVideoDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  };
  
  const getVideoDimensions = (blob: Blob): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.src = URL.createObjectURL(blob);
    });
  };
  
  const useTranscript = async () => {
    if (!transcriptRef.current.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Transcript",
        description: "Please have a conversation first or enter some content."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // If we don't have a session yet, create one
      let currentSessionId = sessionId;
      
      if (!currentSessionId && user) {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            title: `Session ${new Date().toLocaleString()}`,
            transcript: transcriptRef.current
          })
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          currentSessionId = data[0].id;
          setSessionId(data[0].id);
        }
      } else if (currentSessionId) {
        // Update the existing session
        await supabase
          .from('sessions')
          .update({ 
            transcript: transcriptRef.current,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSessionId);
      }
      
      // Save transcript to localStorage for direct routing to generate page
      localStorage.setItem("tweetGenerationTranscript", transcriptRef.current);
      
      // Also set a default style if none exists (simplified flow without transcript editor)
      if (!localStorage.getItem("tweetGenerationStyle")) {
        localStorage.setItem("tweetGenerationStyle", "my-voice");
      }
      
      // Navigate directly to generate page with session ID
      navigate("/generate/new", { 
        state: { 
          transcript: transcriptRef.current,
          sessionId: currentSessionId 
        }
      });
    } catch (error) {
      console.error("Error saving transcript:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save transcript. Using local storage instead."
      });
      
      // Fallback to localStorage if Supabase fails
      localStorage.setItem("tweetGenerationTranscript", transcriptRef.current);
      navigate("/generate/new", { state: { transcript: transcriptRef.current } });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Content container with proper spacing */}
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Header with reduced spacing */}
        <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Back to Dashboard</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              {isVideoEnabled ? (
                <>
                  <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Disable Camera</span>
                </>
              ) : (
                <>
                  <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Enable Camera</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={useTranscript}
              disabled={!transcript.trim() || isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm"
              size="sm"
            >
              {isSaving ? "Processing..." : "Generate Content"}
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </header>
        
        {/* Title section with reduced spacing */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">Studio</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Record your thoughts and transform them into authentic content
          </p>
        </div>
        
        {/* Main content area with balanced spacing */}
        <div className="flex flex-col items-center w-full space-y-4">
          {/* Capture section - Voice Orb and Webcam */}
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
            {/* Voice Orb */}
            <VoiceOrb 
              isListening={isListening}
              isInitializing={isInitializing}
              connectionAttempts={connectionAttempts}
              onStartConversation={startConversation}
              onStopConversation={stopConversation}
            />
            
            {/* Webcam Capture (conditionally rendered) */}
            {isVideoEnabled && (
              <WebcamCapture
                isRecording={isVideoRecording}
                onRecordingStart={handleVideoStart}
                onRecordingStop={handleVideoStop}
                size="lg"
                className={isVideoUploading ? "opacity-50 pointer-events-none" : ""}
              />
            )}
          </div>
          
          {/* Chat conversation container */}
          <div className="w-full max-w-xl mx-auto space-y-4">
            {/* Chat messages area with proper height */}
            <Card className="border border-muted/30">
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] sm:h-[400px] p-4">
                  <div className="space-y-3">
                    {conversationMessages.length > 0 ? (
                      conversationMessages.map((message, index) => (
                        <div 
                          key={index}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div 
                            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                              message.type === "user" 
                                ? "bg-primary/15 text-foreground/90" 
                                : "bg-muted/30 text-foreground/90 flex items-start"
                            }`}
                          >
                            {message.type === "studio" && (
                              <MessageCircle className="h-3 w-3 mr-2 mt-1 text-primary/70" />
                            )}
                            <span>{message.content}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-sm font-normal text-muted-foreground/70">
                          {isListening 
                            ? "Listening... speak clearly" 
                            : "Start a conversation to see the transcript here"}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Input area with reduced spacing */}
            {isConnected && (
              <div className="w-full">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 resize-none bg-background border-muted/30 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg text-sm"
                  />
                  <Button 
                    onClick={sendTextMessage} 
                    disabled={!userInput.trim()}
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <Send className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
