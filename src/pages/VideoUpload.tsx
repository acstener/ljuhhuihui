
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a video
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: "Please upload a video file",
        });
        return;
      }
      
      // Check file size (100MB max for this example)
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > MAX_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a video smaller than 100MB",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if it's a video
      if (!droppedFile.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: "Please upload a video file",
        });
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const uploadVideo = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a video to upload",
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', file);
      
      // Get the authenticated user's token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      // Use a progress tracker simulation since fetch doesn't support progress events well
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + (1 + Math.random() * 5);
          return nextProgress > 95 ? 95 : nextProgress;
        });
      }, 500);
      
      // Call our video-upload function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }
      
      setUploadProgress(100);
      
      const data = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Video uploaded and processing started",
      });
      
      // Start clip generation
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-clipper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId: data.videoId }),
      });
      
      // Navigate to the clip page
      setTimeout(() => {
        navigate(`/clips/${data.videoId}`);
      }, 1500);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
      <p className="text-muted-foreground mb-8">
        Upload a video to generate a 30-second clip
      </p>
      
      <Card>
        <CardContent className="pt-6">
          <div 
            className={`
              border-2 border-dashed rounded-lg p-12 text-center
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {file ? (
              <div className="space-y-4">
                <Video className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="text-lg font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Change video
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Drag and drop your video</h3>
                <p className="text-sm text-muted-foreground">
                  Or click the button below to select a file
                </p>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select video
                </Button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="video/*" 
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
          
          {uploading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          {file && !uploading && (
            <Button 
              onClick={uploadVideo}
              className="w-full mt-6"
              disabled={uploading}
            >
              Generate Clip
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoUpload;
