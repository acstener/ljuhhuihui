
# Voice-Powered Content Generation Platform

## Overview

This application helps users generate authentic content by recording their spoken thoughts and transforming them into ready-to-share social media posts and content. It uses ElevenLabs voice AI for natural conversations, processes the transcripts, and generates polished content that matches the user's authentic voice.

## Core Features

- **Voice Recording Studio**: Have natural conversations with an AI assistant
- **Content Generation**: Transform conversations into polished social media posts
- **Content Management**: Edit, organize, and manage your generated content
- **Voice Training**: Train the system to match your authentic tone and style

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database, Storage)
- **Voice AI**: ElevenLabs Conversation API
- **Hosting**: [Your hosting provider]

## Getting Started

For detailed setup instructions, see the [Local Development Guide](./docs/LOCAL_DEVELOPMENT.md).

### Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run the development server: `npm run dev`

### Environment Variables

Create a `.env` file with the following:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
```

## Authentication & Session Flow

Our application has a unique authentication flow designed to handle content generation that can start before a user is authenticated.

### Key Concepts

1. **Pending Transcripts**: Users can create content without being logged in. These are stored temporarily in localStorage as "pendingTranscript".

2. **Session Creation**: A "session" represents a conversation and its generated content. Sessions are only stored in the database after authentication.

3. **Global Session Tracking**: To prevent duplicate sessions, we use window-level variables (`_sessionCreationInProgress` and `_createdSessionId`) for cross-component coordination.

### Authentication Flow Step-by-Step

1. **Pre-Authentication Content Creation**:
   - User interacts with the AI in Studio or uploads transcript
   - Content is temporarily stored in localStorage as "pendingTranscript"
   - User is prompted to register/login to save content

2. **Registration/Login Process**:
   - User creates an account or signs in using email/password
   - Auth state is managed by Supabase and stored in context
   - The auth process includes checks for pending content

3. **Session Creation After Authentication**:
   - After successful authentication, the system:
     a. Checks if a session with the same transcript already exists to prevent duplicates
     b. If no existing session, creates a new one in the database
     c. Sets global tracking variables to prevent duplicate creation

4. **Content Generation and Storage**:
   - Generated content is linked to the session and user ID
   - User is redirected to view their content

### Session Management Logic

- **Duplicate Prevention**: Multiple safeguards (local refs, global variables, database checks) prevent creating duplicate sessions
- **Unique ID Tracking**: Session IDs are tracked across components using both localStorage and global variables
- **Auth State Monitoring**: Components react to auth state changes for seamless user experience

## Documentation

- [Project Documentation](./docs/README.md) - Complete project overview
- [ElevenLabs Integration](./docs/ELEVENLABS.md) - Details about the voice AI integration
- [Local Development](./docs/LOCAL_DEVELOPMENT.md) - Setup and development workflow

## Main Application Flow

1. **Authentication**: Users sign up/login via Supabase authentication
2. **Studio**: Users record conversations with the AI assistant
3. **Content Generation**: The system processes the transcript and generates content
4. **Management**: Users can edit, organize, and export their content

## Key Components

- **Studio**: Voice recording and conversation interface
- **Thread Generator**: Content generation and editing interface
- **Dashboard**: Session management and overview
- **Voice Training**: Tools to train the system on the user's voice and style

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to contribute to this project.

## License

[Specify your license here]

## Support

[Provide contact information or support resources]
