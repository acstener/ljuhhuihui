
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  returnUrl?: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  // Check if we have a pending transcript and use generate/new as the return URL
  const hasPendingTranscript = localStorage.getItem("pendingTranscript") !== null;
  const returnUrl = hasPendingTranscript ? "/generate/new" : (state?.returnUrl || "/dashboard");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "You've been logged in",
      });
      
      // If there's a pending transcript, show a more descriptive toast
      if (hasPendingTranscript) {
        toast({
          title: "Content Ready",
          description: "Your content is being generated now!",
        });
      }
      
      navigate(returnUrl);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
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
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
      
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
      
      {hasPendingTranscript && (
        <div className="bg-primary/10 p-3 rounded-md text-sm">
          <p className="font-medium">Content Ready!</p>
          <p className="text-muted-foreground">Sign in to see your generated content.</p>
        </div>
      )}
    </form>
  );
};

export default Login;
