import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { recipe } = await request.json();

    if (!recipe || !recipe.title) {
      return NextResponse.json({ error: 'Recipe data required' }, { status: 400 });
    }

    // In demo mode, just return success
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co') {
      return NextResponse.json({ success: true, message: "Recipe removed (demo mode)" });
    }

    // For now, use a demo user_id
    const userId = 'demo-user';

    const { error } = await supabaseServer
      .from('saved_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('title', recipe.title);

    if (error) {
      console.error('Error removing saved recipe:', error);
      return NextResponse.json({ error: 'Failed to remove recipe' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Recipe removed" });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}