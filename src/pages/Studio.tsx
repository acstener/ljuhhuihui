
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Headphones, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AGENT_ID = "PVNwxSmzIwblQ0k5z7s8";

// Define types for ElevenLabs message format
interface ElevenLabsMessage {
  source: string;
  message: string;
}

const Studio = () => {
  const [transcript, setTranscript] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const navigate = useNavigate();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs Conversation AI");
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Connected to ElevenLabs Conversation AI"
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs Conversation AI");
      setIsConnected(false);
      setIsListening(false);
    },
    onMessage: (message: ElevenLabsMessage) => {
      console.log("Message received:", message);
      
      // Handle different message sources from ElevenLabs
      if (message.source === "transcript" && message.message) {
        setTranscript(prev => prev + "\n\n" + message.message);
      } else if (message.source === "agent" && message.message) {
        setTranscript(prev => prev + "\n\nAI: " + message.message);
      } else if (message.source === "user" && message.message) {
        setTranscript(prev => prev + "\n\nYou: " + message.message);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to ElevenLabs AI",
        variant: "destructive"
      });
    }
  });

  const startConversation = async () => {
    try {
      setTranscript("");
      await conversation.startSession({
        agentId: AGENT_ID
      });
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to start conversation with ElevenLabs AI",
        variant: "destructive"
      });
    }
  };

  const stopConversation = async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
    } catch (error) {
      console.error("Failed to stop conversation:", error);
    }
  };

  const sendTextMessage = async () => {
    if (!userInput.trim()) return;
    
    try {
      // Use sendUserMessage instead of sendTextMessage as per the library API
      await conversation.sendUserMessage(userInput);
      setUserInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Message Failed",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const useTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No Transcript",
        description: "There is no conversation transcript to process",
        variant: "destructive"
      });
      return;
    }

    // Save transcript to localStorage to be processed
    localStorage.setItem("studioTranscript", transcript);
    
    // Navigate to the input transcript page
    navigate("/input-transcript", { 
      state: { transcript }
    });
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [isConnected, conversation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Studio</h1>
        <p className="text-muted-foreground mt-1">
          Have a conversation with AI and turn it into tweet threads
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              AI Conversation
            </CardTitle>
            <CardDescription>
              Talk with the AI assistant and create content from your conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                {!isListening ? (
                  <Button 
                    onClick={startConversation}
                    className="flex-1"
                  >
                    <Mic className="mr-2 h-4 w-4" /> Start Conversation
                  </Button>
                ) : (
                  <Button 
                    onClick={stopConversation}
                    variant="destructive"
                    className="flex-1"
                  >
                    <MicOff className="mr-2 h-4 w-4" /> End Conversation
                  </Button>
                )}
              </div>
              
              {isConnected && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button onClick={sendTextMessage} variant="outline">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm">
                    <Headphones className="h-4 w-4 mr-1 text-green-500" /> 
                    <span className="text-muted-foreground">
                      {isListening ? "Listening..." : "Ready to listen"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversation Transcript</CardTitle>
            <CardDescription>
              The transcript will be used to generate tweet threads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-md min-h-[300px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {transcript || "Your conversation transcript will appear here..."}
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={useTranscript}
                disabled={!transcript.trim()}
              >
                Use This Transcript
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Studio;
