
# Voice-Powered Content Generation Application

This documentation will help you set up and understand the application for local development, with specific focus on the ElevenLabs voice AI integration and overall architecture.

## Table of Contents
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [ElevenLabs Integration](#elevenlabs-integration)
- [Supabase Integration](#supabase-integration)
- [Key Workflows](#key-workflows)
- [Development Tips](#development-tips)

## Getting Started

### Prerequisites
- Node.js (v16+) and npm/yarn/bun
- Supabase account (for authentication and database)
- ElevenLabs account (for voice conversation capabilities)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd <your-project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

5. **Open your browser**
   The application should be running at http://localhost:5173

## Project Architecture

The application is built using:
- **React** - Frontend library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - UI component library
- **React Router** - Routing
- **Supabase** - Authentication and database
- **ElevenLabs** - Voice AI conversation

### Directory Structure

```
/src
  /components        # Reusable UI components
    /thread          # Thread-specific components
    /ui              # shadcn UI components
  /hooks             # Custom React hooks
  /integrations      # Third-party integrations
    /supabase        # Supabase client and types
  /layouts           # Page layout components
  /lib               # Utility functions
  /pages             # Page components
```

## ElevenLabs Integration

### Overview

The application uses ElevenLabs' Conversation API to provide voice-based interaction. This is implemented through the `@11labs/react` library which provides React hooks for managing ElevenLabs conversations.

### Key Components

1. **use-eleven-conversation.tsx**
   - Core hook that manages the ElevenLabs conversation
   - Handles connections, messages, and state management
   - Provides an interface for starting/stopping conversations and sending messages

2. **VoiceOrb.tsx**
   - UI component that visualizes the listening state
   - Provides start/stop controls for the conversation

3. **Studio.tsx**
   - Main page that integrates the ElevenLabs conversation
   - Manages the transcript and conversation flow
   - Handles saving sessions to Supabase

### ElevenLabs Configuration

1. **Agent ID**: The application uses a specific ElevenLabs Agent ID (`PVNwxSmzIwblQ0k5z7s8`).

2. **Connection Management**:
   - The application handles reconnection attempts when the connection drops
   - It manages the microphone permissions and audio playback

3. **Conversation Flow**:
   - User starts conversation → ElevenLabs listens for voice input
   - Input is processed by ElevenLabs and a response is generated
   - Response is spoken back to the user and added to the transcript

### How to Test ElevenLabs Integration

1. Navigate to the Studio page
2. Click on the VoiceOrb to start a conversation
3. Speak clearly into your microphone
4. The application will transcribe your speech and generate a response
5. When done, click the VoiceOrb again to stop the conversation

## Supabase Integration

### Authentication

The application uses Supabase for user authentication with the following features:
- Email and password authentication
- Session management
- Protected routes

### Database Schema

The application uses the following tables:

1. **sessions**
   - Stores user session data including transcripts
   - Used to save and retrieve conversation history
   - Links to the user ID for authentication

## Key Workflows

### Content Generation Flow

1. **Record conversation in Studio**
   - User speaks with the AI assistant
   - Conversation is transcribed in real-time
   - Transcript is saved to the database

2. **Generate content**
   - User clicks "Generate Content" in Studio
   - Application redirects to ThreadGenerator
   - AI generates tweets/content based on the conversation
   - User can edit, delete, or copy the generated content

3. **View and manage sessions**
   - User can view all their sessions in Dashboard
   - Select a specific session to view or continue

## Development Tips

### Debugging

1. **Console Logging**
   - The application includes detailed debug logging for ElevenLabs integration
   - Check the console for messages prefixed with `[ElevenLabs Debug]`

2. **Session Storage**
   - Check localStorage for saved transcript data
   - Key to look for: `elevenlabs_session`

### Common Issues

1. **Microphone Access**
   - Ensure your browser has microphone permissions
   - Check browser console for permission errors

2. **Connection Issues**
   - The application attempts to reconnect automatically
   - Check network tab for websocket connection status

3. **Transcript Not Saving**
   - Verify Supabase connection
   - Check user authentication status

## Additional Resources

- [ElevenLabs Documentation](https://docs.elevenlabs.io/)
- [ElevenLabs React SDK](https://www.npmjs.com/package/@11labs/react)
- [Supabase Documentation](https://supabase.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
