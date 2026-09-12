"use client";

import { useEffect, useState } from "react";
import { getStudentId } from "@/lib/client-id";
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

export function useStudentSummary(): StudentSummaryState {
  const [state, setState] = useState<StudentSummaryState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?studentId=${encodeURIComponent(getStudentId())}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState({
          isLoading: false,
          isLive: Boolean(data.isLive),
          entries: data.entries ?? [],
          totalParagraphs: data.totalParagraphs ?? 0,
          streakDays: data.streakDays ?? 0,
        });
      })
      .catch((err) => {
        console.error("useStudentSummary: /api/history недоступен", err);
        if (!cancelled) setState((s) => ({ ...s, isLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
