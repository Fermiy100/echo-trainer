"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { List, ListItem } from "@astryxdesign/core/List";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Banner } from "@astryxdesign/core/Banner";
import { getStudentId } from "@/lib/client-id";
import { isPro } from "@/lib/pro";
import { ProPaywallDialog } from "@/components/ui/ProPaywallDialog";
import { pluralizeRu } from "@/lib/pluralize";
import type { WeakSpot } from "@/lib/db";
import styles from "./page.module.css";

type LoadState = "loading" | "empty" | "ready" | "error";

// Сколько строк показываем честно, без блюра — ровно столько, чтобы было
// видно, что список настоящий (свои же пропущенные идеи), а не абстрактная
// обещалка. Дальше — под замком.
const FREE_PREVIEW_COUNT = 1;

export default function WeakSpotsPage() {
  const [proActive, setProActive] = useState(false);
  const [checkedPro, setCheckedPro] = useState(false);
  const [state, setState] = useState<LoadState>("loading");
  const [spots, setSpots] = useState<WeakSpot[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    setProActive(isPro());
    setCheckedPro(true);
  }, []);

  useEffect(() => {
    fetch(`/api/weak-spots?studentId=${encodeURIComponent(getStudentId())}`)
      .then((res) => res.json())
      .then((data) => {
        setSpots(data.spots ?? []);
        setState((data.spots ?? []).length > 0 ? "ready" : "empty");
      })
      .catch((err) => {
        console.error("weak-spots: /api/weak-spots недоступен", err);
        setState("error");
      });
  }, []);

  const visibleSpots = proActive ? spots : spots.slice(0, FREE_PREVIEW_COUNT);
  const lockedCount = spots.length - visibleSpots.length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/history" aria-label="Назад" className={styles.backLink}>
          <IconButton label="Назад" icon={<Icon icon="chevronLeft" />} variant="ghost" />
        </Link>
        <Text type="body" weight="bold">
          Карта слабых мест
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.shell}>
        <VStack gap={6} padding={5}>
          <VStack gap={2}>
            <Heading level={1}>Что реально не отложилось</Heading>
            <Text type="body" color="secondary">
              Идеи, которые чаще всего пропускаешь в пересказе — по всем предметам и параграфам сразу,
              не только по последнему. Перед ОГЭ это же станет списком для повторения.
            </Text>
          </VStack>

          {state === "loading" && (
            <Center>
              <Text type="body" color="secondary">
                Считаю…
              </Text>
            </Center>
          )}

          {state === "error" && (
            <Banner
              status="error"
              title="Не получилось загрузить"
              description="Проверь интернет и открой страницу ещё раз"
            />
          )}

          {state === "empty" && (
            <Card padding={6}>
              <Center>
                <VStack gap={2} hAlign="center">
                  <Text type="body" weight="bold" justify="center">
                    Пока пусто — и это хорошо
                  </Text>
                  <Text type="supporting" justify="center">
                    Здесь появятся идеи, которые не получилось пересказать. Пока таких нет.
                  </Text>
                </VStack>
              </Center>
            </Card>
          )}

          {state === "ready" && (
            <VStack gap={3}>
              <Card padding={0}>
                <List>
                  {visibleSpots.map((spot) => (
                    <ListItem
                      key={`${spot.subject}:${spot.point}`}
                      label={spot.point}
                      description={spot.subject}
                      endContent={
                        <Text type="label" color="secondary" hasTabularNumbers>
                          ×{spot.missedCount}
                        </Text>
                      }
                    />
                  ))}
                </List>
              </Card>

              {lockedCount > 0 && (
                <button type="button" className={styles.lockedWrap} onClick={() => setPaywallOpen(true)}>
                  <Card padding={0}>
                    <div className={styles.blurredList}>
                      <List>
                        {spots.slice(visibleSpots.length, visibleSpots.length + 3).map((spot) => (
                          <ListItem key={`${spot.subject}:${spot.point}`} label={spot.point} description={spot.subject} />
                        ))}
                      </List>
                    </div>
                    <div className={styles.lockOverlay}>
                      <Icon icon="info" color="accent" />
                      <Text type="body" weight="bold" color="accent">
                        Ещё {lockedCount} {pluralizeRu(lockedCount, "место", "места", "мест")} — в Эхо Про
                      </Text>
                    </div>
                  </Card>
                </button>
              )}
            </VStack>
          )}
        </VStack>
      </div>

      <ProPaywallDialog
        isOpen={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="Вся карта слабых мест, а не только первая строка, — в Эхо Про."
        onActivated={() => setProActive(true)}
      />
    </div>
  );
}
