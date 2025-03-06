import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const { subject, grade, lesson, days, objectives } = await req.json();

    if (!subject || !grade || !lesson || !days) {
      return NextResponse.json(
        { success: false, error: "Please provide all required fields: subject, grade, lesson, and days" },
        { status: 400 }
      );
    }

    const prompt = `As an experienced educator, create a comprehensive ${days}-day lesson plan activities for:
    
Subject: ${subject}
Grade Level: ${grade}
Topic: ${lesson}
${objectives ? `Additional Objectives: ${objectives}` : ''}

create a structured and detailed lesson plan based on the following inputs:

Subject: {subject}
Grade Level: {grade}
Lesson Topic: {lesson}
Duration: {days} days


Your response should be formatted clearly with headings and detailed explanations. Each day’s plan should be structured and actionable, making it easy for teachers to implement in a real classroom setting.

Lesson Plan
1. Introduction & Learning Objectives
Provide a brief introduction to the topic.
Clearly state the learning objectives students should achieve by the end of the lesson.
2. Activities & Exercises
List engaging activities, exercises, and interactive tasks to reinforce learning.
Provide clear step-by-step instructions on how to conduct each activity.
Include group work, hands-on experiments, discussions, or real-world applications (if applicable).
3. Required Materials & Resources
List the materials, tools, or resources needed (e.g., worksheets, online tools, lab equipment, books).
Provide links to any helpful educational resources (if available).
4. Daily Lesson Breakdown
Provide a structured plan for each day covering key topics, activities, and teaching strategies.

Each day should follow this format:

Day {x}: (Title or Key Focus of the Day)

Warm-up Activity: (Brief activity to engage students)
Main Lesson: (Explain the key concepts for the day)
Activity/Practice Task: (Hands-on exercise or group work to reinforce learning)
Discussion & Q&A: (Encourage student participation and address doubts)
Closure & Reflection: (Summarize the lesson and ask key reflection questions)
5. Assessment Methods
Provide different methods to evaluate student learning (e.g., quizzes, projects, presentations, peer assessments, etc.).
Include both formative (ongoing) and summative (final) assessments.
6. Differentiation Strategies
Suggest ways to adapt the lesson for different learning levels (e.g., advanced learners, struggling students, visual learners, kinesthetic learners).
Include modifications for students with special needs if applicable.
7. Additional Notes & Best Practices
Provide tips for teachers on how to maximize student engagement and make the lesson more effective.
If possible, suggest real-world connections or practical applications of the lesson topic.:`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are an experienced teacher and curriculum specialist. Provide detailed, practical, and grade-appropriate lesson plans.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API Error:", errorData);
      throw new Error(`Groq API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from Groq API");
    }

    const generatedLesson = data.choices[0].message.content;

    // Save to Supabase
    const { error } = await supabase
      .from("lesson_plans_activities")
      .insert([
        { subject, grade, lesson, days, objectives, content: generatedLesson },
      ]);

    if (error) {
      throw new Error("Error saving lesson to Supabase: " + error.message);
    }

    return NextResponse.json({ success: true, generatedLesson });

  } catch (error) {
    console.error("Error generating lesson:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate lesson plan" },
      { status: 500 }
    );
  }
}
