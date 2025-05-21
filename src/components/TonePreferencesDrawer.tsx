
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sonner } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";
import { Database } from "@/integrations/supabase/types";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Tone name must be at least 3 characters" })
    .max(50),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500),
  exampleTweets: z.array(z.string()),
});

// Define type for TonePreference using Database types
type TonePreference = Database["public"]["Tables"]["tone_preferences"]["Row"];

// Update the component to accept a trigger prop
interface TonePreferencesDrawerProps {
  trigger?: React.ReactNode;
}

export function TonePreferencesDrawer({ trigger }: TonePreferencesDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tonePreferences, setTonePreferences] = useState<TonePreference[]>([]);
  const [exampleTweets, setExampleTweets] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      exampleTweets: [""],
    },
  });

  const fetchTonePreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tone_preferences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Use type assertion to handle the data safely
      if (data) {
        // Cast data to the correct type
        setTonePreferences(data as TonePreference[]);
      }
    } catch (error: any) {
      console.error("Error fetching tone preferences:", error.message);
      toast({
        variant: "destructive",
        title: "Failed to load tone preferences",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTonePreferences();
    }
  }, [isOpen, user]);

  const addExampleTweet = () => {
    setExampleTweets([...exampleTweets, ""]);
    form.setValue("exampleTweets", [...form.getValues().exampleTweets, ""]);
  };

  const removeExampleTweet = (index: number) => {
    const newTweets = [...exampleTweets];
    newTweets.splice(index, 1);
    setExampleTweets(newTweets);
    form.setValue(
      "exampleTweets",
      form.getValues().exampleTweets.filter((_, i) => i !== index)
    );
  };

  const updateExampleTweet = (index: number, value: string) => {
    const newTweets = [...exampleTweets];
    newTweets[index] = value;
    setExampleTweets(newTweets);
    
    const currentTweets = [...form.getValues().exampleTweets];
    currentTweets[index] = value;
    form.setValue("exampleTweets", currentTweets);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Filter out empty tweets
      const nonEmptyTweets = values.exampleTweets.filter(tweet => tweet.trim() !== "");
      
      // Use the correct type for insert
      const insertData: Database["public"]["Tables"]["tone_preferences"]["Insert"] = {
        user_id: user.id,
        name: values.name,
        description: values.description,
        example_tweets: nonEmptyTweets,
      };

      const { error } = await supabase.from("tone_preferences").insert(insertData);

      if (error) throw error;

      sonner.success("Tone preference saved successfully");
      form.reset({
        name: "",
        description: "",
        exampleTweets: [""],
      });
      setExampleTweets([""]);
      fetchTonePreferences();
    } catch (error: any) {
      console.error("Error saving tone preference:", error.message);
      sonner.error("Failed to save tone preference", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTonePreference = async (id: string) => {
    try {
      // Converting id parameter type to match what the query expects
      const { error } = await supabase
        .from("tone_preferences")
        .delete()
        .eq("id", id as unknown as Database["public"]["Tables"]["tone_preferences"]["Row"]["id"]);

      if (error) throw error;

      sonner.success("Tone preference deleted");
      fetchTonePreferences();
    } catch (error: any) {
      console.error("Error deleting tone preference:", error.message);
      sonner.error("Failed to delete tone preference", {
        description: error.message,
      });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Tone of Voice
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Tone of Voice Preferences</DrawerTitle>
          <DrawerDescription>
            Define custom tones of voice for your generated tweet threads.
            Provide examples to help the AI understand your preferred style.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 mb-8"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Professional, Casual, Humorous..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short name for this tone of voice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the tone in detail..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe how this tone should sound, e.g., "Professional but approachable,
                      uses industry terms but avoids jargon, occasional light humor"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Example Tweets</FormLabel>
                <FormDescription className="mb-2">
                  Provide example tweets that showcase this tone of voice
                </FormDescription>

                {exampleTweets.map((tweet, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Textarea
                      placeholder="Write an example tweet in this tone..."
                      value={tweet}
                      onChange={(e) => updateExampleTweet(index, e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExampleTweet(index)}
                      disabled={exampleTweets.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExampleTweet}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Example Tweet
                </Button>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Tone Preference"}
              </Button>
            </form>
          </Form>

          {tonePreferences.length > 0 && (
            <div className="mt-6 mb-4">
              <h3 className="text-lg font-medium mb-3">Saved Tones</h3>
              <div className="grid gap-4">
                {tonePreferences.map((tone) => (
                  <Card key={tone.id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{tone.name}</CardTitle>
                      <CardDescription>{tone.description}</CardDescription>
                    </CardHeader>
                    {tone.example_tweets.length > 0 && (
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Example Tweets:</h4>
                          <ul className="space-y-2">
                            {tone.example_tweets.map((tweet, idx) => (
                              <li key={idx} className="text-sm border-l-2 border-muted pl-3 py-1">
                                "{tweet}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTonePreference(tone.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
