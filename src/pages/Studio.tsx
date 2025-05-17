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
    <div className="space-y-8 py-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">Studio</h1>
        <p className="text-muted-foreground">
          Have a conversation with AI and transform it into engaging tweet threads
        </p>
      </div>
      
      <div className="grid gap-8 md:gap-12 md:grid-cols-2 items-start">
        <div className="flex flex-col items-center justify-center">
          <div className={`relative transition-all duration-300 ${isListening ? 'scale-110' : 'scale-100'}`}>
            {!isListening ? (
              <Button 
                onClick={startConversation}
                className="h-24 w-24 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
                disabled={isInitializing || connectionAttempts >= 5}
              >
                {isInitializing ? (
                  <div className="animate-pulse">
                    <Mic className="h-10 w-10" />
                  </div>
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>
            ) : (
              <Button 
                onClick={stopConversation}
                variant="destructive"
                className="h-24 w-24 rounded-full shadow-lg transition-all"
                disabled={isInitializing}
              >
                <MicOff className="h-10 w-10" />
              </Button>
            )}
            <div className={`absolute -bottom-8 text-sm font-medium ${isListening ? 'text-destructive' : 'text-primary'}`}>
              {isInitializing ? "Connecting..." : isListening ? "End Conversation" : "Start Conversation"}
            </div>
          </div>
          
          {isConnected && (
            <div className="mt-16 w-full max-w-md">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-background/80 backdrop-blur-sm"
                />
                <Button 
                  onClick={sendTextMessage} 
                  variant="outline"
                  disabled={!userInput.trim()}
                  className="h-10 w-10 p-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {connectionAttempts > 0 && connectionAttempts < 5 && (
            <p className="text-sm text-yellow-600 mt-2">
              Connection attempts: {connectionAttempts}/5
            </p>
          )}
        </div>
        
        <div>
          <Card className="rounded-xl overflow-hidden border bg-card/50 backdrop-blur-sm shadow-md transition-all hover:shadow-lg">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                <h2 className="text-lg font-medium">Conversation</h2>
                <Button 
                  onClick={useTranscript}
                  disabled={!transcript.trim()}
                  variant="ghost"
                  className="text-xs"
                  size="sm"
                >
                  Create Tweet Thread
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="p-6 bg-background/50">
                <div className="bg-muted/20 rounded-lg p-5 min-h-[350px] max-h-[500px] overflow-y-auto whitespace-pre-wrap font-light">
                  {transcript || (
                    <span className="text-muted-foreground italic">
                      Your conversation will appear here...
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Studio;
