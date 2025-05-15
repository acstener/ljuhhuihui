import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon, ArrowRight, Scissors, Video } from "lucide-react";
import { processVideo } from "@/lib/mockData";

const UploadVideo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);
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
    
    await processVideoForClips({ youtubeUrl });
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
    
    await processVideoForClips({ uploadFile: file });
  };

  const processVideoForClips = async ({ 
    uploadFile, 
    youtubeUrl 
  }: { 
    uploadFile?: File; 
    youtubeUrl?: string 
  }) => {
    try {
      setIsUploading(true);
      setIsGeneratingClips(true);
      setUploadProgress(0);
      
      // Start progress simulation
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 2;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 200);

      // Use our mock function instead of Supabase
      const { videoId } = await processVideo({ uploadFile, youtubeUrl });
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        toast({
          title: "Video processing initiated",
          description: "We're generating clips from your video. You'll be redirected to the clips page.",
        });
        navigate(`/clips?videoId=${videoId}`);
      }, 500);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsUploading(false);
      setIsGeneratingClips(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Video Clips Generator</h1>
        <p className="text-muted-foreground mt-2">
          Upload a video file or paste a YouTube URL to automatically generate short, branded clips
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
                      disabled={isUploading || isGeneratingClips}
                    />
                    <Label htmlFor="video-upload">
                      <Button 
                        variant="outline" 
                        className="cursor-pointer" 
                        disabled={isUploading || isGeneratingClips}
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
                    disabled={isUploading || isGeneratingClips}
                  >
                    {isGeneratingClips ? (
                      <>
                        Processing ({uploadProgress}%)...
                      </>
                    ) : (
                      <>
                        <Scissors className="mr-2 h-4 w-4" /> Generate Clips <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {(isUploading || isGeneratingClips) && (
                <div className="mt-4 space-y-2">
                  <div className="bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-1.5 bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {uploadProgress < 30 ? 'Uploading video...' : 
                     uploadProgress < 60 ? 'Transcribing content...' : 
                     uploadProgress < 90 ? 'Generating clips...' : 'Finishing up...'}
                  </p>
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
                        disabled={isUploading || isGeneratingClips}
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
                  disabled={isUploading || isGeneratingClips || !youtubeUrl.trim()}
                >
                  {isGeneratingClips ? (
                    <>
                      Processing ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      <Scissors className="mr-2 h-4 w-4" /> Generate Clips <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {(isUploading || isGeneratingClips) && (
                  <div className="mt-2 space-y-2">
                    <div className="bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-1.5 bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress < 30 ? 'Processing YouTube URL...' : 
                       uploadProgress < 60 ? 'Transcribing content...' : 
                       uploadProgress < 90 ? 'Generating clips...' : 'Finishing up...'}
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-start">
          <Video className="h-5 w-5 text-primary mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium">How it works</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your video or paste a YouTube URL, and our system will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
              <li>Automatically transcribe your video</li>
              <li>Extract the most engaging segments</li>
              <li>Generate 3 branded, subtitled clips</li>
              <li>Make them available for download</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
