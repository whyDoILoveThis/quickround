import { nanoid } from "nanoid";

export function generateRoundId(): string {
  return nanoid(8);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getRoundUrl(roundId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/round/${roundId}`;
  }
  return `/round/${roundId}`;
}
