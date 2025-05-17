
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useElevenConversation } from "@/hooks/use-eleven-conversation";
import { useToast } from "@/components/ui/use-toast";

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
  
  // Navigation
  const navigate = useNavigate();
  
  // Keep a stable instance identifier
  const componentId = useRef(`studio-${Date.now()}`).current;
  
  // Save a copy of transcript for navigation
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  const useTranscript = () => {
    if (!transcriptRef.current.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Transcript",
        description: "Please have a conversation first or enter some content."
      });
      return;
    }

    // Save transcript to localStorage to be processed
    localStorage.setItem("studioTranscript", transcriptRef.current);
    
    // Navigate to the new transcript editor page
    navigate("/transcript-editor", { 
      state: { transcript: transcriptRef.current }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-bold mb-2">Studio</h1>
        <p className="text-muted-foreground">
          Record your thoughts and transform them into engaging tweet threads
        </p>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {/* Centered Mic Button with improved styling */}
        <div className="mb-12 relative">
          {!isListening ? (
            <Button 
              onClick={startConversation}
              className={`h-24 w-24 rounded-full shadow-lg transition-all duration-300 
                ${isInitializing 
                  ? 'bg-primary/80 hover:bg-primary/70' 
                  : 'bg-gradient-to-br from-primary to-primary/80 hover:bg-primary/90'}
              `}
              disabled={isInitializing || connectionAttempts >= 5}
            >
              <div className={`${isInitializing ? 'animate-pulse' : ''}`}>
                <Mic className="h-10 w-10" />
              </div>
            </Button>
          ) : (
            <Button 
              onClick={stopConversation}
              variant="destructive"
              className="h-24 w-24 rounded-full shadow-lg transition-all animate-pulse"
              disabled={isInitializing}
            >
              <MicOff className="h-10 w-10" />
            </Button>
          )}
          
          <div 
            className={`absolute -bottom-8 mt-4 text-sm font-medium transition-all duration-300
              ${isListening 
                ? 'text-destructive' 
                : isInitializing 
                  ? 'text-muted-foreground animate-pulse' 
                  : 'text-primary'}`
            }
          >
            {isInitializing 
              ? "Connecting..." 
              : isListening 
                ? "Recording..." 
                : "Tap to Start"
            }
          </div>
          
          {connectionAttempts > 0 && connectionAttempts < 5 && (
            <div className="absolute -bottom-16 w-full text-center">
              <p className="text-sm text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full inline-block">
                Reconnecting: {connectionAttempts}/5
              </p>
            </div>
          )}
        </div>
        
        {/* Transcript Display with improved styling */}
        <div className="w-full transition-all">
          <Card className="rounded-xl overflow-hidden border bg-card/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <div className="px-6 py-3 border-b bg-muted/30 flex justify-between items-center">
                <h2 className="font-medium">Conversation</h2>
                <Button 
                  onClick={useTranscript}
                  disabled={!transcript.trim()}
                  variant="ghost"
                  className="text-xs hover:bg-primary/10"
                  size="sm"
                >
                  Create Thread
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="p-5 bg-background/50">
                <div className="bg-muted/10 rounded-lg p-4 min-h-[250px] max-h-[350px] overflow-y-auto whitespace-pre-wrap font-light border border-muted/30">
                  {transcript ? (
                    <div>{transcript}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <p className="italic">
                        {isListening 
                          ? "Listening... speak clearly" 
                          : "Start a conversation to see the transcript here"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Text Input Field with improved styling */}
          {isConnected && (
            <div className="mt-4 w-full">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-background/80 backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button 
                  onClick={sendTextMessage} 
                  variant="outline"
                  disabled={!userInput.trim()}
                  className="h-10 w-10 p-0 rounded-full bg-primary/10 hover:bg-primary/20 border-primary/20"
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
