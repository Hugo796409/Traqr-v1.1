import { NextResponse } from "next/server";
import { callMistral } from "../../lib/mistral";

export async function POST(request: Request) {
  try {
    const { model, prompt } = await request.json();
    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 }
      );
    }
    const result = await callMistral(model, [{ role: "user", content: prompt }]);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}