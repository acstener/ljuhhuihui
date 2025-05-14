
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
    const { transcript, numThreads = 3, tonePreference = null } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Generating threads from transcript...');
    
    // Prepare tone instruction
    let toneInstruction = "";
    
    if (tonePreference) {
      toneInstruction = `
      Use the following tone of voice: "${tonePreference.name}"
      
      Tone description: "${tonePreference.description}"
      
      Example tweets in this tone:
      ${tonePreference.example_tweets.map((tweet: string) => `- "${tweet}"`).join('\n')}
      
      Make sure all generated tweets match this tone of voice.
      `;
    }
    
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
            content: `SYSTEM:
You are an expert social‐media content strategist and copywriter. Your goal is to turn a raw transcript into ${numThreads} genuine Twitter/X threads that feel like the speaker is talking directly to their audience. 

1) EMULATE AUTHENTIC VOICE  
 • Analyze the transcript to learn the speaker's natural tone, pacing, favorite phrases, formality level and energy.  
 • Use that same language style, cadence and vocabulary. Don't invent new slang or hashtags the speaker wouldn't use.

2) EXTRACT TOP "HELP NUGGETS"  
 • Identify the ${numThreads} most valuable and concise content nuggets—short actionable tips, mini-stories or lessons—directly from their own words.  
 • A nugget is 1–2 sentences that capture a clear idea.

3) STRUCTURE EACH THREAD  
 For each nugget, create a 3-5 tweet thread:
   1. Tweet 1: A "hook" or question in the speaker's own voice, under 280 chars.  
   2. Tweets 2–4: Expand on that nugget with concrete detail or a brief illustrative example—again, mirroring their phrasing.  
   3. Final Tweet: Close with a natural call-to-action (invite reply, pose a question, point to a resource) as they would.

4) STYLE VARIATION  
 • Ensure each thread feels distinct in approach—some can be how-tos, others quick reflections, others mini-stories—but all must sound like the same speaker.  

5) OUTPUT FORMAT  
Return exactly this JSON:

{
  "threads": [
    {
      "id": "1",
      "nugget": "Direct quote or paraphrase of the 1–2 sentence nugget",
      "tweets": [
        { "id": "1-1", "text": "…speaker-style hook…" },
        { "id": "1-2", "text": "…expansion or step…" },
        { "id": "1-3", "text": "…example or insight…" },
        { "id": "1-4", "text": "…natural CTA…" }
      ]
    }
  ]
}

${toneInstruction}

VARIABLES AT RUNTIME  
 • transcript — full time-stamped transcript text  
 • numThreads — number of thread variations to generate  

Make each thread feel as if the speaker simply clipped their transcript, polished their own words, and dropped it into Twitter. No hashtags, no invented voices—just the speaker, unfiltered.`
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
