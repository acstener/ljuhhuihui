
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
  const { toast } = useToast();

  useEffect(() => {
    // Load transcript from localStorage
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    
    if (savedTranscript) {
      setTranscript(savedTranscript);
      
      // Auto-generate content if we have a transcript already
      generateTweets(savedTranscript);
    }
  }, []);

  const generateTweets = async (text = transcript) => {
    if (!text.trim()) {
      toast({
        title: "Empty transcript",
        description: "Please provide a transcript to generate content from.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-threads', {
        body: { 
          transcript: text,
          count: 5
        }
      });
      
      if (error) throw new Error(error.message);
      
      console.log("Response from generate-threads:", data);
      
      if (data && Array.isArray(data.tweets)) {
        setTweets(data.tweets);
      } else {
        throw new Error("Invalid response format from content generation. Expected tweets array.");
      }
    } catch (err: any) {
      console.error("Failed to generate content:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate content",
        variant: "destructive"
      });
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
    generateTweets,
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll
  };
};
