
# ElevenLabs Integration Guide

This document provides detailed information about the ElevenLabs integration in our application.

## What is ElevenLabs?

ElevenLabs is an AI voice technology company that provides high-quality, realistic voice synthesis and conversation capabilities. In our application, we use ElevenLabs' Conversation API to enable voice-based interaction with an AI assistant.

## Integration Architecture

### 1. React SDK

We use the official `@11labs/react` library which provides React hooks for managing ElevenLabs conversations. This SDK abstracts away the complexity of websocket connections, audio streaming, and message handling.

```typescript
import { useConversation } from "@11labs/react";
```

### 2. Custom Hook Implementation

We've created a custom hook (`useElevenConversation`) that wraps the ElevenLabs SDK and provides additional functionality:

- Transcript management and persistence
- Reconnection logic
- Error handling
- User-friendly state management

This hook can be found in `src/hooks/use-eleven-conversation.tsx`.

## Key Components

### Core Configuration

```typescript
// Agent ID for the ElevenLabs conversation
const AGENT_ID = "PVNwxSmzIwblQ0k5z7s8";

// Maximum number of reconnection attempts
const MAX_RETRIES = 5;

// Delay between reconnection attempts
const CONNECTION_RETRY_DELAY = 5000;
```

### Conversation States

The hook manages several important states:

1. **isListening** - Whether the conversation is active
2. **isConnected** - Whether the websocket connection is established
3. **isInitializing** - Whether the connection is being initialized
4. **transcript** - The current conversation transcript
5. **connectionAttempts** - Number of reconnection attempts made

### Message Handling

The hook processes messages from different sources:

```typescript
const onMessage = useCallback((message: ElevenLabsMessage) => {
  // Different message sources from ElevenLabs
  if (message.source === "transcript" && message.message) {
    setTranscript(prev => prev + "\n\n" + message.message);
  } else if (message.source === "agent" && message.message) {
    setTranscript(prev => prev + "\n\nAI: " + message.message);
  } else if (message.source === "user" && message.message) {
    setTranscript(prev => prev + "\n\nYou: " + message.message);
  } else if (message.source === "ai" && message.message) {
    setTranscript(prev => prev + "\n\nAI: " + message.message);
  }
}, []);
```

## Setting Up Your ElevenLabs Account

### 1. Create an Account

Visit [ElevenLabs](https://elevenlabs.io/) and create an account.

### 2. Get Your API Key

1. Log in to your ElevenLabs account
2. Navigate to Profile Settings
3. Find your API key under the "API" section
4. Use this key in your environment variables:
   ```
   VITE_ELEVENLABS_API_KEY=<your-api-key>
   ```

### 3. Access the ElevenLabs Voice Lab

1. In the ElevenLabs dashboard, navigate to "Voice Lab"
2. Here you can create and customize voices
3. Note the Voice IDs of voices you want to use

### 4. Create a Conversation Agent (Optional)

1. In the ElevenLabs dashboard, navigate to "Conversation Agent"
2. Create a new agent or use an existing one
3. Note the Agent ID to use in your application

## Implementing Your Own ElevenLabs Features

### Basic Conversation Setup

```typescript
import { useConversation } from "@11labs/react";

const YourComponent = () => {
  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: () => console.log("Disconnected from ElevenLabs"),
    onMessage: (message) => console.log("Message received:", message),
    onError: (error) => console.error("Error:", error),
  });

  const startChat = async () => {
    await conversation.startSession({
      agentId: "YOUR_AGENT_ID",
    });
  };

  const stopChat = async () => {
    await conversation.endSession();
  };

  return (
    <div>
      <button onClick={startChat}>Start Conversation</button>
      <button onClick={stopChat}>End Conversation</button>
    </div>
  );
};
```

### Advanced Usage

For more advanced usage, refer to our custom hook implementation in `src/hooks/use-eleven-conversation.tsx`. This includes:

- Connection management
- Error handling
- Transcript persistence
- Reconnection logic

## Troubleshooting

### Common Issues

1. **Connection Fails to Establish**
   - Verify your API key is correct
   - Check network connectivity
   - Ensure the Agent ID is valid

2. **Microphone Not Working**
   - Make sure browser has microphone permissions
   - Try a different browser
   - Test microphone in system settings

3. **No Audio Output**
   - Check system volume
   - Ensure browser has audio permissions
   - Test with another audio source

4. **Messages Not Being Processed**
   - Check console logs for errors
   - Verify the conversation is connected
   - Try restarting the conversation

## Resources

- [ElevenLabs Documentation](https://docs.elevenlabs.io/)
- [ElevenLabs React SDK Documentation](https://www.npmjs.com/package/@11labs/react)
- [ElevenLabs API Reference](https://api.elevenlabs.io/docs)
