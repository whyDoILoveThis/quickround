export type RoundStatus = "waiting" | "active" | "finished";

export interface Player {
  name: string;
  guess: number;
  submittedAt: number;
}

export interface Round {
  id: string;
  question: string;
  answer: number;
  timerSeconds: number;
  status: RoundStatus;
  createdAt: number;
  startedAt: number | null;
  hostToken: string;
  isAI: boolean;
  players: Record<string, Player>;
}

export interface LeaderboardEntry extends Player {
  rank: number;
  distance: number;
  isFurthest: boolean;
}
