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
import { Banner } from "@astryxdesign/core/Banner";
import { TextArea } from "@astryxdesign/core/TextArea";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
import { storeReview } from "@/lib/review-store";
import { getStudentId } from "@/lib/client-id";
import { recordLocalAttempt } from "@/lib/local-history";
import styles from "./page.module.css";

const RECOMMENDED_LIMIT_SECONDS = 90;
const BAR_COUNT = 10;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Web Speech API — бесплатная расшифровка прямо в браузере. Поддержана не везде
// (например, отсутствует в Safari на iOS) — там, где её нет, ученик печатает
// пересказ вручную вместо того, чтобы молча ничего не записывать.
function getSpeechRecognition(): { new (): SpeechRecognition } | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

type Phase = "idle" | "recording" | "reviewing" | "submitting";

export default function RetellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  // Последний ещё не подтверждённый ("interim") кусок речи — некоторые браузеры
  // никогда не помечают самую последнюю фразу как isFinal перед остановкой,
  // и она просто пропадает, если не подстраховаться этим буфером.
  const interimRef = useRef("");
  const wasStoppedByUserRef = useRef(false);
  const speechSupported = useRef(getSpeechRecognition() !== null).current;

  useEffect(() => {
    const stored = readParagraph(id);
    if (stored) setParagraph(stored);
  }, [id]);

  useEffect(() => {
    if (phase === "recording") {
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
  }, [phase]);

  // Единая точка фиксации текста: включает и подтверждённую (final) речь, и
  // ещё не подтверждённый последний кусок (interim) — некоторые браузеры так и
  // не помечают самую последнюю фразу как isFinal перед остановкой, и раньше
  // она просто пропадала бесследно.
  const commitTranscript = (message?: string) => {
    const combined = `${transcriptRef.current} ${interimRef.current}`.trim();
    setFinalText(combined);
    interimRef.current = "";
    if (message) setErrorMessage(message);
    setPhase("reviewing");
  };

  const startRecording = () => {
    transcriptRef.current = "";
    interimRef.current = "";
    wasStoppedByUserRef.current = false;
    setLiveText("");
    setElapsed(0);
    setErrorMessage(null);
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      // Защитный случай: сюда не должны попадать, обе кнопки, вызывающие
      // startRecording, скрыты когда !speechSupported — но на всякий случай
      // не показываем "Слушаю тебя…" без единого шанса что-то записать.
      setErrorMessage("Голосовой ввод не поддержан — впиши пересказ текстом");
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = "ru-RU";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalChunk += text;
          else interimChunk += text;
        }
        if (finalChunk) transcriptRef.current += ` ${finalChunk}`;
        interimRef.current = interimChunk;
        // Показываем и уже распознанное, и то, что распознаётся прямо сейчас —
        // так ученик сразу видит, слушает его приложение или нет.
        setLiveText(`${transcriptRef.current} ${interimChunk}`.trim());
      };
      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        console.error("retell: SpeechRecognition ошибка", e.error);
        // "no-speech"/"aborted" — тишина между фразами или сам перезапуск сессии
        // (см. onend ниже), не повод останавливать запись. Всё остальное (нет
        // доступа к микрофону и т.д.) — честно останавливаем.
        if (e.error === "no-speech" || e.error === "aborted") return;
        recognitionRef.current = null;
        commitTranscript(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "Нет доступа к микрофону — разреши его в браузере или впиши пересказ текстом"
            : "Распознавание речи не сработало — впиши пересказ текстом",
        );
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          // Браузер сам обрывает сессию распознавания через какое-то время (это
          // штатное поведение Web Speech API, не ошибка, происходит примерно
          // раз в минуту) — ученик ещё не нажал "Остановить", значит нужно сразу
          // перезапустить, иначе вторая половина пересказа молча пропадает.
          try {
            recognition.start();
          } catch (err) {
            console.error("retell: не удалось перезапустить распознавание", err);
            commitTranscript();
          }
          return;
        }
        if (wasStoppedByUserRef.current) {
          // Настоящая остановка по кнопке — по спецификации Web Speech API все
          // финальные результаты уже доставлены к этому моменту (в отличие от
          // немедленного чтения transcriptRef прямо в обработчике клика, которое
          // могло проскочить последний ещё не подтверждённый кусок речи).
          wasStoppedByUserRef.current = false;
          commitTranscript();
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("retell: не удалось запустить распознавание", err);
      setErrorMessage("Не удалось включить микрофон — впиши пересказ текстом");
      setPhase("reviewing");
      return;
    }
    setPhase("recording");
  };

  const stopRecording = () => {
    if (!recognitionRef.current) {
      // Уже остановлено (например, только что сработала ошибка) — ждать нечего.
      commitTranscript();
      return;
    }
    wasStoppedByUserRef.current = true;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    // Текст фиксируется в onend (см. выше), а не здесь — .stop() завершает
    // сессию асинхронно, и последний ещё не подтверждённый кусок речи мог
    // прийти уже ПОСЛЕ немедленного чтения transcriptRef в этом обработчике.
    // Подстраховка на случай, если onend по какой-то причине вообще не придёт —
    // не оставляем экран висеть на "Слушаю тебя…" навсегда.
    setTimeout(() => {
      if (wasStoppedByUserRef.current) {
        wasStoppedByUserRef.current = false;
        commitTranscript();
      }
    }, 1500);
  };

  const submit = async () => {
    const transcript = finalText.trim();
    if (!transcript) {
      setErrorMessage("Пересказ пустой — впиши хотя бы пару предложений, что запомнил");
      return;
    }
    setPhase("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyPoints: paragraph.keyPoints,
          transcript,
          subject: paragraph.subject,
          studentId: getStudentId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      storeReview(paragraph.id, data.coveredIndices, data.source);
      // Пишем и локально: пока Neon не подключён, /api/verify честно ничего не
      // сохраняет на сервере — без этого история осталась бы вечно пустой.
      recordLocalAttempt({
        subject: paragraph.subject || "Без темы",
        covered_count: data.coveredIndices.length,
        total_count: paragraph.keyPoints.length,
      });
      router.push(`/review/${paragraph.id}`);
    } catch (err) {
      // Честно показываем ошибку прямо здесь и даём попробовать снова — вместо
      // того чтобы молча уйти на /review с придуманным результатом.
      console.error("retell: /api/verify недоступен", err);
      setErrorMessage("Не получилось проверить пересказ — проверь интернет и попробуй ещё раз");
      setPhase("reviewing");
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

      {!speechSupported && phase === "idle" && (
        <VStack padding={5}>
          <Banner
            status="info"
            title="Голосовой ввод не поддержан в этом браузере"
            description="Это нормально для некоторых мобильных браузеров (например, Safari на iPhone) — впиши пересказ текстом, проверка сработает точно так же."
          />
        </VStack>
      )}

      {phase === "idle" && !speechSupported && (
        <VStack gap={4} padding={5}>
          <TextArea
            label="Твой пересказ"
            value={finalText}
            onChange={setFinalText}
            placeholder="Расскажи своими словами, что запомнил из параграфа…"
            rows={6}
          />
          <Button label="Готово →" variant="primary" width="100%" onClick={() => setPhase("reviewing")} />
        </VStack>
      )}

      {phase === "idle" && speechSupported && (
        <Center axis="both" minHeight="70dvh">
          <VStack gap={6} hAlign="center" padding={5}>
            <VStack gap={1} hAlign="center">
              <Heading level={1} justify="center">
                Готов пересказать?
              </Heading>
              <Text type="body" color="secondary" justify="center">
                Расскажи, что запомнил, своими словами — 60–90 секунд достаточно
              </Text>
            </VStack>
            <div className={styles.recordButtonWrap}>
              <IconButton
                label="Начать запись"
                icon={<Icon icon="microphone" size="lg" />}
                variant="primary"
                elevation="high"
                size="lg"
                onClick={startRecording}
              />
            </div>
          </VStack>
        </Center>
      )}

      {phase === "recording" && (
        <Center axis="both" minHeight="70dvh">
          <VStack gap={5} hAlign="center" padding={5}>
            <Heading level={1} justify="center">
              Слушаю тебя…
            </Heading>

            <div className={styles.waveform} data-active="true">
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <span key={i} className={styles.bar} style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </div>

            <Text type="display-2" hasTabularNumbers color="accent">
              {formatTime(elapsed)}
            </Text>

            {/* Живая расшифровка — видно прямо сейчас, что распознаёт приложение,
                а не только после отправки на проверку. */}
            <div className={styles.liveTranscript}>
              <Text type="body" color={liveText ? "primary" : "secondary"} justify="center">
                {liveText || "Говори — здесь появится то, что услышит приложение…"}
              </Text>
            </div>

            <IconButton
              label="Остановить запись"
              icon={<Icon icon="stop" size="lg" />}
              variant="primary"
              elevation="high"
              size="lg"
              onClick={stopRecording}
            />
          </VStack>
        </Center>
      )}

      {(phase === "reviewing" || phase === "submitting") && (
        <VStack gap={4} padding={5}>
          <Heading level={1}>Проверь, что расслышали</Heading>
          <Text type="supporting" color="secondary">
            Можешь поправить текст, если приложение что-то не расслышало — проверяться будет
            именно то, что здесь написано
          </Text>
          <TextArea
            label="Твой пересказ"
            isLabelHidden
            value={finalText}
            onChange={setFinalText}
            placeholder="Расскажи своими словами, что запомнил из параграфа…"
            rows={6}
            isDisabled={phase === "submitting"}
          />
          {errorMessage && <Banner status="error" title="Не получилось" description={errorMessage} />}
          <VStack gap={2}>
            <Button
              label={phase === "submitting" ? "Проверяю…" : "Отправить на проверку →"}
              variant="primary"
              width="100%"
              isLoading={phase === "submitting"}
              onClick={submit}
            />
            {speechSupported && (
              <Button
                label="Записать заново"
                variant="ghost"
                width="100%"
                isDisabled={phase === "submitting"}
                onClick={startRecording}
              />
            )}
          </VStack>
        </VStack>
      )}
    </div>
  );
}
