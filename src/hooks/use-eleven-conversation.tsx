
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
  const isStoppingRef = useRef<boolean>(false); // Track if stopConversation is in progress
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOperationTimeRef = useRef<number>(Date.now());

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
    lastOperationTimeRef.current = Date.now();
    
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

  // Rate limit operations
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastOperationTimeRef.current;
    const isLimited = elapsed < 1000; // 1 second cooldown
    
    if (isLimited) {
      debugLog(`Operation rate limited. Last operation was ${elapsed}ms ago.`);
    } else {
      lastOperationTimeRef.current = now;
    }
    
    return isLimited;
  }, []);

  const startConversation = async () => {
    // Check if we're in the process of stopping
    if (isStoppingRef.current) {
      debugLog("startConversation called while stopping - aborting");
      return;
    }
    
    // Check if we're already initializing
    if (isInitializing) {
      debugLog("startConversation called while already initializing - aborting");
      return;
    }
    
    // Rate limit check
    if (isRateLimited()) {
      debugLog("startConversation rate limited - ignoring");
      return;
    }
    
    if (!isMountedRef.current) {
      debugLog("startConversation called after component unmount - aborting");
      return;
    }
    
    try {
      debugLog("Starting conversation initialization");
      setIsInitializing(true);
      
      // Don't clear the transcript if there's previous content
      // and this is a reconnection attempt
      if (connectionAttempts === 0) {
        setTranscript("");
      }
      
      debugLog("Starting conversation with agent ID:", AGENT_ID);
      
      // Clear any pending start timeout
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      
      // First ensure any previous session is ended
      if (isConnected) {
        debugLog("Ending previous session before starting new one");
        try {
          await conversation.endSession();
        } catch (error) {
          debugLog("Error ending previous session:", error);
        }
      }
      
      // Small delay to ensure cleanup is complete
      startTimeoutRef.current = setTimeout(async () => {
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
          debugLog("Session started successfully with ID:", sessionId);
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
    // Check if we're already stopping
    if (isStoppingRef.current) {
      debugLog("stopConversation already in progress - ignoring redundant call");
      return;
    }
    
    // Rate limit check
    if (isRateLimited()) {
      debugLog("stopConversation rate limited - ignoring");
      return;
    }
    
    try {
      // Set the flag to indicate we're in the process of stopping
      isStoppingRef.current = true;
      debugLog("Stopping conversation - flag set");
      
      // Immediately update UI state
      setIsListening(false);
      
      // Clear any pending timeouts
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Only try to end session if we're connected
      if (isConnected) {
        debugLog("Ending active session");
        try {
          await conversation.endSession();
          debugLog("Session ended successfully");
        } catch (error) {
          debugLog("Error ending session:", error);
        }
      }
      
      setConnectionAttempts(0);
      setIsInitializing(false);
      
      debugLog("Conversation fully stopped");
      
      // Only show toast once
      toast({
        title: "Conversation Ended",
        description: "You have ended the conversation"
      });
    } catch (error) {
      debugLog("Failed to stop conversation:", error);
    } finally {
      // Reset stopping flag after operation completes, regardless of result
      // with a slight delay to prevent immediate restart
      setTimeout(() => {
        isStoppingRef.current = false;
        debugLog("Stop flag reset");
      }, 1000);
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
      
      // Clear any pending timeouts
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Cleanup on unmount
      if (isConnected) {
        debugLog("Ending session during unmount");
        conversation.endSession().catch(error => {
          debugLog("Error ending session during unmount:", error);
        });
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
