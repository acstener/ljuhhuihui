
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
    const { videoId } = await req.json();
    
    if (!videoId) {
      throw new Error('videoId is required');
    }
    
    // Initialize Supabase client with service role for admin actions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
      
    if (videoError) {
      throw new Error(`Error fetching video: ${videoError.message}`);
    }
    
    // Mock transcription for MVP - in reality you'd call OpenAI Whisper here
    const mockTranscriptSegments = generateMockTranscriptSegments();
    
    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        video_id: videoId,
        content: mockTranscriptSegments
      })
      .select()
      .single();
      
    if (transcriptError) {
      throw new Error(`Error creating transcript: ${transcriptError.message}`);
    }
    
    // Update video status
    await supabase
      .from('videos')
      .update({ status: 'transcribed' })
      .eq('id', videoId);
      
    // Mock clip selection - in reality this would analyze the transcript
    // to find the most engaging segments
    const mockClips = [
      {
        video_id: videoId,
        start_s: 10,
        end_s: 40,
        snippet: "This is an important part where the speaker explains the main concept...",
        status: 'pending'
      },
      {
        video_id: videoId,
        start_s: 65,
        end_s: 95,
        snippet: "Here's a compelling argument about why this approach works so well...",
        status: 'pending'
      },
      {
        video_id: videoId,
        start_s: 120,
        end_s: 150,
        snippet: "The speaker shares a personal anecdote about their experience...",
        status: 'pending'
      }
    ];
    
    // Insert clips
    const { data: clips, error: clipsError } = await supabase
      .from('clips')
      .insert(mockClips)
      .select();
      
    if (clipsError) {
      throw new Error(`Error creating clips: ${clipsError.message}`);
    }
    
    // Update video status
    await supabase
      .from('videos')
      .update({ status: 'clips_selected' })
      .eq('id', videoId);
    
    // For MVP: simulate rendering by setting one clip to complete after a delay
    setTimeout(async () => {
      if (clips && clips.length > 0) {
        await supabase
          .from('clips')
          .update({ 
            status: 'complete',
            clip_url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4'  // Placeholder video URL
          })
          .eq('id', clips[0].id);
          
        // Second clip - complete but with slightly different timing
        setTimeout(async () => {
          await supabase
            .from('clips')
            .update({
              status: 'complete',
              clip_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4' // Different placeholder
            })
            .eq('id', clips[1].id);
        }, 15000);
        
        // Third clip - show an error state for demonstration
        setTimeout(async () => {
          await supabase
            .from('clips')
            .update({
              status: 'error',
              error_message: 'Rendering failed: insufficient video quality'
            })
            .eq('id', clips[2].id);
            
          // Update video status to complete when all clips are processed
          await supabase
            .from('videos')
            .update({ status: 'complete' })
            .eq('id', videoId);
        }, 25000);
      }
    }, 10000);
    
    return new Response(JSON.stringify({ success: true, videoId, message: 'Video processing initiated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in video processing:', error);
    
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

// Helper function to generate mock transcript segments
function generateMockTranscriptSegments() {
  return [
    {
      "text": "Welcome to this very interesting video about content creation.",
      "start": 0,
      "end": 5
    },
    {
      "text": "Today we're going to explore some key strategies for success.",
      "start": 5,
      "end": 10
    },
    {
      "text": "The first important thing to understand is that consistency is critical.",
      "start": 10,
      "end": 15
    },
    {
      "text": "You need to show up regularly for your audience to build trust.",
      "start": 15,
      "end": 20
    },
    {
      "text": "Did you know that creators who post weekly see 5x more growth?",
      "start": 20,
      "end": 25
    },
    // Additional segments would continue throughout the video duration
    {
      "text": "Let me share a personal story about how I grew my channel.",
      "start": 65,
      "end": 70
    },
    {
      "text": "When I first started, I was only getting a few views per video.",
      "start": 70,
      "end": 75
    },
    {
      "text": "But after implementing these strategies, everything changed dramatically.",
      "start": 75,
      "end": 80
    },
    {
      "text": "Within just three months, my subscriber count increased tenfold.",
      "start": 80,
      "end": 85
    },
    // More segments
    {
      "text": "The final tip I want to share is about analyzing your metrics.",
      "start": 120,
      "end": 125
    },
    {
      "text": "Don't just create content blindly, use data to guide your decisions.",
      "start": 125,
      "end": 130
    },
    {
      "text": "Look at which videos perform best and double down on those topics.",
      "start": 130,
      "end": 135
    },
    {
      "text": "This single strategy helped me increase my views by over 200%.",
      "start": 135,
      "end": 140
    },
    {
      "text": "Thank you for watching! Don't forget to like and subscribe.",
      "start": 175,
      "end": 180
    }
  ];
}
