// Task 2.1 (Data): Recepto duomenų modelis
export interface Recipe {
  title: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  missing_ingredients: string[];
  estimated_calories: number;
}
