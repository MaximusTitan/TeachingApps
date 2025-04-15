import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Add this initialization function at the top of the file
async function initSupabaseTable() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('discussion_prompts')
      .select('id')
      .limit(1);
    
    // If the error is that the table doesn't exist, create it
    if (error && error.code === '42P01') {
      console.log("⚙️ Creating discussion_prompts table...");
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.discussion_prompts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            topic TEXT NOT NULL,
            country TEXT NOT NULL,
            board TEXT NOT NULL,
            subject TEXT NOT NULL,
            grade_level TEXT NOT NULL,
            engagement_level TEXT NOT NULL,
            time_limit INTEGER NOT NULL,
            generated_prompts TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error("❌ Error creating table:", createError);
        return false;
      }
      
      console.log("✅ Table created successfully");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error initializing Supabase:", error);
    return false;
  }
}

type DiscussionPromptRequest = {
  country: { label: string };
  board: { label: string };
  subject: { label: string };
  gradeLevel: { label: string };
  topic: string;
  timeLimit: number;
  engagementLevel: { label: string };
};

// Helper function, not exported
async function generateDiscussionPrompt(
  promptData: DiscussionPromptRequest,
): Promise<string> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!API_URL || !API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("API or Supabase configuration is missing");
    }

    console.log("🔹 Sending request to API with data:", promptData);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: `You are a discussion prompt generator. Create clear and engaging prompts based on the provided parameters.`,
          },
          {
            role: "user",
            content: `Generate a discussion prompt for a ${promptData.engagementLevel.label} with the following parameters: Country: ${promptData.country.label}, Board: ${promptData.board.label}, Subject: ${promptData.subject.label}, Grade Level: ${promptData.gradeLevel.label}, Topic: ${promptData.topic}, Time Limit: ${promptData.timeLimit} minutes.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("❌ API error details:", errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt =
      data.choices?.[0]?.message?.content || "No response from API";
    console.log("✅ Generated Prompt:", generatedPrompt);

    // Save to Supabase
    await savePromptToHistory(promptData, generatedPrompt);

    return generatedPrompt;
  } catch (error) {
    console.error("❌ Error generating discussion prompt:", error);
    throw error;
  }
}

// Helper function, not exported
async function savePromptToHistory(
  promptData: DiscussionPromptRequest,
  generatedPrompts: string,
) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("📌 Saving to Supabase:", { promptData, generatedPrompts });

    const { data, error } = await supabase.from("discussion_prompts").insert([
      {
        topic: promptData.topic,
        country: promptData.country.label,
        board: promptData.board.label,
        subject: promptData.subject.label,
        grade_level: promptData.gradeLevel.label,
        engagement_level: promptData.engagementLevel.label,
        time_limit: promptData.timeLimit,
        generated_prompts: generatedPrompts, // Ensures this is not NULL
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      throw new Error("Failed to save prompt to history");
    }

    console.log("✅ Successfully saved to Supabase:", data);
  } catch (error) {
    console.error("❌ Error saving to history:", error);
  }
}

// Helper function, not exported
async function fetchDiscussionHistory() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase configuration is missing");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from("discussion_prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching discussion history:", error);
    throw new Error("Failed to fetch discussion history");
  }

  console.log("Fetched discussion history:", data);
  return data;
}

// Helper function, not exported
async function deleteDiscussionPrompt(id: string) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase configuration is missing");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase
    .from("discussion_prompts")
    .delete()
    .match({ id });

  if (error) {
    console.error("❌ Error deleting discussion prompt:", error);
    throw new Error("Failed to delete discussion prompt");
  }
}

// HTTP Route Handlers for Next.js App Router

export async function GET() {
  try {
    // Try to initialize the table first
    await initSupabaseTable();
    
    const history = await fetchDiscussionHistory();
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch discussion history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to initialize the table first
    await initSupabaseTable();
    
    const promptData = await request.json() as DiscussionPromptRequest;
    const generatedPrompt = await generateDiscussionPrompt(promptData);
    return NextResponse.json({ success: true, data: generatedPrompt });
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate discussion prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Try to initialize the table first
    await initSupabaseTable();
    
    const { id } = await request.json();
    await deleteDiscussionPrompt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete discussion prompt" },
      { status: 500 }
    );
  }
}
