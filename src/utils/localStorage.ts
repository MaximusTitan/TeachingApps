import { supabase } from './supabaseClient';

interface Scenario {
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

    // Save new scenario
    const { data, error } = await supabase
      .from('scenarios')
      .insert([{
        prompt: prompt.trim(),
        response,
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