
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In a real implementation, you would use actual video processing libraries
// For this MVP, we're simulating the video clipping process
async function simulateVideoClipping(originalUrl: string, startTime: number, endTime: number): Promise<string> {
  // Simulate processing delay (5 seconds)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // In a production environment, this would be where you call FFmpeg or another video processing tool
  // For now, we'll just return a modified URL to represent the clipped video
  const parsed = new URL(originalUrl);
  parsed.searchParams.set("start", startTime.toString());
  parsed.searchParams.set("end", endTime.toString());
  parsed.searchParams.set("clipped", "true");
  
  return parsed.toString();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const { videoId } = await req.json();
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "No video ID provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the video information
    const { data: video, error: videoError } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("status", "uploaded")
      .single();
    
    if (videoError || !video) {
      return new Response(
        JSON.stringify({ error: "Video not found or already being processed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update status to processing
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({ status: "processing" })
      .eq("id", videoId);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update video status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    try {
      // Process the video (simulate for now)
      const clipUrl = await simulateVideoClipping(video.original_url, 0, 30);
      
      // Update the video record with the clip URL and status
      const { error: finalUpdateError } = await supabaseAdmin
        .from("videos")
        .update({
          clip_url: clipUrl,
          status: "complete"
        })
        .eq("id", videoId);
      
      if (finalUpdateError) {
        throw new Error("Failed to update video with clip URL");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          videoId: videoId,
          status: "complete",
          clipUrl: clipUrl
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (processingError) {
      // If processing fails, update status to error
      await supabaseAdmin
        .from("videos")
        .update({ 
          status: "error",
          // Store error message in a field (would need to add this to schema)
        })
        .eq("id", videoId);
      
      throw processingError;
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
