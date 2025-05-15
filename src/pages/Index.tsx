
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Content Factory</span>
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Transform your content into engaging tweet threads in minutes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button size="lg" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          
          <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
            Create Account
          </Button>
        </div>
      </div>
      
      <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 5v14"></path>
              <path d="M18 13l-6 6"></path>
              <path d="M6 13l6 6"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Content</h3>
          <p className="text-muted-foreground">Upload your videos or input text to start creating engaging content.</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
              <line x1="18" x2="18" y1="9" y2="15"></line>
              <line x1="15" x2="15" y1="9" y2="15"></line>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Customize Tone</h3>
          <p className="text-muted-foreground">Set your preferred tone of voice with examples to match your brand style.</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Generate Threads</h3>
          <p className="text-muted-foreground">Transform your content into engaging tweet threads ready to share.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
