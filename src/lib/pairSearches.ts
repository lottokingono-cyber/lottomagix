import { supabase } from "@/integrations/supabase/client";

export type SavedPairResult = {
  pair: string;
  occurrences: number;
  where: string[];
};

export type PairSearchRow = {
  id: string;
  game_name: string | null;
  provider: string | null;
  draw_date: string | null;
  search_numbers: number[];
  results: SavedPairResult[];
  created_at: string;
};

export async function listPairSearches(limit = 25): Promise<PairSearchRow[]> {
  const { data, error } = await supabase
    .from("pair_searches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PairSearchRow[];
}

export async function savePairSearch(input: {
  gameName: string | null;
  provider: string | null;
  drawDate: string | null;
  searchNumbers: number[];
  results: SavedPairResult[];
}): Promise<void> {
  const { error } = await supabase.from("pair_searches").insert({
    game_name: input.gameName,
    provider: input.provider,
    draw_date: input.drawDate,
    search_numbers: input.searchNumbers,
    results: input.results as unknown as never,
  });
  if (error) throw new Error(error.message);
}

export async function deletePairSearch(id: string): Promise<void> {
  const { error } = await supabase.from("pair_searches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
