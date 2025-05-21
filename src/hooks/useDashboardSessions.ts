
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";

// Define types for our data
interface Session {
  id: string;
  title: string;
  created_at: string;
  transcript: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_dimensions: { width: number, height: number } | null;
}

export function useDashboardSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Refs for managing fetch states
  const fetchTriggeredRef = useRef(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAttemptsRef = useRef(0);
  const maxFetchAttempts = 3; // Circuit breaker - max number of auto-retries
  
  // Fetch sessions from Supabase with improved debouncing and circuit breaking
  const fetchSessions = useCallback(async (forceRefetch = false) => {
    // Skip if no user ID (not authenticated)
    if (!user?.id) {
      console.log("Cannot fetch sessions: No authenticated user");
      setIsLoading(false);
      setSessions([]);
      return;
    }
    
    // Prevent multiple refreshes within 3 seconds unless forced
    const now = Date.now();
    if (!forceRefetch && now - lastRefreshTime < 3000) {
      console.log("Skipping refresh - too soon since last refresh");
      return;
    }
    
    // Skip if already refreshing
    if (isRefreshing && !forceRefetch) {
      console.log("Already refreshing, skipping duplicate fetch");
      return;
    }
    
    // Circuit breaker - prevent too many auto-retries
    if (!forceRefetch && fetchAttemptsRef.current >= maxFetchAttempts) {
      console.log(`Circuit breaker: Exceeded ${maxFetchAttempts} auto-refresh attempts`);
      setIsLoading(false);
      return;
    }
    
    // Increment fetch attempts counter for auto-refreshes only
    if (!forceRefetch) {
      fetchAttemptsRef.current += 1;
    } else {
      // Reset counter for manual refreshes
      fetchAttemptsRef.current = 0;
    }
    
    setIsLoading(true);
    if (forceRefetch) {
      setIsRefreshing(true);
    }
    
    // Update last refresh time
    setLastRefreshTime(now);
    
    try {
      console.log("Fetching sessions for user:", user.id);
      
      // Double check the user session to make sure we have the current user ID
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const confirmedUserId = currentSession?.user?.id || user.id;
      
      console.log("Confirmed user ID for fetching sessions:", confirmedUserId);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', confirmedUserId)
        .order('updated_at', { ascending: false })
        .limit(6);
        
      if (sessionError) {
        console.error("Error fetching sessions:", sessionError);
        throw sessionError;
      }
      
      console.log("Fetched sessions:", sessionData?.length || 0);
      
      // Only update state if we get valid data
      if (sessionData) {
        // Remove any duplicate sessions by ID
        const uniqueSessions = Array.from(
          new Map(sessionData.map(item => [item.id, item])).values()
        );
        
        console.log("Unique sessions after deduplication:", uniqueSessions.length);
        
        // Transform the data to match our Session interface
        const transformedSessions: Session[] = uniqueSessions.map(item => ({
          id: item.id,
          title: item.title,
          created_at: item.created_at,
          transcript: item.transcript,
          video_url: item.video_url,
          video_duration: item.video_duration,
          // Convert video_dimensions JSON to our expected format or null
          video_dimensions: item.video_dimensions 
            ? (typeof item.video_dimensions === 'string' 
                ? JSON.parse(item.video_dimensions) 
                : item.video_dimensions as { width: number, height: number })
            : null
        }));
        
        setSessions(transformedSessions);
      }
      
      // Check for sessions in the database to verify
      if (sessionData && sessionData.length > 0) {
        console.log("Session data sample:", sessionData[0]);
        // Reset the circuit breaker on successful fetch
        fetchAttemptsRef.current = 0;
      } else {
        console.log("No sessions found for user");
        
        // If no sessions and we just came from signup/content generation
        // let's retry once after a small delay
        if ((location.state?.fromSignup || location.state?.fromContentGeneration) && 
            fetchAttemptsRef.current <= 1) {
          console.log("No sessions found but coming from signup/generation - scheduling retry");
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          refreshTimeoutRef.current = setTimeout(() => {
            console.log("Retrying session fetch after delay");
            fetchSessions(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error loading sessions",
        description: "Could not load your recent sessions. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, toast, isRefreshing, lastRefreshTime, location.state]);

  // Clean up any scheduled refreshes on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Only fetch once when component mounts or when user changes
  useEffect(() => {
    if (user?.id && !fetchTriggeredRef.current) {
      console.log("Initial session fetch for user:", user.id);
      fetchTriggeredRef.current = true;
      fetchSessions(false);
    }
  }, [user?.id, fetchSessions]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (isRefreshing) return;
    fetchTriggeredRef.current = false; // Reset the flag to allow a fresh fetch
    fetchAttemptsRef.current = 0; // Reset circuit breaker
    fetchSessions(true);
  };

  // Check for localStorage indicators that content was generated
  useEffect(() => {
    const lastGenerated = localStorage.getItem("lastContentGenerated");
    
    if (lastGenerated && user?.id) {
      const timestamp = new Date(lastGenerated).getTime();
      const now = new Date().getTime();
      const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
      
      // If content was generated in the last 5 minutes, refresh once
      if (timestamp > fiveMinutesAgo && !fetchTriggeredRef.current) {
        console.log("Recent content generation detected, refreshing sessions");
        fetchSessions(true);
        
        // Clear the lastContentGenerated flag after refreshing
        localStorage.removeItem("lastContentGenerated");
      }
    }
  }, [user?.id, fetchSessions]);
  
  // If coming from signup or content generation, refresh once
  useEffect(() => {
    if ((location.state?.fromContentGeneration || location.state?.fromSignup) && 
        !fetchTriggeredRef.current) {
      console.log("Coming from content generation or signup, refreshing sessions");
      // Add small delay to allow the database to update
      setTimeout(() => fetchSessions(true), 1000);
    }
  }, [location.state, fetchSessions]);

  return {
    sessions,
    isLoading,
    isRefreshing,
    handleRefresh
  };
}
