"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Center } from "@astryxdesign/core/Center";
import { AppFrame } from "@/components/shell/AppFrame";
import { CaptureIllustration, StreakFlame, PagesStack } from "@/components/ui/illustrations";
import { useStudentSummary } from "@/lib/hooks/useStudentSummary";
import { hasOnboarded } from "@/lib/onboarding-status";
import { isPro } from "@/lib/pro";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { isLoading, totalParagraphs, streakDays } = useStudentSummary();
  const [proActive, setProActive] = useState(false);

  useEffect(() => {
    if (!hasOnboarded()) router.replace("/onboarding");
  }, [router]);

  useEffect(() => {
    setProActive(isPro());
  }, []);

  return (
    <AppFrame active="home">
      <VStack gap={6} padding={5}>
        <VStack gap={0.5}>
          <Text type="supporting">Привет!</Text>
          <Heading level={1} type="display-2">
            Готов разобрать параграф?
          </Heading>
        </VStack>

        <Link href="/capture" className={styles.captureLink}>
          <Card padding={6} elevation="low">
            <div className={styles.captureGrid}>
              <div className={styles.captureIllustrationArea}>
                <Center>
                  <CaptureIllustration className={styles.captureIllustration} />
                </Center>
              </div>
              <div className={styles.captureText}>
                <VStack gap={1.5} hAlign="center">
                  <Heading level={2} justify="center">
                    Сфотографировать параграф
                  </Heading>
                  <Text type="body" color="secondary" justify="center">
                    Наведи камеру на страницу учебника — разберём её вместе, шаг за шагом
                  </Text>
                  <Text type="label" color="accent" weight="bold">
                    Сфотографировать →
                  </Text>
                </VStack>
              </div>
            </div>
          </Card>
        </Link>

        <Card padding={0}>
          <HStack gap={0}>
            <StackItem size="fill">
              <Link href="/history" className={`${styles.statusLink} ${styles.statusLinkFirst}`}>
                <HStack gap={3} padding={4} vAlign="center">
                  <PagesStack className={styles.statusIcon} />
                  <VStack gap={0}>
                    <Text type="large" hasTabularNumbers>
                      {isLoading ? "…" : totalParagraphs}
                    </Text>
                    <Text type="supporting" size="xsm">
                      {totalParagraphs === 0 ? "начни с первого параграфа" : "параграфов пройдено"}
                    </Text>
                  </VStack>
                </HStack>
              </Link>
            </StackItem>
            <StackItem size="fill">
              <Link href="/history" className={`${styles.statusLink} ${styles.statusLinkLast}`}>
                <HStack gap={3} padding={4} vAlign="center">
                  <StreakFlame className={styles.statusIcon} />
                  <VStack gap={0}>
                    <Text type="large" color="accent" hasTabularNumbers>
                      {isLoading ? "…" : streakDays > 0 ? `${streakDays} дней` : "0 дней"}
                    </Text>
                    <Text type="supporting" size="xsm">
                      {streakDays > 0 ? "ты в ударе, не останавливайся" : "стрик начнётся сегодня"}
                    </Text>
                  </VStack>
                </HStack>
              </Link>
            </StackItem>
          </HStack>
        </Card>

        {!proActive && (
          <Link href="/pro" className={styles.proLink}>
            <Card padding={4} elevation="low">
              <HStack gap={3} vAlign="center">
                <Icon icon="info" color="accent" />
                <StackItem size="fill">
                  <VStack gap={0}>
                    <Text type="body" weight="bold">
                      Эхо Про — репетитор, а не игра
                    </Text>
                    <Text type="supporting" size="xsm">
                      Безлимитные вопросы, карта слабых мест — от 149 ₽/мес
                    </Text>
                  </VStack>
                </StackItem>
                <Icon icon="chevronRight" color="secondary" size="sm" />
              </HStack>
            </Card>
          </Link>
        )}
      </VStack>
    </AppFrame>
  );
}
