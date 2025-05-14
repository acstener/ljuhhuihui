
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileVideo, Upload, Clock, Check, X, FileText, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/App";
import { TonePreferencesDrawer } from "@/components/TonePreferencesDrawer";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatDuration, formatDate } from "@/lib/utils";

// Production-ready video data that will be replaced with real API calls
const mockVideos = [
  {
    id: "1",
    title: "How to Use React Hooks",
    status: "complete",
    duration: 325, // seconds
    created: "2023-05-10T12:00:00Z",
    thumbnail: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    id: "2",
    title: "Typescript Tips and Tricks",
    status: "processing",
    progress: 60,
    duration: 542, // seconds
    created: "2023-05-08T15:30:00Z",
    thumbnail: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    id: "3",
    title: "Next.js Authentication Strategies",
    status: "failed",
    duration: 420, // seconds
    created: "2023-05-05T09:15:00Z",
    thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29kaW5nfGVufDB8fDB8fHww"
  }
];

const Dashboard = () => {
  const [videos, setVideos] = useState(mockVideos);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      console.log("User authenticated, fetching videos for:", user.id);
      // Future API call will replace this
    }
  }, [user?.id]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your Content</h1>
        <p className="text-muted-foreground">Manage and create content for your audience</p>
      </div>
      
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
            {videos.length} Items
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            <Check className="w-3 h-3 mr-1" /> {videos.filter(v => v.status === 'complete').length} Complete
          </Badge>
          {videos.filter(v => v.status === 'processing').length > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-xs font-medium">
              <Clock className="w-3 h-3 mr-1" /> {videos.filter(v => v.status === 'processing').length} Processing
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <TonePreferencesDrawer trigger={
            <Button variant="outline" size="sm" className="h-9">
              <Sparkles className="mr-2 h-4 w-4" />
              Tone Preferences
            </Button>
          } />
          
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link to="/input-transcript">
              <FileText className="mr-2 h-4 w-4" />
              Text Input
            </Link>
          </Button>
          
          <Button size="sm" className="h-9" asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Link>
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed bg-background/50">
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-5">
              <FileVideo className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No content yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload a video or input text to start creating engaging content for your audience
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/input-transcript">
                  <FileText className="mr-2 h-4 w-4" />
                  Text Input
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Add content card */}
          <Card className="border-dashed bg-background/50 hover:bg-background/80 transition-colors group">
            <Link to="/upload" className="block h-full">
              <CardContent className="flex flex-col items-center justify-center h-full p-8">
                <div className="rounded-full bg-primary/10 p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Add New Content</h3>
                <p className="text-sm text-muted-foreground mt-1">Upload a video or input text</p>
              </CardContent>
            </Link>
          </Card>
          
          {/* Content cards */}
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden border bg-card hover:shadow-md transition-all">
              <div className="relative">
                <AspectRatio ratio={16/9}>
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute top-2 right-2">
                  <StatusBadge status={video.status} />
                </div>
              </div>
              
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg font-medium line-clamp-1">{video.title}</CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1 opacity-70" /> {formatDate(video.created)}
                </CardDescription>
              </CardHeader>
              
              {video.status === "processing" && (
                <CardContent className="pb-2 pt-0">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Processing</span>
                      <span className="text-muted-foreground">{video.progress}%</span>
                    </div>
                    <Progress value={video.progress} className="h-1" />
                  </div>
                </CardContent>
              )}
              
              <CardFooter className="pt-0">
                {video.status === "complete" ? (
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/transcript/${video.id}`}>
                      View Transcript
                    </Link>
                  </Button>
                ) : video.status === "failed" ? (
                  <Button variant="destructive" className="w-full" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Retry Processing
                  </Button>
                ) : (
                  <Button disabled className="w-full" size="sm">
                    <Clock className="mr-2 h-4 w-4 animate-pulse" />
                    Processing...
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// StatusBadge component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case "complete":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">
          <Check className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-0">
          <X className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
};

export default Dashboard;
