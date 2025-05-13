
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, Play, FileVideo, Twitter, RefreshCcw } from "lucide-react";

// Mock thread data for the MVP
const initialThreads = [
  {
    id: "1",
    title: "Introduction to React Hooks",
    tweets: [
      {
        id: "1-1",
        text: "🔥 Just dropped a new tutorial on React Hooks! Learn how these powerful features can transform your functional components and make your code cleaner and more maintainable. #ReactJS #WebDev"
      },
      {
        id: "1-2",
        text: "✅ useState: Add state to functional components\n✅ useEffect: Handle side effects like data fetching\n✅ Pro tip: Use dependency arrays to control when effects run"
      },
      {
        id: "1-3",
        text: "Want to level up your React skills? Check out my full tutorial where I build a complete app using hooks from scratch. Link in bio! #ReactHooks #FrontendDevelopment"
      }
    ]
  },
  {
    id: "2",
    title: "React Hooks Deep Dive",
    tweets: [
      {
        id: "2-1",
        text: "💡 Did you know? React Hooks were introduced in React 16.8 and completely changed how we build components. No more class components needed! #ReactJS #FrontendTips"
      },
      {
        id: "2-2",
        text: "🧵 useState vs useReducer:\n\n• useState: Perfect for simple state\n• useReducer: Better for complex state logic\n\nBonus: You can even combine them for maximum flexibility! #ReactHooks"
      },
      {
        id: "2-3",
        text: "Want to see these hooks in action? I've created a GitHub repo with examples of every React hook and when to use each one. Check it out! #CodeSamples #WebDevelopment"
      }
    ]
  },
  {
    id: "3",
    title: "React Performance Tips",
    tweets: [
      {
        id: "3-1",
        text: "⚡️ Performance matters! Here's how React hooks can help you build blazing-fast web apps without the complexity. #WebPerformance #ReactJS"
      },
      {
        id: "3-2", 
        text: "🔍 Two hooks that boost performance:\n\n• useMemo: Memoize expensive calculations\n• useCallback: Prevent unnecessary re-renders\n\nImplement these and watch your app fly! #ReactHooks"
      },
      {
        id: "3-3",
        text: "I'm hosting a free workshop next week on optimizing React applications. Bring your performance problems and we'll solve them together! Sign up link in bio. #WebDev #Workshop"
      }
    ]
  }
];

const ThreadGenerator = () => {
  const { clipId } = useParams<{ clipId: string }>();
  const { toast } = useToast();
  const [threads, setThreads] = useState(initialThreads);
  const [activeThread, setActiveThread] = useState(threads[0]);
  const [activeTabId, setActiveTabId] = useState(threads[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  
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
          tweets: thread.tweets.map(tweet => {
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
        tweets: activeThread.tweets.map(tweet => {
          if (tweet.id === tweetId) {
            return { ...tweet, text: newText };
          }
          return tweet;
        })
      });
    }
  };
  
  const handleRegenerateThreads = () => {
    setIsGenerating(true);
    
    // Simulate API call to regenerate threads
    setTimeout(() => {
      // In a real app, this would call the OpenAI API via Supabase Edge Function
      toast({
        title: "Threads regenerated",
        description: "New thread variations have been created",
      });
      setIsGenerating(false);
    }, 2000);
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
      <div>
        <h1 className="text-3xl font-bold">Tweet Threads</h1>
        <p className="text-muted-foreground mt-1">
          Edit and export your generated tweet threads
        </p>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateThreads}
                  disabled={isGenerating}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    {thread.tweets.map((tweet, index) => (
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
            </CardContent>
          </Card>
        </div>
        
        {/* Video clips */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileVideo className="h-5 w-5 mr-2" />
                Video Clips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-white text-sm font-medium">
                    "These hooks are essential for building modern React applications."
                  </p>
                </div>
              </div>
              
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download MP4
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Clip 1 of 3 • 5 seconds
              </p>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">All Clips</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`aspect-video bg-muted rounded overflow-hidden cursor-pointer border-2 ${i === 1 ? 'border-primary' : 'border-transparent'}`}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
                        alt={`Clip ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThreadGenerator;
