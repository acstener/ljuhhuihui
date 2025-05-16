
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
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
  
  const handleContinueToStyleSelection = () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Transcript Required",
        description: "Please enter a transcript or long-form text to generate threads.",
      });
      return;
    }
    
    // Save the transcript to localStorage for reference
    localStorage.setItem("studioTranscript", transcript);
    console.log("InputTranscript: Continuing to style selection");
    
    // Here we would navigate to style selection page, but let's
    // implement it directly on this page first and fix the navigation later
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Tweet Threads</h1>
        <p className="text-muted-foreground mt-1">
          Enter a transcript or long-form text to generate tweet threads
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Input Transcript
          </CardTitle>
          <CardDescription>
            Paste your transcript or long-form text below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your transcript or long-form text here..."
            className="min-h-[300px] mb-4"
          />
          
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={handleContinueToStyleSelection}
          >
            Continue to Style Selection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InputTranscript;
