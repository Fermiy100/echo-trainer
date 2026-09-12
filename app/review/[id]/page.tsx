"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { List, ListItem } from "@astryxdesign/core/List";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { UnderstandingRing } from "@/components/ui/UnderstandingRing";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
import { readReview } from "@/lib/review-store";
import styles from "./page.module.css";

// Демо-фоллбэк: если /api/verify недоступен или экран открыт напрямую
// (например /demo), показываем правдоподобный пример вместо пустого экрана.
const DEMO_COVERED_INDICES = [0, 1, 3];

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [coveredIndices, setCoveredIndices] = useState<number[]>(DEMO_COVERED_INDICES);

  useEffect(() => {
    const storedParagraph = readParagraph(id);
    if (storedParagraph) setParagraph(storedParagraph);

    const storedReview = readReview(id);
    if (storedReview) setCoveredIndices(storedReview);
  }, [id]);

  const covered = coveredIndices.length;
  const total = paragraph.keyPoints.length;
  const missed = paragraph.keyPoints.filter((_, i) => !coveredIndices.includes(i));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <VStack gap={6} padding={5} hAlign="center">
          <Center>
            <UnderstandingRing covered={covered} total={total} />
          </Center>

          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              {missed.length === 0 ? "Ты назвал всё до единой мысли!" : "Почти всё запомнил!"}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              {missed.length > 0
                ? `Не хватило: «${missed[0]}» — скажи об этом в следующий раз`
                : "Отлично поработал — можно двигаться дальше"}
            </Text>
          </VStack>

          <Card padding={0} width="100%">
            <List>
              {paragraph.keyPoints.map((point, i) => {
                const isCovered = coveredIndices.includes(i);
                return (
                  <ListItem
                    key={point}
                    label={point}
                    startContent={
                      <Icon icon={isCovered ? "success" : "warning"} color={isCovered ? "success" : "warning"} />
                    }
                  />
                );
              })}
            </List>
          </Card>

          <div className={styles.actions}>
            <Button
              label="Попробовать ещё раз"
              variant="ghost"
              onClick={() => router.push(`/retell/${paragraph.id}`)}
            />
            <Button label="Дальше" variant="primary" onClick={() => router.push("/")} />
          </div>
        </VStack>
      </div>
    </div>
  );
}
