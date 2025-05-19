
import { useState, useEffect, useCallback, useRef } from "react";
import { useConversation } from "@11labs/react";
import { toast } from "@/hooks/use-toast";

// Configuration
const AGENT_ID = "PVNwxSmzIwblQ0k5z7s8";
const CONNECTION_RETRY_DELAY = 5000;
const MAX_RETRIES = 5;
const DEBUG = true;

// Debug logger that can be toggled on/off
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[ElevenLabs Debug] ${message}`, ...args);
  }
};

interface ElevenLabsMessage {
  source: string;
  message: string;
}

interface UseElevenConversationProps {
  onTranscriptUpdate?: (transcriptText: string) => void;
  initialTranscript?: string;
}

interface UseElevenConversationReturn {
  transcript: string;
  userInput: string;
  setUserInput: (input: string) => void;
  isListening: boolean;
  isConnected: boolean;
  isInitializing: boolean;
  connectionAttempts: number;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  sendTextMessage: () => Promise<void>;
}

export const useElevenConversation = ({
  onTranscriptUpdate,
  initialTranscript = "",
}: UseElevenConversationProps = {}): UseElevenConversationReturn => {
  // State that needs to be tracked for re-renders
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [userInput, setUserInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  // Refs for state that shouldn't trigger re-renders
  const isMountedRef = useRef<boolean>(true);
  const isUnmountingRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>(initialTranscript);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false); // Add this to track if stopConversation is in progress

  // Update transcript ref whenever transcript changes
  useEffect(() => {
    transcriptRef.current = transcript;
    
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);
  
  // Create stable callbacks for conversation events
  const onConnect = useCallback(() => {
    if (!isMountedRef.current) {
      debugLog("onConnect called after component unmount - ignoring");
      return;
    }
    
    debugLog("Connected to ElevenLabs Conversation AI");
    setIsConnected(true);
    setConnectionAttempts(0);
    setIsInitializing(false);
    isStoppingRef.current = false; // Reset the stopping flag when connected
    
    toast({
      title: "Connected",
      description: "Connected to ElevenLabs Conversation AI"
    });
  }, []);
  
  const onDisconnect = useCallback(() => {
    debugLog("Disconnected from ElevenLabs Conversation AI");
    
    if (!isMountedRef.current) {
      debugLog("onDisconnect called after component unmount - ignoring reconnect");
      return;
    }
    
    setIsConnected(false);
    
    // Only attempt reconnect if this was not a manual disconnect
    if (isListening && !isInitializing && !isUnmountingRef.current && !isStoppingRef.current) {
      debugLog("Attempting to reconnect...");
      handleReconnect();
    } else {
      debugLog("Not reconnecting because:", { 
        isListening, 
        isInitializing, 
        isUnmounting: isUnmountingRef.current,
        isStopping: isStoppingRef.current
      });
      setIsListening(false);
    }
  }, [isListening, isInitializing]);
  
  const onMessage = useCallback((message: ElevenLabsMessage) => {
    if (!isMountedRef.current) {
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
      setTranscript(prev => prev + "\n\nAI: " + message.message);
    }
  }, []);
  
  const onError = useCallback((error: any) => {
    debugLog("Conversation error:", error);
    toast({
      title: "Error",
      description: "Failed to connect to ElevenLabs AI",
      variant: "destructive"
    });
    
    if (!isMountedRef.current) {
      debugLog("onError called after component unmount - ignoring reconnect");
      return;
    }
    
    if (isListening && !isInitializing && !isUnmountingRef.current && !isStoppingRef.current) {
      handleReconnect();
    } else {
      setIsListening(false);
      setIsInitializing(false);
    }
  }, [isListening, isInitializing]);

  // Create conversation with stable callbacks
  const conversation = useConversation({
    onConnect,
    onDisconnect,
    onMessage,
    onError
  });

  const handleReconnect = useCallback(() => {
    if (!isMountedRef.current || isStoppingRef.current) {
      debugLog("handleReconnect called after component unmount or during stop - aborting");
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
        if (isMountedRef.current && !isStoppingRef.current) {
          setConnectionAttempts(prev => prev + 1);
          startConversation();
        } else {
          debugLog("Reconnect timeout triggered after component unmount or during stop - aborting");
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
      isStoppingRef.current = false;
    }
  }, [connectionAttempts]);

  const startConversation = async () => {
    if (!isMountedRef.current) {
      debugLog("startConversation called after component unmount - aborting");
      return;
    }
    
    // Don't start if we're in the process of stopping
    if (isStoppingRef.current) {
      debugLog("startConversation called while stopping - aborting");
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
        if (!isMountedRef.current || isStoppingRef.current) {
          debugLog("setTimeout callback called after component unmount or during stop - aborting");
          return;
        }
        
        try {
          debugLog("Starting new session with agent:", AGENT_ID);
          const sessionId = await conversation.startSession({
            agentId: AGENT_ID
          });
          
          conversationIdRef.current = sessionId;
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
    // If already stopping, don't trigger again
    if (isStoppingRef.current) {
      debugLog("stopConversation already in progress - ignoring redundant call");
      return;
    }
    
    try {
      // Set the flag to indicate we're in the process of stopping
      isStoppingRef.current = true;
      
      debugLog("Stopping conversation");
      
      // Only try to end session if we're connected
      if (isConnected) {
        await conversation.endSession();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsListening(false);
      setConnectionAttempts(0);
      setIsInitializing(false);
      
      // Only show toast once
      toast({
        title: "Conversation Ended",
        description: "You have ended the conversation"
      });
    } catch (error) {
      debugLog("Failed to stop conversation:", error);
    } finally {
      // Reset stopping flag after operation completes, regardless of result
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 500); // Add small delay to prevent immediate restart
    }
  };

  const sendTextMessage = async () => {
    if (!userInput.trim()) return;
    
    try {
      debugLog("Sending user message:", userInput);
      
      // Add the user's message to the transcript immediately
      setTranscript(prev => prev + "\n\nYou: " + userInput);
      
      // Send message and clear input
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

  // Save transcript to local storage on changes
  useEffect(() => {
    if (transcript.trim()) {
      localStorage.setItem("elevenlabs_session", JSON.stringify({
        timestamp: Date.now(),
        transcript: transcript,
      }));
    }
  }, [transcript]);
  
  // Load saved transcript on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("elevenlabs_session");
    if (savedSession && !initialTranscript) {
      try {
        const sessionData = JSON.parse(savedSession);
        debugLog("Found saved session:", sessionData);
        if (sessionData.transcript) {
          setTranscript(sessionData.transcript);
          transcriptRef.current = sessionData.transcript;
        }
      } catch (e) {
        debugLog("Error parsing saved session:", e);
        localStorage.removeItem("elevenlabs_session");
      }
    }
  }, [initialTranscript]);

  // Setup and teardown
  useEffect(() => {
    debugLog("ElevenLabs conversation hook initialized");
    isMountedRef.current = true;
    isUnmountingRef.current = false;
    isStoppingRef.current = false;
    
    return () => {
      debugLog("ElevenLabs conversation hook unmounting");
      isUnmountingRef.current = true;
      isMountedRef.current = false;
      
      // Prevent reconnects during unmount
      isStoppingRef.current = true;
      
      // Cleanup on unmount
      if (isConnected) {
        debugLog("Ending session during unmount");
        conversation.endSession().catch(error => {
          debugLog("Error ending session during unmount:", error);
        });
      }
      
      if (reconnectTimeoutRef.current) {
        debugLog("Clearing reconnect timeout during unmount");
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
};
