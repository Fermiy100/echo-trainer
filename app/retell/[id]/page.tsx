"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
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
import { HintChip } from "@/components/ui/HintChip";
import styles from "./page.module.css";

const RECOMMENDED_LIMIT_SECONDS = 90;
const BAR_COUNT = 10;

// Три режима пересказа — одна и та же механика записи, разный уровень подсказки:
// - guided (по умолчанию, первая попытка со страницы объяснения) — все опорные
//   тезисы видны целиком.
// - recall (после неудачного пересказа, только пропущенные пункты) — подсказки
//   скрыты, можно приоткрывать по одному слову за тап ("угасающая" подсказка).
// - battle ("Тренировка у доски") — подсказок нет вообще, явно отдельный режим.
type RetellMode = "guided" | "recall" | "battle";

function parseMode(value: string | null): RetellMode {
  return value === "recall" || value === "battle" ? value : "guided";
}

function parseFocusIndices(value: string | null, total: number): number[] {
  if (!value) return Array.from({ length: total }, (_, i) => i);
  const parsed = value
    .split(",")
    .map((v) => Number.parseInt(v, 10))
    .filter((i) => Number.isInteger(i) && i >= 0 && i < total);
  return parsed.length > 0 ? parsed : Array.from({ length: total }, (_, i) => i);
}

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

// Groq Whisper — бесплатный резервный сервис расшифровки (см. app/api/transcribe).
// Единственный путь на Safari/iOS, где нет Web Speech API вообще, и запасной
// вариант там, где он есть, но распознал плохо.
async function transcribeWithGroq(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "retell.webm");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || typeof data?.text !== "string") {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data.text as string;
}

type Phase = "idle" | "recording" | "transcribing" | "reviewing" | "submitting";

