import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json({ error: "Token nerastas." }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("saved_recipes")
      .select("*")
      .eq("share_token", token)
      .single();

    if (error) {
      console.error("Klaida gaunant dalinamą receptą:", error);
      return NextResponse.json({ error: "Receptas nerastas." }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipe: data });
  } catch (err) {
    console.error("Serverio klaida GET /api/share:", err);
    return NextResponse.json({ error: "Serverio klaida." }, { status: 500 });
  }
}
