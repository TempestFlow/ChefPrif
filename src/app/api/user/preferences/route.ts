// REQ-5 (Logic): API route — vartotojo alergijų ir dietų preferencijos
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { isValidAllergy, isValidDiet } from "@/data/preferences";
import { EMPTY_PREFERENCES } from "@/types/preferences";

const isDemo =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://demo.supabase.co" ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(request: NextRequest) {
  if (isDemo) {
    return NextResponse.json({ ...EMPTY_PREFERENCES, demo: true });
  }

  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Neprisijungę." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("user_preferences")
    .select("allergies, diets")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[preferences GET] Klaida:", error);
    return NextResponse.json(
      { error: "Nepavyko įkelti preferencijų." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    allergies: Array.isArray(data?.allergies) ? data!.allergies : [],
    diets: Array.isArray(data?.diets) ? data!.diets : [],
  });
}

export async function POST(request: NextRequest) {
  let body: { allergies?: unknown; diets?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Neteisingas užklausos formatas." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.allergies) || !Array.isArray(body.diets)) {
    return NextResponse.json(
      { error: "Neteisingi duomenys: 'allergies' ir 'diets' privalo būti masyvai." },
      { status: 400 }
    );
  }

  const allergies = (body.allergies as unknown[]).filter(
    (v): v is string => typeof v === "string" && isValidAllergy(v)
  );
  const diets = (body.diets as unknown[]).filter(
    (v): v is string => typeof v === "string" && isValidDiet(v)
  );

  if (allergies.length !== body.allergies.length || diets.length !== body.diets.length) {
    return NextResponse.json(
      { error: "Pateikta nežinomų alergijų ar dietų reikšmių." },
      { status: 400 }
    );
  }

  if (isDemo) {
    return NextResponse.json({ success: true, demo: true, allergies, diets });
  }

  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Neprisijungę." }, { status: 401 });
  }

  const { error } = await supabaseServer
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        allergies,
        diets,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[preferences POST] Klaida:", error);
    return NextResponse.json(
      { error: "Nepavyko išsaugoti preferencijų." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, allergies, diets });
}
