"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
import { storeReview } from "@/lib/review-store";
import { getStudentId } from "@/lib/client-id";
import styles from "./page.module.css";

const RECOMMENDED_LIMIT_SECONDS = 90;
const BAR_COUNT = 10;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Web Speech API — бесплатная расшифровка прямо в браузере (см. 02-ARCHITECTURE.md).
// Поддержана не везде (в основном Chrome/Edge) — там, где её нет, запись всё равно
// работает как таймер + waveform, просто transcript останется пустым и проверка
// на бэкенде честно уйдёт в антислоп-фоллбэк вместо падения.
function getSpeechRecognition(): { new (): SpeechRecognition } | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export default function RetellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const stored = readParagraph(id);
    if (stored) setParagraph(stored);
  }, [id]);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s + 1 >= RECOMMENDED_LIMIT_SECONDS) {
            stopRecording();
            return RECOMMENDED_LIMIT_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const hasRecording = !isRecording && elapsed > 0;

  const startRecording = () => {
    transcriptRef.current = "";
    setElapsed(0);
    const Recognition = getSpeechRecognition();
    if (Recognition) {
      const recognition = new Recognition();
      recognition.lang = "ru-RU";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        }
        if (finalText) transcriptRef.current += ` ${finalText}`;
      };
      recognition.onerror = (e: Event) => console.error("retell: SpeechRecognition ошибка", e);
      recognition.start();
      recognitionRef.current = recognition;
    }
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (hasRecording) {
      startRecording();
    } else if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyPoints: paragraph.keyPoints,
          transcript: transcriptRef.current.trim(),
          subject: paragraph.subject,
          studentId: getStudentId(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { coveredIndices } = await res.json();
      storeReview(paragraph.id, coveredIndices);
    } catch (err) {
      // Проверка недоступна — на /review сработает встроенный демо-фоллбэк,
      // экран всё равно не остаётся пустым.
      console.error("retell: /api/verify недоступен", err);
    } finally {
      router.push(`/review/${paragraph.id}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href={`/explain/${paragraph.id}`} aria-label="Назад" className={styles.backLink}>
          <IconButton label="Назад" icon={<Icon icon="chevronLeft" />} variant="ghost" />
        </Link>
        <Text type="body" weight="bold">
          Перескажи своими словами
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      <Center axis="both" minHeight="75dvh">
        <VStack gap={6} hAlign="center" padding={5}>
          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              {hasRecording ? "Запись готова" : isRecording ? "Слушаю тебя…" : "Готов пересказать?"}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              {hasRecording
                ? "Можешь переслушать себя мысленно и отправить на проверку"
                : "Расскажи, что запомнил, своими словами — 60–90 секунд достаточно"}
            </Text>
          </VStack>

          <div className={styles.waveform} data-active={isRecording}>
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <span key={i} className={styles.bar} style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>

          <Text type="display-2" hasTabularNumbers color={isRecording ? "accent" : "secondary"}>
            {formatTime(elapsed)}
          </Text>

          <div className={styles.recordButtonWrap}>
            <IconButton
              label={isRecording ? "Остановить запись" : hasRecording ? "Записать заново" : "Начать запись"}
              icon={<Icon icon={isRecording ? "stop" : "microphone"} size="lg" />}
              variant="primary"
              elevation="high"
              size="lg"
              onClick={toggleRecording}
            />
          </div>

          {hasRecording && (
            <Button
              label={isSubmitting ? "Проверяю…" : "Готово →"}
              variant="primary"
              width="240px"
              isLoading={isSubmitting}
              onClick={submit}
            />
          )}
        </VStack>
      </Center>
    </div>
  );
}
