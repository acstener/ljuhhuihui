
// Global type definitions for the application

interface Window {
  // Session management across components
  _sessionCreationInProgress?: string;
  _createdSessionId?: string;
  
  // Custom events
  dispatchEvent(event: CustomEvent): boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

// Session for dashboard and session views
interface Session {
  id: string;
  title: string;
  created_at: string;
  transcript: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_dimensions: { width: number, height: number } | null;
}

// Type for Supabase Response
interface SupabaseResponseWithId {
  id: string;
  [key: string]: any;
}

// Add any other global type definitions here
