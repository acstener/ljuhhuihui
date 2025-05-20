
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import LandingVoiceStudio from "@/components/LandingVoiceStudio";
import AuthGate from "@/components/AuthGate";
import { ArrowRight, Zap, MessageCircle, Copy, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasTranscript, setHasTranscript] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check for existing transcript in localStorage
  useEffect(() => {
    const savedTranscript = localStorage.getItem("pendingTranscript");
    if (savedTranscript) {
      setHasTranscript(true);
    }
  }, []);
  
  // Redirect authenticated users with transcript to generator
  useEffect(() => {
    const savedTranscript = localStorage.getItem("pendingTranscript");
    if (user && savedTranscript) {
      navigate("/generate/new");
    }
  }, [user, navigate]);
  
  const handleTranscriptReady = (transcript: string) => {
    setHasTranscript(true);
  };
  
  const handleGenerateClick = () => {
    if (!user) {
      // Show processing state first
      setIsProcessing(true);
      
      // After a brief delay, show auth gate
      setTimeout(() => {
        setIsProcessing(false);
        setShowAuthGate(true);
      }, 1500);
    } else {
      // User is already authenticated, redirect to generator
      navigate("/generate/new");
    }
  };
  
  const handleCloseAuthGate = () => {
    setShowAuthGate(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="pt-12 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Transform Your Voice Into<br />
            <span className="text-primary">Authentic Content</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Speak naturally and watch as your words become perfectly crafted tweets and threads, ready to share with your audience.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="mt-6" variant="outline">
                  Learn How It Works
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How Content Factory Works</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">1. Record Your Thoughts</h3>
                      <p className="text-sm text-muted-foreground">Speak naturally into the microphone or type your message.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">2. Generate Content</h3>
                      <p className="text-sm text-muted-foreground">Our AI transforms your speech into polished social media content.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Copy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">3. Share & Save</h3>
                      <p className="text-sm text-muted-foreground">Edit, copy, or download your content to share with your audience.</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Voice Studio Section */}
      <div className="py-10 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Try It Now</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click the microphone and start speaking. Our AI will listen and help you craft your thoughts.
            </p>
          </div>
          
          {/* Embed the Voice Studio Component */}
          <LandingVoiceStudio onTranscriptReady={handleTranscriptReady} />
          
          {/* Generate Button */}
          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              onClick={handleGenerateClick}
              disabled={!hasTranscript || isProcessing}
              className="relative"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing Content...
                </>
              ) : (
                <>
                  Generate Content
                  <Zap className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            {!hasTranscript && (
              <p className="text-sm text-muted-foreground mt-2">
                Record some content first to generate tweets
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Why Choose Content Factory</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The easiest way to transform your ideas into engaging social media content
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 5v14"></path>
                  <path d="M18 13l-6 6"></path>
                  <path d="M6 13l6 6"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Save Time</h3>
              <p className="text-muted-foreground">Reduce content creation time from hours to minutes with our streamlined process.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                  <line x1="18" x2="18" y1="9" y2="15"></line>
                  <line x1="15" x2="15" y1="9" y2="15"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Maintain Your Voice</h3>
              <p className="text-muted-foreground">Our AI preserves your authentic tone and style in every piece of content.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Increase Engagement</h3>
              <p className="text-muted-foreground">Create content that resonates with your audience and drives higher engagement.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Gate Dialog */}
      {showAuthGate && <AuthGate onClose={handleCloseAuthGate} />}
    </div>
  );
};

export default Index;
