
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
  const [step, setStep] = useState<"style-selection" | "tweet-generation">("style-selection");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load transcript and selected style from localStorage
    const savedTranscript = localStorage.getItem("tweetGenerationTranscript");
    const savedStyle = localStorage.getItem("tweetGenerationStyle") || "my-voice";
    
    if (savedTranscript) {
      setTranscript(savedTranscript);
      setSelectedStyle(savedStyle);
      
      // Auto-generate tweets if we have a transcript already
      generateTweets(savedTranscript, savedStyle);
    }
  }, []);
  
  const generateTweets = async (text = transcript, style = selectedStyle) => {
    if (!text.trim()) {
      toast({
        title: "Empty transcript",
        description: "Please provide a transcript to generate tweets from.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-threads', {
        body: { 
          transcript: text,
          styleId: style,
          count: 5
        }
      });
      
      if (error) throw new Error(error.message);
      
      console.log("Response from generate-threads:", data);
      
      if (data && Array.isArray(data.tweets)) {
        setTweets(data.tweets);
        setStep("tweet-generation"); // Move to tweet viewing after generation
      } else {
        throw new Error("Invalid response format from tweet generation. Expected tweets array.");
      }
    } catch (err: any) {
      console.error("Failed to generate tweets:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate tweets",
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
      title: "Tweet copied",
      description: "Tweet has been copied to clipboard",
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
    a.download = "tweet-thread.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleStyleChange = (newStyle: string) => {
    setSelectedStyle(newStyle);
    localStorage.setItem("tweetGenerationStyle", newStyle);
  };
  
  const handleBackToTranscript = () => {
    navigate("/transcript-editor", { state: { transcript } });
  };

  // Step 1: Style Selection
  if (step === "style-selection") {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-3xl font-bold">Select Your Tweet Style</h1>
          <p className="text-muted-foreground mt-1">
            Choose a style for your tweet thread before generating
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="space-y-4 md:col-span-1 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tweet Style</CardTitle>
              </CardHeader>
              <CardContent>
                <StyleSelector 
                  selectedStyle={selectedStyle}
                  onChange={handleStyleChange}
                />
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={handleBackToTranscript}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Transcript
                </Button>
                <Button 
                  onClick={() => generateTweets()}
                  disabled={isGenerating || !transcript.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Tweets...
                    </>
                  ) : (
                    <>
                      Generate Tweets 
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="hidden lg:block lg:col-span-1">
            {/* Optional: Show a preview or explanation */}
            <Card>
              <CardHeader>
                <CardTitle>About Tweet Styles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Each style represents a unique voice and approach to creating content.
                  Select the style that best matches how you want your tweets to sound.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Tweet Generation Result
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Generated Tweet Thread</h1>
        <p className="text-muted-foreground mt-1">
          Review and edit your tweets before sharing
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Options panel */}
        <div className="space-y-4 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tweet Style</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Current style: <strong>{selectedStyle}</strong>
              </p>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setStep("style-selection")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Style
              </Button>
              <Button onClick={handleRegenerateTweets} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
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
                  Download All Tweets
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Generated tweets */}
        <div className="space-y-4 md:col-span-2">
          {isGenerating ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-24 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                      <div className="h-4 bg-muted rounded w-4/6"></div>
                    </div>
                  </CardContent>
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
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {transcript.trim() 
                    ? "Generating tweets from your transcript..." 
                    : "Please provide a transcript to generate tweets from."}
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
