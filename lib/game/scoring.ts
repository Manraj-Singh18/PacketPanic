// Mission 1 — Route the Packet
export const M1_CORRECT = 100;
export const M1_SPEED_BONUS_MAX = 20; // scaled by remaining time

// Mission 2 — Protocols (3 questions x 50)
export const M2_PER_CORRECT = 50;
export const M2_WRONG_PENALTY = 10;

// Mission 3 — Addressing
export const M3_CORRECT = 150;
export const M3_HINT_PENALTY = 30;

// Mission 4 — Final Outage
export const M4_DIAGNOSIS = 100;
export const M4_ROUTE = 100;
export const M4_PROTOCOL = 50;
export const M4_HINT_PENALTY = 25;
export const M4_NO_HINT_BONUS = 50;

// Mission correct answers (server-authoritative)
export const M1_SOLUTION_PATH = ["laptop", "R1", "R2", "R4", "server"];
export const M3_SOLUTION_IP = "10.20.0.10";
export const M4_SOLUTION_DIAGNOSIS = "link_failure_alt_route";
export const M4_SOLUTION_ROUTE = ["client", "RA", "RC", "RD", "event_server"];
export const M4_SOLUTION_PROTOCOL = "TCP";