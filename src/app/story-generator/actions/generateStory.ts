import { supabase } from "@/lib/supabase";
export async function generateStory(inputs: {
  message: string;
  storyline?: string;
  country: string;
  board: string;
  subject: string;
}) {
  const response = await fetch("/api/story-generator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputs),
  });

  if (!response.ok) {
    throw new Error("Failed to generate story");
  }

  const data = await response.json();
  const story = data.reply; // This is the generated story content

  // Save the generated story to Supabase
  const { error } = await supabase.from("stories").insert([
    {
      topic: inputs.message,
      storyline: inputs.storyline || null,
      country: inputs.country,
      board: inputs.board,
      subject: inputs.subject,
      content: story,
    },
  ]);

  if (error) {
    console.error("❌ Error saving story to Supabase:", error.message);
  } else {
    console.log("✅ Story saved successfully!");
  }

  return story;
};
export async function fetchStoryHistory() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching stories:", error.message);
    return [];
  }

  return data; // Returns an array of past stories
}
export async function deleteStory(storyId: number) {
  const { error } = await supabase.from("stories").delete().eq("id", storyId);

  if (error) {
    console.error("❌ Error deleting story:", error.message);
    return false;
  }

  return true;
}
