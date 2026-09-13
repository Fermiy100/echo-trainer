"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Icon } from "@astryxdesign/core/Icon";
import { StackItem } from "@astryxdesign/core/Stack";
import { List, ListItem } from "@astryxdesign/core/List";
import { AppFrame } from "@/components/shell/AppFrame";
import { StreakFlame, PagesStack, WelcomeIllustration } from "@/components/ui/illustrations";
import { useStudentSummary } from "@/lib/hooks/useStudentSummary";
import { getStudentId, isYandexLinked, getDisplayName, logout } from "@/lib/client-id";
import { isPro } from "@/lib/pro";
import { pluralizeRu } from "@/lib/pluralize";
import styles from "./page.module.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default function HistoryPage() {
  const { isLoading, entries, totalParagraphs, streakDays } = useStudentSummary();
  const [proActive, setProActive] = useState(false);
  const [weakSpotCount, setWeakSpotCount] = useState<number | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [parentCodeError, setParentCodeError] = useState(false);
  const [linked, setLinked] = useState(false);
  const [displayName, setDisplayNameState] = useState<string | null>(null);

  useEffect(() => {
    setProActive(isPro());
    setLinked(isYandexLinked());
    setDisplayNameState(getDisplayName());
    fetch(`/api/weak-spots?studentId=${encodeURIComponent(getStudentId())}`)
      .then((res) => res.json())
      .then((data) => setWeakSpotCount((data.spots ?? []).length))
      .catch((err) => console.error("history: /api/weak-spots недоступен", err));
    fetch("/api/parent-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: getStudentId() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code) setParentCode(data.code);
        else setParentCodeError(true);
      })
      .catch((err) => {
        console.error("history: /api/parent-code недоступен", err);
        setParentCodeError(true);
      });
  }, []);

  return (
    <AppFrame active="history">
      <VStack gap={6} padding={5}>
        <Heading level={1} type="display-2">
          История
        </Heading>

        {linked ? (
          <Card padding={4} elevation="low">
            <HStack gap={3} vAlign="center">
              <Icon icon="success" color="accent" />
              <StackItem size="fill">
                <VStack gap={0}>
                  <Text type="body" weight="bold">
                    {displayName ? `Вы вошли как ${displayName}` : "Вход через Яндекс выполнен"}
                  </Text>
                  <Text type="supporting" size="xsm">
                    История видна с любого устройства с этим входом
                  </Text>
                </VStack>
              </StackItem>
              <Button
                label="Выйти"
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
              />
            </HStack>
          </Card>
        ) : (
          <Link href="/api/auth/yandex/login" prefetch={false} className={styles.plainLink}>
            <Card padding={4} elevation="low">
              <HStack gap={3} vAlign="center">
                <Icon icon="externalLink" color="accent" />
                <StackItem size="fill">
                  <VStack gap={0}>
                    <Text type="body" weight="bold">
                      Войти через Яндекс
                    </Text>
                    <Text type="supporting" size="xsm">
                      Чтобы видеть эту историю с телефона, компьютера — с чего угодно
                    </Text>
                  </VStack>
                </StackItem>
                <Icon icon="chevronRight" color="secondary" size="sm" />
              </HStack>
            </Card>
          </Link>
        )}

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

        {weakSpotCount !== null && weakSpotCount > 0 && (
          <Link href="/weak-spots" className={styles.plainLink}>
            <Card padding={4} elevation="low">
              <HStack gap={3} vAlign="center">
                <Text type="display-2" color="accent" hasTabularNumbers>
                  {weakSpotCount}
                </Text>
                <StackItem size="fill">
                  <VStack gap={0}>
                    <Text type="body" weight="bold">
                      {pluralizeRu(weakSpotCount, "слабое место", "слабых места", "слабых мест")}{" "}
                      {proActive ? "накопилось" : "ждут в Про"}
                    </Text>
                    <Text type="supporting" size="xsm">
                      {proActive
                        ? "Идеи, которые чаще всего пропускаешь — открыть карту"
                        : "Идеи, которые ты пропускаешь снова и снова — посмотреть"}
                    </Text>
                  </VStack>
                </StackItem>
                <Icon icon="chevronRight" color="secondary" size="sm" />
              </HStack>
            </Card>
          </Link>
        )}

        {parentCode && !parentCodeError && (
          <Card padding={4} elevation="low">
            <VStack gap={2}>
              <Text type="body" weight="bold">
                Код для родителя
              </Text>
              <Text type="supporting" size="xsm">
                Покажи этот код родителю — по нему видно тот же прогресс, без пароля и без установки
              </Text>
              <Text type="display-2" hasTabularNumbers color="accent" justify="center">
                {parentCode}
              </Text>
            </VStack>
          </Card>
        )}

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
