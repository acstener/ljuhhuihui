
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Headphones, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

const AGENT_ID = "PVNwxSmzIwblQ0k5z7s8";
const CONNECTION_RETRY_DELAY = 5000; // Increased to 5 seconds
const MAX_RETRIES = 5; // Increased max retries

// Debug configuration
const DEBUG = true;

// Debug logger that can be toggled on/off
const debugLog = (message, ...args) => {
  if (DEBUG) {
    console.log(`[ElevenLabs Debug] ${message}`, ...args);
  }
};

// Define types for ElevenLabs message format
interface ElevenLabsMessage {
  source: string;
  message: string;
}

const Studio = () => {
  debugLog("Studio component rendering");
  const [transcript, setTranscript] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isUnmounting, setIsUnmounting] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const componentMountedRef = useRef<boolean>(true);
  
  // Stable reference to the transcript for use in callbacks
  const transcriptRef = useRef<string>("");
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Debug effect for component lifecycle
  useEffect(() => {
    debugLog("Studio component mounted");
    componentMountedRef.current = true;
    
    // Check if there's a stored session from localStorage
    const savedSession = localStorage.getItem("elevenlabs_session");
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        debugLog("Found saved session:", sessionData);
        if (sessionData.transcript) {
          setTranscript(sessionData.transcript);
          transcriptRef.current = sessionData.transcript;
        }
        // We don't automatically reconnect here, let user decide
      } catch (e) {
        debugLog("Error parsing saved session:", e);
        localStorage.removeItem("elevenlabs_session");
      }
    }
    
    return () => {
      debugLog("Studio component unmounting");
      setIsUnmounting(true);
      componentMountedRef.current = false;
      
      // Save session state before unmounting
      if (transcriptRef.current) {
        debugLog("Saving transcript before unmount");
        const sessionData = {
          timestamp: Date.now(),
          transcript: transcriptRef.current,
        };
        localStorage.setItem("elevenlabs_session", JSON.stringify(sessionData));
      }
    };
  }, []);
  
  // Track current pathname to detect navigation
  useEffect(() => {
    debugLog("Location changed:", location.pathname);
    if (location.pathname !== "/studio" && isListening) {
      debugLog("Navigated away from Studio while listening, cleaning up");
      stopConversation().catch(console.error);
    }
  }, [location.pathname]);

  const conversation = useConversation({
    onConnect: () => {
      if (!componentMountedRef.current) {
        debugLog("onConnect called after component unmount - ignoring");
        return;
      }
      
      debugLog("Connected to ElevenLabs Conversation AI");
      setIsConnected(true);
      setConnectionAttempts(0);
      setIsInitializing(false);
      toast({
        title: "Connected",
        description: "Connected to ElevenLabs Conversation AI"
      });
    },
    onDisconnect: () => {
      debugLog("Disconnected from ElevenLabs Conversation AI");
      
      if (!componentMountedRef.current) {
        debugLog("onDisconnect called after component unmount - ignoring reconnect");
        return;
      }
      
      setIsConnected(false);
      
      // Only attempt reconnect if this was not a manual disconnect
      if (isListening && !isInitializing && !isUnmounting) {
        debugLog("Attempting to reconnect...");
        handleReconnect();
      } else {
        debugLog("Not reconnecting because:", { 
          isListening, 
          isInitializing, 
          isUnmounting 
        });
        setIsListening(false);
      }
    },
    onMessage: (message: ElevenLabsMessage) => {
      if (!componentMountedRef.current) {
        debugLog("onMessage called after component unmount - ignoring");
        return;
      }
      
      debugLog("Message received:", message);
      
      // Handle different message sources from ElevenLabs
      if (message.source === "transcript" && message.message) {
        setTranscript(prev => prev + "\n\n" + message.message);
      } else if (message.source === "agent" && message.message) {
        setTranscript(prev => prev + "\n\nAI: " + message.message);
      } else if (message.source === "user" && message.message) {
        setTranscript(prev => prev + "\n\nYou: " + message.message);
      } else if (message.source === "ai" && message.message) {
        // Handle messages with source "ai"
        setTranscript(prev => prev + "\n\nAI: " + message.message);
      }
    },
    onError: (error) => {
      debugLog("Conversation error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to ElevenLabs AI",
        variant: "destructive"
      });
      
      if (!componentMountedRef.current) {
        debugLog("onError called after component unmount - ignoring reconnect");
        return;
      }
      
      if (isListening && !isInitializing && !isUnmounting) {
        handleReconnect();
      } else {
        setIsListening(false);
        setIsInitializing(false);
      }
    }
  });

  const handleReconnect = useCallback(() => {
    if (!componentMountedRef.current) {
      debugLog("handleReconnect called after component unmount - aborting");
      return;
    }
    
    if (connectionAttempts < MAX_RETRIES) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      debugLog(`Reconnect attempt ${connectionAttempts + 1}/${MAX_RETRIES}`);
      
      toast({
        title: "Reconnecting",
        description: `Attempting to reconnect (${connectionAttempts + 1}/${MAX_RETRIES})...`
      });
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (componentMountedRef.current) {
          setConnectionAttempts(prev => prev + 1);
          startConversation();
        } else {
          debugLog("Reconnect timeout triggered after component unmount - aborting");
        }
      }, CONNECTION_RETRY_DELAY);
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not establish a stable connection. Please try again later.",
        variant: "destructive"
      });
      setIsListening(false);
      setIsInitializing(false);
    }
  }, [connectionAttempts]);

  const startConversation = async () => {
    if (!componentMountedRef.current) {
      debugLog("startConversation called after component unmount - aborting");
      return;
    }
    
    try {
      setIsInitializing(true);
      
      // Don't clear the transcript if there's previous content
      // and this is a reconnection attempt
      if (connectionAttempts === 0) {
        setTranscript("");
      }
      
      debugLog("Starting conversation with agent ID:", AGENT_ID);
      
      // First ensure any previous session is ended
      if (isConnected) {
        debugLog("Ending previous session before starting new one");
        await conversation.endSession();
      }
      
      // Small delay to ensure cleanup is complete
      setTimeout(async () => {
        if (!componentMountedRef.current) {
          debugLog("setTimeout callback called after component unmount - aborting");
          return;
        }
        
        try {
          debugLog("Starting new session with agent:", AGENT_ID);
          await conversation.startSession({
            agentId: AGENT_ID
          });
          setIsListening(true);
        } catch (error) {
          debugLog("Failed to start conversation after delay:", error);
          toast({
            title: "Connection Failed",
            description: "Failed to start conversation with ElevenLabs AI",
            variant: "destructive"
          });
          setIsListening(false);
          setIsInitializing(false);
        }
      }, 1000);
      
    } catch (error) {
      debugLog("Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to start conversation with ElevenLabs AI",
        variant: "destructive"
      });
      setIsListening(false);
      setIsInitializing(false);
    }
  };

  const stopConversation = async () => {
    try {
      debugLog("Stopping conversation");
      await conversation.endSession();
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsListening(false);
      setConnectionAttempts(0);
      setIsInitializing(false);
      
      toast({
        title: "Conversation Ended",
        description: "You have ended the conversation"
      });
    } catch (error) {
      debugLog("Failed to stop conversation:", error);
    }
  };

  const sendTextMessage = async () => {
    if (!userInput.trim()) return;
    
    try {
      debugLog("Sending user message:", userInput);
      
      // Add the user's message to the transcript immediately
      setTranscript(prev => prev + "\n\nYou: " + userInput);
      
      // Use sendUserMessage as per the library API
      await conversation.sendUserMessage(userInput);
      setUserInput("");
    } catch (error) {
      debugLog("Failed to send message:", error);
      toast({
        title: "Message Failed",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const useTranscript = () => {
    if (!transcriptRef.current.trim()) {
      toast({
        title: "No Transcript",
        description: "There is no conversation transcript to process",
        variant: "destructive"
      });
      return;
    }

    // Save transcript to localStorage to be processed
    localStorage.setItem("studioTranscript", transcriptRef.current);
    
    // Navigate to the input transcript page
    navigate("/input-transcript", { 
      state: { transcript: transcriptRef.current }
    });
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        debugLog("Component unmounting, ending session");
        conversation.endSession().catch((error) => {
          debugLog("Error ending session during unmount:", error);
        });
      }
      
      if (reconnectTimeoutRef.current) {
        debugLog("Clearing reconnect timeout during unmount");
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, conversation]);

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
                    disabled={isInitializing || connectionAttempts >= MAX_RETRIES}
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
              
              {connectionAttempts > 0 && connectionAttempts < MAX_RETRIES && (
                <p className="text-sm text-yellow-600">
                  Connection attempts: {connectionAttempts}/{MAX_RETRIES}
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
                Use This Transcript
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Studio;
