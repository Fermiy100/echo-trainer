"use client";

import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { List, ListItem } from "@astryxdesign/core/List";
import { AppFrame } from "@/components/shell/AppFrame";
import { StreakFlame, PagesStack, WelcomeIllustration } from "@/components/ui/illustrations";
import { useStudentSummary } from "@/lib/hooks/useStudentSummary";
import styles from "./page.module.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default function HistoryPage() {
  const { isLoading, entries, totalParagraphs, streakDays } = useStudentSummary();

  return (
    <AppFrame active="history">
      <VStack gap={6} padding={5}>
        <Heading level={1} type="display-2">
          История
        </Heading>

        <div className={styles.statsGrid}>
          <Card padding={4} elevation="low">
            <HStack gap={3} vAlign="center">
              <PagesStack className={styles.statIcon} />
              <VStack gap={0}>
                <Text type="large" hasTabularNumbers>
                  {isLoading ? "…" : totalParagraphs}
                </Text>
                <Text type="supporting" size="xsm">
                  параграфов пройдено
                </Text>
              </VStack>
            </HStack>
          </Card>
          <Card padding={4} elevation="low">
            <HStack gap={3} vAlign="center">
              <StreakFlame className={styles.statIcon} />
              <VStack gap={0}>
                <Text type="large" color="accent" hasTabularNumbers>
                  {isLoading ? "…" : `${streakDays} дней`}
                </Text>
                <Text type="supporting" size="xsm">
                  подряд
                </Text>
              </VStack>
            </HStack>
          </Card>
        </div>

        <VStack gap={3}>
          <Heading level={2}>Пройденные параграфы</Heading>
          {!isLoading && entries.length === 0 ? (
            <Card padding={6}>
              <Center>
                <VStack gap={3} hAlign="center">
                  <WelcomeIllustration className={styles.emptyIllustration} />
                  <VStack gap={1} hAlign="center">
                    <Text type="body" weight="bold" justify="center">
                      Здесь появится твоя история
                    </Text>
                    <Text type="supporting" justify="center">
                      Пройди первый параграф — и он окажется в этом списке
                    </Text>
                  </VStack>
                  <Link href="/capture">
                    <Button label="Сфотографировать параграф" variant="primary" />
                  </Link>
                </VStack>
              </Center>
            </Card>
          ) : (
            <Card padding={0}>
              <List>
                {entries.map((entry) => (
                  <ListItem
                    key={entry.id}
                    label={entry.subject}
                    description={formatDate(entry.created_at)}
                    endContent={
                      <Text
                        type="label"
                        color={entry.covered_count === entry.total_count ? "accent" : "secondary"}
                        hasTabularNumbers
                      >
                        {entry.covered_count}/{entry.total_count}
                      </Text>
                    }
                  />
                ))}
              </List>
            </Card>
          )}
        </VStack>
      </VStack>
    </AppFrame>
  );
}
