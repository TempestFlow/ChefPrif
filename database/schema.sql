-- Task 3.1 (Data): Sukurti saved_recipes lentelę Supabase PostgreSQL duomenų bazėje

-- Sukurti lentelę išsaugotiems receptams
CREATE TABLE saved_recipes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- Ateityje bus UUID iš autentifikacijos
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Ingredientų masyvas
  steps JSONB NOT NULL, -- Žingsnių masyvas
  calories INTEGER,
  servings INTEGER,
  missing_ingredients JSONB DEFAULT '[]'::jsonb, -- Trūkstamų ingredientų masyvas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksai našumui
CREATE INDEX idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_title ON saved_recipes(title);
CREATE INDEX idx_saved_recipes_created_at ON saved_recipes(created_at DESC);

-- UNIQUE constraint dublikatų prevencijai (user_id + title)
ALTER TABLE saved_recipes
ADD CONSTRAINT unique_user_recipe UNIQUE (user_id, title);

-- Row Level Security (RLS) - vartotojai mato tik savo receptus
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Politika: vartotojai gali skaityti tik savo receptus
CREATE POLICY "Users can view own recipes" ON saved_recipes
  FOR SELECT USING (auth.uid()::text = user_id);

-- Politika: vartotojai gali įrašyti tik savo receptus
CREATE POLICY "Users can insert own recipes" ON saved_recipes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Politika: vartotojai gali atnaujinti tik savo receptus
CREATE POLICY "Users can update own recipes" ON saved_recipes
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Politika: vartotojai gali trinti tik savo receptus
CREATE POLICY "Users can delete own recipes" ON saved_recipes
  FOR DELETE USING (auth.uid()::text = user_id);