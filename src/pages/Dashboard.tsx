
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Plus, Sparkles, Clock, Calendar, Sliders, RefreshCw, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/App";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDashboardSessions } from "@/hooks/useDashboardSessions";

// Define types for our data
interface Session {
  id: string;
  title: string;
  created_at: string;
  transcript: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_dimensions: { width: number, height: number } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Use our new custom hook for session management
  const { 
    sessions, 
    isLoading, 
    isRefreshing, 
    handleRefresh 
  } = useDashboardSessions();

  // Debug output for user state
  useEffect(() => {
    if (user) {
      console.log("Dashboard - User authenticated:", user.id);
    } else {
      console.log("Dashboard - No authenticated user");
    }
    
    if (location.state) {
      console.log("Dashboard - Location state:", location.state);
    }
  }, [user, location.state]);

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

  // Format video duration for display
  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                  {session.video_url && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {session.video_duration && (
                        <span>{formatDuration(session.video_duration)}</span>
                      )}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {formatSessionDate(session.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {session.video_url ? (
                  <div className="mb-2 relative pt-[56.25%] bg-muted rounded overflow-hidden">
                    <video 
                      src={session.video_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      poster={session.video_url ? `${session.video_url}#t=0.5` : undefined}
                      preload="metadata"
                    />
                  </div>
                ) : null}
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
    </div>
  );
};

export default Dashboard;
