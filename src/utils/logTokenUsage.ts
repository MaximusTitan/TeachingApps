import { createClient } from "@/utils/supabase/server";  // Supabase client

// Function to track and log token usage and cost
export async function logTokenUsage(toolName: string, modelName: string, promptTokens: number, completionTokens: number, userEmail?: string) {
  // Calculate the cost based on the tokens
  const inputCost = (promptTokens / 1_000_000) * 2.50;  // $2.50 per 1M input tokens
  const outputCost = (completionTokens / 1_000_000) * 10.00; // $10 per 1M output tokens
  const totalCost = inputCost + outputCost;
  const totalTokens = promptTokens + completionTokens;

  // Log the usage into Supabase
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('token_usage_logs')
    .insert([
      {
        tool_name: toolName,
        model_name: modelName,
        input_tokens: promptTokens,
        output_tokens: completionTokens,
        total_tokens: totalTokens,
        total_cost: totalCost,
        user_email: userEmail,
      },
    ]);

  if (error) {
    console.error('Error inserting log:', error.message);
  } else {
    console.log('Token usage logged successfully:', data);
  }
}
