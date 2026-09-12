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
import { Banner } from "@astryxdesign/core/Banner";
import { UnderstandingRing } from "@/components/ui/UnderstandingRing";
import { getParagraph, type Paragraph } from "@/lib/mock-data";
import { readParagraph } from "@/lib/paragraph-store";
import { readReview, type StoredReview } from "@/lib/review-store";
import styles from "./page.module.css";

// Демо-фоллбэк: если экран открыт напрямую (например /demo) без реальной
// проверки — показываем правдоподобный пример вместо пустого экрана.
const DEMO_REVIEW: StoredReview = { coveredIndices: [0, 1, 3], source: undefined };

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph>(() => getParagraph(id));
  const [review, setReview] = useState<StoredReview>(DEMO_REVIEW);
  const coveredIndices = review.coveredIndices;

  useEffect(() => {
    const storedParagraph = readParagraph(id);
    if (storedParagraph) setParagraph(storedParagraph);

    const storedReview = readReview(id);
    if (storedReview) setReview(storedReview);
  }, [id]);

  const covered = coveredIndices.length;
  const total = paragraph.keyPoints.length;
  const missedIndices = paragraph.keyPoints.map((_, i) => i).filter((i) => !coveredIndices.includes(i));
  const missed = missedIndices.map((i) => paragraph.keyPoints[i]);
  const ratio = total > 0 ? covered / total : 0;

  // Честная обратная связь — это весь смысл приложения, поэтому заголовок
  // не может быть одинаково бодрым и при 3 из 4, и при 0 из 4.
  const heading =
    missed.length === 0
      ? "Ты назвал всё до единой мысли!"
      : ratio >= 0.5
        ? "Почти всё запомнил!"
        : ratio > 0
          ? "Есть над чем поработать"
          : "Пока не совсем — и это нормально";
  const subtitle =
    missed.length === 0
      ? "Отлично поработал — можно двигаться дальше"
      : ratio > 0
        ? `Не хватило: «${missed[0]}» — скажи об этом в следующий раз`
        : "Перечитай объяснение ещё раз и попробуй пересказать заново";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <VStack gap={6} padding={5} hAlign="center">
          {review.source === "heuristic" && (
            <Banner
              status="info"
              title="Проверено упрощённым способом"
              description="Нейросеть сейчас недоступна, поэтому пересказ сверили по совпадению ключевых слов, а не по смыслу — результат может быть менее точным, чем обычно."
            />
          )}
          <Center>
            <UnderstandingRing covered={covered} total={total} />
          </Center>

          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              {heading}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              {subtitle}
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

          {/* Иерархия кнопок намеренно строгая: ровно одна главная (primary) —
              самое полезное следующее действие. Остальные — secondary (с
              видимой рамкой, но не яркие) или ghost (просто текст, для самого
              редкого и необязательного действия). Раньше здесь было две
              одинаково яркие "primary"-кнопки на одном экране, из-за чего было
              непонятно, какая из них главная. */}
          {missedIndices.length > 0 ? (
            <Button
              label={`Пересказать пропущенное (${missedIndices.length}) →`}
              variant="primary"
              width="100%"
              onClick={() => router.push(`/retell/${paragraph.id}?mode=recall&focus=${missedIndices.join(",")}`)}
            />
          ) : (
            <Button
              label="Тренировка у доски →"
              variant="primary"
              width="100%"
              onClick={() => router.push(`/retell/${paragraph.id}?mode=battle`)}
            />
          )}

          {paragraph.termCards && paragraph.termCards.length >= 2 && (
            <Button
              label="Закрепить в квизе"
              variant="secondary"
              width="100%"
              onClick={() => router.push(`/quiz/${paragraph.id}`)}
            />
          )}

          <Button label="Готово, на главную" variant="secondary" width="100%" onClick={() => router.push("/")} />

          <Button
            label="Пересказать весь параграф заново"
            variant="ghost"
            width="100%"
            onClick={() => router.push(`/retell/${paragraph.id}`)}
          />
        </VStack>
      </div>
    </div>
  );
}
