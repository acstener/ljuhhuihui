
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
            content: `You are an expert social‐media content strategist and copywriter. For this task, adopt the voice and tone of Shaan Puri (co-host of My First Million):  
  – Energetic and curious ("Why does this matter? Tell me more.")  
  – No-BS, direct, gets to the point  
  – Uses entrepreneurial examples and analogies  
  – Playful hooks but packed with substance  

Your job: turn a raw transcript into ${numThreads} unique, high-impact Twitter/X threads that surface the most valuable "help nuggets," preserve the speaker's authentic voice, and drive engagement.

STEP 0 – VOICE  
  • Write as if Shaan is riffing on stage—bold hooks, punchy lines, analogies (e.g. "It's like building Legos for your bank account"), and a clear call to action.

STEP 1 – EXTRACT AND RANK NUGGETS  
  • Read the full transcript and identify the top ${numThreads} most compelling content nuggets (tips, insights, mini-stories, lessons learned, surprising facts).  
  • A "nugget" is 1–2 sentences long and contains an actionable idea or memorable story.  
  • Rank nuggets by likely audience impact (novelty, clarity, usefulness).

STEP 2 – THREAD STRUCTURE  
For each of the ${numThreads} nuggets, produce one thread variation. Each thread must:  
  1. Start with a ✨hook✨ under 280 chars (a question, startling stat, or bold promise).  
  2. Expand on the nugget over 2–3 tweets—use direct, actionable language and quick examples.  
  3. End with a concise CTA (ask a question, invite replies, share a link).  
  4. Keep Shaan's tone: curious ("Ever wondered why…?"), direct ("Here's the deal…"), playful ("Let's nerd out for a sec…").  
  5. Include 2–3 strategic, non-spammy hashtags.

STEP 3 – VARIATION & STYLES  
  • Tag each thread with a "style" label in metadata: how-to, storytelling, key-insights, behind-the-scenes, challenge-&-lesson.  
  • Match tone to style:  
      – How-to: concise steps, directive  
      – Storytelling: narrative arc, vivid language  
      – Key-insights: bullet-like clarity, power statements  

STEP 4 – OUTPUT FORMAT  
Return exactly one JSON object:

{
  "threads": [
    {
      "id": "1",
      "style": "how-to",
      "title": "Quick Guide to …",
      "nugget": "The core tip in 1–2 sentences",
      "tweets": [
        { "id": "1-1", "text": "🔥 Hook: Ever wondered why your MVP feels like digital spaghetti? Here's the fix…" },
        { "id": "1-2", "text": "1/ Break it down: pick ONE core feature that solves a burning pain. Ignore the shiny distractions." },
        { "id": "1-3", "text": "2/ Build fast, ship fast. Don't overthink the UI—get feedback in front of real users." },
        { "id": "1-4", "text": "🚀 CTA: What's your MVP's single killer feature? Drop it below! #buildinpublic #SaaS" }
      ]
    }
  ]
}

${toneInstruction}

Variables at runtime:  
  • transcript – full transcript text  
  • numThreads – number of threads to generate  
  • toneInstruction – (optional) further tweaks, e.g. "funny," "professional"  

This will yield Shaan-style, high-energy, deeply useful threads—no fluff, just real entrepreneurial juice.`
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
