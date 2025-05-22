
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon, ArrowRight } from "lucide-react";

const UploadVideo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleYoutubeSubmit = (e: React.FormEvent) => {
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
    
    simulateUpload();
  };

  const handleFileUpload = () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a video file to upload",
      });
      return;
    }
    
    simulateUpload();
  };

  // Simulate an upload process for the MVP
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            toast({
              title: "Upload complete",
              description: "Your video is now processing",
            });
            navigate("/dashboard");
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 200);
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
