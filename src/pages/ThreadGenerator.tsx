import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ContentItem } from "@/components/thread/ContentItem";
import { OptionsPanel } from "@/components/thread/OptionsPanel";
import { ContentPlaceholder } from "@/components/thread/ContentPlaceholder";
import { useThreadGenerator } from "@/hooks/use-thread-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Lock } from "lucide-react";

const ThreadGenerator = () => {
  const location = useLocation();
  const {
    transcript,
    sessionId,
    tweets,
    isGenerating,
    error,
    apiKeySet,
    setApiKey,
    generateTweets,
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll,
    setSessionId
  } = useThreadGenerator();
  
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(!apiKeySet);
  
  // Get session ID from location state if available
  useEffect(() => {
    if (location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      localStorage.setItem("currentSessionId", location.state.sessionId);
    }
  }, [location.state, setSessionId]);
  
  // Auto-generate tweets when component loads if transcript exists and API key is set
  useEffect(() => {
    if (transcript && tweets.length === 0 && !isGenerating && apiKeySet) {
      generateTweets();
    }
  }, [transcript, tweets.length, isGenerating, generateTweets, apiKeySet]);
  
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyDialogOpen(false);
      
      // Generate tweets if transcript exists
      if (transcript && tweets.length === 0) {
        generateTweets();
      }
    }
  };
  
  const handleBackToStudio = () => {
    navigate("/studio");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewSession = () => {
    if (sessionId) {
      navigate(`/session/${sessionId}`);
    }
  };

  // Use default Gemini API key if provided
  useEffect(() => {
    const defaultApiKey = "AIzaSyBi7hpkLqfS9r0UAn4uPUlUTjYUzqGXVVQ";
    if (defaultApiKey && !apiKeySet) {
      setApiKey(defaultApiKey);
      setApiKeyInput(defaultApiKey);
    }
  }, [apiKeySet, setApiKey]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Generated Content</h1>
          <p className="text-muted-foreground mt-1">
            Review and edit your authentic content before sharing
          </p>
        </div>
        
        {sessionId && (
          <Button variant="outline" onClick={handleViewSession}>
            View All Session Content
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Options panel */}
        <OptionsPanel
          isGenerating={isGenerating}
          hasContent={tweets.length > 0}
          onRegenerate={() => generateTweets()}
          onDownloadAll={handleDownloadAll}
          onBackToTranscript={handleBackToStudio}
          onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
          apiKeySet={apiKeySet}
        />
        
        {/* Generated content */}
        <div className="space-y-4 md:col-span-2">
          {isGenerating || tweets.length === 0 ? (
            <ContentPlaceholder 
              isLoading={isGenerating} 
              hasTranscript={!!transcript.trim()}
              error={error}
              onRetry={() => generateTweets()}
            />
          ) : (
            <div className="space-y-4">
              {tweets.map((tweet, index) => (
                <ContentItem
                  key={index}
                  content={tweet}
                  index={index}
                  onUpdate={handleUpdateTweet}
                  onDelete={handleDeleteTweet}
                  onCopy={handleCopyTweet}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Gemini API Key</DialogTitle>
            <DialogDescription>
              We need your Gemini API key to generate content. This is stored locally on your device only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Gemini API Key</Label>
              <div className="flex">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                Your API key is stored locally only and never sent to our servers
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThreadGenerator;
