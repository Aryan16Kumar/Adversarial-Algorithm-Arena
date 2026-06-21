import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the client when configured. Calling createClient() with undefined
// values throws at import time and would take the whole game down — so we guard
// it and let the functions below no-op gracefully when the DB isn't set up.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — ' +
    'DB features (questions, leaderboard) disabled. See .env.example.'
  );
}

export async function getRandomQuestion(difficulty) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('difficulty_level', difficulty);

  if (error) {
    console.error('Failed to fetch questions:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;

  return data[Math.floor(Math.random() * data.length)];
}

export async function submitScore(playerName, score) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ player_name: playerName, score }]);

  if (error) {
    console.error('Failed to submit score:', error.message);
    return null;
  }
  return data;
}

export async function getTopScores(limit = 10) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch leaderboard:', error.message);
    return [];
  }
  return data;
}
