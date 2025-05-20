
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
