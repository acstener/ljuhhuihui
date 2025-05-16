
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Plus, Sparkles, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/App";
import { TonePreferencesDrawer } from "@/components/TonePreferencesDrawer";
import { formatDate } from "@/lib/utils";

const mockSessions = [
  {
    id: "1",
    title: "Product Launch Strategy",
    duration: "24 min",
    created: "2023-05-10T12:00:00Z",
    participants: 3,
    messages: 42
  },
  {
    id: "2",
    title: "Content Marketing Planning",
    duration: "42 min",
    created: "2023-05-08T15:30:00Z",
    participants: 4,
    messages: 68
  },
  {
    id: "3",
    title: "Quarterly Goals Review",
    duration: "38 min",
    created: "2023-05-05T09:15:00Z",
    participants: 6,
    messages: 53
  }
];

const Dashboard = () => {
  const [sessions, setSessions] = useState(mockSessions);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      console.log("User authenticated, fetching sessions for:", user.id);
      // In a real implementation, we would fetch sessions from the database here
    }
  }, [user?.id]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your Jam Sessions</h1>
        <p className="text-muted-foreground">Review and continue your previous sessions</p>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
            {sessions.length} Sessions
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            <Calendar className="w-3 h-3 mr-1" /> Last 30 days
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <TonePreferencesDrawer trigger={
            <Button variant="outline" size="sm" className="h-9">
              <Sparkles className="mr-2 h-4 w-4" />
              Tone Preferences
            </Button>
          } />
          
          <Button size="sm" className="h-9" asChild>
            <Link to="/studio">
              <Mic className="mr-2 h-4 w-4" />
              New Session
            </Link>
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed bg-background/50">
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-5">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No jam sessions yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Start a new session to collaborate with your team and AI assistants
            </p>
            <Button asChild>
              <Link to="/studio">
                <Mic className="mr-2 h-4 w-4" />
                Start New Session
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="border-dashed bg-background/50 hover:bg-background/80 transition-colors group">
            <Link to="/studio" className="block h-full">
              <CardContent className="flex flex-col items-center justify-center h-full p-8">
                <div className="rounded-full bg-primary/10 p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Start New Session</h3>
                <p className="text-sm text-muted-foreground mt-1">Collaborate with your team and AI</p>
              </CardContent>
            </Link>
          </Card>
          
          {sessions.map((session) => (
            <Card key={session.id} className="border bg-card hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-medium line-clamp-1">{session.title}</CardTitle>
                    <CardDescription className="flex items-center text-xs mt-1">
                      <Clock className="h-3 w-3 mr-1 opacity-70" /> {formatDate(session.created)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {session.duration}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    {session.messages} messages
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button asChild className="w-full" size="sm">
                  <Link to={`/studio/${session.id}`}>
                    Continue Session
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
