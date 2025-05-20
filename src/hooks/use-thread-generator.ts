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

  useEffect(() => {
    // Load transcript and sessionId from localStorage or state
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    
    if (savedTranscript) {
      setTranscript(savedTranscript);
      
      // Fetch tone preferences
      fetchToneExamples();
    }
    
    // Try to get session ID from localStorage
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  // Fetch tone examples from user's preferences
  const fetchToneExamples = async () => {
    try {
      const { data, error } = await supabase
        .from("tone_preferences")
        .select("example_tweets")
        .limit(1)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      if (data && data.length > 0 && data[0].example_tweets) {
        setExampleTweets(data[0].example_tweets);
        console.log("Loaded tone examples:", data[0].example_tweets);
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
    
    setError(null);
    setIsGenerating(true);
    
    try {
      // Use the utility function directly instead of the edge function
      const generatedTweets = await generateTweetsFromTranscript(text, 5, exampleTweets);
      
      setTweets(generatedTweets);
      
      // If we have a user and session ID, save tweets to Supabase
      if (user && sessionId) {
        try {
          const tweetsToSave = generatedTweets.map((tweet: GeneratedTweet) => ({
            user_id: user.id,
            session_id: sessionId,
            content: tweet.tweet,
            topic: tweet.topic || null
          }));
          
          const { error: insertError } = await supabase
            .from('generated_content')
            .insert(tweetsToSave);
            
          if (insertError) throw insertError;
          
          console.log("Saved generated content to Supabase");
        } catch (err) {
          console.error("Failed to save generated content:", err);
        }
      } else if (user && !sessionId && text) {
        // If we don't have a session ID but have a transcript, create a new session
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              title: `Session ${new Date().toLocaleString()}`,
              transcript: text
            })
            .select();
          
          if (sessionError) throw sessionError;
          if (sessionData && sessionData.length > 0) {
            const activeSessionId = sessionData[0].id;
            setSessionId(activeSessionId);
            localStorage.setItem("currentSessionId", activeSessionId);
            
            // Now save the tweets
            const tweetsToSave = generatedTweets.map((tweet: GeneratedTweet) => ({
              user_id: user.id,
              session_id: activeSessionId,
              content: tweet.tweet,
              topic: tweet.topic || null
            }));
            
            const { error: insertError } = await supabase
              .from('generated_content')
              .insert(tweetsToSave);
              
            if (insertError) throw insertError;
          }
        } catch (err) {
          console.error("Failed to create session:", err);
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
    setSessionId
  };
};
