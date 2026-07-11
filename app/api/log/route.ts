import { NextResponse } from "next/server";
import { callMistral } from "../../lib/mistral";

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json();
    if (!model || !messages) {
      return NextResponse.json(
        { error: "model and messages are required" },
        { status: 400 }
      );
    }
    const result = await callMistral(model, messages);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}