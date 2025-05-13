
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import TranscriptView from "./pages/TranscriptView";
import ThreadGenerator from "./pages/ThreadGenerator";
import TranscriptInput from "./pages/TranscriptInput";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Set up auth state listener and check for existing session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Error registering:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session, user, loading, login, register, logout }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={
                  !session ? <Login /> : <Navigate to="/dashboard" />
                } />
                <Route path="/register" element={
                  !session ? <Register /> : <Navigate to="/dashboard" />
                } />
              </Route>
              
              {/* App routes - protected */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={
                  session ? <Dashboard /> : <Navigate to="/login" />
                } />
                <Route path="/upload" element={
                  session ? <UploadVideo /> : <Navigate to="/login" />
                } />
                <Route path="/transcript/:videoId" element={
                  session ? <TranscriptView /> : <Navigate to="/login" />
                } />
                <Route path="/generate/:clipId" element={
                  session ? <ThreadGenerator /> : <Navigate to="/login" />
                } />
                <Route path="/input-transcript" element={
                  session ? <TranscriptInput /> : <Navigate to="/login" />
                } />
                <Route path="/studio" element={
                  session ? <Studio /> : <Navigate to="/login" />
                } />
              </Route>
              
              {/* Redirect root to login or dashboard based on auth state */}
              <Route path="/" element={
                loading ? <div>Loading...</div> : 
                session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
