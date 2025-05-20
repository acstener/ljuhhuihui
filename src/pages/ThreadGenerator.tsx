
import React, { useEffect, useState, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { supabase } from "@/integrations/supabase/client";

const ThreadGenerator = () => {
  const location = useLocation();
  const { user } = useAuth();
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
    setSessionId,
    setTranscript,
    createNewSession,
    findExistingSessionWithTranscript
  } = useThreadGenerator();
  
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(!apiKeySet);
  const { toast } = useToast();
  
  // Refs to prevent duplicate operations
  const generationTriggered = useRef(false);
  const transcriptProcessed = useRef(false);
  const sessionVerified = useRef(false);
  const sessionFromStateProcessed = useRef(false);
  const confirmedSessionId = useRef<string | null>(null);
  
  // Debug output for important state
  useEffect(() => {
    console.log("ThreadGenerator render - User:", user?.id);
    console.log("ThreadGenerator render - Session ID:", sessionId);
    console.log("ThreadGenerator render - Transcript length:", transcript?.length || 0);
    console.log("ThreadGenerator render - Location state:", location.state);
  }, [user?.id, sessionId, transcript, location.state]);
  
  // Handle session ID from location state - only once
  useEffect(() => {
    if (location.state?.sessionId && !sessionFromStateProcessed.current) {
      console.log("Setting session ID from location state:", location.state.sessionId);
      setSessionId(location.state.sessionId);
      localStorage.setItem("currentSessionId", location.state.sessionId);
      sessionVerified.current = true;
      confirmedSessionId.current = location.state.sessionId;
      sessionFromStateProcessed.current = true;
      
      // Set global session ID for cross-component coordination
      window._createdSessionId = location.state.sessionId;
    }
    
    // Handle transcript from location state - only once
    if (location.state?.transcript && !transcriptProcessed.current) {
      console.log("Setting transcript from location state");
      setTranscript(location.state.transcript);
      transcriptProcessed.current = true;
    }
  }, [location.state, setSessionId, setTranscript]);
  
  // Verify session belongs to current user - only once
  useEffect(() => {
    const verifySession = async () => {
      // Only verify if we have both a user and a session ID and haven't verified yet
      if (!user?.id || !sessionId || sessionVerified.current) return;
      
      try {
        console.log("Verifying session:", sessionId, "belongs to user:", user.id);
        
        const { data, error } = await supabase
          .from('sessions')
          .select('id, user_id')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error("Error verifying session:", error);
          return;
        }
        
        if (data && data.user_id === user.id) {
          console.log("Session verified as belonging to current user");
          sessionVerified.current = true;
          confirmedSessionId.current = sessionId;
        } else {
          console.warn("Session does not belong to current user, will create new session");
          setSessionId(null);
          localStorage.removeItem("currentSessionId");
          confirmedSessionId.current = null;
          window._createdSessionId = undefined;
        }
      } catch (err) {
        console.error("Failed to verify session:", err);
      }
    };
    
    verifySession();
  }, [user?.id, sessionId, setSessionId]);
  
  // Check for existing session with this transcript
  useEffect(() => {
    if (!user?.id || !transcript.trim() || sessionId || !transcriptProcessed.current || window._sessionCreationInProgress) {
      return;
    }
    
    const checkForExistingSession = async () => {
      // First check if global session ID is set
      if (window._createdSessionId) {
        console.log("Using globally created session ID:", window._createdSessionId);
        setSessionId(window._createdSessionId);
        confirmedSessionId.current = window._createdSessionId;
        return;
      }
      
      const existingId = await findExistingSessionWithTranscript(transcript);
      if (existingId) {
        console.log("Found existing session with this transcript:", existingId);
        setSessionId(existingId);
        confirmedSessionId.current = existingId;
        window._createdSessionId = existingId;
        localStorage.setItem("currentSessionId", existingId);
      }
    };
    
    checkForExistingSession();
  }, [user?.id, transcript, sessionId, findExistingSessionWithTranscript]);
  
  // Process pending transcript only once
  useEffect(() => {
    if (transcriptProcessed.current) return;
    
    const pendingTranscript = localStorage.getItem("pendingTranscript");
    if (!pendingTranscript) return;
    
    console.log("Loading pending transcript from localStorage");
    setTranscript(pendingTranscript);
    transcriptProcessed.current = true;
    
    toast({
      title: "Transcript Loaded",
      description: "Your conversation has been loaded and is being processed.",
    });
  }, [setTranscript, toast]);
  
  // Auto-generate tweets only once
  useEffect(() => {
    if (generationTriggered.current) return;
    
    if (transcript && 
        tweets.length === 0 && 
        !isGenerating && 
        apiKeySet) {
      console.log("Triggering initial content generation");
      generationTriggered.current = true;
      generateTweets();
    }
  }, [transcript, tweets.length, isGenerating, generateTweets, apiKeySet]);
  
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyDialogOpen(false);
      
      // Generate tweets if we have a transcript and haven't generated yet
      if (transcript && tweets.length === 0 && !generationTriggered.current) {
        console.log("Triggering content generation after API key set");
        generationTriggered.current = true;
        generateTweets();
      }
    }
  };
  
  const handleBackToStudio = () => {
    navigate("/studio");
  };

  const handleBackToDashboard = () => {
    // Pass state to indicate we're coming from content generation
    navigate("/dashboard", { 
      state: { 
        fromContentGeneration: true,
        sessionId: sessionId || confirmedSessionId.current,
        userId: user?.id,
        updatedAt: new Date().toISOString() // Add a timestamp to force a refresh
      }
    });
  };

  const handleViewSession = () => {
    if (sessionId || confirmedSessionId.current) {
      navigate(`/session/${sessionId || confirmedSessionId.current}`);
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

  // Handle manual regeneration request
  const handleRegenerate = () => {
    console.log("Manual regeneration requested");
    generateTweets();
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
        
        {(sessionId || confirmedSessionId.current) && (
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
          onRegenerate={handleRegenerate}
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
              onRetry={handleRegenerate}
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
