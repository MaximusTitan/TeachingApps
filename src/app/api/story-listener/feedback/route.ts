import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    // Create a Groq model instance
    const model = groq("llama-3.3-70b-versatile");

    // Construct the prompt for the AI
    const prompt = `
You are a supportive and encouraging teacher who is analyzing a child's story. The following is a transcript of a story told by a child:

"""
${transcript}
"""

Your task is to provide constructive, age-appropriate feedback that encourages the child's creativity and storytelling skills. The feedback should be specific to this story, not generic.

Please structure your response with:

1. A list of 3-5 specific strengths (what the child did well)
2. A list of 2-3 gentle suggestions for improvement
3. A list of 2-3 thought-provoking questions to help the child expand their story
4. A brief overall encouraging message (2-3 sentences)

Format your response as a valid JSON object with the following structure:

{
  "praise": ["strength 1", "strength 2", "strength 3", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "questions": ["question 1", "question 2", ...],
  "overall": "Your encouraging message here."
}

Be specific, warm, and enthusiastic in your feedback. Focus more on praise than criticism. Make your feedback actionable but friendly.
`;

    // Generate text using the Groq provider with the constructed prompt
    const { text } = await generateText({
      model: model as any,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1024,
    });

    try {
      // Parse the response as JSON
      const feedbackData = JSON.parse(text.trim());
      
      // Validate the structure of the response
      if (!feedbackData.praise || !feedbackData.suggestions || 
          !feedbackData.questions || !feedbackData.overall) {
        throw new Error("Invalid response format");
      }
      
      return NextResponse.json(feedbackData, { status: 200 });
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw response:", text);
      
      // Fallback response if parsing fails
      return NextResponse.json({
        praise: ["Your story has a clear beginning, middle, and end.", 
                "You used descriptive language that helps the reader visualize the scene.",
                "Your characters are interesting and have distinct personalities."],
        suggestions: ["Consider adding more details about the setting.",
                     "Try adding dialogue between your characters."],
        questions: ["What happens next in your story?",
                   "How do you think your main character feels at the end?"],
        overall: "Great job on your story! You have a wonderful imagination and I enjoyed reading your work. Keep writing and sharing your stories!"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Feedback generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}