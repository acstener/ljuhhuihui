
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StyleSelector } from "@/components/StyleSelector";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, FileText } from "lucide-react";

const TranscriptEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log("TranscriptEditor: Location state received:", location.state);
  
  // Get transcript from state or localStorage
  const initialTranscript = location.state?.transcript || 
    localStorage.getItem("studioTranscript") || "";
  
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [selectedStyle, setSelectedStyle] = useState<string>("my-voice");
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Make sure we have the latest transcript from localStorage or state
    const savedTranscript = localStorage.getItem("studioTranscript");
    if (savedTranscript && !transcript) {
      setTranscript(savedTranscript);
      console.log("TranscriptEditor: Loaded transcript from localStorage");
    }
    
    if (location.state?.transcript && !transcript) {
      setTranscript(location.state.transcript);
      console.log("TranscriptEditor: Loaded transcript from location state");
    }
  }, [location.state, transcript]);

  const handleGenerateThreads = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Transcript Required",
        description: "Please enter a transcript or long-form text to generate threads.",
      });
      return;
    }
    
    // Save transcript and style in localStorage for the ThreadGenerator
    localStorage.setItem("tweetGenerationTranscript", transcript);
    localStorage.setItem("tweetGenerationStyle", selectedStyle);
    
    // Navigate directly to tweet generation page
    navigate("/generate/new");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Tweet Threads</h1>
        <p className="text-muted-foreground mt-1">
          Edit your transcript and choose a tweet style
        </p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Edit Transcript
            </CardTitle>
            <CardDescription>
              Review and edit your transcript or long-form text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter your transcript or long-form text here..."
              className="min-h-[200px] mb-4"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Style Selection</CardTitle>
            <CardDescription>
              Choose the style for your tweet thread
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StyleSelector
              selectedStyle={selectedStyle}
              onChange={setSelectedStyle}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleGenerateThreads}
            disabled={isGenerating || !transcript.trim()}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>Generating Thread...</>
            ) : (
              <>
                Generate Tweet Thread
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;
