// REQ-7 (Types): Sugeneruoto recepto įrašas istorijos lange.
import { Recipe } from "@/types/recipe";

export interface RecipeHistoryEntry {
  id: string | number;
  title: string;
  recipe: Recipe;
  createdAt: string; // ISO data
}

export const MAX_HISTORY_PER_USER = 10;
