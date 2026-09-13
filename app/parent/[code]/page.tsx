"use client";

import { use, useEffect, useState } from "react";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { List, ListItem } from "@astryxdesign/core/List";
import { Icon } from "@astryxdesign/core/Icon";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Banner } from "@astryxdesign/core/Banner";
import type { AttemptRow } from "@/lib/db";
import styles from "./page.module.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

type LoadState = "loading" | "found" | "not-found" | "error";

export default function ParentViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [state, setState] = useState<LoadState>("loading");
  const [entries, setEntries] = useState<AttemptRow[]>([]);
  const [totalParagraphs, setTotalParagraphs] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    fetch(`/api/parent-code?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.found) {
          setState("not-found");
          return;
        }
        setEntries(data.entries ?? []);
        setTotalParagraphs(data.totalParagraphs ?? 0);
        setStreakDays(data.streakDays ?? 0);
        setState("found");
      })
      .catch((err) => {
        console.error("parent: /api/parent-code недоступен", err);
        setState("error");
      });
  }, [code]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <VStack gap={6} padding={5}>
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              Эхо · для родителя
            </Text>
            <Heading level={1}>Прогресс ребёнка</Heading>
            <Text type="body" color="secondary">
              Только то, что нужно для спокойствия — без оценок и без слежки.
            </Text>
          </VStack>

          {state === "loading" && (
            <Center>
              <Text type="body" color="secondary">
                Загружаю…
              </Text>
            </Center>
          )}

          {state === "not-found" && (
            <Banner
              status="error"
              title="Код не найден"
              description="Проверь, что код введён без ошибок — буквы O и цифры 0 в кодах не используются."
            />
          )}

          {state === "error" && (
            <Banner status="error" title="Не получилось загрузить" description="Попробуй открыть ссылку ещё раз" />
          )}

          {state === "found" && (
            <>
              <div className={styles.statsGrid}>
                <Card padding={4} elevation="low">
                  <VStack gap={0}>
                    <Text type="large" hasTabularNumbers>
                      {totalParagraphs}
                    </Text>
                    <Text type="supporting" size="xsm">
                      параграфов пройдено
                    </Text>
                  </VStack>
                </Card>
                <Card padding={4} elevation="low">
                  <VStack gap={0}>
                    <Text type="large" color="accent" hasTabularNumbers>
                      {streakDays} дней
                    </Text>
                    <Text type="supporting" size="xsm">
                      подряд
                    </Text>
                  </VStack>
                </Card>
              </div>

              <VStack gap={3}>
                <Heading level={2}>Последние попытки</Heading>
                {entries.length === 0 ? (
                  <Card padding={6}>
                    <Center>
                      <Text type="body" color="secondary" justify="center">
                        Пока ничего не пройдено
                      </Text>
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
                          startContent={<Icon icon="success" color="secondary" />}
                          endContent={
                            <HStack gap={1} vAlign="center">
                              <Text type="label" hasTabularNumbers>
                                {entry.covered_count}/{entry.total_count}
                              </Text>
                            </HStack>
                          }
                        />
                      ))}
                    </List>
                  </Card>
                )}
              </VStack>
            </>
          )}
        </VStack>
      </div>
    </div>
  );
}
