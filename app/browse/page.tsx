"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { subscribeToAllRounds } from "@/lib/db";
import { formatTime } from "@/lib/utils";
import type { Round } from "@/lib/types";

function getMyRoundIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const ids = new Set<string>();
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("player_")) {
      ids.add(key.replace("player_", ""));
    }
    if (key?.startsWith("host_")) {
      ids.add(key.replace("host_", ""));
    }
  }
  return ids;
}

export default function BrowsePage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "waiting" | "finished" | "mine"
  >("all");
  const [myIds] = useState<Set<string>>(() => getMyRoundIds());

  useEffect(() => {
    const unsub = subscribeToAllRounds((data) => {
      setRounds(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const searchLower = search.toLowerCase();

  const myRounds = useMemo(
    () =>
      rounds
        .filter((r) => myIds.has(r.id))
        .sort((a, b) => b.createdAt - a.createdAt),
    [rounds, myIds],
  );

  const filtered = rounds
    .filter((r) => {
      if (filter === "mine") return myIds.has(r.id);
      if (filter !== "all" && r.status !== filter) return false;
      if (
        searchLower &&
        !r.question.toLowerCase().includes(searchLower) &&
        !r.id.toLowerCase().includes(searchLower)
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const statusOrder = { active: 0, waiting: 1, finished: 2 };
      const sDiff = statusOrder[a.status] - statusOrder[b.status];
      if (sDiff !== 0) return sDiff;
      return b.createdAt - a.createdAt;
    });

  const activeCount = rounds.filter((r) => r.status === "active").length;
  const waitingCount = rounds.filter((r) => r.status === "waiting").length;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold gradient-text tracking-tight"
        >
          Quikround
        </Link>
        <Link href="/create" className="btn-primary text-sm px-5 py-2">
          Create a Round
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Live <span className="gradient-text">Rounds</span>
          </h1>
          <p className="text-zinc-400">
            {activeCount} active · {waitingCount} waiting for players
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-in-delay-1">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              className="input pl-10"
              type="text"
              placeholder="Search by question or round ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "mine", "active", "waiting", "finished"] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? "bg-accent text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  } ${f === "mine" ? "capitalize" : "capitalize"}`}
                >
                  {f === "mine"
                    ? `My Rounds${myIds.size > 0 ? ` (${myRounds.length})` : ""}`
                    : f}
                </button>
              ),
            )}
          </div>
        </div>

        {/* My Rounds section (shown on "all" filter if user has rounds) */}
        {!loading && filter === "all" && myRounds.length > 0 && (
          <div className="mb-10 animate-in-delay-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-accent-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold">My Rounds</h2>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {myRounds.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-linear-to-r from-accent/20 to-transparent" />
            </div>
            <div className="grid gap-3 pl-1 border-l-2 border-accent/20">
              {myRounds.map((round) => (
                <RoundCard key={round.id} round={round} isMine />
              ))}
            </div>
          </div>
        )}

        {/* All Rounds header (when My Rounds section is visible) */}
        {!loading &&
          filter === "all" &&
          myRounds.length > 0 &&
          filtered.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-zinc-400">
                All Rounds
              </h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

        {/* Round list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass p-12 text-center animate-in-delay-2">
            <p className="text-zinc-400 text-lg mb-2">No rounds found</p>
            <p className="text-zinc-500 text-sm">
              {search
                ? "Try a different search term."
                : "Be the first to create one!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 animate-in-delay-2">
            {filtered.map((round) => (
              <RoundCard key={round.id} round={round} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RoundCard({ round, isMine }: { round: Round; isMine?: boolean }) {
  const isActive = round.status === "active" && round.startedAt != null;
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!isActive || !round.startedAt) return null;
    const elapsed = Math.floor((Date.now() - round.startedAt) / 1000);
    return Math.max(0, round.timerSeconds - elapsed);
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !round.startedAt) return;

    function tick() {
      const elapsed = Math.floor((Date.now() - round.startedAt!) / 1000);
      const remaining = Math.max(0, round.timerSeconds - elapsed);
      setTimeLeft(remaining);
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, round.startedAt, round.timerSeconds]);

  const playerCount = round.players ? Object.keys(round.players).length : 0;

  const statusConfig = {
    active: {
      label: "Live",
      color: "bg-green-400",
      textColor: "text-green-400",
    },
    waiting: {
      label: "Waiting",
      color: "bg-yellow-400",
      textColor: "text-yellow-400",
    },
    finished: {
      label: "Finished",
      color: "bg-zinc-500",
      textColor: "text-zinc-500",
    },
  };

  const status = statusConfig[round.status];

  return (
    <Link
      href={`/round/${round.id}`}
      className="glass glass-hover p-5 sm:p-6 flex items-center gap-4 transition-all group"
    >
      {/* Timer / Status badge */}
      <div className="shrink-0">
        {round.status === "active" && timeLeft !== null ? (
          <div
            className={`w-16 h-16 rounded-xl glass flex items-center justify-center font-mono font-bold text-lg ${
              timeLeft <= 30 ? "text-red-400" : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl glass flex items-center justify-center">
            <span
              className={`w-3 h-3 rounded-full ${status.color} ${round.status === "active" || round.status === "waiting" ? "animate-pulse" : ""}`}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-medium uppercase tracking-wider ${status.textColor}`}
          >
            {status.label}
          </span>
          {round.isAI && (
            <span className="text-xs text-accent-light bg-accent/10 px-2 py-0.5 rounded-full">
              AI
            </span>
          )}
          {isMine && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <p className="font-medium text-sm sm:text-base truncate group-hover:text-white transition-colors">
          {round.question}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          <span>
            {playerCount} player{playerCount !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>{Math.floor(round.timerSeconds / 60)} min round</span>
          <span>·</span>
          <span className="font-mono">{round.id}</span>
        </div>
      </div>

      {/* Arrow */}
      <svg
        className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
