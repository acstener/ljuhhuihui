
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Quote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface KeyPoint {
  point: string;
  quote: string;
}

interface KeyPointsDisplayProps {
  transcript: string;
}

export function KeyPointsDisplay({ transcript }: KeyPointsDisplayProps) {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const extractKeyPoints = async () => {
    if (!transcript || transcript.trim().length === 0) {
      toast({
        title: "Empty transcript",
        description: "There's no transcript content to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-key-points', {
        body: { transcript }
      });
      
      if (error) throw new Error(error.message);
      
      if (data && Array.isArray(data.keyPoints)) {
        setKeyPoints(data.keyPoints);
      } else {
        throw new Error("Invalid response format from key points extraction");
      }
    } catch (err: any) {
      console.error("Failed to extract key points:", err);
      setError(err.message || "Failed to extract key points");
      toast({
        title: "Extraction failed",
        description: "Could not extract key points from the transcript.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-extract key points when transcript is provided
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      extractKeyPoints();
    }
  }, [transcript]);
  
  if (!transcript || transcript.trim().length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Key Talking Points</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={extractKeyPoints}
          disabled={isLoading}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? "Extracting..." : "Refresh"}
        </Button>
      </div>
      
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}
      
      {isLoading && (
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && keyPoints.length > 0 && (
        <div className="space-y-4">
          {keyPoints.map((point, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4 pt-6 relative">
                <div className="bg-primary/10 p-2 rounded-full absolute top-4 left-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="pl-12">
                  <h4 className="font-medium">{point.point}</h4>
                  <div className="mt-1 text-sm text-muted-foreground flex gap-2">
                    <Quote className="h-4 w-4 flex-shrink-0" />
                    <span className="italic">"{point.quote}"</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!isLoading && keyPoints.length === 0 && !error && (
        <Card className="border-muted bg-muted/5">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Key points will be extracted from your transcript and displayed here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
