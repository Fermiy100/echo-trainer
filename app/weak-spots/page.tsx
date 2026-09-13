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
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { getStudentId } from "@/lib/client-id";
import { isPro } from "@/lib/pro";
import type { WeakSpot } from "@/lib/db";
import styles from "./page.module.css";

type LoadState = "loading" | "empty" | "ready" | "error";

export default function WeakSpotsPage() {
  const [proActive, setProActive] = useState(false);
  const [checkedPro, setCheckedPro] = useState(false);
  const [state, setState] = useState<LoadState>("loading");
  const [spots, setSpots] = useState<WeakSpot[]>([]);

  useEffect(() => {
    setProActive(isPro());
    setCheckedPro(true);
  }, []);

  useEffect(() => {
    if (!checkedPro || !proActive) return;
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
  }, [checkedPro, proActive]);

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

          {checkedPro && !proActive && (
            <VStack gap={3}>
              <Banner
                status="info"
                title="Это часть Эхо Про"
                description="Карта слабых мест копится из всех твоих пересказов — открывается вместе с Про."
              />
              <Link href="/pro">
                <Button label="Узнать про Эхо Про →" variant="primary" width="100%" />
              </Link>
            </VStack>
          )}

          {checkedPro && proActive && state === "loading" && (
            <Center>
              <Text type="body" color="secondary">
                Считаю…
              </Text>
            </Center>
          )}

          {checkedPro && proActive && state === "error" && (
            <Banner
              status="error"
              title="Не получилось загрузить"
              description="Проверь интернет и открой страницу ещё раз"
            />
          )}

          {checkedPro && proActive && state === "empty" && (
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

          {checkedPro && proActive && state === "ready" && (
            <Card padding={0}>
              <List>
                {spots.map((spot) => (
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
          )}
        </VStack>
      </div>
    </div>
  );
}
