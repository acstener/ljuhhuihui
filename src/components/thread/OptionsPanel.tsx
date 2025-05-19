
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit, Loader2 } from "lucide-react";

interface OptionsPanelProps {
  isGenerating: boolean;
  hasContent: boolean;
  onRegenerate: () => void;
  onDownloadAll: () => void;
  onBackToTranscript: () => void;
}

export const OptionsPanel = ({
  isGenerating,
  hasContent,
  onRegenerate,
  onDownloadAll,
  onBackToTranscript
}: OptionsPanelProps) => {
  return (
    <div className="space-y-4 md:col-span-1">
      <Card>
        <CardHeader>
          <CardTitle>Voice & Style</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your content is generated in your authentic voice - raw and unfiltered.
          </p>
          
          <Button 
            onClick={onRegenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Regenerate Content
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBackToTranscript}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transcript
          </Button>
        </CardFooter>
      </Card>
      
      {hasContent && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              className="w-full"
              onClick={onDownloadAll}
              variant="secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
