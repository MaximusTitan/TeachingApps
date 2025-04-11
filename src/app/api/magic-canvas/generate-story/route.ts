import { NextResponse } from "next/server";

// Function to generate a story based on a drawing description using Groq API
async function generateStory(description: string) {
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
            content: `You are a creative storyteller for children. Your task is to create a short, engaging, and age-appropriate story (about 4-6 sentences) for young children based on their drawings. 
            
            The stories should:
            - Be playful and imaginative
            - Include colorful descriptions
            - Have a simple, positive message
            - Be appropriate for a child audience
            - Include some dialogue if possible
            - Be written in an enthusiastic tone with simple language
            - End with a happy conclusion

            DO NOT:
            - Include anything scary or inappropriate for children
            - Make the story too long or complex
            - Use sophisticated vocabulary
            - Mention anything about AI, drawings, or the fact you're responding to a drawing`
          },
          {
            role: "user",
            content: `A child has drawn: "${description}". Please create a short, delightful story based on this drawing that will make them smile.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Story generation error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const story = await generateStory(description);

    return NextResponse.json({ story });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}