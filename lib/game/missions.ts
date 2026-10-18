export interface MissionConfig {
  id: number;
  title: string;
  concept: string;
  maxPoints: number;
}

export const MISSIONS: MissionConfig[] = [
  { id: 1, title: "Route the Packet", concept: "Routers and IP routing", maxPoints: 100 },
  { id: 2, title: "Choose the Right Protocol", concept: "TCP vs UDP", maxPoints: 150 },
  { id: 3, title: "The Addressing Crisis", concept: "IP addressing", maxPoints: 150 },
  { id: 4, title: "The Final Outage", concept: "Layered troubleshooting", maxPoints: 300 },
];

export const TOTAL_MAX_POINTS = MISSIONS.reduce((s, m) => s + m.maxPoints, 0);