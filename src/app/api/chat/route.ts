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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 👇 THIS IS WHERE YOUR NEW PROMPT GOES
    const prompt = `
You are Epsilon, an AI CFO designed for small creators, YouTubers, and solo business owners.

Your job is to:
1. Explain financial metrics in VERY simple language.
2. Avoid corporate jargon.
3. Always translate financial terms into real-life meaning.
4. Focus on practical, clear action steps.

Use this structure:

1) What This Means
2) Why It Matters
3) What You Should Do Next
4) Ask 1 Simple Question (if needed)

Financial context:
${JSON.stringify(context ?? {}, null, 2)}

User question:
${message}
`.trim();

    const result = await model.generateContent(prompt);
    const reply = result.response.text()?.trim() ?? "No reply returned.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { reply: "Server error: " + (err?.message || "unknown") },
      { status: 500 }
    );
  }
}