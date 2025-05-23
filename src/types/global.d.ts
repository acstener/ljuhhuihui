
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

// Add any other global type definitions here
