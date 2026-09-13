"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Banner } from "@astryxdesign/core/Banner";
import { TextInput } from "@astryxdesign/core/TextInput";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
import { getRussianVoice } from "@/lib/tts";
import { TermCard } from "@/components/ui/TermCard";
import { checkAskQuota, recordAsk, checkRewordQuota, recordReword, isPro, type QuotaCheck } from "@/lib/pro";
import { ProPaywallDialog } from "@/components/ui/ProPaywallDialog";
import styles from "./page.module.css";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withHighlightedTerms(text: string, terms: string[]) {
  const cleanTerms = terms.filter((t) => t.trim().length > 0);
  if (cleanTerms.length === 0) return [text];
  // Термины приходят в начальной форме («фотосинтез»), а в тексте могут стоять
  // в падеже («фотосинтезом») — захватываем и русское окончание слова, иначе
  // подсветка обрывается на середине слова.
  const escaped = cleanTerms.map(escapeRegExp).join("|");
  const pattern = new RegExp(`((?:${escaped})[а-яёА-ЯЁ]*)`, "gi");
  const isMatch = new RegExp(`^(?:${escaped})[а-яёА-ЯЁ]*$`, "i");
  return text.split(pattern).map((chunk, i) =>
    isMatch.test(chunk) ? (
      <Text key={i} type="inherit" color="accent" weight="bold" as="span">
        {chunk}
      </Text>
    ) : (
      <Text key={i} type="inherit" as="span">
        {chunk}
      </Text>
    ),
  );
}

type QaEntry = { question: string; answer: string };

