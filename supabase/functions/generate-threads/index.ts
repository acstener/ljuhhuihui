
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Parse the request body
    const { transcript, numThreads = 3 } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Generating threads from transcript...');
    
    // Call OpenAI API to generate tweet threads
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
            content: `You are an expert social media content creator specializing in creating engaging Twitter/X threads. 
            Your task is to transform the provided transcript into ${numThreads} distinct Twitter thread variations.
            
            For each thread variation:
            1. Create a catchy title for the thread
            2. Generate 3-5 tweets that form a cohesive thread
            3. Each tweet should be under 280 characters
            4. Make the threads engaging, informative, and conversational
            5. Include relevant hashtags where appropriate
            6. Format each thread differently (e.g., one as a how-to, one as key insights, one as a storytelling approach)
            
            Return the results as a JSON object with the following structure:
            {
              "threads": [
                {
                  "id": "1",
                  "title": "Thread Title",
                  "tweets": [
                    { "id": "1-1", "text": "Tweet content here" },
                    { "id": "1-2", "text": "Tweet content here" }
                  ]
                }
              ]
            }`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);
    
    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in generate-threads function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
