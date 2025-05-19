
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    // Load transcript from localStorage
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    
    if (savedTranscript) {
      setTranscript(savedTranscript);
      
      // Fetch tone preferences
      fetchToneExamples();
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

  const generateTweets = async (text = transcript) => {
    if (!text.trim()) {
      toast({
        title: "Empty transcript",
        description: "Please provide a transcript to generate content from.",
        variant: "destructive"
      });
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-threads', {
        body: { 
          transcript: text,
          count: 5,
          exampleTweets: exampleTweets
        }
      });
      
      if (error) throw new Error(error.message);
      
      console.log("Response from generate-threads:", data);
      
      if (data && Array.isArray(data.tweets)) {
        setTweets(data.tweets);
      } else if (data && data.error) {
        // Handle error response from the function
        throw new Error(`API Error: ${data.error}`);
      } else {
        throw new Error("Invalid response format from content generation. Expected tweets array.");
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

  const handleUpdateTweet = (index: number, newText: string) => {
    const updatedTweets = [...tweets];
    updatedTweets[index] = {
      ...updatedTweets[index],
      tweet: newText,
      edited: true
    };
    setTweets(updatedTweets);
  };
  
  const handleDeleteTweet = (index: number) => {
    const updatedTweets = tweets.filter((_, i) => i !== index);
    setTweets(updatedTweets);
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
    tweets,
    isGenerating,
    exampleTweets,
    error,
    generateTweets,
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll
  };
};
