
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ArrowRight, 
  Clock, 
  Wand2 
} from "lucide-react";

// Mock transcript data for the MVP
const mockTranscript = [
  { id: "1", start: 0, end: 4.5, text: "Hey everyone, welcome to this tutorial on React hooks." },
  { id: "2", start: 4.5, end: 9.2, text: "Today we're going to learn about the most commonly used hooks like useState and useEffect." },
  { id: "3", start: 9.2, end: 15, text: "These hooks are essential for building modern React applications." },
  { id: "4", start: 15, end: 22.3, text: "First, let's talk about useState. This hook allows you to add state to your functional components." },
  { id: "5", start: 22.3, end: 28.7, text: "The useState hook takes an initial state value and returns an array with two items." },
  { id: "6", start: 28.7, end: 35.2, text: "The first item is the current state value, and the second is a function that lets you update the state." },
  { id: "7", start: 35.2, end: 42.5, text: "Let's see a simple example where we create a counter component using the useState hook." },
  { id: "8", start: 42.5, end: 50.1, text: "First, we import useState from React. Then we define our component and initialize a count state with useState(0)." },
  { id: "9", start: 50.1, end: 58.4, text: "This gives us a count variable with the current state and a setCount function to update it." },
  { id: "10", start: 58.4, end: 65.2, text: "In our JSX, we display the count and add buttons to increment and decrement it by calling setCount." },
  { id: "11", start: 65.2, end: 72.9, text: "Next, let's talk about useEffect. This hook lets you perform side effects in your components." },
  { id: "12", start: 72.9, end: 80, text: "Side effects might include data fetching, subscriptions, or manually changing the DOM." },
  { id: "13", start: 80, end: 87.5, text: "useEffect runs after every render, but you can control this behavior by providing a dependency array." },
  { id: "14", start: 87.5, end: 95.1, text: "If you provide an empty array, the effect runs only once after the initial render." },
  { id: "15", start: 95.1, end: 105, text: "If you provide values in the array, the effect runs only when those values change." }
];

// Format time from seconds to MM:SS format
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const TranscriptView = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState(mockTranscript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  // Mock video data based on ID - in a real app, fetch this from Supabase
  const videoDetails = {
    id: videoId,
    title: "How to Use React Hooks",
    thumbnail: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D",
    duration: 105 // seconds
  };

  // Simulate playback - in a real app, this would sync with a video player
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying && currentTime < videoDetails.duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1;
          return newTime < videoDetails.duration ? newTime : videoDetails.duration;
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, videoDetails.duration]);

  // Find the current transcript line based on playback time
  const currentLineIndex = transcript.findIndex(
    (line) => currentTime >= line.start && currentTime <= line.end
  );
  
  const toggleLineSelection = (lineId: string) => {
    setSelectedLines((prev) => 
      prev.includes(lineId) 
        ? prev.filter(id => id !== lineId) 
        : [...prev, lineId]
    );
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (seconds: number) => {
    const newTime = Math.max(0, Math.min(videoDetails.duration, currentTime + seconds));
    setCurrentTime(newTime);
  };
  
  const autoSelectClips = () => {
    // In a real app, this would use an algorithm to find the best clips
    // For the MVP, we'll just select a few lines randomly
    const sampleLines = [
      transcript[2].id,
      transcript[6].id,
      transcript[11].id
    ];
    
    setSelectedLines(sampleLines);
    
    toast({
      title: "Clips auto-selected",
      description: "3 potential clips have been selected based on content analysis",
    });
  };
  
  const handleGenerateThreads = () => {
    if (selectedLines.length === 0) {
      toast({
        variant: "destructive",
        title: "No clips selected",
        description: "Please select at least one clip or use auto-select",
      });
      return;
    }
    
    // In a real app, this would send the selection to the backend
    // For the MVP, we'll just navigate to the thread generator
    navigate(`/generate/123`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{videoDetails.title}</h1>
        <p className="text-muted-foreground mt-1">
          Select portions of the transcript to generate tweet threads
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video preview and controls */}
        <div className="md:col-span-1 space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              <img 
                src={videoDetails.thumbnail} 
                alt={videoDetails.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatTime(currentTime)} / {formatTime(videoDetails.duration)}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSeek(-5)}
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  5s
                </Button>
                
                <Button 
                  variant={isPlaying ? "outline" : "default"} 
                  size="sm" 
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSeek(5)}
                >
                  5s
                  <SkipForward className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <h3 className="font-medium">Selected clips: {selectedLines.length}</h3>
            <Button
              variant="outline"
              className="w-full"
              onClick={autoSelectClips}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-select 3 clips
            </Button>
            
            <Button 
              className="w-full"
              onClick={handleGenerateThreads}
              disabled={selectedLines.length === 0}
            >
              Generate Threads
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Transcript viewer */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg">Transcript</h3>
                <div className="text-sm text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Click on lines to select clips for your thread
                </div>
              </div>
              
              <div className="timeline-scrubber mb-4">
                {transcript.map((line) => (
                  <div 
                    key={`marker-${line.id}`}
                    className="timeline-marker" 
                    style={{
                      left: `${(line.start / videoDetails.duration) * 100}%`,
                      width: `${((line.end - line.start) / videoDetails.duration) * 100}%`,
                      background: selectedLines.includes(line.id) 
                        ? 'rgba(59, 130, 246, 0.4)' 
                        : (currentTime >= line.start && currentTime <= line.end 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : 'transparent')
                    }}
                  />
                ))}
                <div 
                  className="absolute h-full w-0.5 bg-primary bottom-0 pointer-events-none" 
                  style={{ left: `${(currentTime / videoDetails.duration) * 100}%` }}
                />
              </div>
              
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                {transcript.map((line, idx) => (
                  <div key={line.id}>
                    <div 
                      className={`transcript-line ${selectedLines.includes(line.id) ? 'selected' : ''} ${idx === currentLineIndex ? 'bg-accent' : ''}`}
                      onClick={() => toggleLineSelection(line.id)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-primary">
                          {formatTime(line.start)} - {formatTime(line.end)}
                        </span>
                        <div className="h-4 w-4">
                          {selectedLines.includes(line.id) && (
                            <div className="h-3 w-3 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      <p>{line.text}</p>
                    </div>
                    {idx < transcript.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TranscriptView;
