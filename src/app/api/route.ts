import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = "openai" | "gemini" | "groq";
const provider: Provider = "groq"; // Change this to switch providers

const apiKeys: Record<Provider, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  groq: process.env.GROQ_API_KEY,
};

const modelMap: Record<Provider, string> = {
  openai: "gpt-4-turbo",
  gemini: "gemini-pro",
  groq: "llama3-70b-8192",
};

export async function POST(req: Request) {
  try {
    const { message, storyline, country, board, subject } = await req.json();

    if (!message || !country || !board || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: message (topic), country, board, subject" },
        { status: 400 }
      );
    }

    const apiKey = apiKeys[provider];
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key for ${provider} is missing` },
        { status: 500 }
      );
    }

    const prompt = `
      You are a master storyteller who creates engaging stories based on specific themes, educational subjects, and cultural backgrounds. Your task is to craft a compelling narrative using the provided details. Do not introduce the story or add commentary—just write the story directly.
      **Topic**: ${message}
      **Storyline**: ${storyline || "Use a creative approach if none is provided"}
      **Country**: ${country}
      **Board**: ${board}
      **Subject**: ${subject}

      ### Story Structure:

      **Title: Create a catchy title based on the story.**
      
      - Start with an engaging hook: "Imagine we're traveling to ${country}..." or "Once upon a time, in the vibrant land of ${country}, there was..."
      - Introduce the main characters and setting.
      - Relate the story to the topic.
      - Introduce a challenge related to ${message}.
      - Connect the challenge to ${subject}.
      - Add suspense and obstacles.
      - Reveal how the character gains key insight.
      - Show how knowledge from ${subject} helps overcome the challenge.
      - Show the impact of the resolution.
      - Reinforce the educational message.
      - Summarize the takeaway.
      - Relate it back to real-world applications.
      Ensure the story is immersive and educational while staying relevant to the ${board} curriculum.
    `;

    let reply = "";

    switch (provider) {
      case "openai":
      case "groq": {
        const client = new OpenAI({
          apiKey,
          baseURL: provider === "groq"
            ? "https://api.groq.com/openai/v1"
            : undefined,
        });

        const completion = await client.chat.completions.create({
          model: modelMap[provider],
          messages: [{ role: "system", content: prompt }],
        });

        reply = completion.choices[0]?.message?.content?.trim() || "";
        break;
      }

      case "gemini": {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelMap[provider] });

        const result = await model.generateContent(prompt);
        reply = (await result.response).text().trim();
        break;
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
