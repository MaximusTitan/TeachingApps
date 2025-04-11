import { NextResponse } from "next/server";

// Function to generate drawing suggestions using Groq API
async function generateDrawingSuggestions(description: string) {
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
            content: `You are a friendly, encouraging drawing coach for children. Your goal is to provide gentle, positive suggestions to inspire children to enhance their drawings. 

            Your suggestions should:
            - Be encouraging, warm, and supportive
            - Focus on adding elements rather than changing existing ones
            - Ask creative questions that spark imagination
            - Suggest 2-3 specific ideas for additions they might make
            - Always be age-appropriate and positive
            - Use simple, accessible language
            - Include playful emoji in your response
            
            Important: NEVER criticize or point out flaws in the child's drawing. Your goal is to inspire, not correct.
            
            Keep your response brief and cheerful, about 3-5 sentences total.`
          },
          {
            role: "user",
            content: `A child has drawn something that looks like: "${description}". Please provide gentle, encouraging suggestions to inspire them to enhance their drawing.`
          }
        ],
        temperature: 0.7,
        max_tokens: 250,
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Drawing suggestions error:", error);
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

    const suggestions = await generateDrawingSuggestions(description);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}