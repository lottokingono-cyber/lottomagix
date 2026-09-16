CREATE TABLE public.draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name text NOT NULL,
  provider text NOT NULL,
  draw_date date NOT NULL,
  initial_numbers numeric[] NOT NULL,
  winning_numbers numeric[],
  machine_numbers numeric[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO authenticated;
GRANT ALL ON public.draws TO service_role;

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read draws" ON public.draws FOR SELECT USING (true);
CREATE POLICY "Anyone can insert draws" ON public.draws FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update draws" ON public.draws FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete draws" ON public.draws FOR DELETE USING (true);

CREATE INDEX draws_draw_date_idx ON public.draws (draw_date DESC);