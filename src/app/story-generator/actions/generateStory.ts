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
  return data.reply;
}
