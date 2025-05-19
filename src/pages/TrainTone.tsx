
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { useAuth } from "@/App";

const TrainTone = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [exampleTweets, setExampleTweets] = useState<string[]>(["", "", "", "", ""]);
  const [toneName, setToneName] = useState("My Authentic Voice");
  const [description, setDescription] = useState("This is my natural tone of voice, authentic and raw.");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load existing tone if available
  useEffect(() => {
    const fetchExistingTone = async () => {
      try {
        const { data, error } = await supabase
          .from("tone_preferences")
          .select("*")
          .limit(1)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        
        if (data && data.length > 0) {
          const tone = data[0];
          setToneName(tone.name);
          setDescription(tone.description);
          
          // Fill example tweets, ensuring we have at least 5 slots
          const tweets = [...tone.example_tweets];
          while (tweets.length < 5) tweets.push("");
          setExampleTweets(tweets.slice(0, 5));
        }
      } catch (err: any) {
        console.error("Failed to fetch existing tone:", err);
      }
    };

    if (user?.id) {
      fetchExistingTone();
    }
  }, [user?.id]);

  const handleUpdateTweet = (index: number, value: string) => {
    const updatedTweets = [...exampleTweets];
    updatedTweets[index] = value;
    setExampleTweets(updatedTweets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to save preferences",
        variant: "destructive"
      });
      return;
    }

    // Filter out empty tweets
    const nonEmptyTweets = exampleTweets.filter(tweet => tweet.trim() !== "");

    if (nonEmptyTweets.length < 1) {
      toast({
        title: "Need examples",
        description: "Please provide at least one example tweet",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tone_preferences")
        .insert({
          user_id: user.id,
          name: toneName,
          description: description,
          example_tweets: nonEmptyTweets
        });

      if (error) throw new Error(error.message);

      toast({
        title: "Tone saved",
        description: "Your tone preferences have been saved successfully"
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Failed to save tone:", err);
      toast({
        title: "Failed to save",
        description: err.message || "Could not save tone preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Train Your Tone</h1>
        <p className="text-muted-foreground">
          Provide examples of your authentic voice to improve content generation
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Voice Profile</CardTitle>
            <CardDescription>
              Help the AI understand your unique tone of voice by providing examples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="toneName" className="block text-sm font-medium">
                Profile Name
              </label>
              <Input
                id="toneName"
                value={toneName}
                onChange={(e) => setToneName(e.target.value)}
                placeholder="My Authentic Voice"
                className="max-w-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the tone and style of your voice..."
                className="max-w-2xl"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">
                Example Posts (provide 5 examples of your authentic voice)
              </label>
              <div className="space-y-4">
                {exampleTweets.map((tweet, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center mt-2 flex-shrink-0">
                      {index + 1}
                    </div>
                    <Textarea
                      value={tweet}
                      onChange={(e) => handleUpdateTweet(index, e.target.value)}
                      placeholder="Enter an example post in your authentic voice..."
                      className="flex-grow"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Tone Profile"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>

      <div className="bg-muted/20 rounded-lg p-6 border border-muted">
        <h3 className="text-lg font-medium mb-2">Tips for Authentic Examples</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Use your natural writing style - don't try to sound "professional" or "polished"</li>
          <li>• Include examples that capture your unique expressions and word choices</li>
          <li>• Avoid using hashtags, @mentions, or other typical "social media" formatting</li>
          <li>• Show your personality - the more authentic, the better the AI can match your voice</li>
          <li>• Include a mix of different topics you typically discuss</li>
        </ul>
      </div>
    </div>
  );
};

export default TrainTone;
