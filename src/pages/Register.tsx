
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if we have a pending transcript
  const hasPendingTranscript = localStorage.getItem("pendingTranscript") !== null;

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
      await register(email, password);
      toast({
        title: "Account created",
        description: "Welcome to ContentFactory! Please check your email for confirmation.",
      });
      
      // If there's a pending transcript, redirect to generate/new and show a toast
      if (hasPendingTranscript) {
        toast({
          title: "Content Ready",
          description: "Your content is being generated now!",
        });
        navigate("/generate/new");
      } else {
        navigate("/dashboard");
      }
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
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
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
