import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { message, storyline, country, board, subject } = await req.json();

    if (!message || !country || !board || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: message (topic), country, board, subject" },
        { status: 400 }
      );
    }

    // Construct the prompt using the provided inputs
    const prompt = `
You are a master storyteller who creates engaging stories based on specific themes, educational subjects, and cultural backgrounds. Your task is to craft a compelling narrative using the provided details. Do not introduce the story or add commentary—just write the story directly.

**Topic**: ${message}
**Storyline**: ${storyline || "Use a creative approach if none is provided"}
**Country**: ${country}
**Board**: ${board}
**Subject**: ${subject}

### Story Structure:

**Title: Create a catchy title based on the story.**
(I want title to be bold)

- Start with an engaging hook.
- Introduce the main characters and setting.
- Relate the story to the topic.
- Introduce a challenge related to ${message}.
- Connect the challenge to ${subject}.
- Add suspense and obstacles.
- Reveal how the character gains key insight.
- Show how knowledge from ${subject} helps overcome the challenge.
- Display the impact of the resolution.
- Reinforce the educational message.
- Summarize the takeaway.
- Relate it back to real-world applications.

Ensure the story is immersive and educational while staying relevant to the ${board} curriculum.
    `;

    // Create a Groq model instance.
    // You can change the model id if needed. Here we use "llama-3.3-70b-versatile" as an example.
    const model = groq("llama-3.3-70b-versatile");

    // Generate text using the Groq provider with the constructed prompt.
    const { text } = await generateText({
      model: model,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1024,
    });

    const reply = text.trim() || "";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}