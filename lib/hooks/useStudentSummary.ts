"use client";

import { useEffect, useState } from "react";
import { getStudentId } from "@/lib/client-id";
import { getLocalHistory, getLocalTotalParagraphs, computeLocalStreakDays } from "@/lib/local-history";
import type { AttemptRow } from "@/lib/db";

export type StudentSummaryState = {
  isLoading: boolean;
  isLive: boolean;
  entries: AttemptRow[];
  totalParagraphs: number;
  streakDays: number;
};

const INITIAL: StudentSummaryState = {
  isLoading: true,
  isLive: false,
  entries: [],
  totalParagraphs: 0,
  streakDays: 0,
};

function readLocal(): StudentSummaryState {
  return {
    isLoading: false,
    isLive: false,
    entries: getLocalHistory() as unknown as AttemptRow[],
    totalParagraphs: getLocalTotalParagraphs(),
    streakDays: computeLocalStreakDays(),
  };
}

export function useStudentSummary(): StudentSummaryState {
  const [state, setState] = useState<StudentSummaryState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?studentId=${encodeURIComponent(getStudentId())}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.isLive) {
          setState({
            isLoading: false,
            isLive: true,
            entries: data.entries ?? [],
            totalParagraphs: data.totalParagraphs ?? 0,
            streakDays: data.streakDays ?? 0,
          });
        } else {
          // База (Neon) не подключена — честный ноль с сервера бесполезен, если
          // попытки реально записывались локально (см. lib/local-history.ts).
          setState(readLocal());
        }
      })
      .catch((err) => {
        console.error("useStudentSummary: /api/history недоступен, использую локальную историю", err);
        if (!cancelled) setState(readLocal());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
