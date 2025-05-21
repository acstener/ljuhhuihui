import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Studio from "@/pages/Studio";
import ThreadGenerator from "@/pages/ThreadGenerator";
import SessionView from "@/pages/SessionView";
import TrainTone from "./pages/TrainTone";
import Index from "./pages/Index";
import { supabase } from "./integrations/supabase/client";

interface AuthContextType {
  user: any;
  session: any;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log("Manually refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        return;
      }
      
      if (data.session) {
        console.log("Session refreshed successfully:", data.session.user.id);
        setSession(data.session);
        setUser(data.session.user);
      } else {
        console.warn("No session returned after refresh");
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // First set up the auth state change listener to catch any events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("Auth state changed:", event, newSession?.user?.id);
          
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // When a new user signs in, save the user ID to localStorage
          if (event === 'SIGNED_IN' && newSession?.user) {
            console.log("User signed in, updating localStorage");
            localStorage.setItem("currentUserId", newSession.user.id);
            localStorage.setItem("authStateChanged", new Date().toISOString());
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out, cleaning up localStorage");
            localStorage.removeItem("currentUserId");
            localStorage.removeItem("currentSessionId");
            localStorage.removeItem("supabase-auth");
          }
        });
        
        // Now get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log("Auth initialized with existing session:", currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          localStorage.setItem("currentUserId", currentSession.user.id);
        } else {
          console.log("Auth initialized without a user session");
          setSession(null);
          setUser(null);
        }
        
        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up the auth state change listener AFTER checking for the existing session
    // This prevents race conditions where the listener triggers before initialization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
      
      // When a new user signs in, save the user ID to localStorage
      // This helps with cross-component consistency
      if (event === 'SIGNED_IN' && newSession?.user) {
        localStorage.setItem("currentUserId", newSession.user.id);
        
        // Set a flag for components to detect authentication state changes
        localStorage.setItem("authStateChanged", new Date().toISOString());
      } else if (event === 'SIGNED_OUT') {
        // Clean up user-related data on sign out
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentSessionId");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Store user ID for cross-component reference
    if (data?.user) {
      localStorage.setItem("currentUserId", data.user.id);
    }
    
    return data;
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Store user ID for cross-component reference if sign up is immediate
    if (data?.user) {
      localStorage.setItem("currentUserId", data.user.id);
    }
    
    return data;
  };

  const logout = async () => {
    // Clean up user data first
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("supabase-auth");
    
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    session,
    login,
    register,
    logout,
    isLoading,
    refreshSession // Add the refreshSession function to the context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Protected route wrapper component
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login page with return URL
      navigate("/auth/login", { 
        replace: true,
        state: { returnUrl: location.pathname }
      });
    }
  }, [user, isLoading, navigate, location]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // If authenticated, render the child routes
  return user ? <Outlet /> : null;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Home page - accessible to everyone */}
          <Route path="/" element={<Index />} />
          
          {/* Auth pages */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          
          <Route
            path="/login"
            element={<Navigate to="/auth/login" replace />}
          />
          
          {/* Protected routes under ProtectedRoute wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="studio" element={<Studio />} />
              <Route path="generate/new" element={<ThreadGenerator />} />
              <Route path="train-tone" element={<TrainTone />} />
              <Route path="session/:id" element={<SessionView />} />
            </Route>
          </Route>

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export { useAuth };
export default App;
