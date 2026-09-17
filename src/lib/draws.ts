import { supabase } from "@/integrations/supabase/client";

export type DrawRow = {
  id: string;
  game_name: string;
  provider: string;
  draw_date: string;
  initial_numbers: number[];
  winning_numbers: number[] | null;
  machine_numbers: number[] | null;
  notes: string | null;
  created_at: string;
};

export async function listDraws(limit = 25): Promise<DrawRow[]> {
  const { data, error } = await supabase
    .from("draws")
    .select("*")
    .order("draw_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DrawRow[];
}

export async function saveDraw(input: {
  gameName: string;
  provider: string;
  drawDate: string;
  initialNumbers: number[];
  winningNumbers: number[] | null;
  machineNumbers: number[] | null;
}): Promise<DrawRow> {
  const { data, error } = await supabase
    .from("draws")
    .insert({
      game_name: input.gameName,
      provider: input.provider,
      draw_date: input.drawDate,
      initial_numbers: input.initialNumbers,
      winning_numbers: input.winningNumbers,
      machine_numbers: input.machineNumbers,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DrawRow;
}

export async function deleteDraw(id: string): Promise<void> {
  const { error } = await supabase.from("draws").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