export default function RetellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("mode"));
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
  // На сервере window нет — SSR всегда рендерит false. Если вычислить реальное
  // значение сразу на клиенте, оно может отличаться от того, что уже отрисовал
  // сервер (Chrome/Edge поддерживают, Safari — нет), и React бросает ошибку
  // гидратации. Поэтому сначала везде false, а настоящее значение — уже после
  // маунта, когда сервер ни при чём.
  const [speechSupported, setSpeechSupported] = useState(false);
  // Резервная запись звука (для Groq Whisper) — идёт параллельно с Web Speech,
  // где он есть, и заменяет его целиком там, где его нет (Safari/iOS).
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const focusIndices = parseFocusIndices(searchParams.get("focus"), paragraph.keyPoints.length);
  const hintPoints = focusIndices.map((i) => paragraph.keyPoints[i]).filter(Boolean);
  const modeCopy: { heading: string; subtitle: string } = {
    guided: {
      heading: "Готов пересказать?",
      subtitle: "Расскажи, что запомнил, своими словами — можешь опираться на подсказки ниже",
    },
    recall: {
      heading: "Закрой пробелы",
      subtitle: "В прошлый раз это осталось за кадром — вспомни, подглядывая по словечку, если совсем забыл",
    },
    battle: {
      heading: "Отвечаешь у доски",
      subtitle: "Без подсказок — как по-настоящему",
    },
  }[mode];

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
  }, []);

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

  // Резервная запись звука для Groq — независимо от Web Speech API. Если
  // микрофон недоступен по этой линии, просто нет резерва — не мешаем
  // основному сценарию сообщением об ошибке.
  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("retell: резервная запись звука недоступна", err);
      mediaRecorderRef.current = null;
    }
  };

  const stopAudioCapture = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
            : null;
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        resolve(blob);
      };
      recorder.stop();
    });
  };

  // Safari на iPhone и другие браузеры без Web Speech API идут этим путём
  // целиком: расшифровка приходит из Groq уже после остановки записи, а не
  // по ходу — здесь просто нечего показывать вживую.
  const finishWithoutSpeechRecognition = async () => {
    setPhase("transcribing");
    const blob = await stopAudioCapture();
    setAudioBlob(blob);
    if (!blob) {
      setErrorMessage("Не удалось записать звук — впиши пересказ текстом");
      setPhase("reviewing");
      return;
    }
    try {
      const text = await transcribeWithGroq(blob);
      setFinalText(text);
    } catch (err) {
      console.error("retell: резервная расшифровка недоступна", err);
      setErrorMessage("Резервная расшифровка сейчас недоступна — впиши пересказ текстом");
    }
    setPhase("reviewing");
  };

  const startRecording = () => {
    transcriptRef.current = "";
    interimRef.current = "";
    wasStoppedByUserRef.current = false;
    setLiveText("");
    setElapsed(0);
    setErrorMessage(null);
    setAudioBlob(null);
    // Резерв стартует всегда, параллельно с Web Speech (если он есть) — не
    // блокирует и не мешает основному сценарию, если недоступен.
    startAudioCapture();
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      // Нет Web Speech API вообще (Safari/iOS) — расшифруем целиком через
      // резервную запись после остановки, см. finishWithoutSpeechRecognition.
      setPhase("recording");
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
      // Либо Web Speech вообще не поддержан (см. startRecording), либо уже
      // остановлено ошибкой ранее — либо расшифровываем резервную запись,
      // либо ждать больше нечего.
      finishWithoutSpeechRecognition();
      return;
    }
    wasStoppedByUserRef.current = true;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    // Резервная запись — на будущее (кнопка "расшифровать точнее" на экране
    // проверки), не блокирует и не участвует в основном сценарии ниже.
    stopAudioCapture().then(setAudioBlob);
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
          {mode === "battle" ? "Тренировка у доски" : mode === "recall" ? "Закрой пробелы" : "Перескажи своими словами"}
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      {!speechSupported && phase === "idle" && (
        <VStack padding={5}>
          <Banner
            status="info"
            title="Мгновенная расшифровка не поддержана в этом браузере"
            description="Это нормально для некоторых мобильных браузеров (например, Safari на iPhone) — запись всё равно работает, просто текст появится сразу после того, как остановишь её, через отдельный резервный сервис, а не по ходу."
          />
        </VStack>
      )}

      {phase === "idle" && (
        <VStack gap={6} padding={5} hAlign="center">
          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              {modeCopy.heading}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              {modeCopy.subtitle}
            </Text>
          </VStack>
          {mode !== "battle" && hintPoints.length > 0 && (
            <VStack gap={2} width="100%">
              {hintPoints.map((point, i) => (
                <HintChip key={i} text={point} peekable={mode === "recall"} />
              ))}
            </VStack>
          )}
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
          {!speechSupported && (
            <Button
              label="Напечатать текст самому"
              variant="ghost"
              onClick={() => setPhase("reviewing")}
            />
          )}
        </VStack>
      )}

      {phase === "recording" && (
        <VStack gap={5} hAlign="center" padding={5}>
          <Heading level={1} justify="center">
            {mode === "battle" ? "Отвечаешь у доски…" : "Слушаю тебя…"}
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
              а не только после отправки на проверку. Там, где Web Speech API
              нет вообще (Safari/iOS), показывать нечего — текст появится
              только после остановки, через резервный сервис. */}
          <div className={styles.liveTranscript}>
            <Text type="body" color={liveText ? "primary" : "secondary"} justify="center">
              {speechSupported
                ? liveText || "Говори — здесь появится то, что услышит приложение…"
                : "Идёт запись — текст появится сразу после остановки"}
            </Text>
          </div>

          {/* Раньше подсказки показывались только на экране "Готов пересказать?"
              и пропадали, как только начиналась запись — то есть именно тогда,
              когда они нужнее всего. Теперь они остаются на экране и во время
              самой записи (кроме боевого режима, где их нет намеренно). */}
          {mode !== "battle" && hintPoints.length > 0 && (
            <VStack gap={2} width="100%">
              {hintPoints.map((point, i) => (
                <HintChip key={i} text={point} peekable={mode === "recall"} />
              ))}
            </VStack>
          )}

          <IconButton
            label="Остановить запись"
            icon={<Icon icon="stop" size="lg" />}
            variant="primary"
            elevation="high"
            size="lg"
            onClick={stopRecording}
          />
        </VStack>
      )}

      {phase === "transcribing" && (
        <VStack gap={5} hAlign="center" padding={5}>
          <Heading level={1} justify="center">
            Расшифровываю…
          </Heading>
          <Text type="body" color="secondary" justify="center">
            Секунду — резервный сервис слушает запись
          </Text>
        </VStack>
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
            {/* Резервная расшифровка звука, которая уже записана в фоне —
                полезна и когда Web Speech распознал плохо, и как ретрай, если
                первая попытка (или сама Groq) не сработала. */}
            {audioBlob && (
              <Button
                label={transcribing ? "Расшифровываю…" : "Расшифровать точнее (резерв)"}
                variant="ghost"
                width="100%"
                isLoading={transcribing}
                isDisabled={phase === "submitting" || transcribing}
                onClick={async () => {
                  setTranscribing(true);
                  setErrorMessage(null);
                  try {
                    const text = await transcribeWithGroq(audioBlob);
                    setFinalText(text);
                  } catch (err) {
                    console.error("retell: резервная расшифровка недоступна", err);
                    setErrorMessage("Резервная расшифровка сейчас недоступна — попробуй позже");
                  } finally {
                    setTranscribing(false);
                  }
                }}
              />
            )}
            <Button
              label="Записать заново"
              variant="ghost"
              width="100%"
              isDisabled={phase === "submitting"}
              onClick={startRecording}
            />
          </VStack>
        </VStack>
      )}
    </div>
  );
}
