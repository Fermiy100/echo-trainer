"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
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

export default function ExplainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [analogyIndex, setAnalogyIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const stored = readParagraph(id);
    if (stored) setParagraph(stored);
  }, [id]);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(paragraph.simplifiedText);
    utterance.lang = "ru-RU";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
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
          <VStack gap={3}>
            <Heading level={1}>Вот что здесь написано</Heading>
            <Card padding={5}>
              <Text type="large">{withHighlightedTerms(paragraph.simplifiedText, paragraph.keyTerms)}</Text>
            </Card>
            <Button
              label={isSpeaking ? "Остановить" : "Прочитать вслух"}
              variant="secondary"
              icon={<Icon icon={isSpeaking ? "stop" : "microphone"} />}
              onClick={speak}
            />
          </VStack>

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
