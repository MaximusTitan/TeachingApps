import { supabase } from './supabaseClient';

export interface SavedScenario {
  id?: string;
  prompt: string;
  response: string;
  created_at?: string;
}

export const saveScenario = async (prompt: string, response: string) => {
  try {
    const normalizedPrompt = prompt.trim().toLowerCase();
    
    // Check for exact duplicate
    const { data: existing } = await supabase
      .from('scenarios')
      .select('*')
      .ilike('prompt', normalizedPrompt)
      .limit(1)
      .single();

    if (existing) {
      return existing; // Return existing scenario if found
    }

    // Format the response before saving for consistency
    const formattedResponse = response
      // Normalize spacing
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      // Ensure consistent formatting for section headers
      .replace(/(Scenario:|Beginning:|Challenge:|Application of .*?:|Final Outcome:)/g, 
        "\n\n**$1**\n\n")
      // Make sure there are no duplicate asterisks in bold text
      .replace(/\*\*\*\*(.*?)\*\*\*\*/g, "**$1**")
      // Ensure proper spacing after list items
      .replace(/• (.*?)(?!\n)/g, "• $1\n")
      // Remove any remaining unmatched double asterisks
      .replace(/\*\*/g, '');

    // Save new scenario
    const { data, error } = await supabase
      .from('scenarios')
      .insert([{
        prompt: prompt.trim(),
        response: formattedResponse,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving scenario:', error);
    throw error;
  }
};