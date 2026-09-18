CREATE TABLE public.pair_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name text,
  provider text,
  draw_date date,
  search_numbers numeric[] NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pair_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pair_searches TO anon;
GRANT ALL ON public.pair_searches TO service_role;

ALTER TABLE public.pair_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pair searches" ON public.pair_searches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pair searches" ON public.pair_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pair searches" ON public.pair_searches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pair searches" ON public.pair_searches FOR DELETE USING (true);

CREATE INDEX pair_searches_created_at_idx ON public.pair_searches (created_at DESC);