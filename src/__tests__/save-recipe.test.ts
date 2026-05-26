/**
 * @jest-environment node
 */
// Testai Task 3.2 (Logic): save recipe API route
import { NextRequest } from "next/server";
import { POST } from "@/app/api/recipes/save/route";

// Mockuojame Supabase
jest.mock("@/lib/supabase", () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'demo-service-key';

import { supabaseServer } from "@/lib/supabase";

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>;

describe("POST /api/recipes/save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleRecipe = {
    title: "Pomidorų sriuba",
    servings: 4,
    ingredients: ["400g pomidorų", "500ml vandens"],
    steps: ["Supiaustyti pomidorus", "Verdinti 15 min"],
    missing_ingredients: ["Česnakus", "Druską"],
    estimated_calories: 150,
  };

  it("grąžina 400 klaidą kai nėra recepto duomenų", async () => {
    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Neteisingi recepto duomenys.");
  });

  it("patikrina dublikatus prieš įrašant", async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockCheckSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

    const mockInsertSingle = jest.fn().mockResolvedValue({ data: { id: 1, title: sampleRecipe.title }, error: null });
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    mockSupabase.from
      .mockReturnValueOnce({ select: mockCheckSelect } as any)
      .mockReturnValueOnce({ insert: mockInsert } as any);

    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({ recipe: sampleRecipe }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Receptas išsaugotas!");
  });

  it("grąžina 409 klaidą kai receptas jau išsaugotas", async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({ recipe: sampleRecipe }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Šis receptas jau išsaugotas.");
  });

  it("sėkmingai įrašo receptą į duomenų bazę", async () => {
    const mockCheckSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const mockCheckEq2 = jest.fn().mockReturnValue({ single: mockCheckSingle });
    const mockCheckEq1 = jest.fn().mockReturnValue({ eq: mockCheckEq2 });
    const mockCheckSelect = jest.fn().mockReturnValue({ eq: mockCheckEq1 });

    // Mock - sėkmingas įrašymas
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: {
        id: 1,
        user_id: "demo-user",
        title: sampleRecipe.title,
        ingredients: sampleRecipe.ingredients,
        steps: sampleRecipe.steps,
        calories: sampleRecipe.estimated_calories,
      },
      error: null,
    });

    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    // First call for check, second for insert
    mockSupabase.from
      .mockReturnValueOnce({ select: mockCheckSelect } as any)
      .mockReturnValueOnce({ insert: mockInsert } as any);

    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({ recipe: sampleRecipe }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "demo-user",
      title: sampleRecipe.title,
      ingredients: sampleRecipe.ingredients,
      steps: sampleRecipe.steps,
      calories: sampleRecipe.estimated_calories,
      servings: sampleRecipe.servings,
      missing_ingredients: sampleRecipe.missing_ingredients,
    });
  });

  it("grąžina 500 klaidą kai nepavyksta įrašyti į DB", async () => {
    const mockCheckSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const mockCheckEq2 = jest.fn().mockReturnValue({ single: mockCheckSingle });
    const mockCheckEq1 = jest.fn().mockReturnValue({ eq: mockCheckEq2 });
    const mockCheckSelect = jest.fn().mockReturnValue({ eq: mockCheckEq1 });

    // Mock - įrašymo klaida
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    // First call for check, second for insert
    mockSupabase.from
      .mockReturnValueOnce({ select: mockCheckSelect } as any)
      .mockReturnValueOnce({ insert: mockInsert } as any);

    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({ recipe: sampleRecipe }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Nepavyko išsaugoti recepto.");
  });

  it("veikia demo režime kai nėra Supabase konfigūracijos", async () => {
    // Temporarily remove env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const request = new NextRequest("http://localhost:3000/api/recipes/save", {
      method: "POST",
      body: JSON.stringify({ recipe: sampleRecipe }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Receptas išsaugotas! (Demo režimas)");
    expect(data.recipe.title).toBe(sampleRecipe.title);

    // Restore env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'demo-service-key';
  });
});