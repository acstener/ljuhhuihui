
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TranscriptInput = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    
    setIsGenerating(true);
    
    try {
      // Call the Supabase Edge Function to generate threads
      const { data, error } = await supabase.functions.invoke('generate-threads', {
        body: { transcript },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Store the generated threads in localStorage for now
      // In a real app, you would save this to a database
      localStorage.setItem('generatedThreads', JSON.stringify(data));
      
      toast({
        title: "Threads Generated",
        description: "Your tweet threads have been generated successfully!",
      });
      
      // Navigate to the ThreadGenerator page to view and edit the threads
      navigate('/generate/new');
    } catch (error) {
      console.error("Error generating threads:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate threads. Please try again.",
      });
    } finally {
      setIsGenerating(false);
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
              disabled={isGenerating || !transcript.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Threads...
                </>
              ) : (
                <>
                  Generate Tweet Threads
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
