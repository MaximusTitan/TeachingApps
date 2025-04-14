import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to generate a unique player ID if one doesn't exist
export async function getPlayerId(): Promise<string> {
  let playerId = localStorage.getItem('logicbuild_player_id');
  
  if (!playerId) {
    // Generate a unique ID
    playerId = 'player_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('logicbuild_player_id', playerId);
  }
  
  return playerId;
}

// Save game state to Supabase
export async function saveGameState(gameState: any): Promise<void> {
  try {
    const playerId = await getPlayerId();
    
    const { error } = await supabase
      .from('logicbuild_progress')
      .upsert({ 
        player_id: playerId,
        game_state: gameState,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'player_id' 
      });
    
    if (error) throw error;
    localStorage.setItem('logicBuildGameState', JSON.stringify(gameState)); // Backup to localStorage
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    // Fallback to localStorage on error
    localStorage.setItem('logicBuildGameState', JSON.stringify(gameState));
  }
}

// Load game state from Supabase
export async function loadGameState(): Promise<any> {
  try {
    const playerId = await getPlayerId();
    
    const { data, error } = await supabase
      .from('logicbuild_progress')
      .select('game_state')
      .eq('player_id', playerId)
      .single();
    
    if (error) throw error;
    
    if (data && data.game_state) {
      return data.game_state;
    }
    
    // Try localStorage as backup
    const savedState = localStorage.getItem('logicBuildGameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    // Fallback to localStorage
    const savedState = localStorage.getItem('logicBuildGameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  }
}

// Delete game state from Supabase (for reset)
export async function deleteGameState(): Promise<void> {
  try {
    const playerId = await getPlayerId();
    
    const { error } = await supabase
      .from('logicbuild_progress')
      .delete()
      .eq('player_id', playerId);
    
    if (error) throw error;
    localStorage.removeItem('logicBuildGameState');
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    localStorage.removeItem('logicBuildGameState');
  }
} 