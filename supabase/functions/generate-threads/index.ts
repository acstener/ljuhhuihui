
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error("OpenAI API key is not set");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          tweets: [] 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { transcript, count = 5, exampleTweets = [] } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      console.error("Empty transcript provided");
      return new Response(
        JSON.stringify({ 
          error: "Transcript is empty or not provided",
          tweets: [] 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("Generating authentic content from transcript:", { transcriptLength: transcript.length });
    console.log("Using example tweets:", { exampleCount: exampleTweets.length });

    // Build the system prompt based on whether we have examples
    let systemPrompt = `You transform conversation transcripts into authentic, raw social media posts.

    IMPORTANT: STICK TO THE TONE OF VOICE AND LANGUAGE USED AS MUCH AS POSSIBLE.
    
    - Keep the content authentic and raw - exactly as someone would naturally express their thoughts
    - DO NOT use hashtags
    - DO NOT use typical "influencer" language or formatting
    - DO NOT try to make it sound like a typical "tweet"
    - Preserve the original voice, word choices, and speaking style
    - Maintain the natural flow and authenticity of the original conversation
    - Focus on the genuine insights and thoughts, not on making them "shareable"
    - The goal is raw authenticity - as if the person is speaking directly to their audience
    
    Create ${count} standalone posts based on the most interesting points in the transcript. Each post should:
    1. Be a complete thought that works on social media (under 280 characters)
    2. Capture a meaningful insight from the conversation
    3. Maintain the authentic voice and tone of the speaker`;

    // Add example tweets to the prompt if provided
    if (exampleTweets && exampleTweets.length > 0) {
      systemPrompt += `\n\nHere are examples of the tone and style to match:`;
      exampleTweets.forEach((tweet, index) => {
        if (tweet.trim()) {
          systemPrompt += `\n${index + 1}. "${tweet.trim()}"`;
        }
      });
    }

    systemPrompt += `\n\nFormat your response as a JSON object with a "tweets" field containing an array of tweet objects with this structure:
    {
      "tweets": [
        {
          "tweet": "The raw, authentic post text here",
          "topic": "Brief topic label (3 words max)"
        }
      ]
    }`;

    console.log("Making OpenAI API request...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("OpenAI API error:", { 
        status: response.status, 
        statusText: response.statusText,
        errorData 
      });
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          details: errorData,
          tweets: [] 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Failed to get proper response from OpenAI:", data);
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate content from OpenAI", 
          details: data,
          tweets: [] 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const content = data.choices[0].message.content;
    console.log("Raw OpenAI response received");
    
    // Parse the JSON response
    let tweets = [];
    try {
      const parsedContent = JSON.parse(content);
      
      if (parsedContent && Array.isArray(parsedContent.tweets)) {
        tweets = parsedContent.tweets;
      } else if (Array.isArray(parsedContent)) {
        // Handle case where OpenAI might just return an array
        tweets = parsedContent;
      } else {
        console.error("Unexpected response format:", parsedContent);
        throw new Error("Invalid response format");
      }
      
      if (!Array.isArray(tweets)) {
        throw new Error("Tweets is not an array");
      }

      // If we got empty tweets, provide fallbacks
      if (tweets.length === 0) {
        tweets = [
          {
            tweet: "This is a sample post generated as a fallback. The API didn't return any content.",
            topic: "Sample Post"
          },
          {
            tweet: "Another example post to show you the formatting. You can regenerate to get authentic content.",
            topic: "Example"
          }
        ];
      }
      
      console.log("Successfully generated tweets:", { count: tweets.length });
    } catch (error) {
      console.error("Error parsing tweets JSON:", error, "Raw content:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse content from OpenAI response",
          rawContent: content,
          tweets: [] 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ tweets }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-threads function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        tweets: [] 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
