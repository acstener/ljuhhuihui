
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth header
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the form data
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    
    if (!videoFile) {
      return new Response(
        JSON.stringify({ error: "No video file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    if (!videoFile.type.startsWith("video/")) {
      return new Response(
        JSON.stringify({ error: "Invalid file type, must be video" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique file path for storage
    const fileExt = videoFile.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload the file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from("raw_videos")
      .upload(filePath, videoFile, {
        contentType: videoFile.type,
        cacheControl: "3600",
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      return new Response(
        JSON.stringify({ error: "Failed to upload video" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the public URL for the uploaded video
    const { data: publicUrlData } = await supabase
      .storage
      .from("raw_videos")
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hour expiry

    const originalUrl = publicUrlData?.signedUrl;

    // Create a record in the videos table
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        original_filename: videoFile.name,
        original_url: originalUrl,
        status: "uploaded"
      })
      .select()
      .single();

    if (videoError) {
      console.error("Database error:", videoError);
      return new Response(
        JSON.stringify({ error: "Failed to create video record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger clip generation via webhook or return the video ID
    return new Response(
      JSON.stringify({ 
        success: true,
        videoId: videoData.id,
        status: videoData.status
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
