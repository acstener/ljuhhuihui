
# Local Development Guide

This document provides detailed instructions for setting up and developing the application locally.

## Initial Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
```

For ElevenLabs, you'll need to sign up at [elevenlabs.io](https://elevenlabs.io) to get an API key.

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application should now be running at http://localhost:5173

## Development Workflow

### Code Architecture

The application follows a component-based architecture with:

1. **Pages** (`src/pages/`) - Main page components
2. **Components** (`src/components/`) - Reusable UI components
3. **Hooks** (`src/hooks/`) - Custom React hooks
4. **Layouts** (`src/layouts/`) - Page layout components
5. **Integrations** (`src/integrations/`) - Third-party service integrations

### Key Files

- `src/App.tsx` - Main application component with routing
- `src/hooks/use-eleven-conversation.tsx` - ElevenLabs conversation hook
- `src/pages/Studio.tsx` - Voice recording and conversation page
- `src/pages/ThreadGenerator.tsx` - Content generation page

### Authentication Flow

The application uses Supabase for authentication:

1. User signs up/logs in via `/auth/register` or `/auth/login`
2. Supabase handles authentication and creates a session
3. Protected routes check for authentication status
4. Session is persisted across page reloads

### Transcript and Content Generation Flow

1. User records conversation in Studio
2. Transcript is saved to Supabase
3. User clicks "Generate Content"
4. Application navigates to ThreadGenerator
5. Content is generated based on transcript

## Testing

### Manual Testing

1. **Authentication**
   - Test user registration
   - Test login/logout
   - Test protected routes

2. **Studio Recording**
   - Test starting/stopping conversation
   - Test microphone input
   - Test AI response
   - Test transcript saving

3. **Content Generation**
   - Test generating content from transcript
   - Test editing generated content
   - Test downloading content

## Debugging

### Browser DevTools

1. **Console**
   - Check for errors and debug logs
   - The application logs detailed information about ElevenLabs connection status

2. **Network Tab**
   - Monitor API requests to Supabase
   - Check websocket connections for ElevenLabs

3. **Application Tab**
   - Check localStorage for saved transcript data
   - Check for authentication tokens

## Common Development Tasks

### Adding a New Page

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Link to the page from relevant components

### Adding a New Component

1. Create the component in `src/components/`
2. Import and use it in the relevant pages/components

### Modifying ElevenLabs Integration

1. Update configuration in `src/hooks/use-eleven-conversation.tsx`
2. Test changes in the Studio page

### Updating Database Schema

1. Update Supabase tables via the Supabase dashboard
2. Update types in `src/integrations/supabase/types.ts`
3. Update queries in relevant components

## Best Practices

1. **Component Structure**
   - Keep components small and focused
   - Use custom hooks for logic
   - Separate UI from business logic

2. **State Management**
   - Use React context for global state
   - Use local state for component-specific state
   - Use Supabase for persistent state

3. **Error Handling**
   - Use try/catch for API calls
   - Display user-friendly error messages
   - Log detailed errors for debugging

4. **Performance**
   - Memoize expensive calculations
   - Use React.memo for pure components
   - Lazy load routes when appropriate

## Deployment

### Building for Production

```bash
npm run build
# or
yarn build
# or
bun run build
```

The built files will be in the `dist` directory.
