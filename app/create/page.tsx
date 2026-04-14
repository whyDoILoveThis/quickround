"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRound } from "@/lib/db";
import { generateRoundId } from "@/lib/utils";
import type { Round } from "@/lib/types";

export default function CreateRoundPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(10);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateAI() {
    setAILoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-question", { method: "POST" });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      setQuestion(data.question);
      setAnswer(String(data.answer));
    } catch {
      setError("Failed to generate AI question. Try again.");
    } finally {
      setAILoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    const numAnswer = parseFloat(answer);
    if (isNaN(numAnswer)) {
      setError("Answer must be a number.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const id = generateRoundId();
      const hostToken = generateRoundId();
      const round: Round = {
        id,
        question: question.trim(),
        answer: numAnswer,
        timerSeconds: timer * 60,
        status: "waiting",
        createdAt: Date.now(),
        startedAt: null,
        hostToken,
        isAI: aiLoading === false && question !== "",
        players: {},
      };
      await createRound(round);
      // Store host token in sessionStorage so host can be identified
      sessionStorage.setItem(`host_${id}`, hostToken);
      router.push(`/round/${id}`);
    } catch {
      setError("Failed to create round. Check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold gradient-text tracking-tight"
        >
          Quikround
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="glass w-full max-w-lg p-8 sm:p-10 animate-in">
          <h1 className="text-3xl font-bold mb-2">Create a Round</h1>
          <p className="text-zinc-400 text-sm mb-8">
            Set up a question and share the link with your group.
          </p>

          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            {/* AI Generate */}
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              {aiLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate AI Question
                </>
              )}
            </button>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex-1 h-px bg-white/10" />
              or enter your own
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Question
              </label>
              <input
                className="input"
                type="text"
                placeholder="How many bones are in the human body?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={300}
              />
            </div>

            {/* Answer */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Correct Answer (numeric)
              </label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                placeholder="206"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>

            {/* Timer */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Timer (minutes)
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 5, 10].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTimer(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timer === m
                        ? "bg-accent text-white"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Round"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
