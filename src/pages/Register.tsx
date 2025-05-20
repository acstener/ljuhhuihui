
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if we have a pending transcript
  const hasPendingTranscript = localStorage.getItem("pendingTranscript") !== null;

  const createSessionFromPending = async (userId: string) => {
    setIsCreatingSession(true);
    
    try {
      const pendingTranscript = localStorage.getItem("pendingTranscript");
      
      if (!pendingTranscript) {
        console.log("No pending transcript to create session from");
        return null;
      }
      
      console.log("Creating session from pending transcript for new user:", userId);
      
      // Ensure we have the correct user ID before creating the session
      // Add a small delay to make sure auth state is fully updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify the user ID one more time
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const confirmedUserId = currentSession?.user?.id || userId;
      
      if (!confirmedUserId) {
        console.error("Cannot create session: No confirmed user ID available");
        throw new Error("Authentication error: User ID not available");
      }
      
      console.log("Confirmed user ID for session creation:", confirmedUserId);
      
      // Create a new session with the pending transcript
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          user_id: confirmedUserId,
          title: `Session ${new Date().toLocaleString()}`,
          transcript: pendingTranscript
        }])
        .select();
        
      if (error) {
        console.error("Error creating session from pending transcript:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const sessionId = data[0].id;
        console.log("Created new session with ID:", sessionId);
        
        // Store session ID in localStorage and make it available globally
        localStorage.setItem("currentSessionId", sessionId);
        
        // Set a timestamp for lastContentGenerated to help with dashboard refresh
        localStorage.setItem("lastContentGenerated", new Date().toISOString());
        
        // Clear pending transcript now that we've created a session
        localStorage.removeItem("pendingTranscript");
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('content-generated', { 
          detail: { sessionId: sessionId, userId: confirmedUserId }
        }));
        
        return sessionId;
      }
    } catch (error) {
      console.error("Failed to create session from pending transcript:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your content. Please try again.",
      });
    } finally {
      setIsCreatingSession(false);
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please complete all fields",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await register(email, password);
      
      if (authError) throw authError;
      
      toast({
        title: "Account created",
        description: "Welcome to ContentFactory! Please check your email for confirmation.",
      });
      
      // If the user was created successfully and we have a pending transcript,
      // create a session with it - but with additional safety checks
      if (authData?.user && hasPendingTranscript) {
        console.log("New user created with ID:", authData.user.id);
        
        // Give auth state time to propagate before creating session
        const sessionId = await createSessionFromPending(authData.user.id);
        
        if (sessionId) {
          toast({
            title: "Content Ready",
            description: "Your content is being generated now!",
          });
          
          // Use the session ID we just created for navigation
          navigate("/generate/new", { 
            state: { 
              fromSignup: true,
              sessionId: sessionId,
              userId: authData.user.id,  // Explicitly pass the user ID
              timestamp: Date.now()      // Add timestamp to prevent caching issues
            }
          });
          return;
        }
      }
      
      // If no session was created or no pending transcript, go to dashboard
      navigate("/dashboard", {
        state: {
          fromSignup: true,
          userId: authData?.user?.id,    // Explicitly pass the user ID
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || isCreatingSession}>
        {isLoading || isCreatingSession ? "Creating account..." : "Create account"}
      </Button>
      
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
      
      {hasPendingTranscript && (
        <div className="bg-primary/10 p-3 rounded-md text-sm">
          <p className="font-medium">Content Ready!</p>
          <p className="text-muted-foreground">Sign up to see your generated content.</p>
        </div>
      )}
    </form>
  );
};

export default Register;
