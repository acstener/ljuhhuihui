
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video } from "lucide-react";

interface VideoItem {
  id: string;
  original_filename: string;
  status: string;
  inserted_at: string;
  clip_url: string | null;
}

const ClipsList = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("inserted_at", { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setVideos(data || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading clips",
          description: error.message || "Failed to load your clips",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-1">Complete</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">Processing</span>;
      case 'uploaded':
        return <span className="bg-yellow-100 text-yellow-800 text-xs rounded-full px-2 py-1">Uploaded</span>;
      case 'error':
        return <span className="bg-red-100 text-red-800 text-xs rounded-full px-2 py-1">Error</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs rounded-full px-2 py-1">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Clips</h1>
        <Button asChild>
          <Link to="/upload">
            <Upload className="mr-2 h-4 w-4" /> New Video
          </Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clips yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload a video to create your first clip
            </p>
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" /> Upload Video
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link key={video.id} to={`/clips/${video.id}`}>
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {video.status === 'complete' && video.clip_url ? (
                    <video 
                      src={video.clip_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {video.status === 'processing' && (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                      )}
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm truncate mr-2">
                      {video.original_filename || 'Untitled Video'}
                    </h3>
                    {getStatusBadge(video.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(video.inserted_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClipsList;
