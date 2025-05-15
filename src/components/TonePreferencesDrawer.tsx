import { useState, useEffect } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Plus, Save, Trash2 } from "lucide-react";

const TonePreferencesDrawer = ({ trigger }: { trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [newPreference, setNewPreference] = useState({ name: '', description: '', example_tweets: [''] });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tone_preferences')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      setPreferences(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch preferences",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewPreference({ ...newPreference, [e.target.name]: e.target.value });
  };

  const handleAddTweet = () => {
    setNewPreference({ ...newPreference, example_tweets: [...newPreference.example_tweets, ''] });
  };

  const handleTweetChange = (index: number, value: string) => {
    const updatedTweets = [...newPreference.example_tweets];
    updatedTweets[index] = value;
    setNewPreference({ ...newPreference, example_tweets: updatedTweets });
  };

  const handleRemoveTweet = (index: number) => {
    const updatedTweets = [...newPreference.example_tweets];
    updatedTweets.splice(index, 1);
    setNewPreference({ ...newPreference, example_tweets: updatedTweets });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tone_preferences')
        .insert({ ...newPreference, user_id: user?.id });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Preference added successfully",
      });
      setNewPreference({ name: '', description: '', example_tweets: [''] });
      fetchPreferences();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add preference",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tone_preferences')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Preference deleted successfully",
      });
      fetchPreferences();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete preference",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tone Preferences</DrawerTitle>
          <DrawerDescription>
            Manage your tone preferences here.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {preferences.map((preference) => (
                <div key={preference.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{preference.name}</p>
                    <p className="text-xs text-muted-foreground">{preference.description}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(preference.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {preferences.length === 0 && (
                <p className="text-sm text-muted-foreground">No preferences added yet.</p>
              )}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button onClick={() => setOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Preference
          </Button>
        </DrawerFooter>
        {/* Add Preference Modal */}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              type="text"
              name="name"
              id="name"
              value={newPreference.name}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              value={newPreference.description}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right">
              Example Tweets
            </Label>
            <div className="col-span-3 space-y-2">
              {newPreference.example_tweets.map((tweet, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={tweet}
                    onChange={(e) => handleTweetChange(index, e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveTweet(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddTweet}
                disabled={isLoading}
              >
                Add Tweet
              </Button>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DrawerFooter>
        
      </DrawerContent>
    </Drawer>
  );
};

export default TonePreferencesDrawer;
