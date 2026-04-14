"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  subscribeToRound,
  addPlayer,
  updateRound,
  playerExists,
  logAnalytics,
} from "@/lib/db";
import { formatTime, getRoundUrl } from "@/lib/utils";
import type { Round, LeaderboardEntry } from "@/lib/types";

export default function RoundPage() {
  const params = useParams();
  const roundId = params.id as string;

  const [round, setRound] = useState<Round | null>(null);
  const [loadingRound, setLoadingRound] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [guess, setGuess] = useState("");
  const [joined, setJoined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyticsLogged = useRef(false);

  // Subscribe to round data
  useEffect(() => {
    const unsub = subscribeToRound(roundId, (data) => {
      setRound(data);
      setLoadingRound(false);
    });
    return () => unsub();
  }, [roundId]);

  // Timer logic
  useEffect(() => {
    if (!round || round.status !== "active" || !round.startedAt) return;

    const { startedAt, timerSeconds } = round;

    function tick() {
      const elapsed = Math.floor((Date.now() - startedAt!) / 1000);
      const remaining = Math.max(0, timerSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        updateRound(roundId, { status: "finished" });
      }
    }

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round, roundId]);

  // Log analytics when round finishes
  useEffect(() => {
    if (round?.status === "finished" && !analyticsLogged.current) {
      analyticsLogged.current = true;
      const playerCount = round.players ? Object.keys(round.players).length : 0;
      logAnalytics({
        roundId: round.id,
        playerCount,
        isAI: round.isAI,
        timestamp: Date.now(),
      });
    }
  }, [round?.status, round?.id, round?.isAI, round?.players]);

  // Check if player already joined (from sessionStorage)
  useEffect(() => {
    if (!round) return;
    const savedName = sessionStorage.getItem(`player_${roundId}`);
    if (savedName && round.players?.[savedName]) {
      // Use a microtask to avoid synchronous setState in effect body
      queueMicrotask(() => {
        setPlayerName(savedName);
        setJoined(true);
        setSubmitted(true);
      });
    }
  }, [round, roundId]);

  const handleJoin = useCallback(async () => {
    if (!playerName.trim()) {
      setError("Enter your name.");
      return;
    }
    setError("");

    const exists = await playerExists(roundId, playerName.trim());
    if (exists) {
      setError("That name is taken. Try another.");
      return;
    }

    setJoined(true);
    sessionStorage.setItem(`player_${roundId}`, playerName.trim());

    // If this is the first player, activate the round
    if (round?.status === "waiting") {
      await updateRound(roundId, {
        status: "active",
        startedAt: Date.now(),
      });
    }
  }, [playerName, roundId, round?.status]);

  const handleSubmit = useCallback(async () => {
    if (!guess.trim()) {
      setError("Enter a guess.");
      return;
    }
    const numGuess = parseFloat(guess);
    if (isNaN(numGuess)) {
      setError("Guess must be a number.");
      return;
    }
    setError("");
    await addPlayer(roundId, {
      name: playerName.trim(),
      guess: numGuess,
      submittedAt: Date.now(),
    });
    setSubmitted(true);
  }, [guess, playerName, roundId]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(getRoundUrl(roundId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roundId]);

  // ── Loading ─────────────────
  if (loadingRound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading round...</p>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────
  if (!round) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass p-10 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">Round Not Found</h1>
          <p className="text-zinc-400 mb-6">
            This round doesn&apos;t exist or has been removed.
          </p>
          <Link href="/create" className="btn-primary">
            Create a New Round
          </Link>
        </div>
      </div>
    );
  }

  const playerCount = round.players ? Object.keys(round.players).length : 0;
  // ── Finished ────────────────
  if (round.status === "finished") {
    return <FinishedView round={round} copyLink={copyLink} copied={copied} />;
  }

  // ── Waiting / Active ────────
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold gradient-text tracking-tight"
        >
          Quikround
        </Link>
        <button onClick={copyLink} className="btn-secondary text-xs px-4 py-2">
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="glass w-full max-w-lg p-8 sm:p-10 animate-in">
          {/* Timer */}
          {round.status === "active" && timeLeft !== null && (
            <div className="text-center mb-8">
              <div
                className={`inline-flex items-center justify-center w-28 h-28 rounded-full glass text-3xl font-mono font-bold ${
                  timeLeft <= 30 ? "text-red-400 pulse-glow" : "text-white"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          {/* Question */}
          <div className="text-center mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              {round.status === "waiting" ? "Waiting for players" : "Question"}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold leading-snug">
              {round.question}
            </h2>
          </div>

          {/* Player count */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {playerCount} player{playerCount !== 1 ? "s" : ""} joined
            </span>
          </div>

          {/* Join form */}
          {!joined && (
            <div className="flex flex-col gap-4">
              <input
                className="input text-center text-lg"
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button onClick={handleJoin} className="btn-primary">
                Join Round
              </button>
            </div>
          )}

          {/* Guess form */}
          {joined && !submitted && round.status === "active" && (
            <div className="flex flex-col gap-4">
              <p className="text-center text-zinc-400 text-sm">
                Playing as{" "}
                <span className="text-white font-medium">{playerName}</span>
              </p>
              <input
                className="input text-center text-2xl font-mono"
                type="text"
                inputMode="decimal"
                placeholder="Your guess"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button onClick={handleSubmit} className="btn-primary">
                Submit Guess
              </button>
            </div>
          )}

          {/* Waiting for guess submission (already joined, waiting state) */}
          {joined && !submitted && round.status === "waiting" && (
            <div className="text-center">
              <p className="text-zinc-400">Waiting for the round to start...</p>
              <p className="text-zinc-500 text-sm mt-2">
                The timer begins when the first player joins.
              </p>
            </div>
          )}

          {/* Submitted */}
          {submitted && round.status === "active" && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-zinc-300 font-medium">Guess submitted!</p>
              <p className="text-zinc-500 text-sm mt-1">
                Waiting for the timer to end...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Results / Leaderboard Component ───────────────────

function FinishedView({
  round,
  copyLink,
  copied,
}: {
  round: Round;
  copyLink: () => void;
  copied: boolean;
}) {
  const players = round.players ? Object.values(round.players) : [];

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = players
    .map((p) => ({
      ...p,
      distance: Math.abs(p.guess - round.answer),
      rank: 0,
      isFurthest: false,
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.submittedAt - b.submittedAt; // tie-break: earliest wins
    })
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  // Mark furthest
  if (leaderboard.length > 0) {
    const maxDist = Math.max(...leaderboard.map((e) => e.distance));
    leaderboard.forEach((e) => {
      if (e.distance === maxDist) e.isFurthest = true;
    });
  }

  const shareText = `Quikround Results!\n\nQ: ${round.question}\nAnswer: ${round.answer}\n\n${leaderboard
    .map(
      (e) => `${e.rank}. ${e.name} — guessed ${e.guess} (off by ${e.distance})`,
    )
    .join("\n")}\n\nPlay at ${getRoundUrl(round.id)}`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
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

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg animate-in">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Round Complete
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold leading-snug mb-3">
              {round.question}
            </h2>
            <div className="inline-flex items-center gap-2 glass px-5 py-3 rounded-full">
              <span className="text-zinc-400 text-sm">Correct Answer:</span>
              <span className="text-2xl font-bold gradient-text">
                {round.answer}
              </span>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-semibold text-sm text-zinc-300">
                Leaderboard
              </h3>
            </div>

            {leaderboard.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-500">
                No players joined this round.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.name}
                    className={`flex items-center px-6 py-4 ${
                      entry.rank === 1
                        ? "bg-accent/5"
                        : entry.isFurthest
                          ? "bg-red-500/5"
                          : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 shrink-0">
                      {entry.rank === 1 ? (
                        <span className="text-xl">🏆</span>
                      ) : entry.isFurthest ? (
                        <span className="text-xl">💀</span>
                      ) : (
                        <span className="text-zinc-500 font-mono text-sm">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Name & guess */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          entry.rank === 1 ? "text-accent-light" : ""
                        } ${entry.isFurthest ? "text-red-400" : ""}`}
                      >
                        {entry.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Guessed {entry.guess}
                      </p>
                    </div>

                    {/* Distance */}
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-mono ${
                          entry.distance === 0
                            ? "text-green-400"
                            : entry.isFurthest
                              ? "text-red-400"
                              : "text-zinc-400"
                        }`}
                      >
                        {entry.distance === 0
                          ? "Exact!"
                          : `Off by ${entry.distance}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/create" className="btn-primary text-center flex-1">
              Start Another Round
            </Link>
            <button onClick={handleShare} className="btn-secondary flex-1">
              Share Results
            </button>
            <button onClick={copyLink} className="btn-secondary flex-1">
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