export default function ExplainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [analogyIndex, setAnalogyIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QaEntry[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [explanationBlocks, setExplanationBlocks] = useState(paragraph.explanationBlocks);
  const [isRewording, setIsRewording] = useState(false);
  const [rewordError, setRewordError] = useState<string | null>(null);
  // Квоты и Про-статус читаются из localStorage — на сервере его нет, поэтому
  // на сервере и при первом клиентском рендере всегда безопасное значение "по
  // умолчанию" (как будто ничего ещё не потрачено), а настоящее — только после
  // маунта. Иначе сервер и клиент могли бы отрисовать разные ветки и React
  // бросил бы ошибку гидратации (та же история, что и с speechSupported).
  const [proActive, setProActive] = useState(false);
  const [askQuota, setAskQuota] = useState<QuotaCheck>({ allowed: true, remaining: 3 });
  const [rewordQuota, setRewordQuota] = useState<QuotaCheck>({ allowed: true, remaining: 1 });
  const [paywallReason, setPaywallReason] = useState<string | null>(null);

  const refreshQuotas = (paragraphId: string) => {
    setProActive(isPro());
    setAskQuota(checkAskQuota(paragraphId));
    setRewordQuota(checkRewordQuota(paragraphId));
  };

  useEffect(() => {
    refreshQuotas(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const stored = readParagraph(id);
    if (stored) {
      setParagraph(stored);
      setExplanationBlocks(stored.explanationBlocks);
    }
  }, [id]);

  const fullText = explanationBlocks.join(" ");

  const rewordExplanation = async () => {
    if (!rewordQuota.allowed) {
      // Кнопка кликабельна нарочно — заблокированный disabled-элемент никто
      // не замечает (см. чат: "даже не узнал про платную"). Клик на упоре в
      // лимит и есть момент, чтобы показать, что именно скрыто за Про.
      setPaywallReason("Один раз объяснить иначе — бесплатно. Дальше — только в Про.");
      return;
    }
    setIsRewording(true);
    setRewordError(null);
    try {
      const res = await fetch("/api/reword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanationText: fullText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setExplanationBlocks(data.explanationBlocks);
      recordReword(paragraph.id);
      refreshQuotas(paragraph.id);
    } catch (err) {
      console.error("explain: /api/reword недоступен", err);
      setRewordError("Не получилось объяснить иначе — попробуй ещё раз");
    } finally {
      setIsRewording(false);
    }
  };

  const speak = async () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "ru-RU";
    utterance.rate = 0.95;
    const voice = await getRussianVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const askQuestion = async () => {
    const q = question.trim();
    if (!q) return;
    if (!askQuota.allowed) {
      setPaywallReason("Бесплатные вопросы на сегодня закончились. Без дневного лимита — в Про.");
      return;
    }
    setIsAsking(true);
    setAskError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanationText: fullText, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setQaHistory((prev) => [...prev, { question: q, answer: data.answer }]);
      setQuestion("");
      recordAsk(paragraph.id);
      refreshQuotas(paragraph.id);
    } catch (err) {
      console.error("explain: /api/ask недоступен", err);
      setAskError("Не получилось ответить — попробуй ещё раз");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" aria-label="Назад" className={styles.backLink}>
          <IconButton label="Назад" icon={<Icon icon="chevronLeft" />} variant="ghost" />
        </Link>
        <Text type="body" weight="bold">
          {paragraph.subject || "Параграф"}
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.shell}>
        <VStack gap={6} padding={5}>
          {paragraph.source === "offline-example" && (
            <Banner
              status="warning"
              title="Не получилось прочитать твоё фото"
              description="Показываем пример вместо разбора — это не твой параграф. Переснимай при хорошем освещении, без бликов, и попробуй ещё раз."
              endContent={
                <Link href="/capture">
                  <Button label="Переснять" variant="secondary" size="sm" />
                </Link>
              }
            />
          )}
          {paragraph.source === "nim" &&
            paragraph.pagesTotal !== undefined &&
            paragraph.pagesRead !== undefined &&
            paragraph.pagesRead < paragraph.pagesTotal && (
              <Banner
                status="info"
                title={`Прочитано ${paragraph.pagesRead} из ${paragraph.pagesTotal} фото`}
                description="Часть страниц не удалось разобрать (сеть или качество снимка) — разбор ниже может охватывать не весь материал. Можешь переснять недостающие страницы отдельно."
                endContent={
                  <Link href="/capture">
                    <Button label="Досъёмка" variant="secondary" size="sm" />
                  </Link>
                }
              />
            )}
          <VStack gap={3}>
            <Heading level={1}>Вот что здесь написано</Heading>
            <Card padding={5}>
              <VStack gap={4}>
                {explanationBlocks.map((block, i) => (
                  <HStack key={i} gap={2} vAlign="start">
                    <Icon icon="info" size="sm" color="secondary" />
                    <Text type="large">{withHighlightedTerms(block, paragraph.keyTerms)}</Text>
                  </HStack>
                ))}
              </VStack>
            </Card>
            <HStack gap={2} vAlign="center">
              <Button
                label={isSpeaking ? "Остановить" : "Прочитать вслух"}
                variant="secondary"
                icon={<Icon icon={isSpeaking ? "stop" : "microphone"} />}
                onClick={speak}
              />
              <Button
                label={isRewording ? "Объясняю иначе…" : "Объясни иначе"}
                variant={rewordQuota.allowed ? "ghost" : "secondary"}
                isLoading={isRewording}
                icon={rewordQuota.allowed ? undefined : <Icon icon="info" size="sm" />}
                onClick={rewordExplanation}
              />
              {!proActive && (
                <Text type="supporting" size="xsm" color={rewordQuota.allowed ? "secondary" : "accent"}>
                  {rewordQuota.allowed ? "1 бесплатно" : "нужен Про"}
                </Text>
              )}
            </HStack>
            {rewordError && <Banner status="error" title="Не получилось" description={rewordError} />}
          </VStack>

          {paragraph.termCards && paragraph.termCards.length > 0 && (
            <VStack gap={3}>
              <Heading level={2}>Термины</Heading>
              <Text type="supporting" color="secondary">
                Нажми на карточку, чтобы узнать, что значит термин
              </Text>
              <div className={styles.termGrid}>
                {paragraph.termCards.map((card) => (
                  <TermCard key={card.term} term={card.term} definition={card.definition} example={card.example} />
                ))}
              </div>
            </VStack>
          )}

          <VStack gap={3}>
            <Heading level={2}>Объясни как другу</Heading>
            <Card padding={5} elevation="low">
              <VStack gap={3}>
                <Text type="body">{paragraph.analogies[analogyIndex]}</Text>
                <Button
                  label="Показать другой пример"
                  variant="ghost"
                  onClick={() => setAnalogyIndex((i) => (i + 1) % paragraph.analogies.length)}
                />
              </VStack>
            </Card>
          </VStack>

          <VStack gap={3}>
            <HStack gap={2} vAlign="center">
              <Heading level={2}>Есть вопрос?</Heading>
              {!proActive && (
                <Text type="label" color={askQuota.remaining === 0 ? "accent" : "secondary"} hasTabularNumbers>
                  {askQuota.remaining}/3 бесплатно
                </Text>
              )}
            </HStack>
            <Text type="supporting" color="secondary">
              Спроси что угодно про этот параграф — объясним ещё раз по-другому
            </Text>
            {qaHistory.length > 0 && (
              <VStack gap={3}>
                {qaHistory.map((qa, i) => (
                  <Card key={i} padding={4} elevation="low">
                    <VStack gap={2}>
                      <Text type="body" weight="bold">
                        {qa.question}
                      </Text>
                      <Text type="body" color="secondary">
                        {qa.answer}
                      </Text>
                    </VStack>
                  </Card>
                ))}
              </VStack>
            )}
            {askError && <Banner status="error" title="Не получилось" description={askError} />}
            <HStack gap={2}>
              <div className={styles.askInput}>
                <TextInput
                  label="Вопрос"
                  isLabelHidden
                  value={question}
                  onChange={setQuestion}
                  placeholder="Например: а зачем это вообще нужно?"
                  isDisabled={isAsking}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") askQuestion();
                  }}
                />
              </div>
              <Button label="Спросить" variant="primary" isLoading={isAsking} onClick={askQuestion} />
            </HStack>
          </VStack>

          <ProPaywallDialog
            isOpen={paywallReason !== null}
            onOpenChange={(open) => !open && setPaywallReason(null)}
            reason={paywallReason ?? ""}
            onActivated={() => refreshQuotas(paragraph.id)}
          />

          <Button
            label="Готов пересказать →"
            variant="primary"
            width="100%"
            onClick={() => router.push(`/retell/${paragraph.id}`)}
          />
        </VStack>
      </div>
    </div>
  );
}
