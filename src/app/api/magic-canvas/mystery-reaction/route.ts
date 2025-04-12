import { NextResponse } from "next/server";

// Function to generate a fun reaction to a mystery box drawing using Groq API
async function generateMysteryReaction(prompt: string, description: string) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are an enthusiastic, playful assistant for a children's drawing app. Your task is to react to a child's drawing in a fun, encouraging way.
            
            The child was given a specific prompt to draw, and now you need to react to what they drew based on that prompt.

            Your reaction should:
            - Be super enthusiastic and playful
            - Include fun expressions and exclamations
            - Use child-friendly language (imagine speaking to a 6-8 year old)
            - Make the child feel proud of their creativity
            - Include at least one emoji
            - Be 2-3 sentences maximum
            
            Never criticize the drawing or suggest it doesn't match the prompt. Always find something positive to focus on!`
          },
          {
            role: "user",
            content: `The child was given this prompt: "${prompt}"
            
            The drawing looks like: "${description}"
            
            Give a fun, playful reaction to their drawing!`
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Mystery reaction error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, description } = await request.json();

    if (!prompt || !description) {
      return NextResponse.json(
        { error: "Both prompt and description are required" },
        { status: 400 }
      );
    }

    const reaction = await generateMysteryReaction(prompt, description);

    return NextResponse.json({ reaction });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate reaction" },
      { status: 500 }
    );
  }
}