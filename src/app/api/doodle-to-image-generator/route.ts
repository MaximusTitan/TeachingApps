import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import Replicate from "replicate";

// Configure the clients with API keys
fal.config({
  credentials: process.env.FAL_API_KEY,
});

// Initialize Replicate client for image captioning
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

// Function to caption the doodle using Replicate's BLIP model
async function captionDoodle(imageBase64: string): Promise<string> {
  try {
    // Validate API key
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('Missing Replicate API token - using default caption');
      return "doodle";
    }

    // Make sure we have a proper data URL
    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    // Use Replicate's BLIP large model for image captioning
    // Ref: https://replicate.com/salesforce/blip-image-captioning-large
    const output = await replicate.run(
      "salesforce/blip-image-captioning-large:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
      {
        input: {
          image: imageUrl,
          caption: "a drawing of", // This helps guide the model to understand it's looking at a drawing
        },
      }
    ) as unknown as string;

    // Log the caption (but not the full image data)
    
    // Enhance the caption if it's too generic
    if (output === "a drawing" || output === "a drawing of" || !output) {
      return "doodle with interesting elements";
    }
    
    return output || "doodle";
  } catch (error) {
    console.error("Error during image captioning:", error);
    // Provide more context in the error logging
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}`);
    }
    // Fall back to a default caption
    return "doodle";
  }
}

// Function to create a better prompt based on the caption
function createEnhancementPrompt(caption: string, transformationStrength: number): string {
  // Clean up the caption to remove any potential prefix like "a drawing of"
  const cleanedCaption = caption.replace(/^a drawing of /i, "").trim();
  
  // Add artistic styles based on the transformation strength
  const artStyles = [
    "colorful", "vibrant", "detailed", "artistic", 
    "professional", "polished", "high-quality"
  ];
  
  // Choose how many art style descriptors to include based on transformation strength
  const numStyles = Math.floor(transformationStrength * 5) + 1;
  const selectedStyles = artStyles.slice(0, numStyles).join(", ");
  
  // For higher transformation strength, allow more creative freedom
  // For lower strength, emphasize preserving the original sketch more
  if (transformationStrength <= 0.4) {
    // Very low transformation - focus on preserving the original with minimal changes
    return `Transform this drawing of ${cleanedCaption} into a slightly enhanced version, carefully preserving all original lines, structure and composition. Maintain the exact same elements in the exact same positions, just add subtle color and minor refinements.`;
  } 
  else if (transformationStrength <= 0.6) {
    // Low-medium transformation - modest improvements
    return `Transform this drawing of ${cleanedCaption} into a ${selectedStyles} version while maintaining the core structure and composition of the original sketch. Keep the main elements recognizable and in similar positions.`;
  }
  else if (transformationStrength <= 0.75) {
    // Medium-high transformation - more creative interpretation
    return `Create a ${selectedStyles} artistic version of this ${cleanedCaption}, inspired by the original sketch but with enhanced details and color. Maintain the general concept and key elements while improving the overall aesthetic.`;
  }
  else {
    // High transformation - significant creative freedom
    return `Create a professional, ${selectedStyles} artistic interpretation of this ${cleanedCaption}, inspired by the original sketch but with significant artistic enhancements. Feel free to elaborate on the concept while keeping the core idea of ${cleanedCaption} intact.`;
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const { imageBase64, transformationStrength = 0.65 } = await request.json();
    
    // Validate API key
    if (!process.env.FAL_API_KEY) {
      console.error('Missing FAL_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }
    
    // Validate request
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }
    
    // Get only the base64 data part without the mimetype prefix
    const imageData = imageBase64.split(',')[1] || imageBase64;
    
    // Log the request (without the full image data for brevity)
    
    // Get the caption for the doodle
    const caption = await captionDoodle(imageBase64);
    // Ensure transformationStrength is a number and create a customized prompt
    const strength = typeof transformationStrength === 'string' 
      ? parseFloat(transformationStrength) 
      : (typeof transformationStrength === 'number' ? transformationStrength : 0.65);
      
    const customPrompt = createEnhancementPrompt(caption, strength);
    
    // Run image-to-image transformation using Fal.ai
    const { data } = await fal.run("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: imageBase64, // Use the full base64 data URI as image_url
        prompt: customPrompt,
        strength: strength,
        num_inference_steps: 40, 
        guidance_scale: 3.0 - (strength * 0.5), // Dynamically adjust guidance - lower for higher transformation
      },
    });
    
    // Extract and return the generated image
    if (data.images && data.images.length > 0) {
      // Return the URL from the first image object along with the prompt used
      return NextResponse.json({ 
        success: true, 
        imageUrl: data.images[0].url,
        usedPrompt: customPrompt,
        caption: caption
      });
    } else {
      console.error('No images returned from Fal API:', data);
      throw new Error('No image was generated');
    }
    
  } catch (error) {
    // More detailed error logging
    console.error('--- Full Error in doodle-to-image-generator API ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Name:', error instanceof Error ? error.name : 'N/A');
    console.error('Error Message:', error instanceof Error ? error.message : JSON.stringify(error));
    if (error instanceof Error && error.stack) {
      console.error('Error Stack:', error.stack);
    }
    console.error('--- End Full Error ---');
    
    // Determine if it's an API key issue
    let errorMessage = 'Failed to generate image. Please try again later.'; // Default generic message
    if (error instanceof Error) {
      if (
        error.message.includes('Authentication failed') || 
        error.message.includes('unauthorized') ||
        error.message.includes('API key') ||
        error.message.includes('credentials')
      ) {
        errorMessage = 'API authorization failed. Please check server configuration.';
      } else {
        // Use a generic message for other errors to avoid exposing too much detail
        // errorMessage = error.message; // Avoid sending potentially sensitive details
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}