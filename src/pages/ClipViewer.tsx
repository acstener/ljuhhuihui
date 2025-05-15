
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoData {
  id: string;
  originalUrl: string;
  clipUrl: string | null;
  status: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
}

const ClipViewer = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Function to fetch video data
  const fetchVideoData = async () => {
    if (!videoId) return;
    
    try {
      setLoading(true);
      
      // Get the authenticated user's token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      // Call our video-status function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/video-status/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load video data');
      }
      
      const data = await response.json();
      setVideoData(data.video);
      
      // If the video is still processing, poll for updates
      if (data.video.status === 'processing' || data.video.status === 'uploaded') {
        setTimeout(fetchVideoData, 2000); // Poll every 2 seconds
      }
      
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load video data",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchVideoData();
  }, [videoId]);
  
  const handleDownload = () => {
    if (videoData?.clipUrl) {
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = videoData.clipUrl;
      link.download = `clip-${videoData.filename || 'video'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/upload')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
      </Button>
      
      <h1 className="text-3xl font-bold mb-4">
        {loading ? <Skeleton className="h-9 w-64" /> : 'Video Clip'}
      </h1>
      
      {error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <p className="text-destructive mb-4">
                {error}
              </p>
              <Button onClick={() => navigate('/upload')}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : loading && !videoData ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ) : videoData ? (
        <Card>
          <CardContent className="pt-6">
            {videoData.status === 'complete' && videoData.clipUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  <video 
                    src={videoData.clipUrl} 
                    controls
                    className="w-full h-full"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      {videoData.filename || 'Untitled Video'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      30-second clip generated at {new Date(videoData.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-xl font-medium mb-2">Processing your clip</h3>
                <p className="text-muted-foreground">
                  {videoData.status === 'uploaded' ? 'Starting clip generation...' : 'This may take a minute...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ClipViewer;
