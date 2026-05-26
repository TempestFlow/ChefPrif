import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { Recipe } from '@/types/recipe';

const mockSavedRecipes: Recipe[] = [
  {
    title: "Klasikinis keptas viščiukas su daržovėmis",
    servings: 4,
    ingredients: ["viščiukas 1kg", "bulvės 500g", "morkos 200g", "svogūnai 2vnt", "alyvuogių aliejus 2š"],
    steps: [
      "Viščiuką nuplaukite ir nusausinkite.",
      "Daržoves supjaustykite ir sumaišykite su aliejumi.",
      "Viščiuką ir daržoves dėkite į kepimo skardą.",
      "Kepkite 180°C temperatūroje apie 45 minutes."
    ],
    missing_ingredients: [],
    estimated_calories: 450
  },
  {
    title: "Pomidorų sriuba su grietine",
    servings: 2,
    ingredients: ["pomidorai 500g", "svogūnas 1vnt", "česnakas 2skiltelės", "grietinė 100ml", "vanduo 500ml"],
    steps: [
      "Svogūną ir česnaką susmulkinkite.",
      "Pomidorus nulupkite ir susmulkinkite.",
      "Viską sudėkite į puodą ir virkite 20 minučių.",
      "Sumaišykite su trintuvu ir įmaišykite grietinę."
    ],
    missing_ingredients: ["bazilikas"],
    estimated_calories: 120
  }
];

export async function GET(request: NextRequest) {
  try {
    // In demo mode, return mock saved recipes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co') {
      return NextResponse.json({ recipes: mockSavedRecipes });
    }

    const { data, error } = await supabaseServer
      .from('saved_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved recipes:', error);
      return NextResponse.json({ error: 'Failed to fetch saved recipes' }, { status: 500 });
    }

    return NextResponse.json({ recipes: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}