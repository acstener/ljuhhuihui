
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, PencilLine } from "lucide-react";
import { KeyPointsDisplay } from "@/components/KeyPointsDisplay";
import { StyleSelector } from "@/components/StyleSelector";

const InputTranscript = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTranscript = location.state?.transcript || 
    localStorage.getItem("studioTranscript") || "";
  
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [selectedStyle, setSelectedStyle] = useState<string>("my-voice");
  
  const handleSubmit = () => {
    if (!transcript.trim()) {
      return;
    }
    
    // Store the transcript and style for tweet generation
    localStorage.setItem("tweetGenerationTranscript", transcript);
    localStorage.setItem("tweetGenerationStyle", selectedStyle);
    
    // Navigate to the thread generator
    navigate("/generate/123");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Tweet Thread</h1>
        <p className="text-muted-foreground mt-1">
          Review your transcript and select a style for your tweets
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Transcript editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Interview Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your interview transcript will appear here. You can edit it if needed."
                className="min-h-[300px]"
              />
            </CardContent>
            <CardFooter className="border-t p-4 bg-muted/5 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <PencilLine className="h-4 w-4 inline-block mr-1" />
                You can edit this transcript if needed
              </div>
              <Button variant="outline" size="sm" onClick={() => setTranscript(initialTranscript)}>
                Reset
              </Button>
            </CardFooter>
          </Card>
          
          {/* Key points display */}
          <KeyPointsDisplay transcript={transcript} />
        </div>
        
        {/* Right column: Style selection and generate button */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tweet Style</CardTitle>
            </CardHeader>
            <CardContent>
              <StyleSelector 
                selectedStyle={selectedStyle} 
                onChange={setSelectedStyle} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-base mb-4">
                Ready to generate your tweet thread?
              </p>
              <Button 
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!transcript.trim()}
              >
                Generate Tweet Thread
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InputTranscript;
