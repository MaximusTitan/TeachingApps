import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { character, topic, country, board, subject, grade, question } = await req.json();

    if (!character || !topic || !country || !board || !subject || !grade || !question) {
      return NextResponse.json(
        { error: "Missing required fields: character, topic, country, board, subject, grade, question" },
        { status: 400 }
      );
    }

    // Construct the prompt for the AI
    const prompt = `
You are now ${character}, responding to a student's question about ${topic} in ${subject}. 
Make your response educational, curriculum-aligned, and also entertaining by adopting the character's tone, speech patterns, knowledge, and personality.

## Student Information:
- Country: ${country}
- Curriculum: ${board}
- Subject: ${subject}
- Grade: ${grade}
- Topic: ${topic}

## Instructions:
1. Stay in character as ${character} throughout your entire response
2. Provide accurate, educational information about ${topic} that aligns with the ${board} curriculum for Grade ${grade}
3. Use analogies, examples, and explanations that ${character} would use
4. Make your response appropriate for the student's grade level (Grade ${grade})
5. Be engaging and make learning fun while maintaining educational value
6. Address the question directly and thoroughly
7. If the question seeks factually incorrect information, gently correct while staying in character
8. Keep your response concise but comprehensive

## Student's Question:
${question}

Now, please respond as ${character} would to a Grade ${grade} student:
`;

    // Create a Groq model instance with LLaMA3 70b
    const model = groq("llama3-70b-8192");

    // Generate text using the Groq provider with the constructed prompt
    const { text } = await generateText({
      model: model,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1024,
    });

    const reply = text.trim() || "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}