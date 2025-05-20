
import React, { useState, useEffect, useRef } from "react";
import { useElevenConversation } from "@/hooks/use-eleven-conversation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceOrb } from "@/components/VoiceOrb";
import { useToast } from "@/hooks/use-toast";

interface LandingVoiceStudioProps {
  onTranscriptReady: (transcript: string) => void;
}

export const LandingVoiceStudio = ({ onTranscriptReady }: LandingVoiceStudioProps) => {
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
  const hasTranscript = useRef(false);
  
  // Update the parent component when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      hasTranscript.current = true;
      // Save transcript to localStorage for later use
      localStorage.setItem("pendingTranscript", transcript);
      // Notify parent component
      onTranscriptReady(transcript);
    }
  }, [transcript, onTranscriptReady]);
  
  // Parse transcript into conversation format for display
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
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col items-center w-full space-y-6">
        {/* Voice Orb */}
        <div>
          <VoiceOrb 
            isListening={isListening}
            isInitializing={isInitializing}
            connectionAttempts={connectionAttempts}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
          />
        </div>
        
        {/* Chat conversation container */}
        <div className="w-full max-w-xl mx-auto space-y-4">
          {/* Chat messages area */}
          <Card className="border border-muted/30">
            <CardContent className="p-0">
              <ScrollArea className="h-[250px] sm:h-[300px] p-4">
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
                          : "Start a conversation by clicking the microphone button above"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Input area */}
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

export default LandingVoiceStudio;
