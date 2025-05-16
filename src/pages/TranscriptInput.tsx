
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, ArrowRight } from "lucide-react";

const TranscriptInput = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Transcript Required",
        description: "Please enter a transcript or long-form text to generate threads.",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Store the transcript in localStorage for the TranscriptEditor component
      localStorage.setItem("studioTranscript", transcript);
      console.log("TranscriptInput: Storing transcript in localStorage and navigating to new route");
      
      // Navigate to the new transcript-editor page with the transcript as state
      navigate("/transcript-editor", { state: { transcript } });
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error Occurred",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
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
          <form onSubmit={handleSubmit}>
            <Textarea 
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your transcript or long-form text here..."
              className="min-h-[300px] mb-4"
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isProcessing || !transcript.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Style Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranscriptInput;
