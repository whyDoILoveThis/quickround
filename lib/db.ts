import { getDb } from "./firebase";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
} from "firebase/database";
import type { Round, Player } from "./types";

// ── Round CRUD ──────────────────────────────────────────

export async function createRound(round: Round): Promise<void> {
  await set(ref(getDb(), `rounds/${round.id}`), round);
}

export async function getRound(id: string): Promise<Round | null> {
  const snap = await get(ref(getDb(), `rounds/${id}`));
  return snap.exists() ? (snap.val() as Round) : null;
}

export async function updateRound(
  id: string,
  data: Partial<Round>
): Promise<void> {
  await update(ref(getDb(), `rounds/${id}`), data);
}

// ── Players ─────────────────────────────────────────────

export async function addPlayer(
  roundId: string,
  player: Player
): Promise<void> {
  await set(ref(getDb(), `rounds/${roundId}/players/${player.name}`), player);
}

export async function playerExists(
  roundId: string,
  name: string
): Promise<boolean> {
  const snap = await get(ref(getDb(), `rounds/${roundId}/players/${name}`));
  return snap.exists();
}

// ── Realtime listener ───────────────────────────────────

export function subscribeToRound(
  id: string,
  callback: (round: Round | null) => void
): () => void {
  const roundRef = ref(getDb(), `rounds/${id}`);
  const handler = onValue(roundRef, (snap) => {
    callback(snap.exists() ? (snap.val() as Round) : null);
  });
  return () => off(roundRef, "value", handler);
}

export function subscribeToAllRounds(
  callback: (rounds: Round[]) => void
): () => void {
  const roundsRef = ref(getDb(), "rounds");
  const handler = onValue(roundsRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.val() as Record<string, Round>;
    callback(Object.values(data));
  });
  return () => off(roundsRef, "value", handler);
}

// ── Analytics ───────────────────────────────────────────

export async function logAnalytics(data: {
  roundId: string;
  playerCount: number;
  isAI: boolean;
  timestamp: number;
}): Promise<void> {
  const analyticsRef = ref(getDb(), "analytics");
  const newRef = push(analyticsRef);
  await set(newRef, data);
}
