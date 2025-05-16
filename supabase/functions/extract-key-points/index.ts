
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
    const { transcript } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is empty or not provided");
    }

    console.log("Extracting key points from transcript", { length: transcript.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing conversations and extracting the most important talking points.
            Extract 3-5 key talking points from the transcript. Each talking point should be:
            1. Concise (max 15 words)
            2. Insightful and meaningful
            3. Representative of the core ideas in the conversation
            
            For each key point, also find a brief supporting quote from the transcript (max 25 words).
            
            Return the results as a JSON array with this format:
            [
              {
                "point": "The concise talking point",
                "quote": "The supporting quote from the transcript"
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
      throw new Error("Failed to extract key points from OpenAI");
    }

    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let keyPoints;
    try {
      const parsedContent = JSON.parse(content);
      keyPoints = parsedContent.keyPoints || [];
      
      if (!Array.isArray(keyPoints)) {
        throw new Error("Key points is not an array");
      }
    } catch (error) {
      console.error("Error parsing key points JSON:", error);
      throw new Error("Failed to parse key points from OpenAI response");
    }

    return new Response(JSON.stringify({ keyPoints }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-key-points function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
