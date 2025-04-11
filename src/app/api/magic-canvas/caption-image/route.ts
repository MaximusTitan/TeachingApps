import { NextResponse } from "next/server";

// Function to caption image with Hugging Face's Salesforce/blip-image-captioning-base model
const captionImage = async (imageBase64: string) => {
  try {
    // Remove data URL prefix to get just the base64 content
    const base64Content = imageBase64.split(",")[1];
    
    // Call Hugging Face API - sending binary data directly
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", 
      {
        method: "POST",
        headers: {
          // Send as binary data instead of JSON
          "Content-Type": "application/octet-stream",
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        // Send raw binary data instead of JSON
        body: Buffer.from(base64Content, 'base64')
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.statusText}. Details: ${errorText}`);
    }

    // Get caption directly from response - Hugging Face returns the result immediately
    const result = await response.json();
    
    // HF returns an array with a single caption string
    let caption = Array.isArray(result) ? result[0] : result;
    
    if (typeof caption === 'object' && caption !== null) {
      // If response is an object with a generated_text property (sometimes happens)
      caption = caption.generated_text || "I'm not sure what that is. Can you tell me?";
    }
    
    if (!caption || typeof caption !== 'string') {
      caption = "I'm not sure what that is. Can you tell me?";
    }
    
    // Format the caption to be more child-friendly
    caption = formatCaption(caption);
    
    return caption;
  } catch (error) {
    console.error("Caption error:", error);
    throw error;
  }
};

// Make captions more child-friendly and concise
const formatCaption = (caption: string): string => {
  // Remove technical language
  caption = caption.replace(/a photograph of /i, "");
  caption = caption.replace(/an image of /i, "");
  caption = caption.replace(/this is /i, "");
  caption = caption.replace(/there is /i, "");
  
  // Remove references to black backgrounds or white paper
  caption = caption.replace(/on a black background/i, "");
  caption = caption.replace(/with a black background/i, "");
  caption = caption.replace(/against a black background/i, "");
  caption = caption.replace(/on white paper/i, "");
  caption = caption.replace(/on a white background/i, "");
  caption = caption.replace(/with a white background/i, "");
  caption = caption.replace(/against a white background/i, "");
  
  // Fix common misconceptions with black drawings
  caption = caption.replace(/black and white drawing/i, "drawing");
  caption = caption.replace(/black and white sketch/i, "sketch");
  caption = caption.replace(/black and white image/i, "drawing");
  
  // Simplify language
  caption = caption.replace(/appears to be/i, "looks like");
  
  // Remove confidence indicators
  caption = caption.replace(/possibly/i, "");
  caption = caption.replace(/probably/i, "");
  
  // Make it more concise
  caption = caption.trim();
  
  // Ensure first letter is capitalized
  caption = caption.charAt(0).toUpperCase() + caption.slice(1);
  
  return caption;
};

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Process the image with HuggingFace model
    const caption = await captionImage(image);

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}