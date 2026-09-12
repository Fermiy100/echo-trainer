"use client";

import { use, useEffect, useState } from "react";
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
import { buildQuizQuestions, type QuizQuestion } from "@/lib/quiz";
import { playCorrectSound, playIncorrectSound } from "@/lib/sound";
import styles from "./page.module.css";

type AnswerState = "idle" | "correct" | "incorrect";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [score, setScore] = useState(0);

  useEffect(() => {
    const stored = readParagraph(id);
    const p = stored ?? paragraph;
    if (stored) setParagraph(stored);
    setQuestions(buildQuizQuestions(p.termCards ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const current = questions[index];
  const isDone = questions.length > 0 && index >= questions.length;

  const restart = () => {
    setQuestions(buildQuizQuestions(paragraph.termCards ?? []));
    setIndex(0);
    setSelected(null);
    setAnswerState("idle");
    setScore(0);
  };

  const choose = (option: string) => {
    if (answerState !== "idle" || !current) return;
    setSelected(option);
    const correct = option === current.correctAnswer;
    setAnswerState(correct ? "correct" : "incorrect");
    if (correct) {
      playCorrectSound();
      setScore((s) => s + 1);
    } else {
      playIncorrectSound();
    }
    setTimeout(() => {
      setSelected(null);
      setAnswerState("idle");
      setIndex((i) => i + 1);
    }, 1100);
  };

  if (questions.length === 0) {
    return (
      <div className={styles.page}>
        <Center axis="both" minHeight="100dvh">
          <VStack gap={4} hAlign="center" padding={5}>
            <Heading level={1} justify="center">
              Пока нечего закрепить
            </Heading>
            <Text type="body" color="secondary" justify="center">
              Для квиза нужно хотя бы два термина в разборе параграфа
            </Text>
            <Link href={`/explain/${id}`}>
              <Button label="Назад к параграфу" variant="primary" />
            </Link>
          </VStack>
        </Center>
      </div>
    );
  }

  if (isDone) {
    const total = questions.length;
    const ratio = score / total;
    const heading = ratio === 1 ? "Идеально!" : ratio >= 0.7 ? "Хороший результат!" : "Есть куда расти";
    return (
      <div className={styles.page}>
        <Center axis="both" minHeight="100dvh">
          <VStack gap={5} hAlign="center" padding={5}>
            <Text type="display-1" hasTabularNumbers color="accent">
              {score}/{total}
            </Text>
            <Heading level={1} justify="center">
              {heading}
            </Heading>
            <VStack gap={2} width="240px">
              <Button label="Пройти ещё раз" variant="primary" width="100%" onClick={restart} />
              <Link href={`/explain/${id}`}>
                <Button label="Назад к параграфу" variant="ghost" width="100%" />
              </Link>
            </VStack>
          </VStack>
        </Center>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href={`/explain/${id}`} aria-label="Закрыть квиз" className={styles.backLink}>
          <IconButton label="Закрыть" icon={<Icon icon="close" />} variant="ghost" />
        </Link>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <Text type="label" hasTabularNumbers>
          {index + 1}/{questions.length}
        </Text>
      </div>

      <Center axis="both" minHeight="80dvh">
        <VStack gap={6} hAlign="center" padding={5} width="100%">
          <VStack gap={1} hAlign="center">
            <Text type="supporting" color="secondary" justify="center">
              Что означает термин?
            </Text>
            <Heading level={1} justify="center">
              {current.term}
            </Heading>
          </VStack>

          <VStack gap={3} width="100%">
            {current.options.map((option) => {
              const isSelected = selected === option;
              const isCorrectOption = answerState !== "idle" && option === current.correctAnswer;
              const isWrongSelected = isSelected && answerState === "incorrect";
              return (
                <button
                  key={option}
                  type="button"
                  className={styles.option}
                  data-state={isCorrectOption ? "correct" : isWrongSelected ? "incorrect" : "idle"}
                  onClick={() => choose(option)}
                  disabled={answerState !== "idle"}
                >
                  <Text type="body">{option}</Text>
                </button>
              );
            })}
          </VStack>
        </VStack>
      </Center>
    </div>
  );
}
