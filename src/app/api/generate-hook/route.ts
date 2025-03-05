import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const HOOK_TEMPLATES = {
  "Story-based Hook": `Create an engaging story hook for teaching {topic} to {grade} students from {country} using the {board} educational board that achieves {objective}. The story should be brief, relatable, and spark curiosity. The story should be relevant to {subject} lessons.`,
  "Thought-provoking Question": `Generate a thought-provoking question about {topic} that will make {grade} students from {country} using the {board} educational board think deeply and connect with the objective: {objective}. The question should challenge assumptions and encourage discussion. It should also be adapted to {subject} lessons.`,
  "Real-world Connection": `Create a real-world connection for {topic} that {grade} students from {country} using the {board} educational board can relate to, showing how it applies to their daily lives while addressing {objective}. Make sure the connection is relevant to {subject} lessons.`,
  "Fun Fact or Riddle": `Generate an interesting fun fact or riddle about {topic} that will capture {grade} students' attention from {country} using the {board} educational board and lead into learning about {objective}. It should also be related to {subject}.`,
  "Role Play or Scenario-based Hook": `Design a brief role-play scenario about {topic} that {grade} students from {country} using the {board} educational board can act out or discuss, making it engaging while working toward {objective}. Adapt this scenario to be pertinent to {subject} lessons.`,
};

export async function POST(req: Request) {
  try {
    const { topic, objective, grade, hook_type, country, board, subject } = await req.json();

    // Log the received data for debugging
    console.log("Received data:", { topic, objective, grade, hook_type, country, board, subject });

    // Check for missing required fields
    if (!topic || !objective || !grade || !hook_type || !country || !board || !subject) {
      // Log which fields are missing
      const missingFields = [];
      if (!topic) missingFields.push("topic");
      if (!objective) missingFields.push("objective");
      if (!grade) missingFields.push("grade");
      if (!hook_type) missingFields.push("hook_type");
      if (!country) missingFields.push("country");
      if (!board) missingFields.push("board");
      if (!subject) missingFields.push("subject");
      
      console.error("Missing fields:", missingFields);
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
    }

    // Check if the hook_type exists in the templates
    if (!HOOK_TEMPLATES[hook_type as keyof typeof HOOK_TEMPLATES]) {
      console.error("Invalid hook_type:", hook_type);
      return NextResponse.json({ error: "Invalid hook type" }, { status: 400 });
    }

    // Prepare the template
    const template = HOOK_TEMPLATES[hook_type as keyof typeof HOOK_TEMPLATES]
      .replace(/{topic}/g, topic)
      .replace(/{objective}/g, objective)
      .replace(/{grade}/g, grade)
      .replace(/{country}/g, country)
      .replace(/{board}/g, board)
      .replace(/{subject}/g, subject);

    // Call the GROQ API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an experienced teacher who creates engaging lesson hooks for ${subject} classes, adapted to different countries (${country}) and educational boards (${board}).`,
        },
        {
          role: "user",
          content: template,
        },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const generated_hook = completion.choices[0]?.message?.content;

    if (!generated_hook) {
      console.error("GROQ API Error: No hook generated");
      return NextResponse.json({ error: "Failed to generate hook" }, { status: 500 });
    }

    // Store in Supabase
    const { error } = await supabase.from("lesson_hooks").insert([
      {
        topic,
        objective,
        grade,
        hook_type,
        country,
        board,
        subject,
        generated_hook,
      },
    ]);

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
    }

    return NextResponse.json({ hook: generated_hook });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}