import { createClient } from "@supabase/supabase-js";

type DiscussionPromptRequest = {
  country: { label: string };
  board: { label: string };
  subject: { label: string };
  gradeLevel: { label: string };
  topic: string;
  timeLimit: number;
  engagementLevel: { label: string };
};

export async function generateDiscussionPrompt(
  promptData: DiscussionPromptRequest,
): Promise<string> {
  try {
    const response = await fetch('/api/discussionprompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("❌ API error details:", errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("❌ Error generating discussion prompt:", error);
    throw error;
  }
}

export async function savePromptToHistory(
  promptData: DiscussionPromptRequest,
  generatedPrompts: string,
) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

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

export async function fetchDiscussionHistory() {
  try {
    const response = await fetch('/api/discussionprompts');
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("❌ Error fetching discussion history:", error);
    throw error;
  }
}

export async function deleteDiscussionPrompt(id: string) {
  try {
    const response = await fetch('/api/discussionprompts', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error deleting discussion prompt:", error);
    throw error;
  }
}
