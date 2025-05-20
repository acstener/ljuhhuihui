import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowRight } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-bold mb-2">Studio</h1>
        <p className="text-muted-foreground">
          Record your thoughts and transform them into authentic content
        </p>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {/* Voice Orb Component */}
        <div className="mb-12 relative">
          <VoiceOrb 
            isListening={isListening}
            isInitializing={isInitializing}
            connectionAttempts={connectionAttempts}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
          />
        </div>
        
        {/* Subtle Transcript Display with improved styling */}
        <div className="w-full transition-all">
          <Card className="rounded-xl overflow-hidden border border-muted/30 bg-card/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-0">
              <div className="px-6 py-3 border-b border-muted/20 bg-muted/10 flex justify-between items-center">
                <h2 className="font-medium text-muted-foreground">Conversation</h2>
                <Button 
                  onClick={useTranscript}
                  disabled={!transcript.trim() || isSaving}
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  {isSaving ? "Saving..." : "Create Content"}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-4 bg-background/30">
                  <div className="rounded-lg p-4 min-h-[150px] whitespace-pre-wrap font-light text-muted-foreground">
                    {transcript ? (
                      <div className="text-sm leading-relaxed">{transcript}</div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/60">
                        <p className="italic text-sm">
                          {isListening 
                            ? "Listening... speak clearly" 
                            : "Start a conversation to see the transcript here"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Text Input Field with subtle styling */}
          {isConnected && (
            <div className="mt-4 w-full">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-background/50 backdrop-blur-sm border-muted/30 focus-visible:ring-1 focus-visible:ring-primary/30"
                />
                <Button 
                  onClick={sendTextMessage} 
                  variant="ghost"
                  disabled={!userInput.trim()}
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
