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
You are an accomplished storyteller with the ability to weave magical narratives that resonate with diverse themes, educational topics, and cultural contexts. Your purpose is to create an enthralling tale using the specifications offered. Do not preface the story or include any personal commentary—simply dive into the narrative.

**Topic**: ${message}  
**Storyline**: ${storyline || "Take a unique and imaginative approach if none is provided"}  
**Country**: ${country}  
**Board**: ${board}  
**Subject**: ${subject}  

### Story Structure:

**Title**: **Craft an engaging and imaginative title for the narrative.**

- Begin with a captivating hook that grabs attention.
- Present the central characters along with their environment.
- Make a clear connection to the specified topic.
- Introduce a conflict or challenge that ties back to ${message}.
- Link this challenge to the educational aspects of ${subject}.
- Build tension and introduce various obstacles.
- Allow the character to discover a pivotal realization or insight.
- Illustrate how understanding from ${subject} aids in resolving the dilemma.
- Highlight the outcomes and effects of addressing the challenge.
- Emphasize the educational lesson learned throughout the story.
- Conclude with a clear takeaway message.
- Provide connections to practical applications in real life.

Your story should be both engaging and informative, while fully aligning with the curriculum framework of ${board}.
    `;

    // Create a Groq model instance.
    // You can change the model id if needed. Here we use "llama-3.3-70b-versatile" as an example.
    const model = groq("llama-3.3-70b-versatile");

    // Generate text using the Groq provider with the constructed prompt.
    const { text } = await generateText({
      model: model as any,
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