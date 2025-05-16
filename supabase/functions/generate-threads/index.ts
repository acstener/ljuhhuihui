
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Style prompts for different influencers
const stylePrompts = {
  "my-voice": "Write in a natural, authentic voice that sounds like me. Don't use any specific style, just make it sound natural and conversational.",
  "shaan-puri": "Write in Shaan Puri's style (from My First Million podcast). Use clear, concise language with actionable business insights. Be direct, use short sentences, and focus on providing value. Occasionally add humor but keep it business-focused.",
  "greg-isenberg": "Write in Greg Isenberg's style. Focus on community building, design, and product insights. Use memorable hooks, include specific examples, emphasize design thinking. Use short paragraphs and engaging questions.",
  "naval": "Write in Naval Ravikant's style. Use philosophical, timeless wisdom focused on wealth creation, happiness, and mental models. Write in aphorisms when possible. Be concise but profound. Focus on first principles thinking.",
  "levels": "Write in the Levels style. Be data-driven and health-optimized with a focus on metabolic health. Combine scientific insights with practical advice. Be educational but approachable, use clear explanations of complex topics."
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, styleId = "my-voice", count = 5 } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is empty or not provided");
    }

    console.log("Generating tweets with style:", styleId, { transcriptLength: transcript.length });

    const stylePrompt = stylePrompts[styleId as keyof typeof stylePrompts] || stylePrompts["my-voice"];

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
            content: `You are an expert at converting interview transcripts into engaging tweet threads.
            
            ${stylePrompt}
            
            Create ${count} standalone tweets based on the most interesting points in the transcript. Each tweet should:
            1. Be a complete thought that works as a standalone tweet (under 280 characters)
            2. Capture a meaningful insight from the conversation
            3. Be attention-grabbing and shareable
            4. Follow the specified style guidance
            
            Format your response as a JSON array of tweet objects with this structure:
            [
              {
                "tweet": "The tweet text here",
                "topic": "Brief topic label (3 words max)"
              }
            ]`
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Failed to generate tweets from OpenAI");
    }

    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let tweets;
    try {
      const parsedContent = JSON.parse(content);
      tweets = parsedContent.tweets || [];
      
      if (!Array.isArray(tweets)) {
        throw new Error("Tweets is not an array");
      }
    } catch (error) {
      console.error("Error parsing tweets JSON:", error);
      throw new Error("Failed to parse tweets from OpenAI response");
    }

    return new Response(JSON.stringify({ tweets }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-threads function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
