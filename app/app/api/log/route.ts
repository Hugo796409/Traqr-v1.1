import { callMistral } from "@/lib/mistral";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, options } = body;

    if (!model || !messages) {
      return NextResponse.json(
        { error: "Missing model or messages" },
        { status: 400 }
      );
    }

    const result = await callMistral(model, messages, options || {});
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
