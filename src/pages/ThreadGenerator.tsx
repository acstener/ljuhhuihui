
import React from "react";
import { useNavigate } from "react-router-dom";
import { ContentItem } from "@/components/thread/ContentItem";
import { OptionsPanel } from "@/components/thread/OptionsPanel";
import { ContentPlaceholder } from "@/components/thread/ContentPlaceholder";
import { useThreadGenerator } from "@/hooks/use-thread-generator";

const ThreadGenerator = () => {
  const {
    transcript,
    tweets,
    isGenerating,
    generateTweets,
    handleUpdateTweet,
    handleDeleteTweet,
    handleCopyTweet,
    handleDownloadAll
  } = useThreadGenerator();
  
  const navigate = useNavigate();
  
  const handleBackToTranscript = () => {
    navigate("/transcript-editor", { state: { transcript } });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Generated Content</h1>
        <p className="text-muted-foreground mt-1">
          Review and edit your authentic content before sharing
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Options panel */}
        <OptionsPanel
          isGenerating={isGenerating}
          hasContent={tweets.length > 0}
          onRegenerate={() => generateTweets()}
          onDownloadAll={handleDownloadAll}
          onBackToTranscript={handleBackToTranscript}
        />
        
        {/* Generated content */}
        <div className="space-y-4 md:col-span-2">
          {isGenerating || tweets.length === 0 ? (
            <ContentPlaceholder 
              isLoading={isGenerating} 
              hasTranscript={!!transcript.trim()} 
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
