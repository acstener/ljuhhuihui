
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, PencilLine, Sparkles, Loader2 } from "lucide-react";
import { StyleSelector } from "@/components/StyleSelector";
import { useToast } from "@/components/ui/use-toast";

const InputTranscript = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log("InputTranscript: Location state received:", location.state);
  
  // Get transcript from state or localStorage
  const initialTranscript = location.state?.transcript || 
    localStorage.getItem("studioTranscript") || "";
  
  console.log("InputTranscript: Initial transcript length:", initialTranscript.length);
  
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [selectedStyle, setSelectedStyle] = useState<string>("my-voice");
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Make sure we have the latest transcript from localStorage or state
    const savedTranscript = localStorage.getItem("studioTranscript");
    if (savedTranscript && !transcript) {
      setTranscript(savedTranscript);
      console.log("InputTranscript: Loaded transcript from localStorage");
    }
    
    if (location.state?.transcript && !transcript) {
      setTranscript(location.state.transcript);
      console.log("InputTranscript: Loaded transcript from location state");
    }
  }, [location.state, transcript]);
  
  const handleSubmit = () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Transcript Required",
        description: "Please enter a transcript or long-form text to generate threads.",
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Store the transcript and style for tweet generation
    localStorage.setItem("tweetGenerationTranscript", transcript);
    localStorage.setItem("tweetGenerationStyle", selectedStyle);
    
    console.log("InputTranscript: Generating tweets with style:", selectedStyle);
    
    // Navigate to the thread generator
    navigate("/generate/123");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Tweet Thread</h1>
        <p className="text-muted-foreground mt-1">
          Enter your transcript and select a style to generate tweet threads
        </p>
      </div>
      
      {/* Single column layout with transcript editor first, then style selector */}
      <div className="space-y-6">
        {/* Transcript editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Input Transcript
            </CardTitle>
            <CardDescription>
              Edit your transcript if needed before generating tweets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your transcript or long-form text here..."
              className="min-h-[300px]"
            />
          </CardContent>
          {initialTranscript && (
            <div className="border-t p-4 bg-muted/5 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <PencilLine className="h-4 w-4 inline-block mr-1" />
                You can edit this transcript if needed
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setTranscript(initialTranscript)}>
                Reset
              </Button>
            </div>
          )}
        </Card>
        
        {/* Style selector card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Tweet Style
            </CardTitle>
            <CardDescription>
              Choose how you want your tweets to sound
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StyleSelector 
              selectedStyle={selectedStyle} 
              onChange={setSelectedStyle} 
            />
          </CardContent>
        </Card>
        
        {/* Generate button */}
        <Card>
          <CardContent className="p-6">
            <p className="text-base mb-4">
              Ready to generate your tweet thread?
            </p>
            <Button 
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!transcript.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Tweet Thread...
                </>
              ) : (
                <>
                  Generate Tweet Thread
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InputTranscript;
