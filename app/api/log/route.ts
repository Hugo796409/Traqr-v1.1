import { NextResponse } from "next/server";
import { callMistral } from "../../lib/mistral";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
      });
    } catch (firebaseError: any) {
      console.error("Erreur de sauvegarde Firestore:", firebaseError);
      // Ne pas échouer la requête si Firestore échoue
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}