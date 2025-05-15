
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Get request body
    const { clipId } = await req.json();
    
    if (!clipId) {
      throw new Error('clipId is required');
    }
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get clip details
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single();
      
    if (clipError) {
      throw new Error(`Error fetching clip: ${clipError.message}`);
    }
    
    // Update clip to pending status
    await supabase
      .from('clips')
      .update({ 
        status: 'rendering',
        error_message: null 
      })
      .eq('id', clipId);
      
    // For MVP: simulate successful rendering after a delay
    setTimeout(async () => {
      // 80% chance of success in this simulation
      const isSuccessful = Math.random() < 0.8;
      
      if (isSuccessful) {
        await supabase
          .from('clips')
          .update({ 
            status: 'complete',
            clip_url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', // Placeholder video
            error_message: null
          })
          .eq('id', clipId);
      } else {
        await supabase
          .from('clips')
          .update({
            status: 'error',
            error_message: 'Rendering failed after retry: processing error'
          })
          .eq('id', clipId);
      }
    }, 8000);
    
    return new Response(JSON.stringify({ success: true, message: 'Clip retry initiated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in clip retry:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
