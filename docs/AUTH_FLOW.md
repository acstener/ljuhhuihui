
# Authentication and Session Flow Technical Documentation

This document provides detailed technical information about how authentication and session management work in the application.

## Authentication Flow Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────────┐
│                 │       │                  │       │                   │
│  Studio/Upload  │──────▶│  Registration/   │──────▶│  Thread Generator │
│  (Transcript)   │       │  Login           │       │  (Content)        │
│                 │       │                  │       │                   │
└─────────────────┘       └──────────────────┘       └───────────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────┐       ┌──────────────────┐       ┌───────────────────┐
│                 │       │                  │       │                   │
│  localStorage   │       │  Supabase Auth   │       │  Supabase DB      │
│  (Temporary)    │       │  (User identity) │       │  (Sessions)       │
│                 │       │                  │       │                   │
└─────────────────┘       └──────────────────┘       └───────────────────┘
```

## Key Components

### 1. AuthProvider (App.tsx)

The AuthProvider is the central component that manages authentication state across the application:

- Initializes and manages user auth state
- Provides login/register functions
- Sets up auth state change listeners
- Persists user ID in localStorage for cross-component reference

### 2. Register.tsx

Handles user registration and session creation:

- Registers new users via Supabase
- Checks for pending transcripts in localStorage
- Calls `createSessionFromPending` to create sessions for new users
- Uses locking mechanisms to prevent duplicate session creation

### 3. ThreadGenerator.tsx

Responsible for content generation and session management:

- Verifies session ownership
- Checks for existing sessions with the same transcript
- Coordinates with Register.tsx using global variables
- Generates content for sessions

## Session Coordination Mechanisms

### Global Variables

```typescript
// In global.d.ts
interface Window {
  _sessionCreationInProgress?: string;
  _createdSessionId?: string;
}
```

- `_sessionCreationInProgress`: Unique ID used to lock session creation
- `_createdSessionId`: Stores the ID of a successfully created session

### Local Refs

```typescript
const sessionCreationAttempted = useRef(false);
const transcriptProcessed = useRef(false);
const sessionVerified = useRef(false);
const confirmedSessionId = useRef<string | null>(null);
```

These React refs prevent duplicate operations within component lifecycles.

## Session Creation Process

1. **Check Global State**:
   ```typescript
   if (window._createdSessionId) {
     console.log("Using globally created session ID:", window._createdSessionId);
     setSessionId(window._createdSessionId);
     return;
   }
   ```

2. **Set Locks**:
   ```typescript
   sessionCreationAttempted.current = true;
   const uniqueId = `register-session-creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   window._sessionCreationInProgress = uniqueId;
   ```

3. **Check for Existing Session**:
   ```typescript
   const existingSessionId = await findExistingSessionWithTranscript(userId, pendingTranscript);
   if (existingSessionId) {
     // Use existing session
     return existingSessionId;
   }
   ```

4. **Create New Session**:
   ```typescript
   const { data, error } = await supabase
     .from('sessions')
     .insert([{
       user_id: confirmedUserId,
       title: sessionTitle,
       transcript: pendingTranscript
     }])
     .select();
   ```

5. **Update Global State**:
   ```typescript
   localStorage.setItem("currentSessionId", sessionId);
   window._createdSessionId = sessionId;
   ```

## Duplicate Prevention Strategy

1. **Component-Level Locks** (useRef booleans)
2. **Application-Level Locks** (window global variables)
3. **Database-Level Checks** (query for existing sessions)
4. **LocalStorage Persistence** (cross-page coordination)

## Common Issues and Solutions

### Issue: Multiple Sessions Created

**Solution**: Ensure all components check for existing sessions using `findExistingSessionWithTranscript` before creating new ones.

### Issue: Session Creation Race Conditions

**Solution**: Use the `window._sessionCreationInProgress` lock to prevent parallel creation attempts.

### Issue: Sessions Not Associated with Current User

**Solution**: Double-check user ID with `supabase.auth.getSession()` before creating sessions.

## Best Practices

1. **Always check global state** before attempting session operations
2. **Use unique lock identifiers** to prevent deadlocks
3. **Handle auth state changes** reactively using `onAuthStateChange`
4. **Clear localStorage** after successful session creation
5. **Log operations** extensively for debugging
