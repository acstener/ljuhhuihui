
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, Copy, Play, FileVideo, Twitter, 
  RefreshCcw, ArrowLeft, Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/App";

// Default thread structure for type safety
const defaultThread = {
  id: "1",
  title: "Loading...",
  tweets: [
    { id: "1-1", text: "Loading tweets..." }
  ]
};

const ThreadGenerator = () => {
  const { clipId } = useParams<{ clipId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([defaultThread]);
  const [activeThread, setActiveThread] = useState(defaultThread);
  const [activeTabId, setActiveTabId] = useState(defaultThread.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [tonePreferences, setTonePreferences] = useState<any[]>([]);
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  
  // Load generated threads from localStorage
  useEffect(() => {
    const loadThreads = () => {
      if (clipId === 'new') {
        try {
          const storedThreads = localStorage.getItem('generatedThreads');
          if (storedThreads) {
            const parsedThreads = JSON.parse(storedThreads).threads || [];
            if (parsedThreads.length > 0) {
              setThreads(parsedThreads);
              setActiveThread(parsedThreads[0]);
              setActiveTabId(parsedThreads[0].id);
            }
          }
        } catch (err) {
          console.error('Error loading stored threads:', err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load generated threads.",
          });
        }
      } else {
        // Here you would fetch specific threads from an API if needed
        // For now we'll use the mock data from the initial implementation
      }
    };
    
    loadThreads();
  }, [clipId, toast]);

  // Load tone preferences
  useEffect(() => {
    const fetchTonePreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('tone_preferences')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setTonePreferences(data || []);
        
        // Set first tone as default if available
        if (data && data.length > 0 && !selectedToneId) {
          setSelectedToneId(data[0].id);
        }
        
      } catch (error) {
        console.error('Error fetching tone preferences:', error);
      }
    };
    
    fetchTonePreferences();
  }, [user]);
  
  const handleCopyTweet = (tweetId: string, text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setIsCopied({...isCopied, [tweetId]: true});
        
        toast({
          title: "Copied to clipboard",
          description: "Tweet copied successfully",
        });
        
        // Reset "Copied" state after 2 seconds
        setTimeout(() => {
          setIsCopied((prev) => ({...prev, [tweetId]: false}));
        }, 2000);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy to clipboard",
        });
      });
  };
  
  const handleTweetChange = (threadId: string, tweetId: string, newText: string) => {
    setThreads(threads.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          tweets: thread.tweets.map((tweet: any) => {
            if (tweet.id === tweetId) {
              return { ...tweet, text: newText };
            }
            return tweet;
          })
        };
      }
      return thread;
    }));
    
    // Also update activeThread if it's the one being edited
    if (threadId === activeThread.id) {
      setActiveThread({
        ...activeThread,
        tweets: activeThread.tweets.map((tweet: any) => {
          if (tweet.id === tweetId) {
            return { ...tweet, text: newText };
          }
          return tweet;
        })
      });
    }
    
    // Update localStorage with the edited threads
    localStorage.setItem('generatedThreads', JSON.stringify({ threads }));
  };
  
  const handleRegenerateThreads = async () => {
    // Get the original transcript from localStorage if available
    const storedData = localStorage.getItem('generatedThreads');
    if (!storedData) {
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: "Original transcript not found. Please go back and start again.",
      });
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedData);
      
      // If we don't have the original transcript, we can't regenerate
      if (!parsedData.originalTranscript) {
        toast({
          variant: "destructive",
          title: "Regeneration Failed",
          description: "Original transcript not found. Please go back and start again.",
        });
        return;
      }
      
      setIsGenerating(true);
      
      // Get selected tone preference if one is selected
      let tonePreference = null;
      if (selectedToneId) {
        tonePreference = tonePreferences.find(tone => tone.id === selectedToneId);
      }
      
      // Call the edge function to regenerate threads
      const { data, error } = await supabase.functions.invoke('generate-threads', {
        body: { 
          transcript: parsedData.originalTranscript,
          tonePreference: tonePreference
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update state with new threads
      setThreads(data.threads);
      setActiveThread(data.threads[0]);
      setActiveTabId(data.threads[0].id);
      
      // Update localStorage
      localStorage.setItem('generatedThreads', JSON.stringify({
        originalTranscript: parsedData.originalTranscript,
        threads: data.threads
      }));
      
      toast({
        title: "Threads Regenerated",
        description: "New thread variations have been created",
      });
    } catch (error) {
      console.error("Error regenerating threads:", error);
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate threads. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle tab change
  useEffect(() => {
    const selectedThread = threads.find(t => t.id === activeTabId);
    if (selectedThread) {
      setActiveThread(selectedThread);
    }
  }, [activeTabId, threads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/input-transcript')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Input
          </Button>
          <h1 className="text-3xl font-bold">Tweet Threads</h1>
          <p className="text-muted-foreground mt-1">
            Edit and export your generated tweet threads
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread preview and actions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Twitter className="h-5 w-5 mr-2 text-[#1DA1F2]" />
                  Thread Preview
                </div>
                <div className="flex items-center gap-2">
                  {tonePreferences.length > 0 && (
                    <div className="flex items-center">
                      <label htmlFor="tone-select" className="text-sm mr-2">
                        Tone:
                      </label>
                      <Select 
                        value={selectedToneId || ""} 
                        onValueChange={value => setSelectedToneId(value)}
                      >
                        <SelectTrigger className="w-[180px]" id="tone-select">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {tonePreferences.map(tone => (
                            <SelectItem key={tone.id} value={tone.id}>
                              {tone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateThreads}
                    disabled={isGenerating}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    {isGenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {threads.length > 0 ? (
                <Tabs value={activeTabId} onValueChange={setActiveTabId}>
                  <TabsList className="grid grid-cols-3">
                    {threads.map((thread) => (
                      <TabsTrigger key={thread.id} value={thread.id}>
                        {thread.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {threads.map((thread) => (
                    <TabsContent key={thread.id} value={thread.id} className="space-y-4 pt-4">
                      {thread.tweets.map((tweet: any, index: number) => (
                        <Card key={tweet.id} className="relative">
                          <CardContent className="pt-6">
                            <div className="absolute top-3 left-3 text-xs font-medium text-muted-foreground">
                              Tweet {index + 1}
                            </div>
                            
                            <Textarea
                              value={tweet.text}
                              onChange={(e) => handleTweetChange(thread.id, tweet.id, e.target.value)}
                              className="min-h-[100px] resize-none"
                            />
                            
                            <div className="flex justify-between items-center mt-3">
                              <div className="text-xs text-muted-foreground">
                                {tweet.text.length} / 280 characters
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyTweet(tweet.id, tweet.text)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {isCopied[tweet.id] ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <p>No threads available. Please generate threads first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Video clips */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                Selected Tone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedToneId ? (
                (() => {
                  const selectedTone = tonePreferences.find(tone => tone.id === selectedToneId);
                  return selectedTone ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium">{selectedTone.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{selectedTone.description}</p>
                      </div>
                      
                      {selectedTone.example_tweets && selectedTone.example_tweets.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Example Tweets:</h4>
                          <div className="space-y-2">
                            {selectedTone.example_tweets.map((tweet: string, idx: number) => (
                              <div key={idx} className="text-sm border-l-2 border-muted pl-3 py-1">
                                "{tweet}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Tone information not available</p>
                  );
                })()
              ) : (
                <p className="text-center text-muted-foreground">
                  {tonePreferences.length > 0 
                    ? "Select a tone to customize your thread's voice" 
                    : "Add tones in the dashboard to customize your thread's voice"}
                </p>
              )}
              
              <Button onClick={handleRegenerateThreads} className="w-full" disabled={isGenerating}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate with Selected Tone"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileVideo className="h-5 w-5 mr-2" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Thread as PDF
              </Button>
              
              <Button variant="outline" className="w-full">
                <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2]" />
                Schedule Thread
              </Button>
              
              <p className="text-xs text-center text-muted-foreground pt-4">
                More export options coming soon
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Thread Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tweets:</span>
                  <span className="font-medium">{activeThread?.tweets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Tweet Length:</span>
                  <span className="font-medium">
                    {activeThread?.tweets?.length 
                      ? Math.round(activeThread.tweets.reduce((sum: number, t: any) => sum + t.text.length, 0) / activeThread.tweets.length) 
                      : 0} chars
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thread Type:</span>
                  <span className="font-medium">{activeThread?.title || "N/A"}</span>
                </div>
                {selectedToneId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tone of Voice:</span>
                    <span className="font-medium">
                      {tonePreferences.find(tone => tone.id === selectedToneId)?.name || "Custom"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThreadGenerator;
