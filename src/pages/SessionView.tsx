
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/components/thread/ContentItem";

interface Tweet {
  id: string;
  content: string;
  topic: string | null;
  is_edited: boolean | null;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  transcript: string | null;
  created_at: string;
}

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session and its content
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (sessionError) throw sessionError;
        
        if (!sessionData) {
          throw new Error("Session not found");
        }
        
        setSession(sessionData);
        
        // Fetch generated content for this session
        const { data: contentData, error: contentError } = await supabase
          .from('generated_content')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true });
          
        if (contentError) throw contentError;
        
        setTweets(contentData || []);
      } catch (error: any) {
        console.error("Error fetching session data:", error);
        setError(error.message || "Failed to load session data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [id]);

  const handleCopyTweet = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Content copied",
      description: "Content has been copied to clipboard",
    });
  };
  
  const handleUpdateTweet = async (id: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('generated_content')
        .update({ 
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setTweets(prev => prev.map(tweet => 
        tweet.id === id 
          ? { ...tweet, content: newContent, is_edited: true }
          : tweet
      ));
      
      toast({
        title: "Content updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Failed to update content:", error);
      toast({
        title: "Update failed",
        description: "Could not save your changes",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteTweet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setTweets(prev => prev.filter(tweet => tweet.id !== id));
      
      toast({
        title: "Content deleted",
        description: "The item has been removed",
      });
    } catch (error) {
      console.error("Failed to delete content:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the content",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleGenerateMore = () => {
    navigate('/generate/new', { 
      state: { 
        sessionId: id, 
        transcript: session?.transcript 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold">Loading session...</h1>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="space-y-6 pb-8">
        <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
          <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="mt-2 text-muted-foreground">{error || "Session not found"}</p>
            <Button onClick={handleBackToDashboard} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
          <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
        </Button>
      </div>
      
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <Badge className="text-xs">
            {formatDate(session.created_at)}
          </Badge>
        </div>
        
        {session.transcript && (
          <Card className="mt-4 bg-muted/30">
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium mb-2">Transcript</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                {session.transcript}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 pb-2 border-b">
        <h2 className="text-xl font-medium">Generated Content</h2>
        <Button variant="outline" size="sm" onClick={handleGenerateMore}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate More
        </Button>
      </div>
      
      {tweets.length > 0 ? (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <ContentItem
              key={tweet.id}
              content={{
                tweet: tweet.content,
                topic: tweet.topic || undefined,
                edited: tweet.is_edited || false
              }}
              index={tweet.id}
              onUpdate={(_, newContent) => handleUpdateTweet(tweet.id, newContent)}
              onDelete={() => handleDeleteTweet(tweet.id)}
              onCopy={handleCopyTweet}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No content has been generated for this session yet.</p>
            <Button onClick={handleGenerateMore} className="mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionView;
