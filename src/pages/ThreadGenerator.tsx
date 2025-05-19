
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Copy, Download, Edit, Trash, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { StyleSelector } from "@/components/StyleSelector";
import { Skeleton } from "@/components/ui/skeleton";

interface Tweet {
  tweet: string;
  topic?: string;
  edited?: boolean;
}

const ThreadGenerator = () => {
  const [transcript, setTranscript] = useState<string>("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<string>("my-voice");
  const { toast } = useToast();
  const navigate = useNavigate();
  
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

  const handleRegenerateTweets = () => {
    generateTweets();
  };
  
  const handleCopyTweet = (tweet: string) => {
    navigator.clipboard.writeText(tweet);
    toast({
      title: "Content copied",
      description: "Content has been copied to clipboard",
    });
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
  
  const handleBackToTranscript = () => {
    navigate("/transcript-editor", { state: { transcript } });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Generated Content</h1>
        <p className="text-muted-foreground mt-1">
          Review and edit your authentic content before sharing
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Options panel */}
        <div className="space-y-4 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Voice & Style</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your content is generated in your authentic voice - raw and unfiltered.
              </p>
              
              <Button 
                onClick={handleRegenerateTweets} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Regenerate Content
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={handleBackToTranscript}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transcript
              </Button>
            </CardFooter>
          </Card>
          
          {tweets.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  className="w-full"
                  onClick={handleDownloadAll}
                  variant="secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Content
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Generated content */}
        <div className="space-y-4 md:col-span-2">
          {isGenerating ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Card key={i} className="border border-muted">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full justify-between">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : tweets.length > 0 ? (
            <div className="space-y-4">
              {tweets.map((tweet, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    {tweet.topic && (
                      <Badge variant="outline" className="text-xs">
                        {tweet.topic}
                      </Badge>
                    )}
                    {tweet.edited && (
                      <Badge variant="secondary" className="text-xs">
                        Edited
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={tweet.tweet} 
                      onChange={(e) => handleUpdateTweet(index, e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-between mt-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTweet(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyTweet(tweet.tweet)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/5">
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {transcript.trim() 
                    ? "Generating authentic content from your transcript..." 
                    : "Please provide a transcript to generate content from."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadGenerator;
