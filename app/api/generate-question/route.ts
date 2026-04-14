import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a trivia question generator. Generate a fun numerical trivia question with a specific numeric answer. The question should be interesting and the answer should be a whole number or a number with at most 2 decimal places. 

Return ONLY a JSON object in this exact format, no other text:
{"question": "your question here?", "answer": 42}

Examples of good questions:
- How many bones are in the adult human body? (answer: 206)
- In what year was the Eiffel Tower completed? (answer: 1889)
- How many countries are in Africa? (answer: 54)
- What is the speed of light in thousands of km per second? (answer: 300)

Make the questions varied - cover history, science, geography, sports, pop culture, etc. The answer must be a number.`;

export async function POST() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Generate a trivia question with a numeric answer." },
        ],
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return NextResponse.json({ error: "AI provider error" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response (handle markdown code blocks too)
    const jsonMatch = content.match(/\{[\s\S]*?"question"[\s\S]*?"answer"[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("Could not parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.question !== "string" || typeof parsed.answer !== "number") {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    return NextResponse.json({
      question: parsed.question,
      answer: parsed.answer,
    });
  } catch (err) {
    console.error("AI question generation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
