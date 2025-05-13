
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileVideo, Upload, Clock, Check, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/App";

// Simulated video data for the MVP
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

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const Dashboard = () => {
  const [videos, setVideos] = useState(mockVideos);
  const { user } = useAuth();
  
  // Use this effect to fetch user-specific videos when authentication is stable
  useEffect(() => {
    // This effect will only run once the user is properly authenticated
    if (user?.id) {
      // Here you would normally fetch user's videos from the database
      console.log("User authenticated, could fetch videos for:", user.id);
      // For now we're using mock data, but in a real app you'd fetch from API:
      // fetchUserVideos(user.id).then(data => setVideos(data));
    }
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Content</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/input-transcript">
              <FileText className="mr-2 h-4 w-4" />
              Input Transcript
            </Link>
          </Button>
          <Button asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Link>
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileVideo className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No videos yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Upload your first video to get started
            </p>
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <StatusBadge status={video.status} />
                </div>
                <CardDescription>{formatDate(video.created)}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                {video.status === "processing" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Processing</span>
                      <span>{video.progress}%</span>
                    </div>
                    <Progress value={video.progress} className="h-1" />
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                {video.status === "complete" ? (
                  <Button asChild className="w-full">
                    <Link to={`/transcript/${video.id}`}>
                      View Transcript
                    </Link>
                  </Button>
                ) : video.status === "failed" ? (
                  <Button variant="destructive" className="w-full">
                    Retry Processing
                  </Button>
                ) : (
                  <Button disabled className="w-full">
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

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "complete":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
};

export default Dashboard;
