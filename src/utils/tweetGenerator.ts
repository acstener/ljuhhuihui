
import { GoogleGenerativeAI } from "@google/generative-ai";

// Store API key in memory - for development only
let geminiApiKey: string | null = null;

export interface GeneratedTweet {
  tweet: string;
  topic?: string;
}

export const setOpenAIKey = (key: string) => {
  geminiApiKey = key;
  localStorage.setItem("gemini_key", key);
};

export const getOpenAIKey = (): string | null => {
  if (!geminiApiKey) {
    geminiApiKey = localStorage.getItem("gemini_key");
  }
  return geminiApiKey;
};

export const generateTweetsFromTranscript = async (
  transcript: string, 
  count = 5, 
  exampleTweets: string[] = []
): Promise<GeneratedTweet[]> => {
  const apiKey = getOpenAIKey();
  
  if (!apiKey) {
    throw new Error("Gemini API key not set. Please set your API key first.");
  }

  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Transcript is empty or not provided");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build system prompt
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

    systemPrompt += `\n\nOutput the results in valid JSON format with this structure:
    {
      "tweets": [
        {"tweet": "First tweet content here"},
        {"tweet": "Second tweet content here"},
        // and so on
      ]
    }`;

    console.log("Generating authentic content from transcript:", { transcriptLength: transcript.length });
    
    const prompt = systemPrompt + "\n\nTranscript:\n" + transcript;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textContent = response.text();
    
    // Extract the JSON part from the response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }
    
    try {
      const parsedContent = JSON.parse(jsonMatch[0]);
      
      if (parsedContent && Array.isArray(parsedContent.tweets)) {
        return parsedContent.tweets;
      } else if (Array.isArray(parsedContent)) {
        return parsedContent;
      }
      
      throw new Error("Invalid response format");
    } catch (jsonError) {
      console.error("Error parsing JSON from response:", jsonError);
      throw new Error("Failed to parse JSON response from Gemini");
    }
  } catch (error: any) {
    console.error("Error generating tweets:", error);
    throw new Error(`Failed to generate tweets: ${error.message || "Unknown error"}`);
  }
};
