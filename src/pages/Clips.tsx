
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Download, RefreshCw, Video, AlertTriangle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

type Clip = {
  id: string;
  video_id: string;
  start_s: number;
  end_s: number;
  snippet: string;
  clip_url: string | null;
  status: "pending" | "rendering" | "complete" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const ClipCard = ({ clip }: { clip: Clip }) => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      
      const { error } = await supabase.functions.invoke('clips/retry', {
        body: { clipId: clip.id }
      });
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Retry initiated",
        description: "We're trying to generate this clip again.",
      });
      
    } catch (error) {
      console.error("Retry error:", error);
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[9/16] bg-black relative">
        {clip.status === "complete" && clip.clip_url ? (
          <video
            src={clip.clip_url}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {clip.status === "error" ? (
              <div className="text-center p-4">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                <p className="text-sm font-medium">Generation Failed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {clip.error_message || "An error occurred"}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Loader className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {clip.status === "rendering" ? "Rendering Clip..." : "Processing..."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <p className="font-medium line-clamp-2 text-sm">
              {clip.snippet || "Clip segment"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDuration(Math.floor(clip.start_s))} - {formatDuration(Math.floor(clip.end_s))} 
              ({Math.floor(clip.end_s - clip.start_s)}s)
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            {clip.status === "complete" && clip.clip_url ? (
              <a
                href={clip.clip_url}
                download
                className="w-full"
              >
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            ) : clip.status === "error" ? (
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm" 
                onClick={handleRetry}
                disabled={isRetrying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            ) : (
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-full rounded-full bg-primary ${
                    clip.status === "rendering" ? "w-2/3" : "w-1/3"
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Clips = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("videoId");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchClips = async () => {
    if (!videoId) return;

    try {
      // First, get video status
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('status')
        .eq('id', videoId)
        .single();
      
      if (videoError) throw videoError;
      
      setVideoStatus(videoData.status);
      
      // Then, get clips for this video
      const { data: clipsData, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });
      
      if (clipsError) throw clipsError;

      setClips(clipsData || []);
      
      // If there are no clips yet, but video is being processed, continue polling
      const shouldContinuePolling = 
        (clipsData?.length === 0 && videoData.status !== 'complete' && videoData.status !== 'error') || 
        clipsData?.some(clip => clip.status === 'pending' || clip.status === 'rendering');
        
      if (!shouldContinuePolling && pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      
    } catch (err) {
      console.error("Error fetching clips:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!videoId) {
      navigate("/upload-video");
      return;
    }

    fetchClips();
    
    // Set up polling every 5 seconds to check for updates
    const interval = setInterval(fetchClips, 5000);
    setPollInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoId, navigate]);

  if (!videoId) return null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <Loader className="h-8 w-8 mx-auto animate-spin mb-4" />
        <h2 className="text-xl font-bold">Loading clips...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button className="mt-4" onClick={() => navigate("/upload-video")}>
          Back to Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Video Clips</h1>
          <Button variant="outline" onClick={() => navigate("/upload-video")}>
            <Video className="h-4 w-4 mr-2" /> Upload New Video
          </Button>
        </div>
        
        {videoStatus && (
          <div className="mt-2">
            <p className="text-muted-foreground">
              {videoStatus === 'uploaded' && 'Video uploaded, waiting to be processed...'}
              {videoStatus === 'ingesting' && 'Ingesting video...'}
              {videoStatus === 'transcribing' && 'Transcribing video...'}
              {videoStatus === 'transcribed' && 'Transcription complete, analyzing content...'}
              {videoStatus === 'selecting_clips' && 'Selecting the best clips...'}
              {videoStatus === 'clips_selected' && 'Clips selected, rendering in progress...'}
              {videoStatus === 'complete' && 'All clips have been generated!'}
              {videoStatus === 'error' && 'An error occurred during processing. Please try again.'}
            </p>
          </div>
        )}
      </div>
      
      {clips.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          {videoStatus && videoStatus !== 'error' ? (
            <>
              <Loader className="h-8 w-8 mx-auto animate-spin mb-4 text-muted-foreground" />
              <h2 className="text-xl font-medium">Generating Clips...</h2>
              <p className="text-muted-foreground mt-2">
                We're processing your video and selecting the best clips.
                <br />This page will update automatically.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-medium">No Clips Generated</h2>
              <p className="text-muted-foreground mt-2">
                There was a problem processing your video.
              </p>
              <Button className="mt-4" onClick={() => navigate("/upload-video")}>
                Try Again
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Clips;
