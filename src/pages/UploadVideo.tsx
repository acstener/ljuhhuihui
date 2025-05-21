import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";

const UploadVideo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a video
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a video file",
        });
        return;
      }
      
      // Check file size (100MB max for this example)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Video must be less than 100MB",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl.trim()) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a YouTube URL",
      });
      return;
    }
    
    // Simple validation - check if it's a YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
      });
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to upload videos",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a new session with YouTube URL
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `YouTube Video ${new Date().toLocaleString()}`,
          video_url: youtubeUrl,
        })
        .select();
        
      if (error) throw error;
      
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      // Clear interval and navigate after completion
      setTimeout(() => {
        clearInterval(interval);
        setIsUploading(false);
        toast({
          title: "YouTube video saved",
          description: "Your YouTube video has been linked to your account",
        });
        
        if (data && data[0]) {
          navigate(`/dashboard`);
        } else {
          navigate("/dashboard");
        }
      }, 2000);
    } catch (err) {
      console.error("Error saving YouTube URL:", err);
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to save YouTube URL",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a video file to upload",
      });
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to upload videos",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a unique file name
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Custom progress handler
      const progressHandler = (progress: number) => {
        setUploadProgress(Math.round(progress * 100));
      };
      
      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      if (!publicUrlData) throw new Error("Failed to get public URL");
      
      // Get video dimensions and duration before saving
      const videoDimensions = await getVideoDimensions(file);
      const videoDuration = await getVideoDuration(file);
      
      // Save to sessions table
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Uploaded Video ${new Date().toLocaleString()}`,
          video_url: publicUrlData.publicUrl,
          video_dimensions: videoDimensions,
          video_duration: Math.round(videoDuration),
        });
      
      if (sessionError) throw sessionError;
      
      toast({
        title: "Upload complete",
        description: "Your video has been uploaded successfully",
      });
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Error uploading video:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload video",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper functions to get video metadata
  const getVideoDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  };
  
  const getVideoDimensions = (blob: Blob): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <p className="text-muted-foreground mt-2">
          Upload a video file or paste a YouTube URL to get started
        </p>
      </div>
      
      <Tabs defaultValue="file">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                
                {file ? (
                  <div className="space-y-2">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <Button 
                      onClick={() => setFile(null)}
                      variant="outline" 
                      size="sm"
                    >
                      Change file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Drag and drop your video</p>
                      <p className="text-sm text-muted-foreground mt-1">Or click to browse files</p>
                    </div>
                    
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Label htmlFor="video-upload">
                      <Button 
                        variant="outline" 
                        className="cursor-pointer" 
                        disabled={isUploading}
                      >
                        Select Video
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
              
              {file && (
                <div className="mt-6">
                  <Button 
                    className="w-full" 
                    onClick={handleFileUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        Uploading ({uploadProgress}%)...
                      </>
                    ) : (
                      <>
                        Upload Video <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {isUploading && (
                <div className="mt-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-1.5 bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="youtube" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube Video URL</Label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="youtube-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pl-9"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube video URL to process it directly
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isUploading || !youtubeUrl.trim()}
                >
                  {isUploading ? (
                    <>
                      Processing ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      Process Video <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {isUploading && (
                  <div className="mt-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-1.5 bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadVideo;
