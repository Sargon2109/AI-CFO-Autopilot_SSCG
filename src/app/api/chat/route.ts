import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { reply: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ reply: "Missing message" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Concise, creator-friendly CFO prompt
    const prompt = `
You are Epsilon, an AI CFO for small creators and solo business owners.

Rules:
- Be concise.
- Maximum 6 sentences total.
- No section headers.
- No markdown.
- No long explanations.
- Give the answer first, then brief reasoning.
- Use the numbers in the provided context. If a required number is missing, ask exactly ONE short question.

If math is involved:
- Show the key calculation clearly in ONE line.
- Round money to whole dollars unless cents matter.

Financial context (JSON):
${JSON.stringify(context ?? {}, null, 2)}

User question:
${message}
`.trim();

    const result = await model.generateContent(prompt);
    const reply = result.response.text()?.trim() ?? "No reply returned.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("❌ /api/chat Gemini error:", err);
    return NextResponse.json(
      { reply: "Server error: " + (err?.message || "unknown") },
      { status: 500 }
    );
  }
}