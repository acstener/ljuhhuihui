
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Plus, Sparkles, Clock, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/App";
import { TonePreferencesDrawer } from "@/components/TonePreferencesDrawer";
import { formatDate } from "@/lib/utils";

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
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
        <h1 className="text-3xl font-semibold tracking-tight">Content Factory</h1>
        <p className="text-muted-foreground">Create and manage your content from one place</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        
        {/* Input transcript card */}
        <Card className="border bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-md transition-all">
          <Link to="/transcript-editor" className="block h-full">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="rounded-full bg-secondary/10 p-4 mb-4 group-hover:bg-secondary/20 transition-colors">
                <FileText className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-lg font-medium">Create from Text</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Generate content from a text transcript
              </p>
            </CardContent>
          </Link>
        </Card>
        
        {/* Tone preferences card */}
        <Card className="border bg-gradient-to-br from-muted/40 to-muted/60 hover:shadow-md transition-all">
          <CardContent className="flex flex-col items-center justify-center h-full p-8">
            <div className="rounded-full bg-background p-4 mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Customize Output</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center mb-4">
              Set your tone preferences for generated content
            </p>
            <TonePreferencesDrawer trigger={
              <Button variant="outline" size="sm" className="mt-2">
                <Sparkles className="mr-2 h-4 w-4" />
                Tone Preferences
              </Button>
            } />
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between pt-4 pb-2 border-b">
        <h2 className="text-xl font-medium">Recent Activity</h2>
        <Badge variant="outline" className="text-xs">
          <Calendar className="w-3 h-3 mr-1" /> Last 30 days
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.length === 0 ? (
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
                <Button variant="outline" asChild>
                  <Link to="/input-transcript">
                    <FileText className="mr-2 h-4 w-4" />
                    Input Text
                  </Link>
                </Button>
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
          // This section would display actual sessions if there were any
          <p className="col-span-full text-center text-muted-foreground py-8">
            Session history will appear here
          </p>
        )}
      </div>
      
      <div className="pt-8">
        <h2 className="text-xl font-medium mb-4">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <CardTitle className="text-lg">Input Your Text</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Have existing text or transcripts? Input them directly to generate tweet threads.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/transcript-editor">
                  <FileText className="mr-2 h-4 w-4" />
                  Input Text
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customize how your content is generated by setting your tone preferences.
              </p>
            </CardContent>
            <CardFooter>
              <TonePreferencesDrawer trigger={
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tone Settings
                </Button>
              } />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
