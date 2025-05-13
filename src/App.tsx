
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useContext } from "react";

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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  // For the MVP, we'll simulate auth with a simple state
  // In a real app, this would connect to Supabase auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    console.log("Would login with", email, password);
    // Here we would connect to Supabase
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string) => {
    console.log("Would register with", email, password);
    // Here we would connect to Supabase
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={
                  !isAuthenticated ? <Login /> : <Navigate to="/dashboard" />
                } />
                <Route path="/register" element={
                  !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
                } />
              </Route>
              
              {/* App routes - protected */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                } />
                <Route path="/upload" element={
                  isAuthenticated ? <UploadVideo /> : <Navigate to="/login" />
                } />
                <Route path="/transcript/:videoId" element={
                  isAuthenticated ? <TranscriptView /> : <Navigate to="/login" />
                } />
                <Route path="/generate/:clipId" element={
                  isAuthenticated ? <ThreadGenerator /> : <Navigate to="/login" />
                } />
                <Route path="/input-transcript" element={
                  isAuthenticated ? <TranscriptInput /> : <Navigate to="/login" />
                } />
                <Route path="/studio" element={
                  isAuthenticated ? <Studio /> : <Navigate to="/login" />
                } />
              </Route>
              
              {/* Redirect root to login or dashboard based on auth state */}
              <Route path="/" element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
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
