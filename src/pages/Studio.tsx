
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useElevenConversation } from "@/hooks/use-eleven-conversation";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";

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

  const handleStartConversation = () => {
    if (!isListening) {
      startConversation();
    }
  };

  const handleStopConversation = (duration: number) => {
    if (isListening) {
      stopConversation();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <TextShimmer 
          as="h1"
          className="text-4xl font-bold mb-2 [--base-color:#2563EB] [--base-gradient-color:#7C3AED] dark:[--base-color:#3B82F6] dark:[--base-gradient-color:#8B5CF6]"
          duration={2.5}
        >
          Studio
        </TextShimmer>
        <p className="text-muted-foreground">
          Record your thoughts and transform them into engaging tweet threads
        </p>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {/* AIVoiceInput Component with properly connected callbacks */}
        <div className="mb-8">
          <AIVoiceInput 
            onStart={handleStartConversation}
            onStop={handleStopConversation}
            isListening={isListening}
            isInitializing={isInitializing}
            visualizerBars={36}
          />
        </div>
        
        {/* Transcript Display */}
        <div className="w-full transition-all">
          <Card className="rounded-xl overflow-hidden border border-muted/30 bg-card/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-0">
              <div className="px-6 py-3 border-b border-muted/20 bg-muted/10 flex justify-between items-center">
                <h2 className="font-medium text-muted-foreground">Conversation</h2>
                <Button 
                  onClick={useTranscript}
                  disabled={!transcript.trim()}
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  Create Thread
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
          
          {/* Text Input Field */}
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
