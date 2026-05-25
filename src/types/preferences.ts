// REQ-5 (Types): Vartotojo preferencijų tipas.

export interface UserPreferences {
  allergies: string[];
  diets: string[];
}

export const EMPTY_PREFERENCES: UserPreferences = {
  allergies: [],
  diets: [],
};
