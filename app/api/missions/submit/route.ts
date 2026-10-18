import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const M1_CORRECT = 100;
const M1_SPEED_BONUS_MAX = 20;
const M2_PER_CORRECT = 50;
const M3_CORRECT = 150;
const M3_HINT_PENALTY = 30;
const M4_DIAGNOSIS = 100;
const M4_ROUTE = 100;
const M4_PROTOCOL = 50;
const M4_HINT_PENALTY = 25;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, missionId, payload, hintUsed } = body;

    console.log("=== SUBMIT === mission:", missionId, "payload:", JSON.stringify(payload));

    if (!sessionId || !missionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: session, error: sErr } = await supabase
      .from("game_sessions")
      .select("id, status, start_time, duration_seconds, current_mission, final_score, hints_used, missions_completed, team_id")
      .eq("id", sessionId)
      .single();

    if (sErr || !session) {
      console.error("Session not found:", sErr?.message);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "active") {
      console.error("Session not active:", session.status);
      return NextResponse.json({ error: "Session not active" }, { status: 403 });
    }

    if (session.start_time) {
      const elapsed = (Date.now() - new Date(session.start_time).getTime()) / 1000;
      if (elapsed > session.duration_seconds) {
        await supabase
          .from("game_sessions")
          .update({ status: "expired", end_time: new Date().toISOString() })
          .eq("id", sessionId);
        return NextResponse.json({ error: "Time expired" }, { status: 403 });
      }
    }

    const { data: mResult, error: mErr } = await supabase
      .from("mission_results")
      .select("id, status, score, attempts, hints_used")
      .eq("session_id", sessionId)
      .eq("mission_id", missionId)
      .single();

    if (mErr || !mResult) {
      console.error("Mission result not found:", mErr?.message);
      return NextResponse.json({ error: "Mission result not found" }, { status: 404 });
    }
    if (mResult.status === "completed") {
      return NextResponse.json({
        success: true,
        score: mResult.score,
        awardedScore: mResult.score,
        totalScore: session.final_score,
        message: "Already completed.",
        attempts: mResult.attempts,
        missionCompleted: true,
        sessionCompleted: false,
      });
    }

    const newAttempts = (mResult.attempts ?? 0) + 1;
    let awardedScore = 0;
    let success = false;
    let message = "";

    // ===== MISSION 1 =====
    if (missionId === 1) {
      const visitedHops: string[] = payload?.path ?? [];
      const completed: boolean = payload?.completed === true;
      const correctPath = ["client", "RA", "RB", "RD", "event"];
      const pathMatches =
        visitedHops.length === correctPath.length &&
        visitedHops.every((h, i) => h === correctPath[i]);

      console.log("M1:", visitedHops, "matches:", pathMatches);

      if (completed && pathMatches) {
        awardedScore = M1_CORRECT;
        if (session.start_time) {
          const elapsed = (Date.now() - new Date(session.start_time).getTime()) / 1000;
          const remaining = Math.max(0, session.duration_seconds - elapsed);
          const speedBonus = Math.round((remaining / session.duration_seconds) * M1_SPEED_BONUS_MAX);
          awardedScore += speedBonus;
        }
        success = true;
        message = "Packet delivered. +" + awardedScore + " pts.";
      } else {
        message = "Path verification failed.";
      }
    }

    // ===== MISSION 2 =====
    if (missionId === 2) {
      const answers = payload?.answers ?? [];
      if (answers.length !== 3) {
        return NextResponse.json({ error: "All three services required" }, { status: 400 });
      }
      const correctMap: Record<number, { protocol: string; port: number }> = {
        1: { protocol: "TCP", port: 443 },
        2: { protocol: "UDP", port: 5060 },
        3: { protocol: "TCP", port: 5432 },
      };
      let correctCount = 0;
      answers.forEach((a: any) => {
        const c = correctMap[a.scenarioId];
        if (c && a.protocol === c.protocol && Number(a.port) === c.port) correctCount++;
      });
      awardedScore = correctCount * M2_PER_CORRECT;
      awardedScore = Math.max(mResult.score ?? 0, awardedScore);
      if (correctCount === 3) {
        success = true;
        message = "All services correct. +" + awardedScore + " pts.";
      } else {
        message = correctCount + "/3 correct.";
      }
    }

    // ===== MISSION 3 =====
    if (missionId === 3) {
      const ip = payload?.destinationIp ?? "";
      const networkPassed = payload?.networkTestPassed === true;
      const serviceResult = payload?.serviceTestResult ?? "";
      const mcqCorrect = payload?.mcqCorrect === true;
      const correctIp = "10.20.0.10";
      const ipCorrect = ip.trim() === correctIp;
      const serviceIssueIdentified = serviceResult === "service-down";

      console.log("M3:", { ip, ipCorrect, networkPassed, serviceResult, mcqCorrect });

      let partial = 0;
      if (ipCorrect && networkPassed) partial += 100;
      if (serviceIssueIdentified && mcqCorrect) partial += 50;
      if (hintUsed) partial -= M3_HINT_PENALTY;
      if (partial < 0) partial = 0;
      awardedScore = Math.max(mResult.score ?? 0, partial);
      success = true;
      message = "Investigation submitted. +" + awardedScore + " pts.";
    }

    // ===== MISSION 4 =====
    if (missionId === 4) {
      const { diagnosis, route, protocol, evidenceCorrect, dnsMcqCorrect } = payload ?? {};
      let partial = 0;
      const diagCorrect = diagnosis === "failed_link";
      const correctRoute = ["client", "RA", "RC", "RD", "event_server"];
      const routeCorrect =
        Array.isArray(route) &&
        route.length === correctRoute.length &&
        route.every((r: string, i: number) => r === correctRoute[i]);
      const protoCorrect = protocol === "TCP";
      const evidenceOk = evidenceCorrect === true;
      const dnsOk = dnsMcqCorrect === true;

      console.log("M4:", { diagCorrect, routeCorrect, protoCorrect, evidenceOk, dnsOk });

      if (diagCorrect) partial += M4_DIAGNOSIS;
      if (routeCorrect) partial += M4_ROUTE;
      if (protoCorrect) partial += M4_PROTOCOL;
      if (evidenceOk) partial += 25;
      if (dnsOk) partial += 25;
      if (hintUsed) partial -= M4_HINT_PENALTY;
      if (partial < 0) partial = 0;
      awardedScore = Math.max(mResult.score ?? 0, partial);
      success = true;
      message = "Incident report submitted. +" + awardedScore + " pts.";
    }

    console.log("Awarded:", awardedScore, "success:", success);

    // === UPDATE mission_results (NO updated_at column!) ===
    const updateData: any = {
      attempts: newAttempts,
      hints_used: (mResult.hints_used ?? 0) + (hintUsed ? 1 : 0),
      score: awardedScore,
    };
    if (success) {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from("mission_results")
      .update(updateData)
      .eq("id", mResult.id);

    if (updateErr) {
      console.error("!!! mission_results update FAILED:", updateErr.message);
    } else {
      console.log("✓ mission_results updated");
    }

    // Recompute totals
    const { data: allResults } = await supabase
      .from("mission_results")
      .select("score, status")
      .eq("session_id", sessionId);

    const totalScore = (allResults ?? []).reduce((s, r) => s + (r.score ?? 0), 0);
    const completedCount = (allResults ?? []).filter((r) => r.status === "completed").length;

    console.log("Totals: score=", totalScore, "completed=", completedCount);

    // Update session
    const sessionUpdate: any = {
      final_score: totalScore,
      missions_completed: completedCount,
      hints_used: (session.hints_used ?? 0) + (hintUsed ? 1 : 0),
      current_mission: success && missionId < 4 ? missionId + 1 : session.current_mission,
    };
    if (success && missionId === 4) {
      const elapsed = (Date.now() - new Date(session.start_time).getTime()) / 1000;
      sessionUpdate.status = "completed";
      sessionUpdate.end_time = new Date().toISOString();
      sessionUpdate.completion_time_seconds = elapsed;
    }

    const { error: sessErr } = await supabase
      .from("game_sessions")
      .update(sessionUpdate)
      .eq("id", sessionId);

    if (sessErr) {
      console.error("!!! game_sessions update FAILED:", sessErr.message);
    } else {
      console.log("✓ game_sessions updated");
    }

    return NextResponse.json({
      success,
      awardedScore,
      totalScore,
      message,
      attempts: newAttempts,
      missionCompleted: success,
      sessionCompleted: success && missionId === 4,
    });
  } catch (e) {
    console.error("===== SUBMIT CRASH =====", e);
    return NextResponse.json({ error: "Internal error: " + String(e) }, { status: 500 });
  }
}
