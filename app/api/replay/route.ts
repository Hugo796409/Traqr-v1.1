import { NextResponse } from "next/server";
import { callMistral } from "../../lib/mistral";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    
    // Sauvegarder dans Firestore
    try {
      await addDoc(collection(db, "logs"), {
        model: result.model,
        prompt: result.prompt,
        response: result.success ? result.response : null,
        cost: result.cost,
        latency: result.latency,
        success: result.success,
        error: result.success ? null : result.error,
        timestamp: serverTimestamp(),
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        isReplay: true, // Marquer comme replay
      });
    } catch (firebaseError: any) {
      console.error("Erreur de sauvegarde Firestore:", firebaseError);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}