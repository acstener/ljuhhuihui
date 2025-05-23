
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ContentPlaceholderProps {
  isLoading: boolean;
  hasTranscript: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ContentPlaceholder = ({ 
  isLoading, 
  hasTranscript,
  error,
  onRetry
}: ContentPlaceholderProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="border border-muted">
            <CardContent className="py-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex justify-between mt-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium mb-2">Content Generation Error</p>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/5">
      <CardContent className="py-12 text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {hasTranscript 
            ? "Generating authentic content from your transcript..." 
            : "Please provide a transcript to generate content from."}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          For more personalized content, train your tone in the dashboard.
        </p>
      </CardContent>
    </Card>
  );
};
