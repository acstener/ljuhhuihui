
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Zap, MessageCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useElevenConversation } from "@/hooks/use-eleven-conversation";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceOrb } from "@/components/VoiceOrb";
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
  
  // Keep a stable instance identifier
  const componentId = useRef(`studio-${Date.now()}`).current;
  
  // Save a copy of transcript for navigation
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;

    // Auto-save transcript when it changes and we have a session ID
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
      
      // Save transcript to localStorage as a backup
      localStorage.setItem("tweetGenerationTranscript", transcriptRef.current);
      
      // Navigate to generate page with session ID
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
    <div className="flex flex-col items-center min-h-[80vh] px-4 pt-16 pb-8 relative">
      {/* Responsive navigation header */}
      <div className="w-full max-w-3xl flex flex-wrap justify-between items-center sticky top-0 left-0 right-0 py-4 px-4 bg-background/80 backdrop-blur-sm z-10 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="whitespace-nowrap">Back to Dashboard</span>
        </Button>
        
        <Button
          onClick={useTranscript}
          disabled={!transcript.trim() || isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm ml-auto"
          size="sm"
        >
          {isSaving ? "Processing..." : "Generate Content"}
          <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      
      <div className="text-center max-w-2xl mx-auto mb-8 mt-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">Studio</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Record your thoughts and transform them into authentic content
        </p>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {/* Voice Orb Component */}
        <div className="mb-10 sm:mb-16 relative">
          <VoiceOrb 
            isListening={isListening}
            isInitializing={isInitializing}
            connectionAttempts={connectionAttempts}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
          />
        </div>
        
        {/* Chat-style Conversation Display */}
        <div className="w-full max-w-xl mx-auto">
          <ScrollArea className="h-72 pr-2 mb-4">
            <div className="space-y-3">
              {conversationMessages.length > 0 ? (
                conversationMessages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
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
                <div className="flex justify-center items-center h-52">
                  <p className="text-sm font-normal text-muted-foreground/70">
                    {isListening 
                      ? "Listening... speak clearly" 
                      : "Start a conversation to see the transcript here"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Text Input Field */}
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
  );
};

export default Studio;
