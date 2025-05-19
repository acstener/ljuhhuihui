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
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Studio from "@/pages/Studio";
import TranscriptEditor from "@/pages/TranscriptEditor";
import ThreadGenerator from "@/pages/ThreadGenerator";
import TrainTone from "./pages/TrainTone";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthContextType {
  user: any;
  session: any;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    session,
    logout,
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

const App = () => {
  const { user, session } = useAuth();

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="flex justify-center items-center h-screen bg-gray-100">
                  <div className="p-8 bg-white shadow-md rounded-lg w-96">
                    <h1 className="text-2xl font-semibold text-center mb-4">
                      Login
                    </h1>
                    <Auth
                      supabaseClient={supabase}
                      appearance={{ theme: ThemeSupa }}
                      providers={["google", "github"]}
                      redirectTo={`${window.location.origin}/dashboard`}
                    />
                  </div>
                </div>
              )
            }
          />

          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="studio" element={<Studio />} />
            <Route path="transcript-editor" element={<TranscriptEditor />} />
            <Route path="generate/new" element={<ThreadGenerator />} />
            <Route path="train-tone" element={<TrainTone />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export { useAuth };
export default App;
