
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Plus, Sparkles, Clock, Calendar, Sliders, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/App";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define types for our data
interface Session {
  id: string;
  title: string;
  created_at: string;
  transcript: string | null;
}

interface GeneratedContent {
  id: string;
  content: string;
  topic: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check for content-generated event
  useEffect(() => {
    const handleContentGenerated = (event: CustomEvent) => {
      console.log("Content generated event detected, refreshing sessions");
      const { sessionId, userId } = event.detail;
      console.log("Event details:", { sessionId, userId, currentUser: user?.id });
      
      // Only refresh if the event is for the current user
      if (userId === user?.id) {
        fetchSessions();
      }
    };
    
    // Type assertion to work with CustomEvent
    window.addEventListener('content-generated', handleContentGenerated as EventListener);
    
    return () => {
      window.removeEventListener('content-generated', handleContentGenerated as EventListener);
    };
  }, [user]);
  
  // Fetch sessions from Supabase
  const fetchSessions = async () => {
    if (!user?.id) {
      console.log("Cannot fetch sessions: No authenticated user");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Fetching sessions for user:", user.id);
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(6);
        
      if (sessionError) {
        console.error("Error fetching sessions:", sessionError);
        throw sessionError;
      }
      
      console.log("Fetched sessions:", sessionData?.length || 0);
      
      if (sessionData && sessionData.length > 0) {
        console.log("Session data sample:", sessionData[0]);
      }
      
      setSessions(sessionData || []);
      
      // If we just went through the content generation flow but no sessions were found,
      // show a message to the user
      if (location.state?.fromContentGeneration && (!sessionData || sessionData.length === 0)) {
        toast({
          title: "No content found",
          description: "Your content may not have been saved correctly. Try refreshing or generating again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error loading sessions",
        description: "Could not load your recent sessions. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for localStorage indicators that content was generated
  useEffect(() => {
    const checkForContentGeneration = () => {
      const lastGenerated = localStorage.getItem("lastContentGenerated");
      const currentSessionId = localStorage.getItem("currentSessionId");
      
      if (lastGenerated && currentSessionId) {
        const timestamp = new Date(lastGenerated).getTime();
        const now = new Date().getTime();
        const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
        
        // If content was generated in the last 5 minutes, refresh
        if (timestamp > fiveMinutesAgo) {
          console.log("Recent content generation detected, refreshing sessions");
          fetchSessions();
          
          // Clear the lastContentGenerated flag after refreshing
          localStorage.removeItem("lastContentGenerated");
        }
      }
    };
    
    checkForContentGeneration();
  }, []);

  // Check for returning from content generation
  useEffect(() => {
    const checkForReturnFromContent = () => {
      // Check if we're coming from a content generation page
      if (location.state?.fromContentGeneration) {
        console.log("Returning from content generation, refreshing sessions");
        fetchSessions();
      }
      
      // Check if there's a recently used session ID in localStorage
      const currentSessionId = localStorage.getItem("currentSessionId");
      if (currentSessionId) {
        console.log("Found session ID in localStorage, refreshing sessions");
        fetchSessions();
      }
    };
    
    checkForReturnFromContent();
  }, [location]);

  // Fetch sessions when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
  }, [user?.id]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setIsRefreshing(false);
  };

  const handleViewSession = (session: Session) => {
    navigate(`/session/${session.id}`, { 
      state: { 
        sessionId: session.id, 
        transcript: session.transcript 
      }
    });
  };

  // Format the session date for display
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Content Factory</h1>
        <p className="text-muted-foreground">Create and manage your content from one place</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create new session card */}
        <Card className="border bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-all">
          <Link to="/studio" className="block h-full">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="rounded-full bg-primary/10 p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Record New Session</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Create a new AI-assisted recording session
              </p>
            </CardContent>
          </Link>
        </Card>
        
        {/* Train tone card */}
        <Card className="border bg-gradient-to-br from-muted/40 to-muted/60 hover:shadow-md transition-all">
          <Link to="/train-tone" className="block h-full">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="rounded-full bg-background p-4 mb-4">
                <Sliders className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Train Your Tone</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Provide examples of your authentic voice
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
      
      <div className="flex items-center justify-between pt-4 pb-2 border-b">
        <h2 className="text-xl font-medium">Recent Activity</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" /> Last 30 days
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <Card className="col-span-full border-dashed bg-background/50">
            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">Loading your sessions...</p>
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="col-span-full border-dashed bg-background/50">
            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-5">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No recent activity</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Your recent content creation sessions will appear here
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/studio">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Session
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleViewSession(session)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{session.title}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {formatSessionDate(session.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.transcript ? (
                    session.transcript.substring(0, 100) + (session.transcript.length > 100 ? '...' : '')
                  ) : (
                    <span className="italic">No transcript available</span>
                  )}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                >
                  View Content
                  <MessageSquare className="ml-2 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      <div className="pt-8">
        <h2 className="text-xl font-medium mb-4">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record a Session</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start a new recording session with our AI assistant to generate content ideas or discuss topics.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/studio">
                  <Mic className="mr-2 h-4 w-4" />
                  Go to Studio
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Train Your Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Provide examples of your authentic voice to improve content generation.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/train-tone">
                  <Sliders className="mr-2 h-4 w-4" />
                  Train Tone
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
