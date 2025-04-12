import { NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Set up the Groq model
const model = groq('llama3-70b-8192'); // Using LLaMA-3 70B model

export async function POST(req: Request) {
  try {
    const { message, language } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine language for system message
    let systemMessage = `You are a friendly AI tutor designed to help students learn. 
Your responses should be:
- Well-formatted with appropriate paragraphs
- Clear and concise
- Educational and accurate
- Suitable for text-to-speech conversion
- Easy to read with proper punctuation
- Free of markdown formatting, HTML tags, or special characters that wouldn't be spoken naturally`;

    if (language && language !== 'en-IN') {
      systemMessage += `\nPlease respond in the ${language.split('-')[0]} language.`;
    }

    // Generate a response using Groq
    const { text } = await generateText({
      model: model,
      prompt: message,
      temperature: 0.7,
      maxTokens: 800,
      system: systemMessage,
    });

    const reply = text.trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Voice Tutor chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}