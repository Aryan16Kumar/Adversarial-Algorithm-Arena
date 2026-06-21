import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getRandomQuestion(difficulty) {
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
