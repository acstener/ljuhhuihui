
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { generateTweetsFromTranscript, setOpenAIKey, getOpenAIKey, GeneratedTweet } from "@/utils/tweetGenerator";

interface Tweet {
  tweet: string;
  topic?: string;
  edited?: boolean;
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

  // Log current user ID for debugging
  useEffect(() => {
    if (user) {
      console.log("useThreadGenerator initialized with user ID:", user.id);
    } else {
      console.log("useThreadGenerator initialized without a user");
    }
  }, [user]);

  useEffect(() => {
    // Load transcript and sessionId from localStorage or state
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    const pendingTranscript = localStorage.getItem("pendingTranscript");
    
    // Use pendingTranscript first if available, then fall back to savedTranscript
    if (pendingTranscript) {
      console.log("Loading pending transcript from localStorage");
      setTranscript(pendingTranscript);
      // Clear from localStorage to prevent reloading on refresh
      localStorage.removeItem("pendingTranscript");
    } else if (savedTranscript) {
      setTranscript(savedTranscript);
    }
    
    // Try to get session ID from localStorage
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId) {
      console.log("Restoring session ID from localStorage:", savedSessionId);
      setSessionId(savedSessionId);
    }
    
    // Fetch tone examples immediately if we have a user
    if (user) {
      fetchToneExamples();
      
      // If we have a transcript but no sessionId, try to create a session
      if ((pendingTranscript || savedTranscript) && !savedSessionId && user) {
        createNewSession(pendingTranscript || savedTranscript || "");
      }
    }
  }, [user]);
  
  // Create a new session with the given transcript
  const createNewSession = async (transcriptText: string) => {
    if (!user) {
      console.log("Cannot create session: No authenticated user");
      return null;
    }
    
    try {
      console.log("Creating new session for user:", user.id);
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Session ${new Date().toLocaleString()}`,
          transcript: transcriptText || ""
        })
        .select();
      
      if (sessionError) {
        console.error("Failed to create session:", sessionError);
        throw sessionError;
      }
      
      if (sessionData && sessionData.length > 0) {
        const newSessionId = sessionData[0].id;
        console.log("Created new session with ID:", newSessionId);
        setSessionId(newSessionId);
        localStorage.setItem("currentSessionId", newSessionId);
        return newSessionId;
      } else {
        console.error("No session data returned after insert");
      }
    } catch (err) {
      console.error("Error in createNewSession:", err);
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
      
      if (data && data.length > 0 && data[0].example_tweets) {
        setExampleTweets(data[0].example_tweets);
        console.log("Loaded tone examples:", data[0].example_tweets);
      } else {
        console.log("No tone examples found for user");
      }
    } catch (err: any) {
      console.error("Failed to fetch tone examples:", err);
      setError("Failed to load tone examples. Please try again later.");
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
      // Use the utility function directly instead of the edge function
      const generatedTweets = await generateTweetsFromTranscript(text, 5, exampleTweets);
      
      setTweets(generatedTweets);
      
      // Ensure we have a session ID before saving tweets
      let activeSessionId = sessionId;
      
      // If we don't have a session ID, create a new session
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
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ 
              transcript: text,
              updated_at: new Date().toISOString()
            })
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
          }));
          
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
        
        if (data && data.length > 0) {
          const contentId = data[0].id;
          
          // Update the content in Supabase
          await supabase
            .from('generated_content')
            .update({ 
              content: newText,
              is_edited: true,
              updated_at: new Date().toISOString()
            })
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
        
        if (data && data.length > 0) {
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
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll,
    setSessionId,
    setTranscript,
    createNewSession
  };
};
