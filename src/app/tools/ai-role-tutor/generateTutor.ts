import { supabase } from "@/lib/supabase";

export async function generateTutorResponse(inputs: {
  country: string;
  board: string;
  subject: string;
  grade: string;
  topic: string;
  character: string;
  question: string;
}) {
  try {
    const response = await fetch("/api/ai-role-tutor/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputs),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API response error:", errorData);
      throw new Error(`Failed to generate response: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tutorResponse = data.reply; // This is the generated response content

    // Try to save to Supabase, but don't block the response if it fails
    try {
      const { error } = await supabase.from("tutor_responses").insert([
        {
          character: inputs.character,
          topic: inputs.topic,
          country: inputs.country,
          board: inputs.board,
          subject: inputs.subject,
          grade: inputs.grade,
          question: inputs.question,
          content: tutorResponse,
        },
      ]);

      if (error) {
        console.error("❌ Error saving response to Supabase:", error.message);
        console.log("Note: You may need to create the 'tutor_responses' table in your Supabase database");
      } else {
        console.log("✅ Tutor response saved successfully!");
      }
    } catch (dbError) {
      console.error("Failed to save to database, but response was generated successfully:", dbError);
    }

    return tutorResponse;
  } catch (error) {
    console.error("Error in generateTutorResponse function:", error);
    throw error; // Re-throw the error to be handled by the calling function
  }
}

// Fetch response history function
export async function fetchResponseHistory() {
  try {
    const { data, error } = await supabase
      .from("tutor_responses")
      .select("id, character, topic, subject, board, country, grade, question, content, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching responses:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch response history:", error);
    return [];
  }
}

// Delete response function
export async function deleteResponse(responseId: number) {
  try {
    const { error } = await supabase.from("tutor_responses").delete().eq("id", responseId);

    if (error) {
      console.error("❌ Error deleting response:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete response:", error);
    return false;
  }
}