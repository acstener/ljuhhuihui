import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { generateTweetsFromTranscript, setOpenAIKey, getOpenAIKey, GeneratedTweet } from "@/utils/tweetGenerator";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

interface Tweet {
  tweet: string;
  topic?: string;
  edited?: boolean;
}

// Create a window-level flag to track session creation across components
declare global {
  interface Window {
    _sessionCreationInProgress?: string;
    _createdSessionId?: string;
  }
}

export const useThreadGenerator = () => {
  const [transcript, setTranscript] = useState<string>("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exampleTweets, setExampleTweets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [apiKeySet, setApiKeySet] = useState<boolean>(!!getOpenAIKey());
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Refs to prevent duplicate operations
  const sessionCreationInProgress = useRef<boolean>(false);
  const sessionCreationAttempted = useRef<boolean>(false);
  const hasLoadedTranscript = useRef<boolean>(false);
  const hasCheckedForExistingSession = useRef<boolean>(false);

  // Log current user ID for debugging
  useEffect(() => {
    if (user) {
      console.log("useThreadGenerator initialized with user ID:", user.id);
    } else {
      console.log("useThreadGenerator initialized without a user");
    }
  }, [user]);

  // Check for existing session with the same transcript
  const findExistingSessionWithTranscript = async (transcriptText: string): Promise<string | null> => {
    if (!user || !transcriptText.trim()) return null;
    
    try {
      console.log("Checking for existing session with the same transcript");
      const { data, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transcript', transcriptText as any) // Type cast to handle Supabase type issues
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error checking for existing session:", error);
        return null;
      }
      
      // Safety check for data and proper type handling
      if (data && Array.isArray(data) && data.length > 0 && data[0]) {
        // Check if id property exists before accessing it
        const sessionItem = data[0];
        if ('id' in sessionItem && sessionItem.id) {
          console.log("Found existing session with this transcript:", sessionItem.id);
          return sessionItem.id.toString();
        }
      }
      
      console.log("No existing session found with this transcript");
      return null;
    } catch (err) {
      console.error("Error in findExistingSessionWithTranscript:", err);
      return null;
    }
  };

  // Load transcript and sessionId from localStorage or state
  useEffect(() => {
    // Only load transcript once to prevent multiple loads
    if (hasLoadedTranscript.current) {
      return;
    }
    
    // Load transcript and sessionId from localStorage or state
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    const pendingTranscript = localStorage.getItem("pendingTranscript");
    
    // Use pendingTranscript first if available, then fall back to savedTranscript
    if (pendingTranscript) {
      console.log("Loading pending transcript from localStorage");
      setTranscript(pendingTranscript);
      hasLoadedTranscript.current = true;
    } else if (savedTranscript) {
      setTranscript(savedTranscript);
      hasLoadedTranscript.current = true;
    }
    
    // Try to get session ID from localStorage
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId) {
      console.log("Restoring session ID from localStorage:", savedSessionId);
      setSessionId(savedSessionId);
    }
  }, []);
  
  // Check for existing session with this transcript once user is available
  useEffect(() => {
    if (!user || !transcript.trim() || hasCheckedForExistingSession.current) return;
    
    const checkExistingSession = async () => {
      // First check if there's a global created session we should use
      if (window._createdSessionId) {
        console.log("Using globally created session ID:", window._createdSessionId);
        setSessionId(window._createdSessionId);
        localStorage.setItem("currentSessionId", window._createdSessionId);
        hasCheckedForExistingSession.current = true;
        return;
      }
      
      // Check if there's already a session with this transcript
      const existingSessionId = await findExistingSessionWithTranscript(transcript);
      if (existingSessionId) {
        console.log("Using existing session with transcript:", existingSessionId);
        setSessionId(existingSessionId);
        localStorage.setItem("currentSessionId", existingSessionId);
        window._createdSessionId = existingSessionId;
        hasCheckedForExistingSession.current = true;
      }
    };
    
    checkExistingSession();
  }, [user, transcript]);
  
  // Fetch tone examples and create session if needed when user is available
  useEffect(() => {
    if (!user) return;
    
    // Fetch tone examples
    fetchToneExamples();
    
    // If we have a transcript but no sessionId, try to create a session
    const pendingTranscript = localStorage.getItem("pendingTranscript");
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    const savedSessionId = localStorage.getItem("currentSessionId");
    
    if ((pendingTranscript || savedTranscript) && !savedSessionId && !sessionCreationAttempted.current && !window._sessionCreationInProgress) {
      sessionCreationAttempted.current = true;
      const transcriptToUse = pendingTranscript || savedTranscript || "";
      createNewSession(transcriptToUse);
    }
  }, [user]);
  
  // Create a new session with the given transcript
  const createNewSession = async (transcriptText: string) => {
    if (!user) {
      console.log("Cannot create session: No authenticated user");
      return null;
    }
    
    if (!transcriptText.trim()) {
      console.log("Cannot create session: Empty transcript");
      return null;
    }
    
    // Check global flag to prevent concurrent creation across components
    if (window._sessionCreationInProgress) {
      console.log("Session creation already in progress globally:", window._sessionCreationInProgress);
      return window._sessionCreationInProgress;
    }
    
    // Check local ref to prevent duplicate calls
    if (sessionCreationInProgress.current) {
      console.log("Session creation already in progress locally, skipping duplicate request");
      return null;
    }
    
    // First, check if there's already a session with this transcript
    const existingSessionId = await findExistingSessionWithTranscript(transcriptText);
    if (existingSessionId) {
      console.log("Using existing session for transcript:", existingSessionId);
      setSessionId(existingSessionId);
      localStorage.setItem("currentSessionId", existingSessionId);
      window._createdSessionId = existingSessionId;
      return existingSessionId;
    }
    
    // Set both local and global flags
    sessionCreationInProgress.current = true;
    const uniqueId = `session-creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window._sessionCreationInProgress = uniqueId;
    
    try {
      console.log("Creating new session for user:", user.id);
      
      // Create a properly typed session object
      const sessionData = {
        user_id: user.id,
        title: `Session ${new Date().toLocaleString()}`,
        transcript: transcriptText as any,  // Cast to handle type issues
      } as Database["public"]["Tables"]["sessions"]["Insert"];
      
      const { data, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select();
      
      if (sessionError) {
        console.error("Failed to create session:", sessionError);
        throw sessionError;
      }
      
      // Safely access the ID from the returned data
      if (data && Array.isArray(data) && data.length > 0) {
        const newSession = data[0];
        if (newSession && 'id' in newSession && newSession.id) {
          const newSessionId = newSession.id.toString();
          console.log("Created new session with ID:", newSessionId);
          setSessionId(newSessionId);
          localStorage.setItem("currentSessionId", newSessionId);
          window._createdSessionId = newSessionId;
          
          // Clear the pending transcript
          localStorage.removeItem("pendingTranscript");
          
          return newSessionId;
        } else {
          console.error("No valid session ID returned after insert");
        }
      } else {
        console.error("No session data returned after insert");
      }
    } catch (err) {
      console.error("Error in createNewSession:", err);
    } finally {
      sessionCreationInProgress.current = false;
      if (window._sessionCreationInProgress === uniqueId) {
        window._sessionCreationInProgress = undefined;
      }
    }
    
    return null;
  };

  // Fetch tone examples from user's preferences
  const fetchToneExamples = async () => {
    if (!user) {
      console.log("Cannot fetch tone examples: No authenticated user");
      return;
    }
    
    try {
      console.log("Fetching tone examples for user:", user.id);
      const { data, error } = await supabase
        .from("tone_preferences")
        .select("example_tweets")
        .eq("user_id", user.id)
        .limit(1)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching tone examples:", error);
        throw new Error(error.message);
      }
      
      // Safely check and extract example_tweets from the response
      if (data && Array.isArray(data) && data.length > 0 && data[0]) {
        const toneData = data[0];
        if ('example_tweets' in toneData && Array.isArray(toneData.example_tweets)) {
          setExampleTweets(toneData.example_tweets);
          console.log("Loaded tone examples:", toneData.example_tweets);
        }
      } else {
        console.log("No tone examples found for user");
      }
    } catch (err: any) {
      console.error("Failed to fetch tone examples:", err);
    }
  };

  const setApiKey = (key: string) => {
    setOpenAIKey(key);
    setApiKeySet(true);
  };

  const generateTweets = async (text = transcript) => {
    if (!text.trim()) {
      toast({
        title: "Empty transcript",
        description: "Please provide a transcript to generate content from.",
        variant: "destructive"
      });
      return;
    }
    
    if (!getOpenAIKey()) {
      toast({
        title: "API Key Required",
        description: "Please set your OpenAI API key before generating content.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      console.log("No authenticated user found for tweet generation");
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate and save content.",
        variant: "destructive"
      });
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      console.log("Generating authentic content from transcript:", text);
      // Use the utility function directly instead of the edge function
      const generatedTweets = await generateTweetsFromTranscript(text, 5, exampleTweets);
      
      setTweets(generatedTweets);
      
      // Ensure we have a session ID before saving tweets
      let activeSessionId = sessionId;
      
      // First, check if we already have a global session ID
      if (window._createdSessionId) {
        console.log("Using globally created session ID:", window._createdSessionId);
        activeSessionId = window._createdSessionId;
        setSessionId(window._createdSessionId);
      }
      
      // Check if there's an existing session with this transcript
      if (!activeSessionId) {
        const existingSessionId = await findExistingSessionWithTranscript(text);
        if (existingSessionId) {
          console.log("Using existing session with transcript:", existingSessionId);
          activeSessionId = existingSessionId;
          setSessionId(existingSessionId);
          localStorage.setItem("currentSessionId", existingSessionId);
          window._createdSessionId = existingSessionId;
        }
      }
      
      // If we still don't have a session ID, create a new session
      if (!activeSessionId) {
        console.log("No session ID found, creating new session");
        activeSessionId = await createNewSession(text);
        
        if (!activeSessionId) {
          console.error("Failed to create or retrieve session ID");
          throw new Error("Could not create session to save content");
        }
      } else {
        console.log("Using existing session ID:", activeSessionId);
        // Update the transcript in the existing session
        try {
          const updateData: Partial<Database["public"]["Tables"]["sessions"]["Update"]> = {
            transcript: text,
            updated_at: new Date().toISOString()
          };
          
          const { error: updateError } = await supabase
            .from('sessions')
            .update(updateData)
            .eq('id', activeSessionId);
            
          if (updateError) {
            console.error("Failed to update session with transcript:", updateError);
            throw updateError;
          }
        } catch (err) {
          console.error("Failed to update session with transcript:", err);
        }
      }
      
      // Now save tweets to Supabase with the session ID
      if (activeSessionId) {
        try {
          console.log("Saving generated content for session:", activeSessionId, "and user:", user.id);
          const tweetsToSave = generatedTweets.map((tweet: GeneratedTweet) => ({
            user_id: user.id,
            session_id: activeSessionId,
            content: tweet.tweet,
            topic: tweet.topic || null
          } as Database["public"]["Tables"]["generated_content"]["Insert"]));
          
          // Log the data we're about to insert for debugging
          console.log("About to insert content:", tweetsToSave);
          
          const { data, error: insertError } = await supabase
            .from('generated_content')
            .insert(tweetsToSave)
            .select();
            
          if (insertError) {
            console.error("Failed to save generated content:", insertError);
            throw insertError;
          }
          
          console.log("Successfully saved content to Supabase:", data);
          
          // Force refresh the session in localStorage to ensure it's picked up on dashboard
          localStorage.setItem("currentSessionId", activeSessionId);
          
          // Trigger a custom event that the dashboard can listen for
          window.dispatchEvent(new CustomEvent('content-generated', { 
            detail: { sessionId: activeSessionId, userId: user.id }
          }));
          
          // Add a timestamp to help with debugging
          localStorage.setItem("lastContentGenerated", new Date().toISOString());
          
          toast({
            title: "Content Generated",
            description: "Your content was successfully generated and saved",
          });
        } catch (err) {
          console.error("Failed to save generated content:", err);
          toast({
            title: "Save Error",
            description: "Your content was generated but couldn't be saved",
            variant: "destructive"
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to generate content:", err);
      setError(err.message || "Could not generate content. Please try again later.");
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate content",
        variant: "destructive"
      });
      setTweets([]); // Clear any previous tweets
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTweet = async (index: number, newText: string) => {
    const updatedTweets = [...tweets];
    const originalTweet = updatedTweets[index];
    
    updatedTweets[index] = {
      ...originalTweet,
      tweet: newText,
      edited: true
    };
    setTweets(updatedTweets);
    
    // If we have a user and session ID, update the tweet in Supabase
    if (user && sessionId && tweets.length > index) {
      try {
        // We need to find the content ID in Supabase
        const { data, error } = await supabase
          .from('generated_content')
          .select('id')
          .eq('session_id', sessionId)
          .eq('content', originalTweet.tweet)
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0 && data[0]?.id) {
          const contentId = data[0].id;
          
          // Update the content in Supabase
          const updateData: Partial<Database['public']['Tables']['generated_content']['Update']> = {
            content: newText,
            is_edited: true,
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('generated_content')
            .update(updateData)
            .eq('id', contentId);
            
          console.log("Updated tweet in Supabase");
        }
      } catch (err) {
        console.error("Failed to update tweet in Supabase:", err);
      }
    }
  };
  
  const handleDeleteTweet = async (index: number) => {
    const tweetToDelete = tweets[index];
    const updatedTweets = tweets.filter((_, i) => i !== index);
    setTweets(updatedTweets);
    
    // If we have a user and session ID, delete the tweet from Supabase
    if (user && sessionId && tweetToDelete) {
      try {
        // We need to find the content ID in Supabase
        const { data, error } = await supabase
          .from('generated_content')
          .select('id')
          .eq('session_id', sessionId)
          .eq('content', tweetToDelete.tweet)
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0 && data[0]?.id) {
          const contentId = data[0].id;
          
          // Delete the content from Supabase
          await supabase
            .from('generated_content')
            .delete()
            .eq('id', contentId);
            
          console.log("Deleted tweet from Supabase");
        }
      } catch (err) {
        console.error("Failed to delete tweet from Supabase:", err);
      }
    }
  };

  const handleCopyTweet = (tweet: string) => {
    navigator.clipboard.writeText(tweet);
    toast({
      title: "Content copied",
      description: "Content has been copied to clipboard",
    });
  };
  
  const handleDownloadAll = () => {
    const content = tweets.map(t => t.tweet).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "content-thread.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    transcript,
    sessionId,
    tweets,
    isGenerating,
    exampleTweets,
    error,
    apiKeySet,
    setApiKey,
    generateTweets,
    handleUpdateTweet: () => {}, // keeping stub functions for type compatibility
    handleDeleteTweet: () => {},
    handleCopyTweet: () => {},
    handleDownloadAll: () => {},
    setSessionId,
    setTranscript,
    createNewSession,
    findExistingSessionWithTranscript
  };
};
