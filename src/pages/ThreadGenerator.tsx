
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ContentItem } from "@/components/thread/ContentItem";
import { OptionsPanel } from "@/components/thread/OptionsPanel";
import { ContentPlaceholder } from "@/components/thread/ContentPlaceholder";
import { useThreadGenerator } from "@/hooks/use-thread-generator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ThreadGenerator = () => {
  const location = useLocation();
  const {
    transcript,
    sessionId,
    tweets,
    isGenerating,
    error,
    generateTweets,
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll,
    setSessionId
  } = useThreadGenerator();
  
  const navigate = useNavigate();
  
  // Get session ID from location state if available
  useEffect(() => {
    if (location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      localStorage.setItem("currentSessionId", location.state.sessionId);
    }
  }, [location.state, setSessionId]);
  
  // Auto-generate tweets when component loads if transcript exists
  useEffect(() => {
    if (transcript && tweets.length === 0 && !isGenerating) {
      generateTweets();
    }
  }, [transcript, tweets.length, isGenerating, generateTweets]);
  
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
    </div>
  );
};

export default ThreadGenerator;
