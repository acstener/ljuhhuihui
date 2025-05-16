import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Headphones, Send, ArrowRight } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Studio</h1>
        <p className="text-muted-foreground mt-1">
          Have a conversation with AI and turn it into tweet threads
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              AI Conversation
            </CardTitle>
            <CardDescription>
              Talk with the AI assistant and create content from your conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                {!isListening ? (
                  <Button 
                    onClick={startConversation}
                    className="flex-1"
                    disabled={isInitializing || connectionAttempts >= 5}
                  >
                    {isInitializing ? (
                      "Connecting..."
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" /> Start Conversation
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={stopConversation}
                    variant="destructive"
                    className="flex-1"
                    disabled={isInitializing}
                  >
                    <MicOff className="mr-2 h-4 w-4" /> End Conversation
                  </Button>
                )}
              </div>
              
              {isConnected && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendTextMessage} 
                      variant="outline"
                      disabled={!userInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm">
                    <Headphones className="h-4 w-4 mr-1 text-green-500" /> 
                    <span className="text-muted-foreground">
                      {isListening ? "Listening..." : "Ready to listen"}
                    </span>
                  </div>
                </div>
              )}
              
              {connectionAttempts > 0 && connectionAttempts < 5 && (
                <p className="text-sm text-yellow-600">
                  Connection attempts: {connectionAttempts}/5
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversation Transcript</CardTitle>
            <CardDescription>
              The transcript will be used to generate tweet threads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-md min-h-[300px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {transcript || "Your conversation transcript will appear here..."}
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={useTranscript}
                disabled={!transcript.trim()}
              >
                Create Tweet Thread
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Studio;
